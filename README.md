# Ntertainment TNT V2.2

## Deploy
1. Run `sql/tnt-v2.2-migration.sql` once in Azure SQL.
2. Copy the full contents of this package over the local GitHub repository.
3. Commit and push; wait until both Azure deployments are green.
4. Hard refresh `tnt.html` (Ctrl+F5).

## V2.2
- Team access per TNT Evaluator; Admin always sees all teams.
- User management saves role + team assignments.
- All 11 scores, General evaluation and Growth plan are required.
- Existing evaluation warning before opening and confirmation before overwrite.
- Duplicate evaluator/dancer/period protection in API/database.
- PDF/report Performance & Development split into Individual and Group-oriented parameters.
- Dancer and team average are shown as two bars underneath each other.
- New PDF page with TNT 1 -> TNT 2 line chart for each individual parameter.
- Red/green scale legend remains below the 1-10 buttons; buttons themselves stay neutral/gold.
