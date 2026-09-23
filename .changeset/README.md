# Changesets

Every pull request that changes a package under `packages/` adds a changeset
(`bun run changeset`). The "Version Packages" pull request that Changesets opens
is the release; merging it publishes with npm trusted publishing. See
`context/project-overview.md` §Release.
