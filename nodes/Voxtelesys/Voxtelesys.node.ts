import type { INodeTypeBaseDescription, IVersionedNodeType } from 'n8n-workflow'
import { VersionedNodeType } from 'n8n-workflow'

import { VoxtelesysV1 } from './v1/VoxtelesysV1'

// Project is versioned by default in order to make future versioning simple
export class Voxtelesys extends VersionedNodeType {
	constructor() {
		const baseDescription: INodeTypeBaseDescription = {
			displayName: 'Voxtelesys',
			name: 'voxtelesys',
			icon: {
        dark: 'file:voxtelesys-dark.svg',
        light: 'file:voxtelesys-light.svg'
      },
			group: ['output'],
			subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
			description: 'Send SMS and MMS via Voxtelesys',
			defaultVersion: 1,
		}

		const nodeVersions: IVersionedNodeType['nodeVersions'] = {
			1: new VoxtelesysV1(baseDescription),
		}

		super(nodeVersions, baseDescription)
	}
}
