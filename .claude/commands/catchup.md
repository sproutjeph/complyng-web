Rebuild context after a /clear. Read all files modified on the current branch compared to main.
For each file, understand the changes made.
Then summarize:
1. What pages and components have been implemented so far
2. What API integrations are in place
3. What tests exist and their pass/fail status
4. What work remains based on docs/handoff.md

Changed files on this branch:
$ git diff --name-only main

Current test status:
$ bun run test 2>&1 | tail -40

Current build status:
$ bun run build 2>&1 | tail -20

Current lint status:
$ bun run lint 2>&1 | tail -20

Read docs/handoff.md for open decisions and next steps.
Read CLAUDE.md and AGENTS.md for project conventions.
