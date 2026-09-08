import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow'
import { NodeOperationError } from 'n8n-workflow'

import { voxtelesysApiRequest } from '../../transport'
import { normalizeAndValidate } from '../../helpers/phoneNumbers'
import { applyCommonOptions } from '../../helpers/utils'

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

	const from = normalizeAndValidate.call(
		this,
		'From',
		this.getNodeParameter('from', itemIndex) as string,
		{ normalize, itemIndex },
	)
	const to = normalizeAndValidate.call(
		this,
		'To',
		this.getNodeParameter('to', itemIndex) as string,
		{ normalize, itemIndex },
	)

	const body: IDataObject = { from, to }

	// Message is required on every request, even if there is media attached
	const message = this.getNodeParameter('body', itemIndex, '') as string
	if (!message.trim()) {
		throw new NodeOperationError(this.getNode(), 'Message is required', {
			itemIndex,
			description:
				'Every send needs a message body. Add Media URLs under Options to send an MMS message.',
		})
	}
	body.body = message

	applyCommonOptions.call(this, body, options, itemIndex)

	const response = await voxtelesysApiRequest.call(this, 'sms', 'POST', '/sms', body)

	return [
		{
			json: response,
			pairedItem: { item: itemIndex },
		},
	]
}
