import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow'
import { NodeOperationError } from 'n8n-workflow'

import { voxtelesysApiRequest } from '../../transport'
import { CALL_NUMERIC_FIELDS } from '../../helpers/constants'
import { normalizeAndValidate } from '../../helpers/phoneNumbers'
import { applyNumericOptions, applyStatusCallback, applyTags } from '../../helpers/utils'

/**
 * POST /calls
 *
 * {
 *   "to": "+13003003001",
 *   "from": "+13003003000",
 *   "voice_trunk_group_id": 90001,
 *   "voxxml": "<Response><Say>Hello!</Say></Response>",
 *   "timeout": 60,
 *   "tag": "...",
 *   "bulk_tag": "...",
 *   "status_callback": { "url": "http://example.com", "method": "POST", "events": ["completed"] }
 * }
 *
 */
export async function create(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const options = this.getNodeParameter('options', itemIndex, {}) as IDataObject
	const normalize = options.normalize !== false

	const from = normalizeAndValidate.call(
		this,
		'From',
		this.getNodeParameter('from', itemIndex) as string,
		{ normalize, itemIndex },
	)
	const to = normalizeAndValidate.call(
		this,
		'To',
		this.getNodeParameter('to', itemIndex) as string,
		{ normalize, itemIndex },
	)

	// The trunk group decides which carrier the call leaves on, so there is no usable default
	const voiceTrunkGroupId = Number(this.getNodeParameter('voiceTrunkGroupId', itemIndex))
	if (!Number.isInteger(voiceTrunkGroupId) || voiceTrunkGroupId <= 0) {
		throw new NodeOperationError(
			this.getNode(),
			'Voice Trunk Group ID must be the positive whole number of an outbound trunk group on your account',
			{ itemIndex },
		)
	}

	const body: IDataObject = { from, to, voice_trunk_group_id: voiceTrunkGroupId }

	applyInstructions.call(this, body, itemIndex)
	applyTags.call(this, body, options, itemIndex)
	applyNumericOptions.call(this, body, options, CALL_NUMERIC_FIELDS, itemIndex)
	applyRouting.call(this, body, options, itemIndex)
	applyRecording(body, options)

	if (options.machineDetection) body.machine_detection = options.machineDetection as string

	applyStatusCallback(body, options, options.statusCallbackEvents as string[] | undefined)

	const response = await voxtelesysApiRequest.call(this, 'voice', 'POST', '/calls', body)

	return [
		{
			json: response,
			pairedItem: { item: itemIndex },
		},
	]
}

/**
 * Set the VoXML, VoXML URL or Flow that the call executes once it is answered.
 *
 * @param body - Request body that is mutated in place
 * @param itemIndex - Index of the item being processed, used in error messages
 * @throws {NodeOperationError} When the selected instruction is empty
 */
function applyInstructions(this: IExecuteFunctions, body: IDataObject, itemIndex: number): void {
	const instructions = this.getNodeParameter('instructions', itemIndex, 'voxxml') as string

	if (instructions === 'url') {
		const url = (this.getNodeParameter('url', itemIndex, '') as string).trim()
		if (!url) {
			throw new NodeOperationError(this.getNode(), 'VoXML URL is required', {
				itemIndex,
				description:
					'Enter the URL the VoXML is fetched from, or switch Call Instructions to VoXML to enter the VoXML on this node.',
			})
		}
		body.url = url
		body.method = (this.getNodeParameter('method', itemIndex, 'POST') as string) || 'POST'
		return
	}

	if (instructions === 'flow') {
		const flowGuid = (this.getNodeParameter('flowGuid', itemIndex, '') as string).trim()
		if (!flowGuid) {
			throw new NodeOperationError(this.getNode(), 'Flow GUID is required', {
				itemIndex,
				description: 'Copy the GUID of the Flow to run from the Voxtelesys Portal.',
			})
		}
		body.flow_guid = flowGuid
		return
	}

	const voxxml = (this.getNodeParameter('voxxml', itemIndex, '') as string).trim()
	if (!voxxml) {
		throw new NodeOperationError(this.getNode(), 'VoXML is required', {
			itemIndex,
			description:
				'Enter the VoXML to run once the call is answered, or switch Call Instructions to VoXML URL or Flow.',
		})
	}
	body.voxxml = voxxml
}

/**
 * Apply the options that decide how the call is routed.
 *
 * @param body - Request body that is mutated in place
 * @param options - Options collection values
 * @param itemIndex - Index of the item being processed, used in error messages
 * @throws {NodeOperationError} When both routing options are set
 */
function applyRouting(
	this: IExecuteFunctions,
	body: IDataObject,
	options: IDataObject,
	itemIndex: number,
): void {
	const routeProfileGuid = (options.routeProfileGuid as string | undefined)?.trim()
	const byoc = (options.byoc as string | undefined)?.trim()

	// The API rejects the pair, but the message is clearer coming from the node
	if (routeProfileGuid && byoc) {
		throw new NodeOperationError(
			this.getNode(),
			'Route Profile GUID and BYOC Trunk GUID cannot be combined',
			{
				itemIndex,
				description:
					'A call either stays internal on a route profile or leaves on a BYOC trunk. Remove one of the two options.',
			},
		)
	}

	if (routeProfileGuid) body.route_profile_guid = routeProfileGuid
	if (byoc) body.byoc = byoc
}

/**
 * Apply the recording options - only set if recording is turned on.
 *
 * @param body - Request body that is mutated in place
 * @param options - Options collection values
 */
function applyRecording(body: IDataObject, options: IDataObject): void {
	if (options.record !== true) return

	body.record = true
	if (options.recordingTrack) body.recording_track = options.recordingTrack as string
	if (options.recordingChannel) body.recording_channel = options.recordingChannel as string

	const callbackUrl = (options.recordingStatusCallbackUrl as string | undefined)?.trim()
	if (!callbackUrl) return

	body.recording_status_callback = callbackUrl
	body.recording_status_callback_method =
		(options.recordingStatusCallbackMethod as string) || 'POST'
	body.recording_status_callback_event =
		(options.recordingStatusCallbackEvent as string) || 'completed'
}
