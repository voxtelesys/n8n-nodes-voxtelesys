import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow'
import { NodeOperationError } from 'n8n-workflow'

import { voxtelesysApiRequest } from '../../transport'
import { MAX_MESSAGE_BODY_LENGTH } from '../../helpers/constants'
import { toContent, type ContentType } from '../../helpers/content'
import { normalizeAndValidate } from '../../helpers/phoneNumbers'
import {
	applyStatusCallback,
	applyTags,
	requireString,
	toIsoTimestamp,
	toMediaUrls,
} from '../../helpers/utils'

/**
 * POST /rcs
 *
 * {
 *   "to": "+13003003001",
 *   "from": "Brand",
 *   "content": {
 *     "type": "TEXT",
 *     "body": "Hello world",
 *     "suggestions": [{ "type": "REPLY", "text": "Yes", "callback_data": "yes" }]
 *   },
 *   "expire_at": "2024-12-31T23:59:59Z",
 *   "tag": "...",
 *   "bulk_tag": "...",
 *   "failover": {
 *     "enabled": true,
 *     "from": "+13003003000",
 *     "to": "+13003003001",
 *     "body": "Hello world",
 *     "media": ["http://path.to.image"]
 *   },
 *   "status_callback": { "url": "http://example.com", "method": "POST" }
 * }
 *
 */
export async function send(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const options = this.getNodeParameter('options', itemIndex, {}) as IDataObject
	const normalize = options.normalize !== false

	// The RCS sender is a registered agent rather than a number, so there's not much validation to be done
	const from = (this.getNodeParameter('from', itemIndex, '') as string).trim()
	if (!from) {
		throw new NodeOperationError(this.getNode(), 'From is required', {
			itemIndex,
			description:
				'Use the sender registered for your RCS agent. It is a brand name rather than a phone number.',
		})
	}

	const to = normalizeAndValidate.call(
		this,
		'To',
		this.getNodeParameter('to', itemIndex) as string,
		{ normalize, itemIndex },
	)

	const contentType = this.getNodeParameter('contentType', itemIndex, 'TEXT') as ContentType
	const content = toContent.call(this, contentType, normalize, itemIndex)

	const body: IDataObject = { from, to, content }

	if (options.expireAt) {
		body.expire_at = toIsoTimestamp.call(this, 'Expire At', options.expireAt, itemIndex)
	}

	if (this.getNodeParameter('failover', itemIndex, false) as boolean) {
		// Only a text message has a body the failover can reuse
		const message = contentType === 'TEXT' ? ((content.body as string) ?? '') : ''
		body.failover = buildFailover.call(this, { to, message, normalize }, itemIndex)
	}

	applyTags.call(this, body, options, itemIndex)
	applyStatusCallback.call(this, body, options, itemIndex)

	const response = await voxtelesysApiRequest.call(this, 'rcs', 'POST', '/rcs', body)

	return [
		{
			json: response,
			pairedItem: { item: itemIndex },
		},
	]
}

/**
 * Builds the failover to SMS/MMS if the RCS message fails
 *
 * @param rcs.to - Recipient of the RCS message
 * @param rcs.message - Body of the RCS message, which is empty for content that has no body
 * @param rcs.normalize - Whether to convert loosely formatted numbers to E.164
 * @param itemIndex - Index of the item being processed, used in error messages
 * @returns The failover object in the shape the API expects
 * @throws {NodeOperationError} When the failover sender or message is missing, or a number is invalid
 */
function buildFailover(
	this: IExecuteFunctions,
	rcs: { to: string; message: string; normalize: boolean },
	itemIndex: number,
): IDataObject {
	const options = this.getNodeParameter('failoverOptions', itemIndex, {}) as IDataObject

	const failoverFrom = (this.getNodeParameter('failoverFrom', itemIndex, '') as string).trim()
	if (!failoverFrom) {
		throw new NodeOperationError(this.getNode(), 'Failover From is required', {
			itemIndex,
			description:
				'Failover sends an SMS or MMS message, which needs an SMS enabled phone number as its sender.',
		})
	}

	const from = normalizeAndValidate.call(this, 'Failover From', failoverFrom, {
		normalize: rcs.normalize,
		itemIndex,
	})

	const overrideTo = ((options.to as string) ?? '').trim()
	const to = overrideTo
		? normalizeAndValidate.call(this, 'Failover To', overrideTo, {
				normalize: rcs.normalize,
				itemIndex,
			})
		: rcs.to

	const overrideBody = ((options.body as string) ?? '').trim()
	if (!overrideBody && !rcs.message) {
		throw new NodeOperationError(this.getNode(), 'Failover Message is required', {
			itemIndex,
			description:
				'An SMS or MMS message always needs a body, and only a text RCS message has one to fall back on. Set Message under Failover Options, and attach any images there as media URLs.',
		})
	}

	const failover: IDataObject = {
		enabled: true,
		from,
		to,
		body: requireString.call(
			this,
			'Failover Message',
			overrideBody || rcs.message,
			MAX_MESSAGE_BODY_LENGTH,
			itemIndex,
		),
	}

	const media = toMediaUrls.call(this, options.media, itemIndex)
	if (media.length) failover.media = media

	return failover
}
