# Releasing

How to publish a new version of `@voxtelesys/n8n-nodes-voxtelesys` to npm.

This covers routine releases. It assumes the one-time setup is already done: the
GitHub repository is public, the `@voxtelesys` npm organisation exists, and the
repository has a working `NPM_TOKEN` secret (or a configured npm Trusted
Publisher).

## How a release happens

Pushing a tag matching `*.*.*` triggers
[`.github/workflows/publish.yml`](.github/workflows/publish.yml), which builds,
lints and publishes to npm with a provenance attestation.

**Pushing a tag is the release.** Merging to `main` publishes nothing, and
neither does running any local command. There is no `npm run release` script in
this project.

Two consequences worth internalising:

- **The tag does not set the version.** npm publishes whatever `version` says in
  `package.json`. The tag only triggers the workflow, and the two must agree.
- **A published version is immutable.** npm will not accept a re-publish of a
  version that already exists. A botched `0.2.0` is not fixable — you release
  `0.2.1` instead.

## Files that carry the version

Three files must be updated together on every release.

| File | What to change |
| --- | --- |
| `package.json` | the `version` field |
| `nodes/Voxtelesys/v1/transport/version.ts` | `NODE_PACKAGE_VERSION` |
| `README.md` | add a `## Version history` entry, move `(Current)` |

`NODE_PACKAGE_VERSION` is the one to watch. It is sent on the `User-Agent`
header of every API request, and it is deliberately a hardcoded constant rather
than a read of `package.json` — verified community nodes are not allowed to
touch the filesystem. Nothing fails to compile if you forget it; the package
just reports the wrong version to the API forever. Step 2 below guards against
this.

### Do not bump these

Two other version numbers exist and are unrelated to package releases:

- `version: 1` in `nodes/Voxtelesys/v1/VoxtelesysV1.ts`
- `"nodeVersion": "1.0"` in `nodes/Voxtelesys/Voxtelesys.node.json`

These identify the **node's interface version**, not the package. They change
only when shipping a breaking change to the node's parameters, which means
adding a `v2/` directory alongside `v1/` and registering it in
`nodes/Voxtelesys/Voxtelesys.node.ts` — existing workflows keep running against
`v1`. A normal release never touches them.

## Choosing the version

Standard semver, from the perspective of someone with an existing workflow
built on this node:

- **Patch** (`0.1.0` -> `0.1.1`) — bug fixes, docs, internal refactors. Nothing
  a user's workflow can observe apart from the fix.
- **Minor** (`0.1.0` -> `0.2.0`) — new operations, new options, new optional
  fields. Existing workflows keep working untouched.
- **Major** (`0.1.0` -> `1.0.0`) — a breaking change to the node's interface. If
  it would break an existing workflow, it needs a new node version
  (`v2/`) rather than just a major package bump. See "Do not bump these" above.

## Steps

### 1. Bump the version in all three files

Set the same version in `package.json` and `version.ts`, then add a README
entry. With `0.2.0` as the example:

```bash
# package.json
npm version 0.2.0 --no-git-tag-version

# nodes/Voxtelesys/v1/transport/version.ts
sed -i "s/NODE_PACKAGE_VERSION = '.*'/NODE_PACKAGE_VERSION = '0.2.0'/" \
  nodes/Voxtelesys/v1/transport/version.ts
```

`--no-git-tag-version` matters: without it `npm version` creates its own commit
and tag, and the tag would fire the publish workflow before the other two files
are updated.

Then edit `README.md` by hand — add the new entry under `## Version history`,
move `(Current)` onto it, and summarise the user-visible changes:

```markdown
### 0.2.0 (Current)

- Add scheduled send option

### 0.1.0

- Send SMS/MMS messages
```

### 2. Verify the versions match

```bash
node -e "
const pkg = require('./package.json').version;
const src = require('fs').readFileSync('nodes/Voxtelesys/v1/transport/version.ts', 'utf8');
const m = src.match(/NODE_PACKAGE_VERSION = '([^']+)'/);
if (!m) { console.error('could not find NODE_PACKAGE_VERSION'); process.exit(1); }
if (m[1] !== pkg) { console.error(\`MISMATCH  package.json=\${pkg}  version.ts=\${m[1]}\`); process.exit(1); }
console.log('versions match:', pkg);
"
```

Do not skip this. A mismatch produces a working package that misreports itself,
and it cannot be corrected without burning a version number.

### 3. Check it builds and lints

```bash
pnpm install --frozen-lockfile
npm run lint
npm run build
```

`npm publish` runs both of these itself via `prepublishOnly`, so a failure here
would abort the release halfway through. Catching it now is cheaper.

### 4. Commit and merge to main

```bash
git checkout -b release/0.2.0
git add package.json nodes/Voxtelesys/v1/transport/version.ts README.md
git commit -m "release 0.2.0"
git push -u origin release/0.2.0
```

Open a pull request, let CI pass, and merge. Then:

```bash
git checkout main
git pull origin main
```

The release commit must be on `main` before tagging. The provenance attestation
records the repository and commit it was built from, and n8n's scanner fetches
the source from that reference — so it has to be on the public default branch.

### 5. Wait for CI to pass on main

Check the **CI** workflow run for the merge commit before continuing.
[`ci.yml`](.github/workflows/ci.yml) is not a gate on publishing, so tagging
immediately would start the release while CI is still running and tell you
nothing.

### 6. Tag and push

This is the release:

```bash
git tag 0.2.0
git push origin 0.2.0
```

The tag must match `package.json` exactly, with no `v` prefix — the workflow
filter is `*.*.*`.

Note that `git push origin main` does **not** push tags. The explicit tag push
is what fires the workflow.

Then watch the **Publish** workflow run in the Actions tab. It will:

1. Mint an OIDC token for the provenance attestation
2. Install with `pnpm install --frozen-lockfile`
3. Run `npm publish --provenance --access public`, which triggers
   `prepublishOnly` (`npm run build && npm run lint`) before packing
4. Sign the attestation and publish to npm

### 7. Verify the published package

```bash
npm view @voxtelesys/n8n-nodes-voxtelesys version
npx @n8n/scan-community-package @voxtelesys/n8n-nodes-voxtelesys
```

The scan is the same check n8n runs during verification. Both lines must be
green:

```
✅ Provenance check passed for @voxtelesys/n8n-nodes-voxtelesys@0.2.0
✅ Package @voxtelesys/n8n-nodes-voxtelesys@0.2.0 has passed all security checks
```

A missing attestation means the package cannot be verified by n8n. It is not
repairable in place — fix the cause and release a new patch version.

Finally, confirm the npm page shows a **Provenance** section naming this
repository and the release commit.

## If a release fails

**The publish workflow failed on lint or build.** Nothing was published, so the
version number is still free. Fix the problem on a branch, merge it, then delete
and re-create the tag:

```bash
git push origin :0.2.0   # delete the remote tag
git tag -d 0.2.0         # delete it locally
# after merging the fix and pulling main:
git tag 0.2.0 && git push origin 0.2.0
```

**The publish workflow failed on auth.** The `NPM_TOKEN` secret is missing or
expired, or its granular-token permissions no longer cover this package. Nothing
was published; fix the secret and re-push the tag as above.

**The package published but has no provenance.** The version is spent. Confirm
the repository is public — npm does not generate attestations for private
repositories, whatever the package's own visibility — then release a new patch
version.

**The version was already published.** npm rejects re-publishing an existing
version. Bump to the next patch and start again from step 1.

## Quick reference

Routine release of `0.2.0`, assuming a clean `main` and no problems:

```bash
# 1. bump
npm version 0.2.0 --no-git-tag-version
sed -i "s/NODE_PACKAGE_VERSION = '.*'/NODE_PACKAGE_VERSION = '0.2.0'/" \
  nodes/Voxtelesys/v1/transport/version.ts
# ... then edit README.md Version history by hand

# 2. check
pnpm install --frozen-lockfile && npm run lint && npm run build

# 3. merge (via PR)
git checkout -b release/0.2.0
git commit -am "release 0.2.0"
git push -u origin release/0.2.0
# open PR, wait for CI, merge

# 4. tag from main once CI is green
git checkout main && git pull origin main
git tag 0.2.0 && git push origin 0.2.0

# 5. verify
npx @n8n/scan-community-package @voxtelesys/n8n-nodes-voxtelesys
```
