import type { IDataObject, IExecuteFunctions } from 'n8n-workflow'
import { NodeOperationError } from 'n8n-workflow'

import { MAX_TAG_LENGTH } from './constants'

// Both tags are length-capped strings
const TAG_FIELDS = [
	{ optionName: 'tag', displayName: 'Tag', bodyField: 'tag' },
	{ optionName: 'bulkTag', displayName: 'Bulk Tag', bodyField: 'bulk_tag' },
]

// Apply the Send Options collection onto the request body. Options that are not exposed are omitted.
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

	if (options.statusCallbackUrl) {
		body.status_callback = {
			url: options.statusCallbackUrl as string,
			method: (options.statusCallbackMethod as string) || 'POST',
		}
	}
}
