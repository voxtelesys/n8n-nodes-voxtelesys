const path = require('path')
const { task, src, dest, parallel } = require('gulp')

task('build:icons', copyIcons)
task('build:codex', copyCodex)
task('build:assets', parallel(copyIcons, copyCodex))

function copyIcons() {
	const nodeSource = path.resolve('nodes', '**', '*.{png,svg}')
	const nodeDestination = path.resolve('dist', 'nodes')

	src(nodeSource, { encoding: false, allowEmpty: true }).pipe(dest(nodeDestination))

	const credSource = path.resolve('credentials', '**', '*.{png,svg}')
	const credDestination = path.resolve('dist', 'credentials')

	return src(credSource, { encoding: false, allowEmpty: true }).pipe(dest(credDestination))
}

// Codex files are located by n8n purely by filename convention (the compiled`X.node.js` path with "on" appended),
// never imported, so tsc will not emit them. They have to be copied alongside the compiled node.
function copyCodex() {
	const source = path.resolve('nodes', '**', '*.node.json')
	const destination = path.resolve('dist', 'nodes')

	return src(source, { allowEmpty: true }).pipe(dest(destination))
}
