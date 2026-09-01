import type { IExecuteFunctions } from 'n8n-workflow'
import { NodeOperationError } from 'n8n-workflow'

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
 * Normalize a number entered in the UI and reject anything still not E.164.
 *
 * Every operation that sends puts numbers through this, so the error text a
 * user sees is the same wherever the bad number came from. `label` names the
 * field as the UI labels it.
 */
export function normalizeAndValidate(
	this: IExecuteFunctions,
	label: string,
	value: string,
	options: { normalize: boolean; itemIndex: number },
): string {
	const number = options.normalize ? toE164(value) : value.trim()

	if (!isValidE164(number)) {
		throw new NodeOperationError(
			this.getNode(),
			`${label} is not a valid E.164 number: "${number}"`,
			{
				itemIndex: options.itemIndex,
				description:
					'Numbers must look like +13005550100 (E.164 format). Enable "Normalize Numbers to E.164" to convert common formats automatically.',
			},
		)
	}

	return number
}
