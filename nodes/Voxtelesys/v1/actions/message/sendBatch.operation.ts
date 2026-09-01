import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow'
import { NodeOperationError } from 'n8n-workflow'

import { voxtelesysApiRequest } from '../../transport'
import { buildParameters } from '../../helpers/personalization'
import { normalizeAndValidate } from '../../helpers/phoneNumbers'
import { applyCommonOptions } from '../../helpers/utils'

/**
 * POST /sms/batch
 *
 * {
 *   "from": "+13003003000",
 *   "to": ["+13003003001", "+13003003002"],
 *   "body": "Hello ${name}, your appointment is at ${time}.",
 *   "parameters": {
 *     "definition": ["name", "time"],
 *     "default": ["there", 0],
 *     "+13003003001": ["Alice", "3pm"]
 *   },
 *   "media": ["http://path.to.image"],
 *   "tag": "...",
 *   "bulk_tag": "...",
 *   "expire_at": "2026-01-01T00:00:00.000Z",
 *   "status_callback": { "url": "http://example.com", "method": "POST" }
 * }
 *
 * The snake_case format is just for the body of the request. The node UI uses other names found in the resource and does not expose raw field names
 */
export async function sendBatch(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const options = this.getNodeParameter('batchOptions', itemIndex, {}) as IDataObject
	const normalize = options.normalize !== false

	const from = normalizeAndValidate.call(
		this,
		'From',
		this.getNodeParameter('from', itemIndex) as string,
		{ normalize, itemIndex },
	)

	const rawRecipients = this.getNodeParameter('recipients', itemIndex, []) as string[]
	const recipients: string[] = []
	for (const rawTo of rawRecipients) {
		if (!rawTo || !rawTo.trim()) continue
		recipients.push(normalizeAndValidate.call(this, 'Recipient', rawTo, { normalize, itemIndex }))
	}

	if (recipients.length === 0) {
		throw new NodeOperationError(this.getNode(), 'Add at least one recipient to the batch', {
			itemIndex,
		})
	}

	const body: IDataObject = { from, to: recipients }

	const message = this.getNodeParameter('bodyTemplate', itemIndex, '') as string
	if (message) body.body = message

	applyCommonOptions.call(this, body, options, itemIndex)

	// Runs after the options are applied, because media arrives with them.
	if (!body.body && !body.media) {
		throw new NodeOperationError(
			this.getNode(),
			'Provide a message template, one or more media URLs, or both',
			{ itemIndex },
		)
	}

	if (this.getNodeParameter('personalize', itemIndex, false) as boolean) {
		body.parameters = buildParameters.call(this, itemIndex, recipients, normalize)
	}

	const response = await voxtelesysApiRequest.call(this, 'sms', 'POST', '/sms/batch', body)

	return [
		{
			json: response,
			pairedItem: { item: itemIndex },
		},
	]
}
