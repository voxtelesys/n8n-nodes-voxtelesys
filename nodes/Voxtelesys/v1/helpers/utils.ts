import type { IDataObject, IExecuteFunctions } from 'n8n-workflow'
import { NodeOperationError } from 'n8n-workflow'

import { MAX_TAG_LENGTH } from './constants'

// Both tags are length-capped strings
const TAG_FIELDS = [
	{ optionName: 'tag', displayName: 'Tag', bodyField: 'tag' },
	{ optionName: 'bulkTag', displayName: 'Bulk Tag', bodyField: 'bulk_tag' },
]

/**
 * Apply the Send Options collection onto the request body. Options that are not exposed are omitted.
 *
 * @param body - Request body that is mutated in place
 * @param options - Send Options collection values
 * @param itemIndex - Index of the item being processed, used in error messages
 * @throws {NodeOperationError} When a tag exceeds the maximum length or a media entry is not a string
 */
export function applyCommonOptions(
	this: IExecuteFunctions,
	body: IDataObject,
	options: IDataObject,
	itemIndex: number,
): void {
	const media = toMediaUrls.call(this, options.media, itemIndex)
	if (media.length) body.media = media

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

/**
 * Coerce the Media URLs field into a list of URL strings.
 * Only a flat list of strings is accepted, everything else is rejected.
 *
 * @param value - Raw Media URLs field value
 * @param itemIndex - Index of the item being processed, used in error messages
 * @returns The media URLs as trimmed strings
 * @throws {NodeOperationError} When an entry is not a string
 */
function toMediaUrls(this: IExecuteFunctions, value: unknown, itemIndex: number): string[] {
	const entries: unknown[] = Array.isArray(value) ? value : [value]
	const urls: string[] = []

	for (const entry of entries) {
		if (!entry) continue

		if (typeof entry !== 'string') {
			const entryType = Array.isArray(entry) ? 'array' : typeof entry
			throw new NodeOperationError(
				this.getNode(),
				`Media URLs must be URL strings, but one entry is a ${entryType}`,
				{
					itemIndex,
					description:
						'Add one entry per URL, or use an expression that resolves to a single URL string, such as {{ $json.imageUrl }}. An expression that returns an array of URLs is not accepted.',
				},
			)
		}

		const url = entry.trim()
		if (url) urls.push(url)
	}

	return urls
}
