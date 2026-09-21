# Ntertainment TNT V2.6

V2.6 adds:
- Dance year management, starting with 2026-2027 and an active-year selector.
- Team statistics for Admin and TNT Evaluators, restricted by team access.
- Consolidated team averages per TNT moment for all 11 parameters.
- Dancer overview per team and Team report print/PDF.
- Admin dancer management: edit name/team/status; delete when unused or archive when history exists.
- Admin user editing: name, email, role, active status and team rights.
- Admin deletion of incorrect evaluations from the individual report.
- Existing V2.5 PDF/reporting, mobile, duplicate protection and evaluator activation functionality retained.

## Deploy
1. Run `sql/tnt-v2.6-migration.sql` in Azure SQL first.
2. Replace the repository files with this package.
3. Commit and push.
4. Wait for GitHub Actions/Azure deployment to finish.
5. Hard refresh the web app (Ctrl+F5).
