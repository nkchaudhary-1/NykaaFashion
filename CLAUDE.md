# Working rules for this repository

Read `PROJECT_STATUS.md` first (decisions, QA log, what is simulated), then `docs/PRD.md` for the product. Also read `AGENTS.md` — this is not the Next.js you know.

## Release workflow — the owner's standing instruction (31 Oct 2026)

**Whenever the owner asks you to create or change anything, build it on the staging side. Only when the owner says it is final do you move it to production and make it live.**

* Staging = branch `claude/nykaa-fashion-staging` → `scripts/release/deploy.sh staging` → `https://nykaafashion-neelesh-staging.vercel.app`.
* Production = branch `claude/nykaa-fashion-awards` → `PROMOTE=yes scripts/release/deploy.sh production` → `https://nykaafashion-neelesh-design.vercel.app` (also `nykaa-fashion-awards.vercel.app`).
* Do **not** commit new work to the live branch, merge into it, or deploy to production until the owner has said a build is final ("final", "go live", "push to production" …). Approval of one thing is not approval of the rest.
* `claude/nykaa-fashion-grid-redesign` is the earlier design: never touch it.
* Full procedure, promotion and rollback: `docs/RELEASE.md`.

## Design rules (unchanged)

Only the typeface Inter Display · no shadows, gradients or blur — flat colour · strict 12-column grid (4 on phones) · keep the live Nykaa identity · every simulated flow is labelled · only the owner's two photographs are used as imagery until the owner supplies a new set (no stock-photo fetching).

## Keep the record

Add decisions and the QA log to `PROJECT_STATUS.md` as you go; say what was verified and what was not.
