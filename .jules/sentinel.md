## 2025-01-16 - [Duplicate DTOs & Weak Password Policy]
**Vulnerability:** Discovered duplicate `RegisterDto` definitions in `apps/backend/src/auth/auth.controller.ts` (inline) and `apps/backend/src/dto/register.dto.ts` (unused). The inline definition enforced a weak password policy (min 6 chars), while the unused shared DTO had a strong policy (min 8 chars + complexity).
**Learning:** Inline DTO definitions in controllers often bypass shared validation logic and security policies. They are easy to overlook during security reviews compared to centralized DTO files.
**Prevention:** Enforce a rule that Controllers must import DTOs from a dedicated `dto/` directory and should not define validation classes inline. Regularly audit for `class .*Dto` definitions inside controller files.

## 2025-01-20 - [Mocked Authentication Logic in Utility Files]
**Vulnerability:** Discovered `apps/backend/src/utils/auth.ts` which contained an `authenticateUser` function that bypassed password verification with a comment "we'll assume password comparison works". This file was unused but posed a significant risk if accidentally imported.
**Learning:** Placeholder or "mocked" logic committed to the codebase (especially in utility files) can persist for a long time and become a trap for future developers.
**Prevention:** Strictly enforce that no "mocked" security logic is ever committed to the main branch, even if "unused". Use `@deprecated` tags aggressively but prefer deletion of dangerous dead code.
