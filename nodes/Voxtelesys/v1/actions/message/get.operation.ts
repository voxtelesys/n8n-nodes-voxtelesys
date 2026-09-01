import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow'
import { NodeOperationError } from 'n8n-workflow'

import { voxtelesysApiRequest } from '../../transport'
import { classifyStatus, isFinalStatus } from '../../helpers/statuses'

/**
 * Add derived delivery fields next to the raw API response.
 *
 * The API reports a single `status` string. `deliveryOutcome` collapses it to
 * the four-valued outcome and `isFinal` says whether the status can still
 * change, so a workflow can branch without hardcoding the status vocabulary.
 * The raw response is passed through untouched alongside them.
 */
function decorate(message: IDataObject): IDataObject {
	const status = message.status
	if (typeof status !== 'string' || !status.trim()) {
		return message
	}

	return {
		...message,
		deliveryOutcome: classifyStatus(status),
		isFinal: isFinalStatus(status),
	}
}

/**
 * GET /sms/{id}
 *
 * Retrieves a single message by its ID, as returned in the `id` field of a
 * Send response or on a delivery report.
 */
export async function get(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const messageId = (this.getNodeParameter('messageId', itemIndex, '') as string).trim()

	if (!messageId) {
		throw new NodeOperationError(this.getNode(), 'Provide the ID of the message to retrieve', {
			itemIndex,
		})
	}

	const response = await voxtelesysApiRequest.call(
		this,
		'sms',
		'GET',
		`/sms/${encodeURIComponent(messageId)}`,
	)

	return [
		{
			json: decorate(response),
			pairedItem: { item: itemIndex },
		},
	]
}
