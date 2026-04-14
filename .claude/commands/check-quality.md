Run full quality checks on the codebase.

1. TypeCheck: $ npx tsc --noEmit 2>&1 | tail -30
2. Lint: $ bun run lint 2>&1 | tail -30
3. Build: $ bun run build 2>&1 | tail -30
4. Tests: $ bun run test 2>&1 | tail -40
5. Check for TODOs: $ grep -rn "TODO\|FIXME\|HACK\|XXX" src/ --include="*.ts" --include="*.tsx" | head -30
6. Check for any types: $ grep -rn ": any\|as any" src/ --include="*.ts" --include="*.tsx" | head -20
7. Check for hardcoded URLs/secrets: $ grep -rn "http://\|https://\|Bearer \|api_key\|secret" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v ".env" | head -20

Report:
- Number of type errors and lint issues
- Build success or failure (with errors if failed)
- Test results (pass/fail counts)
- List of TODOs that need attention
- List of `any` types that should be replaced
- Any hardcoded URLs or secrets that should be env vars
- Overall assessment: ready to merge or needs work
