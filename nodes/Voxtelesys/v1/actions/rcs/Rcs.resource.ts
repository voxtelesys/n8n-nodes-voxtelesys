import type { INodeProperties } from 'n8n-workflow'

const showFor = (operation: string[]) => ({
	show: {
		resource: ['rcs'],
		operation,
	},
})

const showForContentType = (contentType: string[]) => ({
	show: {
		resource: ['rcs'],
		operation: ['send'],
		contentType,
	},
})

const showForSuggestionType = (type: string[]) => ({
	show: { type },
})

// Media on a card is optional, and the rest of the media fields only matter once a URL is set
const showWhenMediaSet = {
	show: { mediaUrl: [{ _cnd: { not: '' } }] },
}

export const rcsOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['rcs'] } },
		options: [
			{
				name: 'Send',
				value: 'send',
				description: 'Send an RCS message',
				action: 'Send an RCS message',
			},
		],
		default: 'send',
	},
]

// Suggestion fields
const suggestionFields: INodeProperties[] = [
	{
		displayName: 'Type',
		name: 'type',
		type: 'options',
		// Suggestion types in the order our docs list them
		options: [
			{
				name: 'Create Calendar Event',
				value: 'CREATE_CALENDAR_EVENT',
				description: 'Open the calendar app with a new event prefilled',
			},
			{ name: 'Dial Phone', value: 'DIAL_PHONE', description: 'Open the dialer with a number' },
			{ name: 'Open URL', value: 'OPEN_URL', description: 'Open a URL in a browser or webview' },
			{ name: 'Reply', value: 'REPLY', description: 'Send a text reply back to the sender' },
			{
				name: 'Request Location',
				value: 'REQUEST_LOCATION',
				description: 'Ask the recipient to share their location',
			},
			{ name: 'Show Location', value: 'SHOW_LOCATION', description: 'Open a map at a location' },
		],
		default: 'REPLY',
		description: "What tapping the chip does on the recipient's phone",
	},
	{
		displayName: 'Text',
		name: 'text',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'Reply',
		description: 'Text to display in the suggestion chip (max 25 characters)',
	},
	{
		displayName: 'Callback Data',
		name: 'callbackData',
		type: 'string',
		default: '',
		required: true,
		description:
			'Data sent back to you when the chip is tapped (max 2048 characters). Arrives on the inbound message or callback event, so use it to identify which chip was tapped.',
	},
	// OPEN_URL
	{
		displayName: 'URL',
		name: 'url',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'https://example.com',
		description: 'The URL to open',
		displayOptions: showForSuggestionType(['OPEN_URL']),
	},
	{
		displayName: 'Application',
		name: 'application',
		type: 'options',
		options: [
			{ name: 'Browser', value: 'BROWSER', description: "Open the URL in the phone's web browser" },
			{
				name: 'Webview',
				value: 'WEBVIEW',
				description: "Open the URL inside the phone's messaging app",
			},
		],
		default: 'BROWSER',
		description: 'How the URL will be opened on the phone',
		displayOptions: showForSuggestionType(['OPEN_URL']),
	},
	{
		displayName: 'View Mode',
		name: 'viewMode',
		type: 'options',
		options: [
			{ name: 'Full', value: 'FULL', description: 'Take up the full screen' },
			{ name: 'Half', value: 'HALF', description: 'Take up half of the screen' },
			{ name: 'Tall', value: 'TALL', description: 'Take up three quarters of the screen' },
		],
		default: 'FULL',
		required: true,
		description: 'How much of the screen the webview takes up. Required for a webview.',
		displayOptions: { show: { type: ['OPEN_URL'], application: ['WEBVIEW'] } },
	},
	// DIAL_PHONE
	{
		displayName: 'Phone Number',
		name: 'phoneNumber',
		type: 'string',
		default: '',
		required: true,
		placeholder: '+13003003000',
		description: 'The phone number to dial, in E.164 format',
		displayOptions: showForSuggestionType(['DIAL_PHONE']),
	},
	// SHOW_LOCATION
	{
		displayName: 'Latitude',
		name: 'latitude',
		type: 'number',
		default: 0,
		required: true,
		description: 'Latitude of the location to show, between -90 and 90',
		displayOptions: showForSuggestionType(['SHOW_LOCATION']),
	},
	{
		displayName: 'Longitude',
		name: 'longitude',
		type: 'number',
		default: 0,
		required: true,
		description: 'Longitude of the location to show, between -180 and 180',
		displayOptions: showForSuggestionType(['SHOW_LOCATION']),
	},
	{
		displayName: 'Label',
		name: 'label',
		type: 'string',
		default: '',
		placeholder: 'Our office',
		description: 'Name shown for the location on the map (max 100 characters)',
		displayOptions: showForSuggestionType(['SHOW_LOCATION']),
	},
	// CREATE_CALENDAR_EVENT
	{
		displayName: 'Title',
		name: 'title',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'Planning Meeting',
		description: 'Title of the event (max 100 characters)',
		displayOptions: showForSuggestionType(['CREATE_CALENDAR_EVENT']),
	},
	{
		displayName: 'Start Time',
		name: 'startTime',
		type: 'dateTime',
		default: '',
		required: true,
		description: 'When the event starts',
		displayOptions: showForSuggestionType(['CREATE_CALENDAR_EVENT']),
	},
	{
		displayName: 'End Time',
		name: 'endTime',
		type: 'dateTime',
		default: '',
		required: true,
		description: 'When the event ends. Must be after the start time.',
		displayOptions: showForSuggestionType(['CREATE_CALENDAR_EVENT']),
	},
	{
		displayName: 'Description',
		name: 'eventDescription',
		type: 'string',
		typeOptions: { rows: 2 },
		default: '',
		description: 'Description of the event (max 500 characters)',
		displayOptions: showForSuggestionType(['CREATE_CALENDAR_EVENT']),
	},
]

// Suggestion chips
const suggestionsField = {
	displayName: 'Suggestions',
	name: 'suggestions',
	type: 'fixedCollection',
	typeOptions: { multipleValues: true, multipleValueButtonText: 'Add suggestion' },
	placeholder: 'Add suggestion',
	default: {},
	options: [
		{
			displayName: 'Suggestion',
			name: 'suggestion',
			values: suggestionFields,
		},
	],
} satisfies INodeProperties

// Contents of one card used by both the Card and Carousel
const cardFields: INodeProperties[] = [
	{
		displayName: 'Title',
		name: 'title',
		type: 'string',
		default: '',
		placeholder: 'Card Title',
		description:
			'Title of the card (max 200 characters). A card needs a title, media, or both, to be shown.',
	},
	{
		displayName: 'Description',
		name: 'description',
		type: 'string',
		typeOptions: { rows: 3 },
		default: '',
		description:
			'Description shown under the title (max 1600 characters). A description on its own is not enough to render a card.',
	},
	{
		displayName: 'Media URL',
		name: 'mediaUrl',
		type: 'string',
		default: '',
		placeholder: 'https://example.com/media.jpg',
		description:
			'Publicly reachable URL of an image or video to show on the card, up to 15 MB. A card needs a title, media, or both, to be shown.',
	},
	{
		displayName: 'Media Height',
		name: 'mediaHeight',
		type: 'options',
		options: [
			{ name: 'Medium', value: 'MEDIUM' },
			{ name: 'Short', value: 'SHORT' },
			{ name: 'Tall', value: 'TALL' },
		],
		default: 'MEDIUM',
		description: 'How much of the card the media takes up',
		displayOptions: showWhenMediaSet,
	},
	{
		displayName: 'Media Thumbnail URL',
		name: 'mediaThumbnailUrl',
		type: 'string',
		default: '',
		placeholder: 'https://example.com/thumb.jpg',
		description:
			'Publicly reachable URL of a thumbnail to show while the media loads, up to 100 KB. JPEG or PNG only.',
		displayOptions: showWhenMediaSet,
	},
	{
		...suggestionsField,
		description:
			'Tappable chips shown on this card rather than under the message, up to 4. Each one either replies, opens something on the phone, or asks the recipient for their location.',
	},
]

export const rcsFields: INodeProperties[] = [
	// POST /rcs
	{
		displayName: 'From',
		name: 'from',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'Brand',
		description:
			'Registered sender the message is sent as, which is an RCS agent rather than a phone number',
		displayOptions: showFor(['send']),
	},
	{
		displayName: 'To',
		name: 'to',
		type: 'string',
		default: '',
		required: true,
		placeholder: '+13003003001',
		description: 'Recipient phone number, in E.164 format',
		displayOptions: showFor(['send']),
	},
	{
		displayName: 'Content Type',
		name: 'contentType',
		type: 'options',
		options: [
			{
				name: 'Card',
				value: 'CARD',
				description: 'A single rich card with a title, description and media',
			},
			{
				name: 'Carousel',
				value: 'CAROUSEL',
				description: 'Between 2 and 10 rich cards the recipient scrolls through',
			},
			{
				name: 'File',
				value: 'FILE',
				description: 'An image, video, audio file or PDF sent on its own',
			},
			{ name: 'Text', value: 'TEXT', description: 'A plain text message' },
		],
		default: 'TEXT',
		description: 'What the message carries. Suggestions can be attached to any of them.',
		displayOptions: showFor(['send']),
	},
	// TEXT
	{
		displayName: 'Message',
		name: 'body',
		type: 'string',
		typeOptions: { rows: 4 },
		default: '',
		required: true,
		description: 'Message body (max 1600 characters)',
		displayOptions: showForContentType(['TEXT']),
	},
	// FILE
	{
		displayName: 'File URL',
		name: 'fileUrl',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'https://example.com/media.jpg',
		description:
			'Publicly reachable URL of the file to send, up to 15 MB. Images, video, audio and PDFs are accepted.',
		displayOptions: showForContentType(['FILE']),
	},
	{
		displayName: 'Thumbnail URL',
		name: 'thumbnailUrl',
		type: 'string',
		default: '',
		placeholder: 'https://example.com/thumb.jpg',
		description:
			'Publicly reachable URL of a thumbnail to show while the file loads, up to 100 KB. JPEG or PNG only.',
		displayOptions: showForContentType(['FILE']),
	},
	// CARD
	{
		displayName: 'Orientation',
		name: 'orientation',
		type: 'options',
		options: [
			{ name: 'Horizontal', value: 'HORIZONTAL', description: 'Media beside the text' },
			{ name: 'Vertical', value: 'VERTICAL', description: 'Media above the text' },
		],
		default: 'VERTICAL',
		description: 'How the card lays out its media against its text',
		displayOptions: showForContentType(['CARD']),
	},
	{
		displayName: 'Alignment',
		name: 'alignment',
		type: 'options',
		options: [
			{ name: 'Left', value: 'LEFT' },
			{ name: 'Right', value: 'RIGHT' },
		],
		default: 'LEFT',
		description: 'Which side of the card its content sits on',
		displayOptions: showForContentType(['CARD']),
	},
	{
		displayName: 'Card',
		name: 'card',
		type: 'fixedCollection',
		placeholder: 'Add card',
		default: {},
		description: 'Contents of the card',
		displayOptions: showForContentType(['CARD']),
		options: [
			{
				displayName: 'Card',
				name: 'card',
				values: cardFields,
			},
		],
	},
	// CAROUSEL
	{
		displayName: 'Card Width',
		name: 'cardWidth',
		type: 'options',
		options: [
			{ name: 'Medium', value: 'MEDIUM' },
			{ name: 'Small', value: 'SMALL' },
		],
		default: 'MEDIUM',
		description: 'Width every card in the carousel is shown at',
		displayOptions: showForContentType(['CAROUSEL']),
	},
	{
		displayName: 'Cards',
		name: 'cards',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true, multipleValueButtonText: 'Add card' },
		placeholder: 'Add card',
		default: {},
		description:
			'Cards in the carousel, between 2 and 10. Each one needs a title, media, or both, to be shown.',
		displayOptions: showForContentType(['CAROUSEL']),
		options: [
			{
				displayName: 'Card',
				name: 'card',
				values: cardFields,
			},
		],
	},
	{
		...suggestionsField,
		description:
			'Tappable chips shown under the message, up to 11, whichever content type it carries. Each one either replies, opens something on the phone, or asks the recipient for their location.',
		displayOptions: showFor(['send']),
	},
	{
		displayName: 'SMS Failover',
		name: 'failover',
		type: 'boolean',
		default: false,
		description:
			'Whether to fall back to sending an SMS or MMS message when the recipient cannot receive RCS',
		displayOptions: showFor(['send']),
	},
	{
		displayName: 'Failover From',
		name: 'failoverFrom',
		type: 'string',
		default: '',
		required: true,
		placeholder: '+13003003000',
		description:
			'Sender phone number for the failover message, in E.164 format. The RCS sender is an agent rather than a number, so a number is always needed here.',
		displayOptions: { show: { resource: ['rcs'], operation: ['send'], failover: [true] } },
	},
	{
		displayName: 'Failover Options',
		name: 'failoverOptions',
		type: 'collection',
		placeholder: 'Add failover option',
		default: {},
		displayOptions: { show: { resource: ['rcs'], operation: ['send'], failover: [true] } },
		// Collection options must be ordered alphabetically by display name
		options: [
			{
				displayName: 'Media URLs',
				name: 'media',
				type: 'string',
				typeOptions: { multipleValues: true, multipleValueButtonText: 'Add media URL' },
				default: [],
				placeholder: 'https://path.to.image',
				description:
					'List of publicly reachable URLs to include as media attachments. Providing media sends the failover as an MMS message rather than an SMS message.',
			},
			{
				displayName: 'Message',
				name: 'body',
				type: 'string',
				typeOptions: { rows: 4 },
				default: '',
				description:
					'Message body for the failover message (max 1600 characters). Defaults to the RCS message body, and is required for content that has no body of its own, such as a file, a card or a carousel.',
			},
			{
				displayName: 'To',
				name: 'to',
				type: 'string',
				default: '',
				placeholder: '+13003003001',
				description:
					'Recipient phone number for the failover message, in E.164 format. Defaults to the RCS recipient.',
			},
		],
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add option',
		default: {},
		displayOptions: showFor(['send']),
		// Collection options must be ordered alphabetically by display name
		options: [
			{
				displayName: 'Bulk Tag',
				name: 'bulkTag',
				type: 'string',
				default: '',
				description:
					'String which will be included in callback events (max 256 chars), typically used to store an external identifier for a batch of messages',
			},
			{
				displayName: 'Expire At',
				name: 'expireAt',
				type: 'dateTime',
				default: '',
				description:
					'Give up on the message if it has not been sent by this time. Useful for time-sensitive messages such as one-time passcodes.',
			},
			{
				displayName: 'Normalize Numbers to E.164',
				name: 'normalize',
				type: 'boolean',
				default: true,
				description:
					'Whether to convert loosely formatted numbers such as (300) 555-0100 into E.164 before sending',
			},
			{
				displayName: 'Status Callback Method',
				name: 'statusCallbackMethod',
				type: 'options',
				options: [
					{ name: 'GET', value: 'GET' },
					{ name: 'POST', value: 'POST' },
				],
				default: 'POST',
				// Only available once a callback URL is set
				displayOptions: {
					show: {
						statusCallbackUrl: [{ _cnd: { exists: true } }],
					},
				},
				description: 'The HTTP method to use for status callbacks. Defaults to POST.',
			},
			{
				displayName: 'Status Callback URL',
				name: 'statusCallbackUrl',
				type: 'string',
				default: '',
				placeholder: 'https://example.com/status-callback',
				description:
					'The URL to send callbacks to when the status of the message is updated. Statuses include the intermediate queued and delivering as well as the final delivered, failed, unknown and expired. Pair with the expression {{ $execution.resumeUrl }} and a Wait node, branching on the status and looping back for non-final values. Set the field as an expression so it resolves to a URL, and make sure the URL is reachable from the internet.',
			},
			{
				displayName: 'Tag',
				name: 'tag',
				type: 'string',
				default: '',
				description:
					'String which will be included in callback events (max 256 chars), typically used to store an external identifier for the message',
			},
		],
	},
]
