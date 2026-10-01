import type { INodeProperties } from 'n8n-workflow'

const showFor = (operation: string[]) => ({
	show: {
		resource: ['call'],
		operation,
	},
})

const showForInstructions = (instructions: string[]) => ({
	show: {
		resource: ['call'],
		operation: ['create'],
		instructions,
	},
})

export const callOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['call'] } },
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Place an outgoing call',
				action: 'Create a call',
			},
		],
		default: 'create',
	},
]

export const callFields: INodeProperties[] = [
	// POST /calls
	{
		displayName: 'From',
		name: 'from',
		type: 'string',
		default: '',
		required: true,
		placeholder: '+13003003000',
		description:
			'Number to originate the call from. Must be in E.164 format: a plus sign, country code, then subscriber number, with no spaces, dashes or parentheses.',
		displayOptions: showFor(['create']),
	},
	{
		displayName: 'To',
		name: 'to',
		type: 'string',
		default: '',
		required: true,
		placeholder: '+13003003001',
		description: 'Number to dial, in E.164 format',
		displayOptions: showFor(['create']),
	},
	{
		displayName: 'Voice Trunk Group ID',
		name: 'voiceTrunkGroupId',
		type: 'number',
		default: 0,
		required: true,
		placeholder: '90001',
		description: 'The outbound trunk group to place the call on',
		displayOptions: showFor(['create']),
	},
	{
		displayName: 'Call Instructions',
		name: 'instructions',
		type: 'options',
		default: 'voxxml',
		description: 'How the call is controlled once the callee answers',
		options: [
			{
				name: 'Flow',
				value: 'flow',
				description: 'Run a Flow built in the Voxtelesys Portal, from its Outbound Call action',
			},
			{
				name: 'VoXML',
				value: 'voxxml',
				description: 'Run VoXML entered on this node',
			},
			{
				name: 'VoXML URL',
				value: 'url',
				description: 'Fetch VoXML from a URL when the call is answered',
			},
		],
		displayOptions: showFor(['create']),
	},
	{
		displayName: 'VoXML',
		name: 'voxxml',
		type: 'string',
		typeOptions: { rows: 4 },
		default: '',
		required: true,
		placeholder: "<Response><Say voice='Joanna' language='en-US'>Hello!</Say></Response>",
		description: 'VoXML to execute once the call is answered',
		displayOptions: showForInstructions(['voxxml']),
	},
	{
		displayName: 'VoXML URL',
		name: 'url',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'https://example.com/voxml',
		description: 'Absolute URL to fetch the VoXML from once the call is answered',
		displayOptions: showForInstructions(['url']),
	},
	{
		displayName: 'VoXML URL Method',
		name: 'method',
		type: 'options',
		options: [
			{ name: 'GET', value: 'GET' },
			{ name: 'POST', value: 'POST' },
		],
		default: 'POST',
		description: 'The HTTP method to use when fetching the VoXML. Defaults to POST.',
		displayOptions: showForInstructions(['url']),
	},
	{
		displayName: 'Flow GUID',
		name: 'flowGuid',
		type: 'string',
		default: '',
		required: true,
		placeholder: '4185fb1e-d696-40d4-9485-c71154af2d53',
		description: 'GUID of the Flow to execute once the call is answered',
		displayOptions: showForInstructions(['flow']),
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add option',
		default: {},
		displayOptions: showFor(['create']),
		// Collection options must be ordered alphabetically by display name
		options: [
			{
				displayName: 'Answering Machine Detection',
				name: 'machineDetection',
				type: 'options',
				options: [
					{
						name: 'Detect Message End',
						value: 'detect_message_end',
						description:
							'Report a human as soon as one is detected, or a machine once it has finished its message',
					},
					{ name: 'Disabled', value: '' },
					{
						name: 'Enabled',
						value: 'enable',
						description: 'Report the result as soon as a human or a machine is detected',
					},
				],
				default: '',
				description:
					'Whether to detect an answering machine on the call. The result is returned as the AnsweredBy field on the request that fetches the VoXML.',
			},
			{
				displayName: 'Bulk Tag',
				name: 'bulkTag',
				type: 'string',
				default: '',
				description:
					'String which will be included in callback events (max 256 chars), typically used to store an external identifier for a batch of calls',
			},
			{
				displayName: 'BYOC Trunk GUID',
				name: 'byoc',
				type: 'string',
				default: '',
				placeholder: 'f2f734f5-ff64-4e62-9089-01bdf733795c',
				description:
					'GUID of a BYOC (Bring Your Own Carrier) trunk on your account to route the call through. Cannot be combined with Route Profile GUID.',
			},
			{
				displayName: 'Machine Detection Business Speech Threshold (Ms)',
				name: 'machineDetectionBusinessSpeechThreshold',
				type: 'number',
				typeOptions: { minValue: 1000, maxValue: 6000 },
				default: 3200,
				displayOptions: { show: { machineDetection: ['enable', 'detect_message_end'] } },
				description:
					'The maximum number of milliseconds of speech that can be classified as a human in business',
			},
			{
				displayName: 'Machine Detection Residence Speech Threshold (Ms)',
				name: 'machineDetectionResidenceSpeechThreshold',
				type: 'number',
				typeOptions: { minValue: 1000, maxValue: 6000 },
				default: 2000,
				displayOptions: { show: { machineDetection: ['enable', 'detect_message_end'] } },
				description:
					'The maximum number of milliseconds of speech that can be classified as a human in residence',
			},
			{
				displayName: 'Machine Detection Silence Timeout (Ms)',
				name: 'machineDetectionSilenceTimeout',
				type: 'number',
				typeOptions: { minValue: 2000, maxValue: 10000 },
				default: 5000,
				displayOptions: { show: { machineDetection: ['enable', 'detect_message_end'] } },
				description:
					'The maximum number of milliseconds of silence to allow before returning an unknown result',
			},
			{
				displayName: 'Machine Detection Speech End Threshold (Ms)',
				name: 'machineDetectionSpeechEndThreshold',
				type: 'number',
				typeOptions: { minValue: 500, maxValue: 5000 },
				default: 1000,
				displayOptions: { show: { machineDetection: ['enable', 'detect_message_end'] } },
				description:
					'The number of milliseconds of silence to allow after speech before the speech is considered complete',
			},
			{
				displayName: 'Machine Detection Timeout (Seconds)',
				name: 'machineDetectionTimeout',
				type: 'number',
				typeOptions: { minValue: 3, maxValue: 59 },
				default: 30,
				displayOptions: { show: { machineDetection: ['enable', 'detect_message_end'] } },
				description:
					'The number of seconds to perform answering machine detection before timing out. On timeout, an unknown result is returned.',
			},
			{
				displayName: 'Normalize Numbers to E.164',
				name: 'normalize',
				type: 'boolean',
				default: true,
				description:
					'Whether to convert loosely formatted numbers such as (300) 555-0100 into E.164 before placing the call',
			},
			{
				displayName: 'Record Call',
				name: 'record',
				type: 'boolean',
				default: false,
				description: 'Whether to record the entire call',
			},
			{
				displayName: 'Recording Channel',
				name: 'recordingChannel',
				type: 'options',
				options: [
					{ name: 'Dual', value: 'dual' },
					{ name: 'Mono', value: 'mono' },
				],
				default: 'mono',
				displayOptions: { show: { record: [true] } },
				description: 'The number of channels in the recording file. Defaults to Mono.',
			},
			{
				displayName: 'Recording Status Callback Event',
				name: 'recordingStatusCallbackEvent',
				type: 'options',
				options: [
					{ name: 'Completed', value: 'completed' },
					{ name: 'Failed', value: 'failed' },
					{ name: 'In-Progress', value: 'in-progress' },
				],
				default: 'completed',
				displayOptions: { show: { recordingStatusCallbackUrl: [{ _cnd: { exists: true } }] } },
				description: 'The recording status to send a callback for. Defaults to Completed.',
			},
			{
				displayName: 'Recording Status Callback Method',
				name: 'recordingStatusCallbackMethod',
				type: 'options',
				options: [
					{ name: 'GET', value: 'GET' },
					{ name: 'POST', value: 'POST' },
				],
				default: 'POST',
				displayOptions: { show: { recordingStatusCallbackUrl: [{ _cnd: { exists: true } }] } },
				description: 'The HTTP method to use for recording status callbacks. Defaults to POST.',
			},
			{
				displayName: 'Recording Status Callback URL',
				name: 'recordingStatusCallbackUrl',
				type: 'string',
				default: '',
				placeholder: '{{ $execution.resumeUrl }}',
				displayOptions: { show: { record: [true] } },
				description:
					'The absolute URL to send callbacks to when the status of the recording is updated',
			},
			{
				displayName: 'Recording Track',
				name: 'recordingTrack',
				type: 'options',
				options: [
					{ name: 'Both', value: 'both' },
					{ name: 'Inbound', value: 'inbound' },
					{ name: 'Outbound', value: 'outbound' },
				],
				default: 'both',
				displayOptions: { show: { record: [true] } },
				description:
					'Which side of the call to record. Outbound records only the audio generated by the VoXML, inbound records only the callee. Defaults to Both.',
			},
			{
				displayName: 'Route Profile GUID',
				name: 'routeProfileGuid',
				type: 'string',
				default: '',
				placeholder: 'c1f8a3e2-4b6d-4e9a-9c2f-7d5b1e0a8f34',
				description:
					'GUID of an inbound route profile on your account to route the call to. The call is routed internally to the route profile destination rather than across the PSTN, and is billed at the flat internal rate configured on the inbound trunk group. Cannot be combined with BYOC Trunk GUID.',
			},
			{
				displayName: 'Status Callback Events',
				name: 'statusCallbackEvents',
				type: 'multiOptions',
				options: [
					{ name: 'Busy', value: 'busy' },
					{ name: 'Completed', value: 'completed' },
					{ name: 'Failed', value: 'failed' },
					{ name: 'No Answer', value: 'no-answer' },
				],
				default: [],
				displayOptions: { show: { statusCallbackUrl: [{ _cnd: { exists: true } }] } },
				description: 'The call statuses to send callbacks for. Defaults to Completed.',
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
				displayOptions: { show: { statusCallbackUrl: [{ _cnd: { exists: true } }] } },
				description: 'The HTTP method to use for status callbacks. Defaults to POST.',
			},
			{
				displayName: 'Status Callback URL',
				name: 'statusCallbackUrl',
				type: 'string',
				default: '',
				placeholder: '{{ $execution.resumeUrl }}',
				description:
					'The absolute URL to send callbacks to when the status of the call changes. Pair with {{ $execution.resumeUrl }} and a Wait node to hold the workflow until the call reaches a final status.',
			},
			{
				displayName: 'Tag',
				name: 'tag',
				type: 'string',
				default: '',
				description:
					'String which will be included in callback events (max 256 chars), typically used to store an external identifier for the call',
			},
			{
				displayName: 'Timeout (Seconds)',
				name: 'timeout',
				type: 'number',
				typeOptions: { minValue: 0, maxValue: 600 },
				default: 60,
				description:
					'The number of seconds to allow before ending the call due to no answer. Defaults to 60 seconds.',
			},
		],
	},
]
