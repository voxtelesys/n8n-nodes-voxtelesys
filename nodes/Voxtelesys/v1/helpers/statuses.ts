/**
 * Message statuses as documented at
 * https://developer.voxtelesys.com/apis/message/statuses
 */
export const MESSAGE_STATUSES = {
	queued: { direction: 'outbound', final: false },
	delivering: { direction: 'outbound', final: false },
	delivered: { direction: 'outbound', final: true },
	failed: { direction: 'outbound', final: true },
	unknown: { direction: 'outbound', final: true },
	expired: { direction: 'outbound', final: true },
	received: { direction: 'inbound', final: true },
} as const

export type MessageStatus = keyof typeof MESSAGE_STATUSES

export type DeliveryOutcome = 'delivered' | 'failed' | 'unknown' | 'pending'

/**
 * Classify a status into an outcome.
 *
 * Deliberately four-valued rather than a boolean. `unknown` is a FINAL status
 * whose real delivery state is not known, so it must not be lumped in with
 * `failed` — retrying on `unknown` risks delivering the same message twice to
 * the end user.
 */
export function classifyStatus(status: string): DeliveryOutcome {
	// RCS delivery receipts report status in upper case ("DELIVERED") while the
	// Messaging API uses lower case ("delivered"). Fold before comparing.
	switch (status.trim().toLowerCase()) {
		case 'delivered':
		case 'received':
			return 'delivered'
		case 'failed':
		case 'expired':
			return 'failed'
		case 'unknown':
			return 'unknown'
		case 'queued':
		case 'delivering':
			return 'pending'
		default:
			return 'unknown'
	}
}

export function isFinalStatus(status: string): boolean {
	const entry = MESSAGE_STATUSES[status.trim().toLowerCase() as MessageStatus]
	return entry ? entry.final : false
}

/**
 * RCS delivery receipts report numbers in E.164 WITHOUT the leading plus
 * ("1234567890"), unlike every other surface of the platform. Restore it so
 * that a number received on a webhook compares equal to the number that was
 * sent.
 */
export function ensurePlus(value?: string): string | undefined {
	if (!value) return undefined
	const trimmed = value.trim()
	if (!trimmed) return undefined
	if (trimmed.startsWith('+')) return trimmed
	return /^\d{7,15}$/.test(trimmed) ? `+${trimmed}` : trimmed
}

/**
 * RCS delivery receipts always include an `error` object, using
 * { code: "0", description: "None" } as a sentinel when nothing went wrong.
 * Treat that as "no error" rather than surfacing a misleading code 0.
 */
export function isSentinelError(error?: { code?: unknown, description?: unknown }): boolean {
	if (!error) return true
	const code = String(error.code ?? '').trim()
	const description = String(error.description ?? '').trim().toLowerCase()
	if (code === '' || code === '0') return true
	return description === 'none' || description === 'no error'
}

/**
 * Normalize a phone number to E.164 without pulling in a runtime dependency.
 *
 * Verified community nodes may not declare external dependencies, so
 * libphonenumber-js is not available. This handles the common NANP cases and
 * passes through anything already in E.164 it deliberately does not attempt
 * full international parsing.
 */
export function toE164(input: string, defaultCountryCode = '1'): string {
	const trimmed = input.trim()
	if (/^\+[1-9]\d{6,14}$/.test(trimmed)) {
		return trimmed
	}

	const digits = trimmed.replace(/\D/g, '')
	if (digits.length === 0) {
		return trimmed
	}
	if (defaultCountryCode === '1' && digits.length === 10) {
		return `+1${digits}`
	}
	if (defaultCountryCode === '1' && digits.length === 11 && digits.startsWith('1')) {
		return `+${digits}`
	}
	return `+${digits}`
}

export function isValidE164(input: string): boolean {
	return /^\+[1-9]\d{6,14}$/.test(input.trim())
}
