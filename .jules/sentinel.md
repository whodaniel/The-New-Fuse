## 2025-05-15 - [Critical SQL Injection via executeRaw]
**Vulnerability:** Found multiple SQL injection vulnerabilities in `apps/api/src/modules/access/access.service.ts` where manual string escaping (`.replace(/'/g, "''")`) and string interpolation were used with `this.db.executeRaw`.
**Learning:** `executeRaw` calls in this codebase must strictly use parameterized queries (e.g. `$1`, `$2` passed along with an array of arguments) rather than relying on manual text replacements.
**Prevention:** Always use the parameterized query syntax provided by the database driver when executing raw SQL. Never trust manual `.replace()` for escaping strings.
