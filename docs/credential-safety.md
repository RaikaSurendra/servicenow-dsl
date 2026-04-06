# Credential Safety Policy

**Read this before working with any project in this repo.**

## The Rule

> No ServiceNow instance URL, username, password, OAuth client ID/secret, or any other credential
> is ever committed to this repository — in any file, in any form.

## How credentials work in this repo

Every project that connects to a ServiceNow instance uses this pattern:

```
project/
├── .env.example    ← committed — template with placeholder values
├── .env            ← NOT committed — contains real values, in .gitignore
└── now.config.js   ← reads from process.env.*, never hard-coded
```

## Setup steps (every new machine, every new project)

```bash
# 1. Copy the template
cp .env.example .env

# 2. Edit with your real PDI values
#    SN_INSTANCE_URL=https://dev12345.service-now.com
#    SN_USERNAME=admin
#    SN_PASSWORD=your-actual-password

# 3. Verify .env is ignored
git status   # .env must NOT appear here
```

## What to check before every commit

```bash
git diff --cached --name-only   # Review staged files
git status                      # Check for untracked files
```

If `.env` appears in either list — **do not commit**. Run `git reset HEAD .env` to unstage.

## What is safe to commit

| File | Safe to commit? |
|------|----------------|
| `.env.example` | ✓ Yes — only placeholder values |
| `.env` | ✗ Never |
| `now.config.js` | ✓ Yes — only reads env vars, no values |
| `seed-data/mock-*.json` | ✓ Yes — fabricated data only |
| Any file with `process.env.*` | ✓ Yes — reading is fine |
| Any file with `password: 'real-value'` | ✗ Never |

## If you accidentally commit credentials

1. **Immediately rotate** the credential in your ServiceNow PDI (change password, revoke OAuth token)
2. Remove the credential from git history:
   ```bash
   git filter-branch --force --index-filter \
     'git rm --cached --ignore-unmatch path/to/file' HEAD
   ```
3. Force-push (only safe on a personal dev branch, never on main without team coordination)
4. Treat the old credential as permanently compromised — rotation is not optional

## PDI-specific notes

- Use your **Personal Developer Instance** (PDI) only — never a shared or production instance
- Create a dedicated non-admin user for SDK operations (not your personal admin account)
- PDIs can be requested for free at [developer.servicenow.com](https://developer.servicenow.com)
- PDIs hibernate after inactivity — wake them before running deploy commands
