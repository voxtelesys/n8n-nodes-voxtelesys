import type { IDataObject, IExecuteFunctions } from 'n8n-workflow'
import { NodeOperationError } from 'n8n-workflow'

import { MAX_TAG_LENGTH, type NumericField } from './constants'

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

	applyTags.call(this, body, options, itemIndex)
	applyStatusCallback(body, options)
}

/**
 * Copy the Tag and Bulk Tag options onto the request body, rejecting over-long values.
 *
 * @param body - Request body that is mutated in place
 * @param options - Options collection values
 * @param itemIndex - Index of the item being processed, used in error messages
 * @throws {NodeOperationError} When a tag exceeds the maximum length
 */
export function applyTags(
	this: IExecuteFunctions,
	body: IDataObject,
	options: IDataObject,
	itemIndex: number,
): void {
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
}

/**
 * Build the `status_callback` object from the callback options. Nothing is set without a URL.
 *
 * @param body - Request body that is mutated in place
 * @param options - Options collection values
 * @param events - Statuses to request callbacks for, supported by the Voice API only
 */
export function applyStatusCallback(
	body: IDataObject,
	options: IDataObject,
	events?: string[],
): void {
	if (!options.statusCallbackUrl) return

	const statusCallback: IDataObject = {
		url: options.statusCallbackUrl as string,
		method: (options.statusCallbackMethod as string) || 'POST',
	}
	if (events?.length) statusCallback.events = events

	body.status_callback = statusCallback
}

/**
 * Copy numeric options onto the request body, rejecting values outside the range the API accepts.
 *
 * @param body - Request body that is mutated in place
 * @param options - Options collection values
 * @param fields - Numeric options to apply, with their accepted ranges
 * @param itemIndex - Index of the item being processed, used in error messages
 * @throws {NodeOperationError} When a value is not a number or falls outside its range
 */
export function applyNumericOptions(
	this: IExecuteFunctions,
	body: IDataObject,
	options: IDataObject,
	fields: NumericField[],
	itemIndex: number,
): void {
	for (const { optionName, displayName, bodyField, min, max } of fields) {
		const raw = options[optionName]
		if (raw === undefined || raw === null || raw === '') continue

		// Expressions can resolve to a numeric string, so accept anything Number() understands
		const value = Number(raw)
		if (!Number.isFinite(value)) {
			throw new NodeOperationError(this.getNode(), `${displayName} must be a number`, { itemIndex })
		}
		if (value < min || value > max) {
			throw new NodeOperationError(
				this.getNode(),
				`${displayName} must be between ${min} and ${max}, but is ${value}`,
				{ itemIndex },
			)
		}

		body[bodyField] = Math.round(value)
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
