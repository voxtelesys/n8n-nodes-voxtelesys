import type { ICredentialType, INodeProperties } from 'n8n-workflow';

/**
	OAuth 2.0 client credentials grant against the Voxtelesys Auth API.
 	n8n by default handles token caching and refresh.
 */
export class VoxtelesysOAuth2Api implements ICredentialType {
	name = 'voxtelesysOAuth2Api';

	extends = ['oAuth2Api'];

	displayName = 'Voxtelesys OAuth2 API';

	documentationUrl = 'https://developer.voxtelesys.com/apis/authorization';

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
			description: 'Shown only once when generated. Regenerate in the Portal if lost.',
		},
		{
			displayName: 'Scope',
			name: 'scope',
			type: 'string',
			default: '',
			description:
				'Space separated scopes. Leave empty to use every scope granted to the client in the Portal.',
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
		},
	];
}
