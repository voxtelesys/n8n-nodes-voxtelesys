import type { IDataObject, IExecuteFunctions } from 'n8n-workflow'
import { NodeOperationError } from 'n8n-workflow'

import { MAX_TAG_LENGTH } from './constants'

/**
 * Both tags are length-capped strings; they differ only in which option feeds
 * which body field. The error names the option as the UI labels it, not as the
 * API spells it.
 */
const TAG_FIELDS = [
	{ optionName: 'tag', displayName: 'Tag', bodyField: 'tag' },
	{ optionName: 'bulkTag', displayName: 'Bulk Tag', bodyField: 'bulk_tag' },
]

/**
 * Apply the Options collection shared by Send and Send Batch onto the request
 * body. Options a given operation does not expose are simply absent, so the
 * same helper serves both.
 */
export function applyCommonOptions(
	this: IExecuteFunctions,
	body: IDataObject,
	options: IDataObject,
	itemIndex: number,
): void {
	const media = (options.media as string[] | undefined)?.filter((url) => url && url.trim())
	if (media?.length) body.media = media

	for (const { optionName, displayName, bodyField } of TAG_FIELDS) {
		const value = options[optionName] as string | undefined
		if (!value) continue
		if (value.length > MAX_TAG_LENGTH) {
			throw new NodeOperationError(
				this.getNode(),
				`${displayName} must be ${MAX_TAG_LENGTH} characters or fewer`,
				{ itemIndex },
			)
		}
		body[bodyField] = value
	}

	if (options.expireAt) body.expire_at = new Date(options.expireAt as string).toISOString()

	if (options.statusCallbackUrl) {
		body.status_callback = {
			url: options.statusCallbackUrl as string,
			method: (options.statusCallbackMethod as string) || 'POST',
		}
	}
}
