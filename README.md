# Ntertainment TNT V2.3

## Deploy order
1. Run `sql/tnt-v2.3-migration.sql` once in Azure SQL.
2. Copy the full V2.3 project over the local repository.
3. Commit and push to GitHub.
4. Wait until Azure deployments are green and hard-refresh `tnt.html`.

## V2.3
- Admin can create TNT Evaluators with one-time activation code.
- Evaluator uses **Eerste keer aanmelden** to choose their own password.
- Admin can generate a new activation/reset code.
- Team access remains managed per evaluator.
- TNT Evaluators can open/generate reports only for assigned teams; Admin can do all teams.
- Direct report/evaluation API access is also protected by team membership.
- Evolution graphs use only actually stored TNT data from the same school year; missing TNT moments remain empty.
- Existing V2.2 evaluation validation, overwrite confirmation, individual/team split and PDF design retained.

## TNT V2.4
- Mobile-first responsive layout for dashboard, evaluation, user management and reports.
- TNT branding uses **Van talent naar topniveau**; “More than dance” removed from TNT UI/report.
- Successful evaluation save redirects to Dashboard with a visible confirmation.
- Hard database uniqueness: one evaluator + one dancer + one TNT period = one evaluation.
- Existing evaluations are edited/overwritten only after confirmation.
- Evolution charts render only real stored TNT measurements; no synthetic TNT 2 point.
- TNT Evaluators can open/generate reports only for teams assigned to them; Admin can access all teams.
- PDF/report styling aligned more closely with the beige/black/gold web application.

Run `sql/tnt-v2.4-migration.sql` once before deploying V2.4.
