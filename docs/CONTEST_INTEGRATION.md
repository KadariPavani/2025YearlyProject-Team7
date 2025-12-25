# Contest + Judge Integration

This document describes endpoints and sample frontend usage to allow trainers to create contests and students to submit code.

## New endpoints

- POST /api/contests/admin
  - Role: `admin` or `instructor`
  - Body: { name, description, startTime, endTime, duration, questions, allowedLanguages, maxAttempts, targetBatchIds }
  - On success: Creates `Contest` and sends notifications to students (using `notifyContestCreated`).

- POST /api/contests/:contestId/questions/:questionId/submit
  - Role: authenticated student
  - Body: { code, language }
  - Runs the code against question test cases and returns `submission` with `testCaseResults` and `marks`.

## Frontend sample (React)

Trainer - create contest

```js
async function createContest(payload, token) {
  const res = await fetch('/api/contests/admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  });
  return res.json();
}
```

Student - submit code

```js
async function submitSolution(contestId, questionId, code, language, token) {
  const res = await fetch(`/api/contests/${contestId}/questions/${questionId}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ code, language })
  });
  return res.json();
}
```

Notes:
- The server implementation uses a simple judge (`backend/utils/judge.js`) that supports `python`, `javascript` (node), `c`, `cpp`, and `java` (basic). This is a minimal, non-sandboxed solution for local/testing use only. For production, use a sandbox (Docker, firecracker, or remote judge service).
- Time limits and memory limits are applied conservatively; memory limits are not enforced by this simple runner.
- All outputs are normalized by trimming whitespace and CRLF before comparison.
