import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow'
import { NodeOperationError } from 'n8n-workflow'

import { voxtelesysApiRequest } from '../../transport'
import { isValidE164, toE164 } from '../../helpers/statuses'

/**
 * POST /sms
 *
 * {
 *   "to": "+13003003001",
 *   "from": "+13003003000",
 *   "body": "Hello world",
 *   "media": ["http://path.to.image"],
 *   "tag": "...",
 *   "bulk_tag": "...",
 *   "status_callback": { "url": "http://example.com", "method": "POST" }
 * }
 *
 * The snake_case format is just for the body of the request. The node UI uses other names found in the resource and does not expose raw field names
 */
export async function send(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const options = this.getNodeParameter('options', itemIndex, {}) as IDataObject
	const normalize = options.normalize !== false

	const rawFrom = this.getNodeParameter('from', itemIndex) as string
	const rawTo = this.getNodeParameter('to', itemIndex) as string
	const from = normalize ? toE164(rawFrom) : rawFrom.trim()
	const to = normalize ? toE164(rawTo) : rawTo.trim()

	const paramsList = [['From', from], ['To', to]]
	for (const [label, value] of paramsList) {
		if (!isValidE164(value)) {
			throw new NodeOperationError(
				this.getNode(),
				`${label} is not a valid E.164 number: "${value}"`,
				{
					itemIndex,
					description:
						'Numbers must look like +13005550100 (E.164 format). Enable "Normalize Numbers to E.164" to convert common formats automatically.',
				},
			)
		}
	}

	const body: IDataObject = { from, to }

	const message = this.getNodeParameter('body', itemIndex, '') as string
	if (message) body.body = message

	const media = (options.media as string[] | undefined)?.filter((url) => url && url.trim())
	if (media?.length) body.media = media

	if (!body.body && !body.media) {
		throw new NodeOperationError(
			this.getNode(),
			'Provide a message, one or more media URLs, or both',
			{ itemIndex },
		)
	}

	const response = await voxtelesysApiRequest.call(this, 'sms', 'POST', '/sms', body)

	return [
		{
			json: response,
			pairedItem: { item: itemIndex },
		},
	]
}
