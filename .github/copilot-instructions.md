# Copilot Instructions

Project: copilot-agent-cli (TypeScript CLI to orchestrate GitHub Copilot prompt "agents")
Goal for AI changes: Preserve modular DI architecture, clear command boundaries, and test coverage patterns.
Keep responses in English and concise.

## Core Mental Model
- Entry point: `src/cli.ts` wires Commander + DI container (`serviceRegistration.ts`).
- Commands live in `src/commands/` (1 class per feature) and are registered via `agentCommandFactory.ts`.
- Services (filesystem, parsing, packaging, update, session, formatting, VS Code integration) are in `src/services/` behind interfaces in `src/core/interfaces.ts` and tokens in `src/core/container.ts`.
- Data flow (list/run): Command -> discovery (`promptDiscovery.ts`) -> metadata (`metadataParser.ts`) -> optional formatting (`tableFormatter.ts`) -> terminal / VS Code via `vscodeIntegration.ts`.
- Packaging/sharing: `packagingService.ts` creates/reads gzip+JSON `.agents` bundles (local only, no network I/O).

## Conventions
- Agent name = filename `<name>.prompt.md` (never overridden by YAML front matter).
- Two prompt roots: global `$HOME/AppData/Roaming/Code/User/prompts` and project `.github/prompts`. Project overrides on name collision.
- Metadata front matter (optional): description, mode, model, tools. Safe to extend; preserve existing fields.
- All file ops use Node `path` + `os.homedir()` for cross‑platform correctness (Windows primary target). Don't hardcode separators.
- Commands should not throw raw errors; prefer user-friendly messages consistent with current patterns in existing commands.
- Keep new service functionality injectable (define interface + token + register in `serviceRegistration.ts`).

## Adding a New Command
1. Create `src/commands/<newCommand>.ts` extending `BaseCommand` or following existing pattern.
2. Inject required services via constructor parameters typed to exported interfaces.
3. Register in `agentCommandFactory.ts` and (if needed) new service(s) in `serviceRegistration.ts`.
4. Add tests in `tests/` mirroring existing command test structure (see `updateCommand.test.ts`).

## Testing Pattern
- Jest + ts-jest; unit tests live in `tests/` with file-focused naming.
- Mock filesystem / process interactions where practical; inspect formatting and structured results.
- When adding service contracts, create small focused tests (see `promptDiscovery.test.ts`).

## Update & Session Logic
- First command per shell session triggers update check via `sessionTracking.ts` + `updateChecker.ts`.
- Respect existing throttling logic; any enhancement must remain silent if already checked this session unless explicitly forced.

## VS Code Execution Logic
- `runCommand` constructs `code chat -a <prompt> <context>`.
- Environment detection picks flags: external terminal => `-n --maximize`; VS Code integrated terminal => `-r`.
- Context message rules: no user context => "Follow the instructions from the file."; else append user text.

## Packaging / Sharing (`share` & `install`)
- Format: gzip(JSON { version, createdAt, agents:[{name, content}] }).
- Never auto-overwrite existing prompt files unless `--force` flag.
- Installation target: default global; `--target project` for `.github/prompts/`.

## Safe Change Guidelines
- BEFORE editing: skim related command + involved services to honor current abstractions.
- DO NOT bypass discovery or metadata parsing; extend them.
- Keep public method signatures stable unless version bump justified.
- Prefer pure helpers in `utils/index.ts` for cross-cutting logic.
- Maintain ASCII table UX consistency (column order: Name | Description | Scope | Mode | Model | Tools).

## Common Pitfalls to Avoid
- Introducing sync fs operations inside performance-sensitive loops (use async patterns already present if applicable).
- Hardcoding paths or assuming POSIX separators.
- Letting new commands skip dependency injection (breaks testability/consistency).
- Deriving agent name from front matter (must stay filename-derived).

## When Unsure
- Look at parallel examples: list/run/delete/update for style; share/install for packaging flows.
- Add minimal test reproducing intended behavior before refactor.

Provide concise diffs; keep this file updated if architectural boundaries or conventions change.