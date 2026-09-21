import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow'
import { NodeOperationError } from 'n8n-workflow'

import { voxtelesysApiRequest } from '../../transport'
import { normalizeAndValidate } from '../../helpers/phoneNumbers'
import { applyCommonOptions } from '../../helpers/utils'

interface ParameterEntry {
	name?: string
	value?: string
}

// Addresses may also be email addresses, which are passed through untouched
const emailLikeRegex = /[a-zA-Z@]/

/**
 * Return phone numbers (can be normalized) or return raw email address if provided
 *
 * @param label - Field name used in error messages
 * @param value - Raw address as entered on the node
 * @param options.normalize - Whether to convert phone numbers to E.164 before validating
 * @param options.itemIndex - Index of the item being processed, used in error messages
 * @returns The address ready to be sent
 * @throws {NodeOperationError} When the address is empty, or is a phone number that is not valid
 */
function resolveAddress(
	this: IExecuteFunctions,
	label: string,
	value: string,
	options: { normalize: boolean; itemIndex: number },
): string {
	const address = value.trim()

	if (!address) {
		throw new NodeOperationError(this.getNode(), `${label} is required`, {
			itemIndex: options.itemIndex,
			description:
				'Provide either a phone number in E.164 format, such as +13005550100, or an email address.',
		})
	}

	if (emailLikeRegex.test(address)) return address

	return normalizeAndValidate.call(this, label, address, options)
}

// POST /flows/:flow_guid/executions
export async function execute(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const options = this.getNodeParameter('options', itemIndex, {}) as IDataObject
	const normalize = options.normalize !== false

	const flowGuid = (this.getNodeParameter('flowGuid', itemIndex, '') as string).trim()
	if (!flowGuid) {
		throw new NodeOperationError(this.getNode(), 'Flow GUID is required', {
			itemIndex,
			description: 'Copy the GUID of the flow you want to execute from the Voxtelesys portal.',
		})
	}

	const from = resolveAddress.call(
		this,
		'From',
		this.getNodeParameter('from', itemIndex) as string,
		{
			normalize,
			itemIndex,
		},
	)
	const to = resolveAddress.call(this, 'To', this.getNodeParameter('to', itemIndex) as string, {
		normalize,
		itemIndex,
	})

	const body: IDataObject = { from, to }

	const entries = this.getNodeParameter('parameters.parameter', itemIndex, []) as ParameterEntry[]
	const parameters: IDataObject = {}
	for (const entry of entries) {
		const name = entry?.name?.trim()
		if (!name) continue
		parameters[name] = entry.value ?? ''
	}
	if (Object.keys(parameters).length) body.parameters = parameters

	// The API accepts a version or an environment, never both
	const environment = options.environment as string | undefined
	const versionGuid = (options.versionGuid as string | undefined)?.trim()
	if (environment && versionGuid) {
		throw new NodeOperationError(
			this.getNode(),
			'Environment and Version GUID cannot both be set',
			{
				itemIndex,
				description:
					'Remove one of them under Options. Use Environment to follow whichever version that environment points at, or Version GUID to pin a specific version.',
			},
		)
	}
	if (environment) body.environment = environment
	if (versionGuid) body.version_guid = versionGuid

	applyCommonOptions.call(this, body, options, itemIndex)

	const response = await voxtelesysApiRequest.call(
		this,
		'flow',
		'POST',
		`/flows/${encodeURIComponent(flowGuid)}/executions`,
		body,
	)

	return [
		{
			json: response ?? {},
			pairedItem: { item: itemIndex },
		},
	]
}
