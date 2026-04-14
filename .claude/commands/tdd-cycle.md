Run the TDD cycle for the specified module.

1. Run tests: $ bun run test -- $ARGUMENTS --reporter=verbose 2>&1
2. Report which tests pass, which fail
3. If there are failing tests with compilation errors: implement missing types/interfaces first
4. If there are failing tests with logic errors: implement the minimum code to make them pass
5. After each implementation, run tests again to confirm
6. When all pass: check for obvious refactoring (duplication, naming, prop types)
7. Run typecheck: $ npx tsc --noEmit 2>&1
8. Run lint: $ bun run lint 2>&1
9. Fix any type or lint issues
10. Commit with: git add -A && git commit -m "feat: [describe what was implemented]"
