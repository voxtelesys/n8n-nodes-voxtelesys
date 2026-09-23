import type { IDataObject, IExecuteFunctions } from 'n8n-workflow'
import { NodeOperationError } from 'n8n-workflow'

import { MAX_TAG_LENGTH } from './constants'

// Both tags are length-capped strings
const TAG_FIELDS = [
	{ optionName: 'tag', displayName: 'Tag', bodyField: 'tag' },
	{ optionName: 'bulkTag', displayName: 'Bulk Tag', bodyField: 'bulk_tag' },
]

/**
 * Apply the Tag and Bulk Tag options onto the request body. Unset options are omitted.
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
 * Apply the Status Callback options onto the request body. Omitted when no URL is set
 *
 * @param body - Request body that is mutated in place
 * @param options - Options collection values
 * @param itemIndex - Index of the item being processed, used in error messages
 * @throws {NodeOperationError} When the URL is not an absolute HTTP or HTTPS URL
 */
export function applyStatusCallback(
	this: IExecuteFunctions,
	body: IDataObject,
	options: IDataObject,
	itemIndex: number,
): void {
	const raw = options.statusCallbackUrl
	if (!raw) return

	const url = String(raw).trim()
	if (!url) return

	// unresolved expression
	if (url.includes('{{')) {
		throw new NodeOperationError(
			this.getNode(),
			'Status Callback URL still holds an expression instead of its result',
			{
				itemIndex,
				description: `The field was sent as the literal text ${url}. Switch it to an expression, by hovering the field and choosing Expression, so n8n resolves it to a URL before the request is sent.`,
			},
		)
	}

	if (!isHttpUrl(url)) {
		throw new NodeOperationError(this.getNode(), 'Status Callback URL is not a valid URL', {
			itemIndex,
			description: `The API only accepts an absolute HTTP or HTTPS URL it can reach, but the field resolved to ${url}.`,
		})
	}

	body.status_callback = {
		url,
		method: (options.statusCallbackMethod as string) || 'POST',
	}
}

/**
 * Checks whether a value is an absolute HTTP or HTTPS URL.
 *
 * @param value - Value to check
 * @returns True when the value parses as an absolute http: or https: URL
 */
function isHttpUrl(value: string): boolean {
	let parsed: URL
	try {
		parsed = new URL(value)
	} catch {
		return false
	}

	return parsed.protocol === 'http:' || parsed.protocol === 'https:'
}

/**
 * Coerce a Media URLs field into a list of URL strings.
 * Only a flat list of strings is accepted, everything else is rejected.
 *
 * @param value - Raw Media URLs field value
 * @param itemIndex - Index of the item being processed, used in error messages
 * @returns The media URLs as trimmed strings
 * @throws {NodeOperationError} When an entry is not a string
 */
export function toMediaUrls(this: IExecuteFunctions, value: unknown, itemIndex: number): string[] {
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

/**
 * n8n hands back a string for a picked date, but an expression can resolve to a Date or a Luxon DateTime
 *
 * @param label - Field name used in error messages
 * @param value - Raw date-time field value
 * @param itemIndex - Index of the item being processed, used in error messages
 * @returns The value as an ISO 8601 timestamp
 * @throws {NodeOperationError} When the value cannot be read as a date-time
 */
export function toIsoTimestamp(
	this: IExecuteFunctions,
	label: string,
	value: unknown,
	itemIndex: number,
): string {
	const reject = () => {
		throw new NodeOperationError(this.getNode(), `${label} is not a valid date and time`, {
			itemIndex,
			description:
				'Pick a date in the field, or use an expression that resolves to an ISO 8601 timestamp such as 2024-12-31T23:59:59Z.',
		})
	}

	// Luxon DateTime, which is what n8n date expressions such as {{ $now }} resolve to
	if (typeof value === 'object' && value !== null && 'toISO' in value) {
		const iso = (value as { toISO: () => string | null }).toISO()
		if (!iso) reject()
		return iso as string
	}

	if (value instanceof Date) {
		if (Number.isNaN(value.getTime())) reject()
		return value.toISOString()
	}

	if (typeof value !== 'string' || !value.trim()) reject()

	const parsed = new Date(value as string)
	if (Number.isNaN(parsed.getTime())) reject()

	return parsed.toISOString()
}

/**
 * Ensure text exists and reject values over the API limit.
 *
 * @param label - Field name used in error messages
 * @param value - Raw field value
 * @param maxLength - Maximum length the API accepts, or undefined when it is not capped
 * @param itemIndex - Index of the item being processed, used in error messages
 * @returns The value trimmed
 * @throws {NodeOperationError} When the value is empty or too long
 */
export function requireString(
	this: IExecuteFunctions,
	label: string,
	value: unknown,
	maxLength: number | undefined,
	itemIndex: number,
): string {
	const text = typeof value === 'string' ? value.trim() : ''
	if (!text) {
		throw new NodeOperationError(this.getNode(), `${label} is required`, { itemIndex })
	}

	return maxLength === undefined ? text : withinLength.call(this, label, text, maxLength, itemIndex)
}

/**
 * Read optional text field
 *
 * @param label - Field name used in error messages
 * @param value - Raw field value
 * @param maxLength - Maximum length the API accepts, or undefined when it is not capped
 * @param itemIndex - Index of the item being processed, used in error messages
 * @returns The value trimmed, or an empty string when it is unset
 * @throws {NodeOperationError} When the value is too long
 */
export function optionalString(
	this: IExecuteFunctions,
	label: string,
	value: unknown,
	maxLength: number | undefined,
	itemIndex: number,
): string {
	const text = typeof value === 'string' ? value.trim() : ''
	if (!text) return ''

	return maxLength === undefined ? text : withinLength.call(this, label, text, maxLength, itemIndex)
}

/**
 * Reject a value that is over an API length limit.
 *
 * @param label - Field name used in error messages
 * @param value - Value to check
 * @param maxLength - Maximum length the API accepts
 * @param itemIndex - Index of the item being processed, used in error messages
 * @returns The value unchanged
 * @throws {NodeOperationError} When the value is too long
 */
export function withinLength(
	this: IExecuteFunctions,
	label: string,
	value: string,
	maxLength: number,
	itemIndex: number,
): string {
	if (value.length > maxLength) {
		throw new NodeOperationError(
			this.getNode(),
			`${label} must be ${maxLength} characters or fewer`,
			{ itemIndex },
		)
	}
	return value
}
