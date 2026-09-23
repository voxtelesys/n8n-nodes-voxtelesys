import type { NodeHint } from 'n8n-workflow'

import {
	MAX_CALLBACK_DATA_LENGTH,
	MAX_CARD_DESCRIPTION_LENGTH,
	MAX_CARD_SUGGESTIONS,
	MAX_CARD_TITLE_LENGTH,
	MAX_CAROUSEL_CARDS,
	MAX_EVENT_DESCRIPTION_LENGTH,
	MAX_EVENT_TITLE_LENGTH,
	MAX_LOCATION_LABEL_LENGTH,
	MAX_MESSAGE_BODY_LENGTH,
	MAX_SUGGESTION_TEXT_LENGTH,
	MAX_SUGGESTIONS,
	MAX_TAG_LENGTH,
	MAX_URL_LENGTH,
	MIN_CAROUSEL_CARDS,
} from './constants'

/**
 * n8n only enforces a limit in the panel when it maps onto a field, which covers the number
 * fields but nothing else: `fixedCollection` ignores `maxValue`, and a string has no maximum
 * length. These hints cover the rest, so a message that is over a limit says so while it is
 * being built rather than only when it runs.
 */

const IS_RCS = '$parameter.resource === "rcs"'

// Suggestions attached to the message, rather than to one of its cards
const SUGGESTIONS = '(($parameter.suggestions || {}).suggestion || [])'

// A single card comes back as one entry, a carousel as a list, so both are read as a list
const SINGLE_CARD =
	'($parameter.contentType === "CARD" ? [].concat((($parameter.card || {}).card) || []) : [])'
const CAROUSEL_CARDS =
	'($parameter.contentType === "CAROUSEL" ? [].concat((($parameter.cards || {}).card) || []) : [])'
const CARDS = `${SINGLE_CARD}.concat(${CAROUSEL_CARDS})`

// Every suggestion on the send, whether it hangs off the message or off one of its cards
const CARD_SUGGESTIONS = `${CARDS}.reduce(function (all, card) { return all.concat(((card.suggestions || {}).suggestion || [])) }, [])`
const ALL_SUGGESTIONS = `${SUGGESTIONS}.concat(${CARD_SUGGESTIONS})`

// Capped text on a suggestion. `type` limits a field to the suggestion types that show it
const SUGGESTION_TEXT_FIELDS = [
	{ field: 'text', label: 'Text', max: MAX_SUGGESTION_TEXT_LENGTH },
	{ field: 'callbackData', label: 'Callback Data', max: MAX_CALLBACK_DATA_LENGTH },
	{ field: 'label', label: 'Label', max: MAX_LOCATION_LABEL_LENGTH, type: 'SHOW_LOCATION' },
	{ field: 'title', label: 'Title', max: MAX_EVENT_TITLE_LENGTH, type: 'CREATE_CALENDAR_EVENT' },
	{
		field: 'eventDescription',
		label: 'Description',
		max: MAX_EVENT_DESCRIPTION_LENGTH,
		type: 'CREATE_CALENDAR_EVENT',
	},
]

// Capped text on a card, which is the same whether the card stands alone or sits in a carousel
const CARD_TEXT_FIELDS = [
	{ field: 'title', label: 'Title', max: MAX_CARD_TITLE_LENGTH },
	{ field: 'description', label: 'Description', max: MAX_CARD_DESCRIPTION_LENGTH },
	{ field: 'mediaUrl', label: 'Media URL', max: MAX_URL_LENGTH },
	{ field: 'mediaThumbnailUrl', label: 'Media Thumbnail URL', max: MAX_URL_LENGTH },
]

// Reads a field that may be unset, since an untouched field is undefined rather than empty text
const lengthOf = (value: string) => `(${value} || "").length`

// Warns on any entry in a list whose text is over the limit
const someOver = (list: string, field: string, max: number, type?: string) => {
	const guard = type ? `entry.type === '${type}' && ` : ''
	return `${list}.some(function (entry) { return ${guard}${lengthOf(`entry.${field}`)} > ${max} })`
}

const warn = (message: string, condition: string): NodeHint => ({
	message,
	type: 'warning',
	location: 'ndv',
	displayCondition: `={{ ${condition} }}`,
})

// Scopes a condition to the RCS resource, whose fields keep their values while Message is selected
const rcs = (condition: string) => `${IS_RCS} && (${condition})`

export const nodeHints: NodeHint[] = [
	warn(
		`A message can carry at most ${MAX_SUGGESTIONS} suggestions, and this one has more`,
		rcs(`${SUGGESTIONS}.length > ${MAX_SUGGESTIONS}`),
	),
	warn(
		`A card can carry at most ${MAX_CARD_SUGGESTIONS} suggestions, and one of these has more`,
		rcs(
			`${CARDS}.some(function (card) { return ((card.suggestions || {}).suggestion || []).length > ${MAX_CARD_SUGGESTIONS} })`,
		),
	),
	warn(
		`A carousel needs between ${MIN_CAROUSEL_CARDS} and ${MAX_CAROUSEL_CARDS} cards`,
		rcs(
			`$parameter.contentType === "CAROUSEL" && (${CAROUSEL_CARDS}.length < ${MIN_CAROUSEL_CARDS} || ${CAROUSEL_CARDS}.length > ${MAX_CAROUSEL_CARDS})`,
		),
	),
	warn(
		'Every card needs a Title, a Media URL, or both — a description on its own is not enough',
		rcs(
			`${CARDS}.some(function (card) { return !(card.title || "").trim() && !(card.mediaUrl || "").trim() })`,
		),
	),
	warn(
		`Message must be ${MAX_MESSAGE_BODY_LENGTH} characters or fewer`,
		rcs(
			`$parameter.contentType === "TEXT" && ${lengthOf('$parameter.body')} > ${MAX_MESSAGE_BODY_LENGTH}`,
		),
	),
	warn(
		`File URL must be ${MAX_URL_LENGTH} characters or fewer`,
		rcs(
			`$parameter.contentType === "FILE" && (${lengthOf('$parameter.fileUrl')} > ${MAX_URL_LENGTH} || ${lengthOf('$parameter.thumbnailUrl')} > ${MAX_URL_LENGTH})`,
		),
	),
	...CARD_TEXT_FIELDS.map(({ field, label, max }) =>
		warn(`A card's ${label} must be ${max} characters or fewer`, rcs(someOver(CARDS, field, max))),
	),
	...SUGGESTION_TEXT_FIELDS.map(({ field, label, max, type }) =>
		warn(
			`A suggestion's ${label} must be ${max} characters or fewer`,
			rcs(someOver(ALL_SUGGESTIONS, field, max, type)),
		),
	),
	warn(
		`Failover Message must be ${MAX_MESSAGE_BODY_LENGTH} characters or fewer`,
		rcs(
			`$parameter.failover === true && ${lengthOf('($parameter.failoverOptions || {}).body')} > ${MAX_MESSAGE_BODY_LENGTH}`,
		),
	),
	// Tags are an option on both resources, so this one is not scoped to RCS
	warn(
		`Tag and Bulk Tag must be ${MAX_TAG_LENGTH} characters or fewer`,
		`${lengthOf('($parameter.options || {}).tag')} > ${MAX_TAG_LENGTH} || ${lengthOf('($parameter.options || {}).bulkTag')} > ${MAX_TAG_LENGTH}`,
	),
]
