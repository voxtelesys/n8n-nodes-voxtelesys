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
				name: 'Get',
				value: 'get',
				description: 'Retrieve a single message by ID',
				action: 'Get a message',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Retrieve a list of messages',
				action: 'Get many messages',
			},
			{
				name: 'Send',
				value: 'send',
				description: 'Send an SMS or MMS message',
				action: 'Send a message',
			},
			{
				name: 'Send Batch',
				value: 'sendBatch',
				description: 'Send one personalized message to many recipients in a single call',
				action: 'Send a batch of messages',
			},
		],
		default: 'send',
	},
]

export const messageFields: INodeProperties[] = [
	// POST /sms and POST /sms/batch
	{
		displayName: 'From',
		name: 'from',
		type: 'string',
		default: '',
		required: true,
		placeholder: '+13005550100',
		description:
			'Sending number in E.164 format. Must be SMS enabled and assigned to the same service trunk group as your credential.',
		displayOptions: showFor(['send', 'sendBatch']),
	},
	// POST /sms
	{
		displayName: 'To',
		name: 'to',
		type: 'string',
		default: '',
		required: true,
		placeholder: '+13005550101',
		description:
			'Recipient number in E.164 format. To message many recipients, pass one input item per recipient, or use the Send Batch operation.',
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
			'Text body of the message. Required on every send, including an MMS that also carries media.',
		displayOptions: showFor(['send']),
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add option',
		default: {},
		displayOptions: showFor(['send']),
		options: [
			{
				displayName: 'Bulk Tag',
				name: 'bulkTag',
				type: 'string',
				default: '',
				description:
					'Groups related messages together, for example every message in one campaign. Returned on delivery reports as bulk_tag. Max 256 characters.',
			},
			{
				displayName: 'Media URLs',
				name: 'media',
				type: 'string',
				typeOptions: { multipleValues: true, multipleValueButtonText: 'Add media URL' },
				default: [],
				placeholder: 'https://example.com/image.jpg',
				description:
					'Publicly reachable URLs to attach as MMS. Providing media makes this an MMS rather than an SMS.',
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
					{ name: 'POST', value: 'POST' },
					{ name: 'GET', value: 'GET' },
				],
				default: 'POST',
				description:
					'HTTP method Voxtelesys uses when calling the status callback URL. Ignored unless a Status Callback URL is set.',
			},
			{
				displayName: 'Status Callback URL',
				name: 'statusCallbackUrl',
				type: 'string',
				default: '',
				placeholder: '{{ $execution.resumeUrl }}',
				description:
					'Per-message delivery receipt destination, overriding the Messaging Application DR webhook. Fires on every status change, including intermediate ones. Pair with {{ $execution.resumeUrl }} and a Wait node, branching on the status and looping back for non-final values.',
			},
			{
				displayName: 'Tag',
				name: 'tag',
				type: 'string',
				default: '',
				description:
					'Custom string echoed back on the delivery report and on Get. Use it to carry business context such as an order ID. Max 256 characters.',
			},
		],
	},
	// POST /sms/batch
	{
		displayName: 'Recipients',
		name: 'recipients',
		type: 'string',
		typeOptions: { multipleValues: true, multipleValueButtonText: 'Add recipient' },
		default: [],
		required: true,
		placeholder: '+13005550101',
		description: 'Recipient numbers in E.164 format. Sent as the batch <code>to</code> list.',
		displayOptions: showFor(['sendBatch']),
	},
	{
		displayName: 'Message Template',
		name: 'bodyTemplate',
		type: 'string',
		typeOptions: { rows: 4 },
		default: '',
		required: true,
		placeholder: 'Hello ${name}, your appointment is at ${time}.',
		description:
			'Text body sent to every recipient. Required on every batch, including an MMS that also carries media. Insert ${key} placeholders to personalize per recipient, then define the keys below.',
		displayOptions: showFor(['sendBatch']),
	},
	{
		displayName: 'Personalize Per Recipient',
		name: 'personalize',
		type: 'boolean',
		default: false,
		description:
			'Whether to substitute ${key} placeholders in the message template with per-recipient values',
		displayOptions: showFor(['sendBatch']),
	},
	{
		displayName: 'Parameter Keys',
		name: 'parameterKeys',
		type: 'string',
		typeOptions: { multipleValues: true, multipleValueButtonText: 'Add key' },
		default: [],
		placeholder: 'name',
		description:
			'The ${key} names used in the message template, without the ${} wrapper. Order matters: default values and recipient values are matched to these keys by position.',
		displayOptions: {
			show: { resource: ['message'], operation: ['sendBatch'], personalize: [true] },
		},
	},
	{
		displayName: 'Default Values',
		name: 'parameterDefaults',
		type: 'string',
		typeOptions: { multipleValues: true, multipleValueButtonText: 'Add default' },
		default: [],
		description:
			'Fallback values used for any recipient without their own values, in the same order as Parameter Keys. Provide one entry per key; leave an entry empty to send 0, meaning no value.',
		displayOptions: {
			show: { resource: ['message'], operation: ['sendBatch'], personalize: [true] },
		},
	},
	{
		displayName: 'Recipient Values',
		name: 'recipientParameters',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true, multipleValueButtonText: 'Add recipient values' },
		default: {},
		description:
			'Per-recipient substitutions. Any recipient listed above without an entry here falls back to Default Values.',
		displayOptions: {
			show: { resource: ['message'], operation: ['sendBatch'], personalize: [true] },
		},
		options: [
			{
				displayName: 'Recipient',
				name: 'recipient',
				values: [
					{
						displayName: 'To',
						name: 'to',
						type: 'string',
						default: '',
						placeholder: '+13005550101',
						description:
							'Recipient number in E.164 format. Must also appear in the Recipients list above.',
					},
					{
						displayName: 'Values',
						name: 'values',
						type: 'string',
						typeOptions: { multipleValues: true, multipleValueButtonText: 'Add value' },
						default: [],
						description:
							'Values for this recipient, in the same order as Parameter Keys. Provide one entry per key; leave an entry empty to send 0, meaning no value.',
					},
				],
			},
		],
	},
	{
		displayName: 'Options',
		name: 'batchOptions',
		type: 'collection',
		placeholder: 'Add option',
		default: {},
		displayOptions: showFor(['sendBatch']),
		options: [
			{
				displayName: 'Bulk Tag',
				name: 'bulkTag',
				type: 'string',
				default: '',
				description:
					'Shared identifier stamped on every message in this batch and returned as bulk_tag on each delivery report. This is how the per-recipient callbacks are correlated back to the batch that produced them. Max 256 characters.',
			},
			{
				displayName: 'Expire At',
				name: 'expireAt',
				type: 'dateTime',
				default: '',
				description:
					'Drop any message in the batch that has not been sent by this time. Sent as ISO 8601.',
			},
			{
				displayName: 'Media URLs',
				name: 'media',
				type: 'string',
				typeOptions: { multipleValues: true, multipleValueButtonText: 'Add media URL' },
				default: [],
				placeholder: 'https://example.com/image.jpg',
				description:
					'Publicly reachable URLs to attach as MMS. Providing media makes this an MMS rather than an SMS.',
			},
			{
				displayName: 'Normalize Numbers to E.164',
				name: 'normalize',
				type: 'boolean',
				default: true,
				description:
					'Whether to convert loosely formatted numbers such as (300) 555-0100 into E.164 before sending. Applies to the sender, every recipient, and any recipient keys under Recipient Values.',
			},
			{
				displayName: 'Status Callback Method',
				name: 'statusCallbackMethod',
				type: 'options',
				options: [
					{ name: 'POST', value: 'POST' },
					{ name: 'GET', value: 'GET' },
				],
				default: 'POST',
				description:
					'HTTP method Voxtelesys uses when calling the status callback URL. Ignored unless a Status Callback URL is set.',
			},
			{
				displayName: 'Status Callback URL',
				name: 'statusCallbackUrl',
				type: 'string',
				default: '',
				placeholder: 'https://example.com/delivery-receipts',
				description:
					'Delivery receipt destination, overriding the Messaging Application DR webhook. The batch is flattened into one message per recipient, so this URL receives a separate callback per recipient per status change, each carrying its own message ID and to number. Send to 20 recipients and 20 independent callback streams arrive here, not one batch-level result. Use a Webhook node rather than {{ $execution.resumeUrl }} and a Wait node: a Wait node resumes on the first callback and the remaining recipients are dropped.',
			},
			{
				displayName: 'Tag',
				name: 'tag',
				type: 'string',
				default: '',
				description:
					'Custom string echoed back on each delivery report and on Get. One value is applied identically to every message in the batch, so it cannot identify a recipient; branch on the to number or message ID in the callback for that. Max 256 characters.',
			},
		],
	},
	// GET /sms/{id}
	{
		displayName: 'Message ID',
		name: 'messageId',
		type: 'string',
		default: '',
		required: true,
		placeholder: '6708f96b76b15fde200deaca',
		description: 'ID of the message to retrieve',
		displayOptions: showFor(['get']),
	},
	// GET /sms
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		description: 'Whether to return all results or only up to a given limit',
		displayOptions: showFor(['getAll']),
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: { minValue: 1 },
		default: 50,
		description: 'Max number of results to return',
		displayOptions: {
			show: { resource: ['message'], operation: ['getAll'], returnAll: [false] },
		},
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add filter',
		default: {},
		displayOptions: showFor(['getAll']),
		options: [
			{
				displayName: 'Bulk Tag',
				name: 'bulkTag',
				type: 'string',
				default: '',
				description:
					'Return only messages carrying this bulk tag. Applied by the API as bulk_tag.',
			},
			{
				displayName: 'End Date',
				name: 'endDate',
				type: 'dateTime',
				default: '',
				description:
					'Return only messages at or before this time, sent as ISO 8601. Defaults to today when omitted.',
			},
			{
				displayName: 'Start Date',
				name: 'startDate',
				type: 'dateTime',
				default: '',
				description:
					'Return only messages at or after this time, sent as ISO 8601. Defaults to yesterday when omitted, so set this to reach further back.',
			},
			{
				displayName: 'Tag',
				name: 'tag',
				type: 'string',
				default: '',
				description: 'Return only messages carrying this tag. Applied by the API as tag.',
			},
			{
				displayName: 'Trunk Group ID',
				name: 'trunkGroupId',
				type: 'number',
				default: 0,
				placeholder: '70000',
				description:
					'Return only messages on this service trunk group. Leave at 0 to search every trunk group on the account.',
			},
		],
	},
]
