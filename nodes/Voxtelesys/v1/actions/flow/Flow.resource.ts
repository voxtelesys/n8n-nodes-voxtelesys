import type { INodeProperties } from 'n8n-workflow'

const showFor = (operation: string[]) => ({
	show: {
		resource: ['flow'],
		operation,
	},
})

export const flowOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['flow'] } },
		options: [
			{
				name: 'Execute',
				value: 'execute',
				description: 'Create a Flow execution',
				action: 'Execute a flow',
			},
		],
		default: 'execute',
	},
]

export const flowFields: INodeProperties[] = [
	// POST /flows/:flow_guid/executions
	{
		displayName: 'Flow GUID',
		name: 'flowGuid',
		type: 'string',
		default: '',
		required: true,
		placeholder: '6b40db14-05aa-4266-b006-8b13a6639eb7',
		description: 'GUID of the flow to execute, found on the flow in the Voxtelesys portal',
		displayOptions: showFor(['execute']),
	},
	{
		displayName: 'From',
		name: 'from',
		type: 'string',
		default: '',
		required: true,
		placeholder: '+13003003000',
		description:
			'Originating address for the execution. Either a phone number in E.164 format, or the username portion of an email address.',
		displayOptions: showFor(['execute']),
	},
	{
		displayName: 'To',
		name: 'to',
		type: 'string',
		default: '',
		required: true,
		placeholder: '+13003003001',
		description:
			'Destination address for the execution. Either a phone number in E.164 format, or an email address.',
		displayOptions: showFor(['execute']),
	},
	{
		displayName: 'Parameters',
		name: 'parameters',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true, multipleValueButtonText: 'Add parameter' },
		default: {},
		description: 'Additional parameters passed into the execution',
		displayOptions: showFor(['execute']),
		options: [
			{
				displayName: 'Parameter',
				name: 'parameter',
				values: [
					{
						displayName: 'Name',
						name: 'name',
						type: 'string',
						default: '',
						description: 'Name of the flow parameter or global variable to set',
					},
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						default: '',
						description: 'Value to pass into the execution',
					},
				],
			},
		],
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add option',
		default: {},
		displayOptions: showFor(['execute']),
		// Collection options must be ordered alphabetically by display name
		options: [
			{
				displayName: 'Bulk Tag',
				name: 'bulkTag',
				type: 'string',
				default: '',
				description:
					'String which will be included in callback events (max 256 chars), typically used to group a batch of executions. Tags are propagated to the voice, SMS and email channels called during the execution.',
			},
			{
				displayName: 'Environment',
				name: 'environment',
				type: 'options',
				options: [
					{ name: 'Development', value: 'DEVELOPMENT' },
					{ name: 'Live', value: 'LIVE' },
					{ name: 'Staging', value: 'STAGING' },
				],
				default: 'LIVE',
				description:
					'Flow environment to execute, as defined in the portal. Defaults to Live. Cannot be combined with Version GUID.',
			},
			{
				displayName: 'Normalize Numbers to E.164',
				name: 'normalize',
				type: 'boolean',
				default: true,
				description:
					'Whether to convert loosely formatted phone numbers such as (300) 555-0100 into E.164 before sending. Email addresses are always left untouched.',
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
					'The absolute URL to send callbacks to when updates or actions occur during the execution. Pair with {{ $execution.resumeUrl }} and a Wait node to continue the workflow once the execution reports back.',
			},
			{
				displayName: 'Tag',
				name: 'tag',
				type: 'string',
				default: '',
				description:
					'String which will be included in callback events (max 256 chars), typically used to store an external identifier for the execution. Tags are propagated to the voice, SMS and email channels called during the execution.',
			},
			{
				displayName: 'Version GUID',
				name: 'versionGuid',
				type: 'string',
				default: '',
				placeholder: '70c1b2c6-2b9d-4a74-bf65-c1be45e31833',
				description:
					'GUID of the flow version to execute, instead of whichever version an environment points at. Cannot be combined with Environment.',
			},
		],
	},
]
