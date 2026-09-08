import type { IExecuteFunctions } from 'n8n-workflow'
import { NodeOperationError } from 'n8n-workflow'

const e164Regex = /^\+[1-9]\d{6,14}$/
const digitsOnlyRegex = /\D/g
// +1, then the area code (NPA) and exchange code (NXX), then the line number
const nanpRegex = /^\+1([2-9]\d{2})([2-9]\d{2})\d{4}$/
// Area codes currently in service for toll-free numbers
const tollFreeNpaRegex = /^(800|833|844|855|866|877|888)$/

/**
 * Normalize a phone number to E.164
 *
 * @param input - Phone number in any format
 * @param defaultCountryCode - Country code assumed when the input has no country code
 * @returns The number in E.164 format
 */
export function toE164(input: string, defaultCountryCode = '1'): string {
	const trimmed = input.trim()
	if (e164Regex.test(trimmed)) return trimmed

	const digits = trimmed.replace(digitsOnlyRegex, '')
	if (digits.length === 0) return trimmed

	if (defaultCountryCode === '1' && digits.length === 10) return `+1${digits}`
	if (defaultCountryCode === '1' && digits.length === 11 && digits.startsWith('1')) return `+${digits}`

	return `+${digits}`
}

/**
 * Checks to see if the input is a valid E164 number
 *
 * @param input - Phone number to check
 * @returns True when the input is a valid E.164 number
 */
export function isValidE164(input: string): boolean {
	return e164Regex.test(input.trim())
}

/**
 * Ensures NANP number and rejects the following reserved npas: 211, 411, 611, 911
 *
 * @param input - Phone number to check
 * @returns True when the input is a valid NANP number
 */
export function isValidNANP(input: string): boolean {
	const match = nanpRegex.exec(input.trim())
	if (!match) return false

	const npa = match[1]
	const nxx = match[2]
	if (npa.endsWith('11')) return false

	return !nxx.endsWith('11') || tollFreeNpaRegex.test(npa)
}

/**
 * Normalizes a phone number and ensures it is valid E164 before returning it
 *
 * @param label - Field name used in error messages
 * @param value - Phone number to normalize and validate
 * @param options.normalize - Whether to convert the value to E.164 before validating
 * @param options.itemIndex - Index of the item being processed, used in error messages
 * @returns The validated phone number in E.164 format
 * @throws {NodeOperationError} When the number is not a valid E.164 or NANP number
 */
export function normalizeAndValidate(
	this: IExecuteFunctions,
	label: string,
	value: string,
	options: { normalize: boolean, itemIndex: number },
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

	// +1 and correct digits passes the E.164 check, so still need to validate it's not a junk number
	if (number.startsWith('+1') && !isValidNANP(number)) {
		throw new NodeOperationError(
			this.getNode(),
			`${label} is not a valid North American number: "${number}"`,
			{
				itemIndex: options.itemIndex,
				description:
					'Numbers in the +1 country code must be +1 followed by 10 digits, where the area code and exchange code each start with 2-9. N11 service codes such as 411 or 911 are not valid area codes, or exchange codes outside of toll-free numbers.',
			},
		)
	}

	return number
}
