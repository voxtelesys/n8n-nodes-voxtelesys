import {
  JsonObject,
  NodeApiError,
  NodeOperationError,
	type IDataObject,
	type IExecuteFunctions,
	type IHookFunctions,
	type IHttpRequestMethods,
	type IHttpRequestOptions,
	type ILoadOptionsFunctions,
} from 'n8n-workflow'

import { USER_AGENT } from './version'

export type VoxtelesysService = 'sms'

type RequestContext = IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions

interface ServiceDescriptor {
	host: string
	version: string
	// Whether this service is reachable at a region-prefixed host
	regional: boolean
}

const SERVICES: Record<VoxtelesysService, ServiceDescriptor> = {
	sms: { host: 'smsapi', version: 'v2', regional: true }
}

const VOXTELESYS_REGIONS = ['slc', 'dfw', 'pit']

export function getBaseUrl(service: VoxtelesysService, region?: string): string {
	const descriptor = SERVICES[service]
	const useRegion =
		descriptor.regional &&
		region &&
		(VOXTELESYS_REGIONS as readonly string[]).includes(region)

	const prefix = useRegion ? `${descriptor.host}.${region}` : descriptor.host
	return `https://${prefix}.voxtelesys.net/api/${descriptor.version}`
}

export interface VoxtelesysRequestOptions {
	headers?: Record<string, string>
	timeout?: number
}

export async function voxtelesysApiRequest(
	this: RequestContext,
	service: VoxtelesysService,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject = {},
	qs: IDataObject = {},
	options: VoxtelesysRequestOptions = {},
): Promise<IDataObject> {
	const credentialType = 'voxtelesysOAuth2Api'
	const credentials = await this.getCredentials(credentialType)
  if (!credentials) {
    throw new NodeOperationError(this.getNode(), 'No valid credentials were found for this request', {
      description: 'Select a Voxtelesys OAuth2 credential on this node, or create one if none exists yet.',
    })
  }

	const region = (credentials.region as string) || ''
	const config: IHttpRequestOptions = {
		method,
		url: `${getBaseUrl(service, region)}${endpoint}`,
		headers: {
			'User-Agent': USER_AGENT,
			...(options.headers ?? {}),
		},
		json: true,
		timeout: options.timeout,
	}

	if (Object.keys(body).length > 0) config.body = body
	if (Object.keys(qs).length > 0) config.qs = qs

  try {
    return (await this.helpers.httpRequestWithAuthentication.call(
      this,
      credentialType,
      config,
    )) as IDataObject
  } catch (error) {
    // The request helper throws raw HTTP errors, which lose their status code and response body in the n8n UI unless they are wrapped.
    throw new NodeApiError(this.getNode(), error as JsonObject)
  }
}
