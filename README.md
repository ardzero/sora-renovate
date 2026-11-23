# sora-renovate

Self-hosted [Renovate](https://docs.renovatebot.com/) for `ardzero`'s open-source repos, running as the **Sora (renovate)** GitHub App (bot: `sora-renovate[bot]`). One app, one key, one runner, one shared config. It's free because this repo is public, so GitHub Actions minutes are unlimited.

| File                             | Purpose                                                        |
| :------------------------------- | :------------------------------------------------------------- |
| `.github/workflows/renovate.yml` | Runs Renovate hourly across every repo the app is installed on |
| `default.json`                   | Base preset shared by every repo                               |
| `weekly.json`                    | Weekly batch policy (extends `default.json`)                   |

## Presets

**`github>ardzero/sora-renovate`** (`default.json`): the base every repo gets.

- Releases must be 3 days old before Renovate proposes them; security fixes from OSV skip the wait.
- `^` ranges get their minimum bumped; exact pins stay exact.
- GitHub Actions are pinned to commit SHAs with a `# vX.Y.Z` comment.
- Renovate merges automerge PRs itself, only after every check passes (no branch protection needed).
- Weekly lockfile refresh, automerged.
- `engines.node` is never changed: it's the minimum Node.js users need, a deliberate support decision.
- Workflow `node-version: "26"` only moves between even (LTS) majors, as a reviewed PR.

**`github>ardzero/sora-renovate:weekly`** (`weekly.json`): base plus the weekly batch.

- New PRs only open on Mondays (UTC). The whole day counts, so a run GitHub starts hours late still opens them.
- One PR for all non-major npm updates and one for GitHub Actions, both automerged once CI passes. Each major npm update gets its own PR; major GitHub Actions and workflow Node.js updates share one PR. Majors always wait for you.
- Minor updates of `0.x` packages can break (semver), so they get their own PR (`pre-1.0 minor updates`) that waits for you.

## Repos

| Repo                                            | Config                   | Extends                                     |
| :---------------------------------------------- | :----------------------- | :------------------------------------------ |
| [bunestro](https://github.com/ardzero/bunestro) | `renovate.json5`         | `:weekly`                                   |
| [bunpack](https://github.com/ardzero/bunpack)   | `renovate.json`          | `:weekly`                                   |
| [bunext](https://github.com/ardzero/bunext)     | `.github/renovate.json5` | base, plus its own anytime automerge policy |

## Add a repo

1. Add a `renovate.json` to the repo:

   ```json
   {
     "$schema": "https://docs.renovatebot.com/renovate-schema.json",
     "extends": ["github>ardzero/sora-renovate:weekly"]
   }
   ```

2. Make sure the repo has a CI workflow that runs on pull requests. Automerge waits for it, and without CI every PR waits for you.
3. Add the repo to the Sora app's installation: GitHub → Settings → Applications → Installed GitHub Apps → **Sora (renovate)** → Configure → Repository access.
4. The next hourly run picks it up. Actions → **Renovate** → **Run workflow** starts it right away.

Repos the app can access but that have no Renovate config are skipped.

## One-time setup

1. **Create the GitHub App**: GitHub → Settings → Developer settings → GitHub Apps → New GitHub App.
   - Homepage URL: this repo. Webhook: uncheck **Active**.
   - Repository permissions:

     | Permission        | Access         |
     | :---------------- | :------------- |
     | Checks            | Read and write |
     | Commit statuses   | Read and write |
     | Contents          | Read and write |
     | Issues            | Read and write |
     | Pull requests     | Read and write |
     | Workflows         | Read and write |
     | Administration    | Read-only      |
     | Dependabot alerts | Read-only      |
     | Metadata          | Read-only      |

   - Where can this app be installed: **Only on this account**.
2. On the app page, copy the **Client ID** and **Generate a private key**.
3. **Install** the app on the managed repos only, **not on this repo**. The app's token must never be able to change this repo's workflow, which holds the private key.
4. In this repo → Settings → Secrets and variables → Actions: variable `SORA_APP_CLIENT_ID`, secret `SORA_APP_PRIVATE_KEY` (the whole `.pem`). Then delete the `.pem`.

## Security

- **The app isn't installed on this repo.** A leaked app token (valid for 1 hour) therefore can't edit this repo's workflow to print the private key. Keep it that way, and keep this repo's own action pins and Renovate version up to date by hand.
- **The Renovate image is pinned by digest** (`renovate-version: <version>@sha256:…`), so a re-pushed tag can't change what runs with the token. Update the version and digest together.
- **Managed repos publish to npm only with your approval.** Their `npm` environments require you as reviewer and allow `main` only, and their publish workflows build without publish rights and upload a packed tarball in a separate job.
- `main` is protected by a ruleset in every repo: PRs only, no force pushes or deletion. Renovate still automerges through PRs once CI passes.

A GitHub App is used instead of a personal access token because it doesn't expire, its commits are signed (merges show **Verified**), PRs come from the bot so GitHub notifies you, and its PRs trigger CI, which PRs opened with `GITHUB_TOKEN` would not.

## Troubleshooting

- Actions → **Renovate** → **Run workflow** with log level `debug`.
- Validate a config locally: `bunx --package renovate renovate-config-validator --strict` in the repo.
- Switching the bot identity (a new app) makes Renovate treat the old bot's branches as someone else's work and leave them. Switch when no Renovate PRs are open, or delete leftover `renovate/*` branches by hand.
