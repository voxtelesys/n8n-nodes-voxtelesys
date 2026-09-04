import type { INodeProperties } from 'n8n-workflow'

const showFor = (operation: string[]) => ({
	show: {
		resource: ['message'],
		operation,
	},
})

export const messageOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['message'] } },
		options: [
			{
				name: 'Send',
				value: 'send',
				description: 'Send an SMS or MMS message',
				action: 'Send a message',
			},
		],
		default: 'send',
	},
]

export const messageFields: INodeProperties[] = [
	// POST /sms
	{
		displayName: 'From',
		name: 'from',
		type: 'string',
		default: '',
		required: true,
		placeholder: '+13003003000',
		description:
			'Sender phone number. Must be in E.164 format: a plus sign, country code, then subscriber number, with no spaces, dashes or parentheses.',
		displayOptions: showFor(['send']),
	},
	{
		displayName: 'To',
		name: 'to',
		type: 'string',
		default: '',
		required: true,
		placeholder: '+13003003001',
		description:
			'Recipient phone number, in E.164 format',
		displayOptions: showFor(['send']),
	},
	{
		displayName: 'Message',
		name: 'body',
		type: 'string',
		typeOptions: { rows: 4 },
		default: '',
		required: true,
		description:
			'Message body. Required on every send, including an MMS that also carries media.',
		displayOptions: showFor(['send']),
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
				displayName: 'Media URLs',
				name: 'media',
				type: 'string',
				typeOptions: { multipleValues: true, multipleValueButtonText: 'Add media URL' },
				default: [],
				placeholder: 'https://path.to.image',
				description:
					'List of publicly reachable URLs to include as media attachments. Providing media sends the message as an MMS message rather than an SMS message.',
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
				placeholder: '{{ $execution.resumeUrl }}',
				description:
					'The URL to send callbacks to when the status of the message is updated, overriding the Messaging Application DR webhook for this message. Statuses include the intermediate queued and delivering as well as the final delivered, failed, unknown and expired. Pair with {{ $execution.resumeUrl }} and a Wait node, branching on the status and looping back for non-final values.',
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
