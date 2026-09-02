import {
  JsonObject,
  NodeApiError,
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

export const VOXTELESYS_REGIONS = ['slc', 'dfw', 'pit'] as const
export type VoxtelesysRegion = (typeof VOXTELESYS_REGIONS)[number]

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
  if (!credentials) throw new Error('No valid credentials were found for this request.')
  
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
    throw error
  }
}

// walking list endpoint
export interface PaginationStrategy {
	pageSize: number
	/** Query parameters for a page. `cursor` is undefined on the first request. */
	buildQuery: (pageSize: number, cursor?: string) => IDataObject
	/** Pull the array of records out of a response body. */
	extract: (response: IDataObject) => IDataObject[]
	/** Cursor for the next page, or undefined when the last page has been read. */
	nextCursor: (response: IDataObject) => string | undefined
}

export const cursorPagination: PaginationStrategy = {
	pageSize: 100,
	buildQuery: (pageSize, cursor) => (cursor ? { page_size: pageSize, next_page: cursor } : { page_size: pageSize }),
	extract: (response) => {
		const page = response.results ?? response.messages ?? response.data ?? []
		return Array.isArray(page) ? (page as IDataObject[]) : []
	},
	nextCursor: (response) => {
		const cursor = response.next_page
		if (!cursor) return undefined
		const value = String(cursor).trim()
		return value || undefined
	}
}

// Walk a cursor-paginated list endpoint
export async function voxtelesysApiRequestAllItems(
	this: IExecuteFunctions | ILoadOptionsFunctions,
	service: VoxtelesysService,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject = {},
	qs: IDataObject = {},
	maxItems?: number,
	strategy: PaginationStrategy = cursorPagination,
): Promise<IDataObject[]> {
	const results: IDataObject[] = []
	const pageSize = maxItems ? Math.min(strategy.pageSize, Math.max(1, maxItems)) : strategy.pageSize

	let cursor: string | undefined;
	const seenCursors = new Set<string>()

	// Hard ceiling so a malformed contract cannot spin forever.
	const MAX_PAGES = 100

	for (let page = 0; page < MAX_PAGES; page++) {
		const response = await voxtelesysApiRequest.call(this, service, method, endpoint, body, {
			...qs,
			...strategy.buildQuery(pageSize, cursor),
		})

		const records = strategy.extract(response)
		if (records.length === 0) break

		for (const record of records) {
			results.push(record)
			if (maxItems && results.length >= maxItems) return results
		}

		const next = strategy.nextCursor(response)
		if (!next) break

		// A repeated cursor means the endpoint is not advancing. Fail loudly
		// rather than accumulating duplicates until the page ceiling.
		if (seenCursors.has(next)) {
			throw new NodeApiError(this.getNode(), {
				message: 'Pagination did not advance',
				description:
					'The API returned the same next_page cursor twice. Stopping to avoid fetching duplicate records.',
			} as JsonObject)
		}
		seenCursors.add(next)
		cursor = next
	}

	return results
}