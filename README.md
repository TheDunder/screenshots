# Screenshots

Public helper repo: a GitHub Actions workflow that takes screenshots of a public web page with Playwright. It is
public so its Actions minutes are free.

```bash
gh workflow run screenshots.yml -R TheDunder/screenshots -f url=https://<site>/
gh run list -R TheDunder/screenshots --workflow screenshots.yml -L 1 --json databaseId -q '.[0].databaseId'
gh run watch <id> -R TheDunder/screenshots --exit-status
gh run download <id> -R TheDunder/screenshots -n screenshots -D <dir>
gh run view <id> -R TheDunder/screenshots --log | grep -E "problem|overflow|error"
```

Output: `desktop-light`, `desktop-dark`, `tablet-dark`, `mobile-light`, each as a full page, `-top` (first screen) and
`-mid`. The log lists page errors, console errors and horizontal overflow.

Everything here is public: never add secrets, and only capture public URLs. The run log and the artifact (kept 7 days)
can be seen by anyone.
