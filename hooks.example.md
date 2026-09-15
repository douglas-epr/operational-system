# hooks.example.md — Optional Claude Code Hooks

> **Nothing in this file is enabled.** It is a recipe book, not configuration. `.claude/settings.json` currently declares only a `permissions` block — no `hooks` key. To turn one of these on, copy its `hooks` object into `.claude/settings.json` (shared, committed) or `.claude/settings.local.json` (personal, untracked) and merge it alongside the existing `permissions` object.

Hooks are shell commands the Claude Code harness runs around tool calls. They are the only way to get a behaviour that fires *every* time regardless of what Claude remembers — CLAUDE.md is guidance, a hook is enforcement.

| Event | Fires | Typical use here |
|---|---|---|
| `PreToolUse` | Before a tool runs; exit `2` blocks the call and shows stderr to Claude | Refuse irreversible commands |
| `PostToolUse` | After a tool succeeds | Type-check or lint what was just written |
| `Stop` | When Claude finishes its turn | Remind about the end-of-session doc pass |

Schema: each event maps to an array of matcher groups. `matcher` is a regex tested against the tool name (`Bash`, `Edit`, `Write`, `Edit|Write`, …); `Stop` takes no matcher. Each hook entry is `{ "type": "command", "command": "…" }`. The hook receives the tool-call JSON on **stdin** (`tool_name`, `tool_input`, …).

---

## Environment notes (read before copying)

- **Shell.** Commands run through this machine's Git Bash (POSIX `sh`), not `cmd.exe` or PowerShell. Use forward slashes and `$VAR`. Wrapping the logic in `node -e` is the most portable option — Node is already a prerequisite of this repo — and avoids PowerShell/`cmd` quoting differences entirely.
- **JSON escaping.** Inside a JSON string, `"` must be `\"` and a literal backslash must be `\\`. The snippets below deliberately avoid regex backslashes (they use `includes()` and `endsWith()` instead) so you can paste them without re-escaping.
- **Working directory.** Hooks run from the repo root, so `tsconfig.json` and `package.json` resolve without changing directory.
- **Non-ASCII path.** This repo lives under `…/Área de Trabalho/…`. Never build a command that interpolates the repo path unquoted.

---

## 1. `PreToolUse` on `Bash` — block shipping commands

Guardrail for the CLAUDE.md rule "never push or deploy unless I explicitly say so". Blocks the four irreversible commands unless `ALLOW_SHIP=1` is set in the environment. Exits `2`, so the command never runs and Claude reads the reason instead.

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "node -e \"let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{if(process.env.ALLOW_SHIP==='1')process.exit(0);const c=((JSON.parse(s||'{}').tool_input)||{}).command||'';const keys=['git '+'push','vercel deploy','vercel --prod','supabase db '+'push'];const bad=keys.filter(k=>c.includes(k));if(bad.length){console.error('BLOCKED by hooks.example.md recipe 1: '+bad.join(', ')+' is an irreversible, externally-visible action. CLAUDE.md requires explicit per-message approval. Once the user has said so, re-run with ALLOW_SHIP=1.');process.exit(2)}process.exit(0)})\""
          }
        ]
      }
    ]
  }
}
```

The two `'git '+'push'` style concatenations are not superstition: some command-rewriting harnesses (including the RTK prefixer active in this environment) pattern-match literal command strings in whatever they are inspecting. Splitting the literal keeps the hook's own payload from being rewritten. Drop the concatenation if your setup does not do that.

This recipe overlaps with the `permissions.deny` list already in `.claude/settings.json`, which denies the same four commands. The difference: `deny` is absolute; the hook has an escape hatch (`ALLOW_SHIP=1`) for the session where you actually do intend to ship. Pick one — with both in place `deny` wins and the hook never sees the call.

---

## 2. `PostToolUse` on `Edit|Write` — type-check TypeScript

Runs the project type-check after any `.ts` / `.tsx` file is written and reports the errors back. Non-TypeScript writes exit immediately, so the cost is only paid on source edits.

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "node -e \"let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const p=((JSON.parse(s||'{}').tool_input)||{}).file_path||'';if(!(p.endsWith('.ts')||p.endsWith('.tsx')))process.exit(0);try{require('child_process').execSync('npx tsc --noEmit -p tsconfig.json',{stdio:'pipe'});process.exit(0)}catch(e){console.error('tsc reported errors after editing '+p+':');console.error(String(e.stdout||e.stderr||e.message).slice(0,4000));process.exit(2)}})\""
          }
        ]
      }
    ]
  }
}
```

Caveats worth knowing before enabling it:

- A full `tsc --noEmit` on this project takes a few seconds. Firing it after **every** edit in a multi-file change is slow and will report errors from files you are still halfway through. Prefer running it once at the end, or swap it for `npx eslint --fix <file>`, which is per-file and fast.
- `tsconfig.tsbuildinfo` is already present, so incremental runs are much cheaper than the first one.
- Exit `2` makes Claude fix the errors before moving on. Exit `0` with the same `console.error` just surfaces them as information.

---

## 3. `Stop` — end-of-session documentation checklist

`RULES.md` §10 makes a changelog entry plus its companion updates mandatory. This prints the checklist when Claude finishes a turn.

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node -e \"const L=['','== End-of-session checklist (RULES.md section 10) ==','  [ ] docs/changelog.md       new dated entry','  [ ] .specs/project/STATE.md decision recorded, if one was made','  [ ] docs/project_status.md  migration count bumped, if a migration shipped','  [ ] .specs/codebase/*       stack/structure/conventions still accurate','  [ ] CHALLENGES.md           new dated section for friction hit this session',''];for(const l of L)console.error(l)\""
          }
        ]
      }
    ]
  }
}
```

Exit code matters here. As written the hook exits `0`, so the checklist is informational (visible in transcript mode, `Ctrl+O`). Exiting `2` instead **blocks** Claude from ending its turn and feeds the text back as an instruction — useful, but it fires on every turn rather than only the last one, so gate it on something (a marker file, or a `--stat` diff showing uncommitted source changes) before making it blocking.

---

## Already running in this environment: GateGuard

Independently of this file, a **GateGuard fact-forcing hook** from the user's global harness runs here. It can block the first `Write` or `Edit` to a file and demand four facts before letting the write through:

1. **Callers** — who or what reads this file.
2. **No duplicate** — that an equivalent file does not already exist.
3. **Data shape** — the format being written.
4. **Verbatim instruction** — the user's own words asking for the change.

The recovery is not to work around it: state the four facts in the reply text and retry the identical write. If it misfires, it can be disabled for the session with either of:

```bash
ECC_GATEGUARD=off
ECC_DISABLED_HOOKS=pre:edit-write:gateguard-fact-force
```

Because GateGuard already occupies the `PreToolUse` slot for `Edit|Write`, add recipe 2 above as a `PostToolUse` (as written) rather than a `PreToolUse`, or the two will compete on the same event.

---

## Related

- `.claude/settings.json` — shared permissions (committed). Where a hook the whole team should have belongs.
- `.claude/settings.local.json` — personal overrides (untracked). Where an experiment belongs.
- `CLAUDE.md` → **Operating Rules** — the deployment and commit guardrails these hooks enforce.
- `RULES.md` §10 — the documentation obligations recipe 3 reminds you of.
- `CHALLENGES.md` — the dated log of hook and tooling friction already hit in this repo.
