import type { Icon, ICredentialTestRequest, ICredentialType, INodeProperties } from 'n8n-workflow'

/**
 * n8n handles token caching and refresh.
 * Access tokens default to a one hour lifetime, so this is the recommended credential for production workflows.
 */
export class VoxtelesysOAuth2Api implements ICredentialType {
	name = 'voxtelesysOAuth2Api'

	extends = ['oAuth2Api']

	displayName = 'Voxtelesys OAuth2 API'

	icon: Icon = {
		dark: 'file:../nodes/Voxtelesys/voxtelesys-dark.svg',
		light: 'file:../nodes/Voxtelesys/voxtelesys-light.svg',
	}

	documentationUrl = 'https://developer.voxtelesys.com/apis/authorization'

	properties: INodeProperties[] = [
		{
			displayName: 'Grant Type',
			name: 'grantType',
			type: 'hidden',
			default: 'clientCredentials',
		},
		{
			displayName: 'Access Token URL',
			name: 'accessTokenUrl',
			type: 'hidden',
			default: 'https://authapi.voxtelesys.net/api/v1/oauth/token',
		},
		{
			displayName: 'Authentication',
			name: 'authentication',
			type: 'hidden',
			default: 'header',
		},
		{
			displayName: 'Client ID',
			name: 'clientId',
			type: 'string',
			default: '',
			required: true,
			description: 'Client ID from the OAuth client created in the Voxtelesys Portal',
		},
		{
			displayName: 'Client Secret',
			name: 'clientSecret',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'Shown only once when generated. Regenerate in the Voxtelesys Portal if lost.',
		},
		{
			displayName: 'Region',
			name: 'region',
			type: 'options',
			options: [
				{ name: 'Automatic', value: '' },
				{ name: 'Dallas-Fort Worth', value: 'dfw' },
				{ name: 'Pittsburgh', value: 'pit' },
				{ name: 'Salt Lake City', value: 'slc' },
			],
			default: '',
			description:
				'Pin API requests to a specific region. Leave on Automatic to use the non-region-specific endpoint.',
		},
	]

	/**
	 * Issuing a token only proves the client credentials are valid, so the test reads
	 * back an empty page of messages to confirm the token is actually accepted by the
	 * Messaging API in the selected region.
	 *
	 * The base URL mirrors `getBaseUrl` in the node transport, restated as an
	 * expression because the region is only known once the credential is filled in.
	 */
	test: ICredentialTestRequest = {
		request: {
			baseURL:
				'={{ $credentials.region ? "https://smsapi." + $credentials.region + ".voxtelesys.net/api/v2" : "https://smsapi.voxtelesys.net/api/v2" }}',
			url: '/sms',
			method: 'GET',
		},
	}
}
