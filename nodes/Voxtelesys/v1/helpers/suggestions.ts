import type { IDataObject, IExecuteFunctions } from 'n8n-workflow'
import { NodeOperationError } from 'n8n-workflow'

import {
	MAX_CALLBACK_DATA_LENGTH,
	MAX_EVENT_DESCRIPTION_LENGTH,
	MAX_EVENT_TITLE_LENGTH,
	MAX_LOCATION_LABEL_LENGTH,
	MAX_SUGGESTIONS,
	MAX_SUGGESTION_TEXT_LENGTH,
} from './constants'
import { normalizeAndValidate } from './phoneNumbers'
import { toIsoTimestamp } from './utils'

type SuggestionType =
	| 'REPLY'
	| 'OPEN_URL'
	| 'DIAL_PHONE'
	| 'SHOW_LOCATION'
	| 'REQUEST_LOCATION'
	| 'CREATE_CALENDAR_EVENT'

/**
 * Build the `content.suggestions` array
 *
 * @param value - Raw Suggestions field value
 * @param normalize - Whether to convert loosely formatted phone numbers to E.164
 * @param itemIndex - Index of the item being processed, used in error messages
 * @returns The suggestions in the shape the API expects
 * @throws {NodeOperationError} When a suggestion is incomplete or exceeds an API limit
 */
export function toSuggestions(
	this: IExecuteFunctions,
	value: unknown,
	normalize: boolean,
	itemIndex: number,
): IDataObject[] {
	const entries = ((value as IDataObject)?.suggestion ?? []) as IDataObject[]
	if (!Array.isArray(entries) || entries.length === 0) return []

	if (entries.length > MAX_SUGGESTIONS) {
		throw new NodeOperationError(
			this.getNode(),
			`A message can carry at most ${MAX_SUGGESTIONS} suggestions, but ${entries.length} were given`,
			{ itemIndex },
		)
	}

	return entries.map((entry, index) =>
		buildSuggestion.call(this, entry, `Suggestion ${index + 1}`, normalize, itemIndex),
	)
}

// Builds the suggestion
function buildSuggestion(
	this: IExecuteFunctions,
	entry: IDataObject,
	label: string,
	normalize: boolean,
	itemIndex: number,
): IDataObject {
	const type = (entry.type as SuggestionType) || 'REPLY'

	const suggestion: IDataObject = {
		type,
		text: requireString.call(
			this,
			`${label} Text`,
			entry.text,
			MAX_SUGGESTION_TEXT_LENGTH,
			itemIndex,
		),
		callback_data: requireString.call(
			this,
			`${label} Callback Data`,
			entry.callbackData,
			MAX_CALLBACK_DATA_LENGTH,
			itemIndex,
		),
	}

	switch (type) {
		// These two cases do not need any extra logic added to them
		case 'REPLY':
		case 'REQUEST_LOCATION':
			break

		case 'OPEN_URL': {
			suggestion.url = requireString.call(this, `${label} URL`, entry.url, undefined, itemIndex)

			const application = (entry.application as string) || 'BROWSER'
			suggestion.application = application

			if (application === 'WEBVIEW') {
				suggestion.view_mode = requireString.call(
					this,
					`${label} View Mode`,
					entry.viewMode,
					undefined,
					itemIndex,
				)
			}
			break
		}

		case 'DIAL_PHONE':
			suggestion.phone_number = normalizeAndValidate.call(
				this,
				`${label} Phone Number`,
				requireString.call(this, `${label} Phone Number`, entry.phoneNumber, undefined, itemIndex),
				{ normalize, itemIndex },
			)
			break

		case 'SHOW_LOCATION': {
			suggestion.location = {
				latitude: requireCoordinate.call(this, `${label} Latitude`, entry.latitude, 90, itemIndex),
				longitude: requireCoordinate.call(
					this,
					`${label} Longitude`,
					entry.longitude,
					180,
					itemIndex,
				),
			}

			const locationLabel = ((entry.label as string) ?? '').trim()
			if (locationLabel) {
				suggestion.label = withinLength.call(
					this,
					`${label} Label`,
					locationLabel,
					MAX_LOCATION_LABEL_LENGTH,
					itemIndex,
				)
			}
			break
		}

		case 'CREATE_CALENDAR_EVENT': {
			suggestion.title = requireString.call(
				this,
				`${label} Title`,
				entry.title,
				MAX_EVENT_TITLE_LENGTH,
				itemIndex,
			)

			const startTime = toIsoTimestamp.call(this, `${label} Start Time`, entry.startTime, itemIndex)
			const endTime = toIsoTimestamp.call(this, `${label} End Time`, entry.endTime, itemIndex)

			if (Date.parse(endTime) <= Date.parse(startTime)) {
				throw new NodeOperationError(
					this.getNode(),
					`${label} End Time must be after its Start Time`,
					{ itemIndex },
				)
			}

			suggestion.start_time = startTime
			suggestion.end_time = endTime

			const eventDescription = ((entry.eventDescription as string) ?? '').trim()
			if (eventDescription) {
				suggestion.description = withinLength.call(
					this,
					`${label} Description`,
					eventDescription,
					MAX_EVENT_DESCRIPTION_LENGTH,
					itemIndex,
				)
			}
			break
		}

		default:
			throw new NodeOperationError(this.getNode(), `${label} has an unknown type: "${type}"`, {
				itemIndex,
			})
	}

	return suggestion
}

// Read empty or long values from the text field of a suggestion
function requireString(
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

function withinLength(
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

// Read a required latitude or longitude off of a suggestion and reject values that are not in range
function requireCoordinate(
	this: IExecuteFunctions,
	label: string,
	value: unknown,
	bound: number,
	itemIndex: number,
): number {
	const coordinate = typeof value === 'string' ? Number(value.trim()) : (value as number)

	if (typeof coordinate !== 'number' || !Number.isFinite(coordinate)) {
		throw new NodeOperationError(this.getNode(), `${label} is required and must be a number`, {
			itemIndex,
		})
	}

	if (coordinate < -bound || coordinate > bound) {
		throw new NodeOperationError(
			this.getNode(),
			`${label} must be between -${bound} and ${bound}, but is ${coordinate}`,
			{ itemIndex },
		)
	}

	return coordinate
}
