import type { IDataObject, IExecuteFunctions } from 'n8n-workflow'
import { NodeOperationError } from 'n8n-workflow'

import type { RecipientParameterRow } from './interfaces'
import { normalizeAndValidate } from './phoneNumbers'

/**
 * Positional: pad short lists with 0 ("no value") so a later value never lands
 * on an earlier key, and reject long ones rather than silently dropping the
 * tail.
 */
function alignToDefinition(
	this: IExecuteFunctions,
	definition: string[],
	label: string,
	values: string[],
	itemIndex: number,
): Array<string | number> {
	if (values.length > definition.length) {
		throw new NodeOperationError(
			this.getNode(),
			`${label} has ${values.length} values but only ${definition.length} parameter keys are defined`,
			{
				itemIndex,
				description: 'Provide one value per key, in the same order as Parameter Keys.',
			},
		)
	}

	return definition.map((_, index) => {
		const value = values[index]
		return value === undefined || value.trim() === '' ? 0 : value
	})
}

/**
 * Build the `parameters` object of POST /sms/batch.
 *
 * `parameters` is positional: `definition` fixes the order of the ${key}
 * placeholders, and every other list is read against it. A missing value is
 * sent as 0, which the API reads as "no value", so a short list is padded
 * rather than shifting later values onto the wrong key. Recipient keys are
 * written with the same normalized string used in `to`, so the two always
 * agree.
 */
export function buildParameters(
	this: IExecuteFunctions,
	itemIndex: number,
	recipients: string[],
	normalize: boolean,
): IDataObject {
	// The UI asks for bare key names, but ${name} is the form users see in
	// their own template, so accept either.
	const definition = (this.getNodeParameter('parameterKeys', itemIndex, []) as string[])
		.map((key) =>
			key
				.trim()
				.replace(/^\$\{(.*)\}$/, '$1')
				.trim(),
		)
		.filter(Boolean)

	if (definition.length === 0) {
		throw new NodeOperationError(
			this.getNode(),
			'Personalization is on but no parameter keys are defined',
			{
				itemIndex,
				description:
					'Add one key per ${key} placeholder in the message template, or turn "Personalize Per Recipient" off.',
			},
		)
	}

	const parameters: IDataObject = { definition }

	const defaults = (this.getNodeParameter('parameterDefaults', itemIndex, []) as string[]) ?? []
	if (defaults.length > 0) {
		parameters.default = alignToDefinition.call(
			this,
			definition,
			'Default Values',
			defaults,
			itemIndex,
		)
	}

	const recipientParameters = this.getNodeParameter(
		'recipientParameters',
		itemIndex,
		{},
	) as IDataObject
	const rows = (recipientParameters.recipient as RecipientParameterRow[] | undefined) ?? []

	for (const row of rows) {
		const rawTo = row.to ?? ''
		if (!rawTo.trim()) continue

		const to = normalizeAndValidate.call(this, 'Recipient Values entry', rawTo, {
			normalize,
			itemIndex,
		})

		// A number that is not in the batch would silently receive nothing, so
		// treat the mismatch as the typo it almost always is.
		if (!recipients.includes(to)) {
			throw new NodeOperationError(
				this.getNode(),
				`Recipient Values entry "${rawTo}" is not in the Recipients list`,
				{
					itemIndex,
					description: 'Every recipient given per-recipient values must also appear in Recipients.',
				},
			)
		}

		parameters[to] = alignToDefinition.call(
			this,
			definition,
			`Recipient ${to}`,
			row.values ?? [],
			itemIndex,
		)
	}

	return parameters
}
