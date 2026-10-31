# Release workflow — staging first, production only when the owner says so

Standing instruction from the owner (31 Oct 2026): **whenever something new is created, it is built on the staging side. When the owner says it is final, it is moved to production and made live.** Production never changes in between.

| | Staging (review) | Production (live prototype) |
|---|---|---|
| Address | `https://nykaafashion-neelesh-staging.vercel.app` | `https://nykaafashion-neelesh-design.vercel.app` (also `nykaa-fashion-awards.vercel.app`) |
| Git branch | `claude/nykaa-fashion-staging` (and short-lived feature branches off it) | `claude/nykaa-fashion-awards` |
| Vercel | Preview deployment of the same project, aliased to the staging address | Production deployment |
| Sign-in | the same named accounts (`SITE_USERS` exists for Preview and Production) | same |
| Looks different by… | a yellow **Staging** strip above the header, "(staging)" in the tab title, the experimental home layout as the default | nothing — it is the page the owner approved |
| Sign-in notifications | none (`LOGIN_NOTIFY_URL` is a Production-only variable on purpose) | one line per user sign-in |

`claude/nykaa-fashion-grid-redesign` is the earlier design and is never touched.

## 1 · Build something new (every time the owner asks to "create" anything)

1. Work on `claude/nykaa-fashion-staging` (or a feature branch off it that is merged into it). Never commit new work to the live branch.
2. Check it locally the usual way (`npm run typecheck`, the QA scripts that touch the change, `scripts/qa/prod.sh 3100`).
3. Push the branch, then publish to the review site: `scripts/release/deploy.sh staging` — it deploys a clean checkout of the commit as a Preview and points the staging address at it. The script prints the address.
4. Tell the owner what is on staging and how to look at it. Iterate there as many times as needed.

## 2 · Go live (only when the owner has said a staging build is final)

1. Merge the approved work into `claude/nykaa-fashion-awards` — fast-forward when possible. If the owner approved only part of staging, take only that part (cherry-pick or merge the feature branch), not the rest.
2. Run the full QA on a production build (`npm run qa`).
3. `PROMOTE=yes scripts/release/deploy.sh production` — refuses unless the commit is on the live branch. Both production addresses follow the deployment automatically.
4. Verify the live address (sign in, load the changed pages), then record the deployment in `PROJECT_STATUS.md` and tell the owner it is live.

**Roll back:** `PROMOTE=yes scripts/release/deploy.sh production <earlier commit on the live branch>`.

## How the channel is decided

`scripts/release/deploy.sh` passes `NEXT_PUBLIC_RELEASE_CHANNEL=staging` (and the commit id and the live address) to the staging build; they are inlined at build time (`src/lib/channel.ts`). Local runs and production builds have none of it, so the QA suite always exercises exactly what ships. Code that is staging-only reads `IS_STAGING` from `src/lib/channel.ts`.

## Things worth knowing

* **Vercel Deployment Protection (applies to staging today).** Vercel puts its own login in front of *Preview* deployments (project → Settings → Deployment Protection → Vercel Authentication), and the staging address is a Preview. To open it, sign in to Vercel in that browser as a member of the team; the site's own Login ID / password page follows. To make staging behave like production (reachable by anyone who has the address, protected only by the site's sign-in page) switch *Vercel Authentication* off for the project — that is the owner's decision and has not been changed. Production is not affected either way. (To check a protected preview without a browser, `vercel curl <path> --deployment <url>` works — but it **creates a *Protection Bypass for Automation* secret on the project** the first time it runs; that happened on 31 Oct 2026 while verifying staging. It can be revoked under *Settings → Deployment Protection → Protection Bypass for Automation*.)
* **Variables.** Anything the app reads must exist in both the Preview and Production environments of the Vercel project. Today: `SITE_USERS` (both), `LOGIN_NOTIFY_URL` and `NEXT_PUBLIC_SITE_URL` (Production only, deliberately).
* **Images.** Only the owner's two photographs are used until the owner supplies a new set. Staging and production read the same files.
* **Pictures and the gate.** Staging serves pictures straight from `/img` behind the sign-in cookie, exactly like production (the build sees `SITE_USERS`).
