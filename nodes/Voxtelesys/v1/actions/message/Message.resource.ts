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
		placeholder: '+13005550100',
		description:
			'Sending number in E.164 format. Must be SMS enabled and assigned to the same service trunk group as your credential.',
		displayOptions: showFor(['send']),
	},
	{
		displayName: 'To',
		name: 'to',
		type: 'string',
		default: '',
		required: true,
		placeholder: '+13005550101',
		description:
			'Recipient number in E.164 format. To message many recipients, pass one input item per recipient.',
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
				displayName: 'Tag',
				name: 'tag',
				type: 'string',
				default: '',
				description:
					'Custom string echoed back on the delivery report and included on the delivery receipt. Use it to carry business context such as an order ID. Max 256 characters.',
			},
			{
				displayName: 'Bulk Tag',
				name: 'bulkTag',
				type: 'string',
				default: '',
				description:
					'Used to store an external identifier for a batch of messages which is included in callback events. Max 256 characters.',
			},
			{
				displayName: 'Media URLs',
				name: 'media',
				type: 'string',
				typeOptions: { multipleValues: true, multipleValueButtonText: 'Add media URL' },
				default: [],
				placeholder: 'https://example.com/image.jpg',
				description:
					'Publicly reachable URLs to attach as MMS message. Providing media makes this an MMS message rather than an SMS message.',
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
				displayName: 'Status Callback URL',
				name: 'statusCallbackUrl',
				type: 'string',
				default: '',
				placeholder: '{{ $execution.resumeUrl }}',
				description:
					'Per-message delivery receipt destination, overriding the Messaging Application DR webhook. Fires on every status change, including intermediate ones. Pair with {{ $execution.resumeUrl }} and a Wait node, branching on the status and looping back for non-final values.',
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
				// Only offered once a callback URL is set, so the method can never be stored on its own
				displayOptions: {
					show: {
						statusCallbackUrl: [{ _cnd: { not: '' } }],
					},
				},
				description: 'HTTP method Voxtelesys uses when calling the status callback URL',
			}
		],
	},
]
