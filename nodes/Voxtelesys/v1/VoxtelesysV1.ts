import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeBaseDescription,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow'
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow'
import { callFields, callOperations } from './actions/call/Call.resource'
import { create as createCall } from './actions/call/create.operation'
import { messageFields, messageOperations } from './actions/message/Message.resource'
import { send as sendMessage } from './actions/message/send.operation'
import { rcsFields, rcsOperations } from './actions/rcs/Rcs.resource'
import { send as sendRcs } from './actions/rcs/send.operation'
import { nodeHints } from './helpers/hints'
import { flowFields, flowOperations } from './actions/flow/Flow.resource'
import { execute as executeFlow } from './actions/flow/execute.operation'

function unsupportedOperation(
	context: IExecuteFunctions,
	resource: string,
	operation: string,
	itemIndex: number,
): NodeOperationError {
	return new NodeOperationError(
		context.getNode(),
		`The operation '${operation}' is not yet implemented for resource '${resource}'`,
		{ itemIndex },
	)
}

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
			hints: nodeHints,
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
					options: [
						{ name: 'Call', value: 'call' },
						{ name: 'Flow', value: 'flow' },
						{ name: 'Message', value: 'message' },
						{ name: 'RCS Message', value: 'rcs' },
					],
					default: 'message',
				},
				...callOperations,
				...callFields,
				...messageOperations,
				...messageFields,
				...rcsOperations,
				...rcsFields,
				...flowOperations,
				...flowFields,
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

				switch (resource) {
					case 'message':
						switch (operation) {
							case 'send':
								results = await sendMessage.call(this, i)
								break
							default:
								throw unsupportedOperation(this, resource, operation, i)
						}
						break
					case 'flow':
						switch (operation) {
							case 'execute':
								results = await executeFlow.call(this, i)
								break
							default:
								throw unsupportedOperation(this, resource, operation, i)
						}
						break
					case 'call':
						switch (operation) {
							case 'create':
								results = await createCall.call(this, i)
								break
							default:
								throw unsupportedOperation(this, resource, operation, i)
						}
						break
					case 'rcs':
						switch (operation) {
							case 'send':
								results = await sendRcs.call(this, i)
								break
							default:
								throw unsupportedOperation(this, resource, operation, i)
						}
						break
					default:
						throw unsupportedOperation(this, resource, operation, i)
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
