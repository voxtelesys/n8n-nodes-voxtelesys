import type { IExecuteFunctions } from 'n8n-workflow'
import { NodeOperationError } from 'n8n-workflow'

// Normalize a phone number to E.164
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

// Normalizes a phone number and ensures it is valid E164 before returning it
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
