# Release

Prepare and publish a checked library version through the release workflow. [AGENTS.md](../../AGENTS.md) owns repository boundaries, [Architecture](../architecture.md#package-boundaries) owns delivery topology, and the manifests and [workflow](../../.github/workflows/release.yml) own exact commands and targets. This runbook owns final registry and installed-package verification. Unfinished work stays in task context.

## Target and preconditions

The target is the `react-visual-novel` package on `https://registry.npmjs.org`. The library manifest selects its version, and `scripts/check-release-tag.ts` requires the corresponding `v<version>` tag. The demo is private and is built for release validation.

Run workspace commands from the repository root with the locked runtime and dependencies. Resolve authentication before provider checks. GitHub repository access belongs to the authenticated operator, and npm publication uses the workflow's OIDC identity. Verify that npm's trusted publisher matches the repository identity in the library manifest, workflow `release.yml`, and environment `release`, following [npm's setup requirements](https://docs.npmjs.com/trusted-publishers/#for-github-actions). Read the actual GitHub environment protection rules. Missing access or unresolved publisher configuration blocks release delivery.

Provider configuration changes, dependency downloads, tag pushes, artifact uploads, and npm publication require their matching explicit approvals. A release tag push starts the workflow, including artifact upload and publication. Obtain approval for each reachable action before pushing the tag. Changing provider configuration is a separate transition.

## Audit

Read `git status --short`, the selected commit and remote, the library manifest, and the release workflow. Read the remote tag and npm version state before selecting a release tag. Verify that the version is unpublished and that the tag is absent or already points to the exact approved commit. Preserve existing tags and published versions.

Check that every intended source change is committed and that unrelated work is excluded from the release commit. Review published exports, peers, and the `Branches` augmentation contract before choosing the version. The package manifest's `files` field owns the tarball inventory. Update this runbook when release targets, execution, approvals, or final-consumer verification change.

## Prepare

1. Update the library version and any affected living usage contracts. Commit the version change separately from implementation changes.
2. Set `RELEASE_TAG` to the exact proposed tag and run `pnpm run release-check-tag`. Stop if it does not match the library manifest.
3. Run `pnpm run lint`, then `pnpm --filter react-visual-novel-demo run build`. The lint command generates library output and Next declarations before checking source, formatting, and package metadata.
4. Run `pnpm --filter react-visual-novel pack --pack-destination "$PWD/.tmp/release"`. The package's `prepack` script regenerates library output. Classify the local tarball as scratch and keep it under root `.tmp/`.
5. Inspect the tarball inventory and manifest. Verify the declared JavaScript, declarations, and stylesheet are present. Exclude archives, scratch, local state, and secret files.

Keep the checked commit, exact tag, tarball integrity, package inventory, and approval targets together in task context before requesting delivery approval. Do not run a manual `npm publish` alongside the workflow.

## Push the tag

After the required approvals, create the exact version tag at the checked commit and push only that tag to the verified repository remote. Read the remote tag back and confirm its commit before following the workflow run. A successful push does not establish package publication.

The workflow's package job validates the tag, checks the workspace, builds the demo, and uploads the checked tarball. Verify that it ran for the approved tag and commit. Preserve its tarball for comparison with the registry result.

## Publish

Follow the workflow's separate `publish` job in environment `release`. Complete any configured environment review after checking the publication approval and package artifact. The job publishes the package-job tarball with provenance. Verify the job's exact package version and registry target before accepting its result.

## Failure recovery

Stop at a failed prerequisite or local check. Repair the owning source and repeat the affected check before creating a tag. Keep the previous published version available throughout delivery.

After an ambiguous push, read the authoritative remote tag before another push. After an ambiguous publish, read npm's exact version metadata and integrity before rerunning a workflow job. [npm prevents overwriting a published version](https://docs.npmjs.com/cli/v11/commands/npm-publish/#description). If that version contains a defect, prepare a new version through this procedure. Tag deletion, version deprecation, and provider changes are separately approved actions.

## Verification

Confirm that the workflow's package and publish jobs completed for the approved tag and commit. Set `release_version` to the approved library version, then read its published metadata with `npm view "react-visual-novel@$release_version" version dist --json --registry=https://registry.npmjs.org`, following [npm's metadata command](https://docs.npmjs.com/cli/v11/commands/npm-view/). Compare registry integrity with the checked workflow tarball. Verify that provenance identifies the approved repository, workflow, and commit.

With explicit approval for dependency downloads, install the exact published version and its peers in a disposable consumer under root `.tmp/`. Verify that the public package entry, `dist/index.js`, and `dist/index.css` resolve and that the installed declarations preserve the advertised exports and branch augmentation. Use source checks for application acceptance. Report registry verification or installed-consumer verification as unresolved when its required evidence is unavailable.
