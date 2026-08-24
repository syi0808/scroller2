# Releasing

## 0.0.1

The package metadata, changelog, Node 22/24 CI, npm provenance, and `NPM_TOKEN` repository secret are prepared.

1. Confirm that the `main` CI workflow succeeds.
2. Review the package with `pnpm pack --dry-run`.
3. Publish the prepared GitHub draft release for `v0.0.1`.
4. Push the matching tag if the release UI does not create it.
5. Verify `pnpm view scrol@0.0.1` after the Publish workflow succeeds.

The Publish workflow rejects tags that do not match the version in `package.json`.
