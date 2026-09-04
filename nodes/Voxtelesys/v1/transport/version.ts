/**
 * Package version, sent on the User-Agent header of every request.
 *
 * Kept as a constant rather than read from package.json so the built output has no filesystem access (a hard requirement for verified community nodes).
 * Bump this alongside the version in package.json when releasing.
 */
export const NODE_PACKAGE_VERSION = '0.0.0'
 
export const USER_AGENT = `n8n-nodes-voxtelesys/${NODE_PACKAGE_VERSION}`