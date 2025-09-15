# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project adheres (lightly) to Semantic Versioning.

## [1.5.0] - 2025-09-15
### Added
- Packaging & sharing of agents via `copilot agent share` producing gzip+JSON `.agents` bundles.
- Installation of shared bundles via `copilot agent install <file.agents>` with `--target` and `--force` options.
- Documentation updates in README and AGENTS for new share/install functionality.

### Changed
- Bumped version to 1.5.0 in `package.json`.
- Updated prompt authoring note to v1.5.x in `AGENTS.md`.

### Notes
- All operations remain fully local (no network I/O for packaging/install).
- Existing tests pass unchanged.

## [1.4.0] - 2025-??-??
### Added
- Previous feature set including enhanced list, delete, update, feedback, and helloworld agent improvements.

