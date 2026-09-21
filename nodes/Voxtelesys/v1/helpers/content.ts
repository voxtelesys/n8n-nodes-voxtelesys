import type { IDataObject, IExecuteFunctions } from 'n8n-workflow'
import { NodeOperationError } from 'n8n-workflow'

import {
	MAX_CARD_DESCRIPTION_LENGTH,
	MAX_CARD_SUGGESTIONS,
	MAX_CARD_TITLE_LENGTH,
	MAX_CAROUSEL_CARDS,
	MAX_MESSAGE_BODY_LENGTH,
	MAX_SUGGESTIONS,
	MAX_URL_LENGTH,
	MIN_CAROUSEL_CARDS,
} from './constants'
import { toSuggestions } from './suggestions'
import { optionalString, requireString } from './utils'

export type ContentType = 'TEXT' | 'FILE' | 'CARD' | 'CAROUSEL'

/**
 * Build the `content` object of a send
 *
 * TEXT     { type, body }
 * FILE     { type, file_url, thumbnail_url }
 * CARD     { type, orientation, alignment, content: Card }
 * CAROUSEL { type, card_width, cards: Card[] }
 *
 * @param contentType - Content Type field value, which selects the shape of the content
 * @param normalize - Whether to convert loosely formatted phone numbers to E.164
 * @param itemIndex - Index of the item being processed, used in error messages
 * @returns The content in the shape the API expects
 * @throws {NodeOperationError} When the content is incomplete or exceeds an API limit
 */
export function toContent(
	this: IExecuteFunctions,
	contentType: ContentType,
	normalize: boolean,
	itemIndex: number,
): IDataObject {
	const content: IDataObject = { type: contentType }

	switch (contentType) {
		case 'TEXT':
			content.body = requireString.call(
				this,
				'Message',
				this.getNodeParameter('body', itemIndex, ''),
				MAX_MESSAGE_BODY_LENGTH,
				itemIndex,
			)
			break

		case 'FILE': {
			content.file_url = requireString.call(
				this,
				'File URL',
				this.getNodeParameter('fileUrl', itemIndex, ''),
				MAX_URL_LENGTH,
				itemIndex,
			)

			const thumbnailUrl = optionalString.call(
				this,
				'Thumbnail URL',
				this.getNodeParameter('thumbnailUrl', itemIndex, ''),
				MAX_URL_LENGTH,
				itemIndex,
			)
			if (thumbnailUrl) content.thumbnail_url = thumbnailUrl
			break
		}

		case 'CARD': {
			content.orientation = this.getNodeParameter('orientation', itemIndex, 'VERTICAL')
			content.alignment = this.getNodeParameter('alignment', itemIndex, 'LEFT')

			const entries = toCardEntries(this.getNodeParameter('card', itemIndex, {}))
			if (entries.length === 0) {
				throw new NodeOperationError(this.getNode(), 'Card is required', {
					itemIndex,
					description:
						'Add the card with the Add Card button, then give it a title, media, or both.',
				})
			}

			content.content = toCard.call(this, entries[0], 'Card', normalize, itemIndex)
			break
		}

		case 'CAROUSEL': {
			content.card_width = this.getNodeParameter('cardWidth', itemIndex, 'MEDIUM')

			const entries = toCardEntries(this.getNodeParameter('cards', itemIndex, {}))
			if (entries.length < MIN_CAROUSEL_CARDS || entries.length > MAX_CAROUSEL_CARDS) {
				throw new NodeOperationError(
					this.getNode(),
					`A carousel must have between ${MIN_CAROUSEL_CARDS} and ${MAX_CAROUSEL_CARDS} cards, but ${entries.length} ${entries.length === 1 ? 'was' : 'were'} given`,
					{ itemIndex },
				)
			}

			content.cards = entries.map((entry, index) =>
				toCard.call(this, entry, `Card ${index + 1}`, normalize, itemIndex),
			)
			break
		}

		default:
			throw new NodeOperationError(
				this.getNode(),
				`Content Type has an unknown value: "${contentType}"`,
				{ itemIndex },
			)
	}

	const suggestions = toSuggestions.call(
		this,
		this.getNodeParameter('suggestions', itemIndex, {}),
		{ max: MAX_SUGGESTIONS, normalize },
		itemIndex,
	)
	if (suggestions.length) content.suggestions = suggestions

	return content
}

// Both the single card and the carousel cards come back as a fixedCollection keyed by `card`
function toCardEntries(value: unknown): IDataObject[] {
	const entries = ((value as IDataObject)?.card ?? []) as IDataObject | IDataObject[]

	// A fixedCollection that takes a single value hands back the entry rather than a list
	if (!Array.isArray(entries)) return [entries]

	return entries
}

/**
 * Build a single card used by both the CARD and CAROUSEL types
 *
 * @param entry - Raw card values
 * @param label - Card name used in error messages
 * @param normalize - Whether to convert loosely formatted phone numbers to E.164
 * @param itemIndex - Index of the item being processed, used in error messages
 * @returns The card in the shape the API expects
 * @throws {NodeOperationError} When the card has nothing to render or exceeds an API limit
 */
function toCard(
	this: IExecuteFunctions,
	entry: IDataObject,
	label: string,
	normalize: boolean,
	itemIndex: number,
): IDataObject {
	const card: IDataObject = {}

	const title = optionalString.call(
		this,
		`${label} Title`,
		entry.title,
		MAX_CARD_TITLE_LENGTH,
		itemIndex,
	)
	if (title) card.title = title

	const description = optionalString.call(
		this,
		`${label} Description`,
		entry.description,
		MAX_CARD_DESCRIPTION_LENGTH,
		itemIndex,
	)
	if (description) card.description = description

	const mediaUrl = optionalString.call(
		this,
		`${label} Media URL`,
		entry.mediaUrl,
		MAX_URL_LENGTH,
		itemIndex,
	)

	// The API only renders a card that has something on it
	if (!title && !mediaUrl) {
		throw new NodeOperationError(this.getNode(), `${label} needs a title or a media URL`, {
			itemIndex,
			description:
				'A card is only rendered when it has something to show. A description on its own is not enough.',
		})
	}

	if (mediaUrl) {
		const media: IDataObject = {
			file_url: mediaUrl,
			height: (entry.mediaHeight as string) || 'MEDIUM',
		}

		const thumbnailUrl = optionalString.call(
			this,
			`${label} Media Thumbnail URL`,
			entry.mediaThumbnailUrl,
			MAX_URL_LENGTH,
			itemIndex,
		)
		if (thumbnailUrl) media.thumbnail_url = thumbnailUrl

		card.media = media
	}

	const suggestions = toSuggestions.call(
		this,
		entry.suggestions,
		{ max: MAX_CARD_SUGGESTIONS, labelPrefix: label, normalize },
		itemIndex,
	)
	if (suggestions.length) card.suggestions = suggestions

	return card
}
