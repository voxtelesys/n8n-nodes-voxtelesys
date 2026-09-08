import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeBaseDescription,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow'
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow'
import { messageFields, messageOperations } from './actions/message/Message.resource'
import { send as sendMessage } from './actions/message/send.operation'

export class VoxtelesysV1 implements INodeType {
	description: INodeTypeDescription

	constructor(baseDescription: INodeTypeBaseDescription) {
		this.description = {
			...baseDescription,
			version: 1,
			defaults: { name: 'Voxtelesys' },
			inputs: [NodeConnectionTypes.Main],
			outputs: [NodeConnectionTypes.Main],
			usableAsTool: true,
			credentials: [
				{
					name: 'voxtelesysOAuth2Api',
					required: true,
					displayOptions: { show: { authentication: ['oAuth2'] } },
				},
			],
			properties: [
				{
					displayName: 'Authentication',
					name: 'authentication',
					type: 'options',
					noDataExpression: true,
					options: [{ name: 'OAuth2', value: 'oAuth2' }],
					default: 'oAuth2',
				},
				{
					displayName: 'Resource',
					name: 'resource',
					type: 'options',
					noDataExpression: true,
					options: [{ name: 'Message', value: 'message' }],
					default: 'message',
				},
				...messageOperations,
				...messageFields,
			],
		}
	}

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData()
		const resource = this.getNodeParameter('resource', 0) as string
		const operation = this.getNodeParameter('operation', 0) as string
		const returnData: INodeExecutionData[] = []

		for (let i = 0; i < items.length; i++) {
			try {
				let results: INodeExecutionData[]

				if (resource === 'message' && operation === 'send') {
					results = await sendMessage.call(this, i)
				} else {
					throw new NodeOperationError(
						this.getNode(),
						`The operation "${operation}" is not yet implemented for resource "${resource}"`,
						{ itemIndex: i },
					)
				}

				returnData.push(...results)
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					})
					continue
				}
				if (error instanceof NodeApiError) {
					throw new NodeApiError(this.getNode(), error as unknown as JsonObject)
				}
				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i })
			}
		}

		return [returnData]
	}
}
