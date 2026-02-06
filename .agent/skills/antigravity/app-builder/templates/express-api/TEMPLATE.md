---
name: express-api
description: Express.js REST API template principles. TypeScript, Drizzle, JWT.
---

# Express.js API Template

## Tech Stack

| Component  | Technology          |
| ---------- | ------------------- |
| Runtime    | Node.js 20+         |
| Framework  | Express.js          |
| Language   | TypeScript          |
| Database   | PostgreSQL + Drizzle |
| Validation | Zod                 |
| Auth       | JWT + bcrypt        |

---

## Directory Structure

```
project-name/
├── drizzle/
│   └── schema.drizzle
├── src/
│   ├── app.ts           # Express setup
│   ├── config/          # Environment
│   ├── routes/          # Route handlers
│   ├── controllers/     # Business logic
│   ├── services/        # Data access
│   ├── middleware/
│   │   ├── auth.ts      # JWT verify
│   │   ├── error.ts     # Error handler
│   │   └── validate.ts  # Zod validation
│   ├── schemas/         # Zod schemas
│   └── utils/
└── package.json
```

---

## Middleware Stack

| Order | Middleware        |
| ----- | ----------------- |
| 1     | helmet (security) |
| 2     | cors              |
| 3     | morgan (logging)  |
| 4     | body parsing      |
| 5     | routes            |
| 6     | error handler     |

---

## API Response Format

| Type    | Structure                              |
| ------- | -------------------------------------- |
| Success | `{ success: true, data: {...} }`       |
| Error   | `{ error: "message", details: [...] }` |

---

## Setup Steps

1. Create project directory
2. `npm init -y`
3. Install deps: `npm install express drizzle zod bcrypt jsonwebtoken`
4. Configure Drizzle
5. `npm run db:push`
6. `npm run dev`

---

## Best Practices

- Layer architecture (routes → controllers → services)
- Validate all inputs with Zod
- Centralized error handling
- Environment-based config
- Use Drizzle for type-safe DB access
