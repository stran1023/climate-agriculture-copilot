# Session Handoff

## Verified Now

- What is currently working: `backend/app` compiles cleanly
  (`cd backend && python -m compileall app`). No product behavior is
  verified — `/workflow/run` returns a hardcoded stub response.
- What verification actually ran: `bash init.sh` (syntax check only, no
  dependencies installed, no server started).

## Changed This Session

- Code or behavior added: none — this session only set up the agent harness.
- Infrastructure or harness changes: added `CLAUDE.md`, `feature_list.json`,
  `progress.md`, `session-handoff.md`, `init.sh`.
- Files modified: same five files, all newly created (no pre-existing
  harness files in this repo).

## Broken Or Unverified

- Known defect: `run_daily_workflow` in `backend/app/main.py` is fully
  stubbed (all 5 steps are TODO comments).
- Unverified path: whether the Snowflake objects in
  `snowflake/coco-prompts.md` actually exist in a real account — the
  "Result" lines are all blank.
- Unverified path: `backend/app/services/cortex_agent_client.py`'s REST
  endpoint/payload shape is a guess pending Snowflake's Cortex Agents API
  docs (see its module docstring).
- Blockers for the next session: none blocking harness use; feat-001 blocks
  all product work.

## Next Session

- Highest-priority unfinished feature: `feat-001` — run Snowflake CoCo CLI
  prompts from `snowflake/coco-prompts.md`.
- Why it is next: every backend feature (feat-002 through feat-006) reads
  or writes tables/agents that only exist once feat-001 is done.
- What counts as passing: every prompt's "Result" line filled in, and a
  `SELECT *` against each table in `CLIMATE_AG_COPILOT.OPS` returns rows.
- What must not change during that step: don't touch `backend/app` — this
  step is CoCo CLI interaction only, tracked in `snowflake/coco-prompts.md`.
- Recommended Next Step: launch `cortex` from the `snowflake/` directory and
  paste the first prompt in `coco-prompts.md`.

## Commands

- Startup: `./init.sh`
- Verification: `cd backend && python -m compileall app`
- Focused debug command: `cd backend && python -c "import app.main"` (will
  fail until `pip install -r requirements.txt` has been run in a venv)
