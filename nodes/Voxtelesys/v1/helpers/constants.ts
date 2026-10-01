// The maximum length accepted for `tag` and `bulk_tag` properties on Voxtelesys APIs
export const MAX_TAG_LENGTH = 256

export interface NumericField {
	// Name of the option in the node UI
	optionName: string
	// Name shown in the node UI, used in error messages
	displayName: string
	// Name of the property in the request body
	bodyField: string
	min: number
	max: number
}

// Options on POST /calls
export const CALL_NUMERIC_FIELDS: NumericField[] = [
	{
		optionName: 'timeout',
		displayName: 'Timeout',
		bodyField: 'timeout',
		min: 0,
		max: 600,
	},
	{
		optionName: 'machineDetectionTimeout',
		displayName: 'Machine Detection Timeout',
		bodyField: 'machine_detection_timeout',
		min: 3,
		max: 59,
	},
	{
		optionName: 'machineDetectionResidenceSpeechThreshold',
		displayName: 'Machine Detection Residence Speech Threshold',
		bodyField: 'machine_detection_human_residence_speech_threshold',
		min: 1000,
		max: 6000,
	},
	{
		optionName: 'machineDetectionBusinessSpeechThreshold',
		displayName: 'Machine Detection Business Speech Threshold',
		bodyField: 'machine_detection_human_business_speech_threshold',
		min: 1000,
		max: 6000,
	},
	{
		optionName: 'machineDetectionSpeechEndThreshold',
		displayName: 'Machine Detection Speech End Threshold',
		bodyField: 'machine_detection_machine_speech_end_threshold',
		min: 500,
		max: 5000,
	},
	{
		optionName: 'machineDetectionSilenceTimeout',
		displayName: 'Machine Detection Silence Timeout',
		bodyField: 'machine_detection_silence_timeout',
		min: 2000,
		max: 10000,
	},
]
