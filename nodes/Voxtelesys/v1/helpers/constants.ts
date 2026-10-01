// The maximum length accepted for `tag` and `bulk_tag` properties on Voxtelesys APIs
export const MAX_TAG_LENGTH = 256

// Limits the RCS API places on the content of a message
export const MAX_MESSAGE_BODY_LENGTH = 1600
export const MAX_URL_LENGTH = 1000
export const MAX_CARD_TITLE_LENGTH = 200
export const MAX_CARD_DESCRIPTION_LENGTH = 1600
export const MIN_CAROUSEL_CARDS = 2
export const MAX_CAROUSEL_CARDS = 10

// Limits the RCS API places on the suggestion chips attached to a message or a card
export const MAX_SUGGESTIONS = 11
export const MAX_CARD_SUGGESTIONS = 4
export const MAX_SUGGESTION_TEXT_LENGTH = 25
export const MAX_CALLBACK_DATA_LENGTH = 2048
export const MAX_LOCATION_LABEL_LENGTH = 100
export const MAX_EVENT_TITLE_LENGTH = 100
export const MAX_EVENT_DESCRIPTION_LENGTH = 500
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
