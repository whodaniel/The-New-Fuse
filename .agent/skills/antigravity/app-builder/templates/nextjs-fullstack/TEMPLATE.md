---
name: nextjs-fullstack
description: Next.js full-stack template principles. App Router, Drizzle, Tailwind.
---

# Next.js Full-Stack Template

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL + Drizzle |
| Styling | Tailwind CSS |
| Auth | Clerk (optional) |
| Validation | Zod |

---

## Directory Structure

```
project-name/
├── drizzle/
│   └── schema.drizzle
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   └── api/
│   ├── components/
│   │   └── ui/
│   ├── lib/
│   │   ├── db.ts        # Drizzle client
│   │   └── utils.ts
│   └── types/
├── .env.example
└── package.json
```

---

## Key Concepts

| Concept | Description |
|---------|-------------|
| Server Components | Default, fetch data |
| Server Actions | Form mutations |
| Route Handlers | API endpoints |
| Drizzle | Type-safe ORM |

---

## Environment Variables

| Variable | Purpose |
|----------|---------|
| DATABASE_URL | Drizzle connection |
| NEXT_PUBLIC_APP_URL | Public URL |

---

## Setup Steps

1. `npx create-next-app {{name}} --typescript --tailwind --app`
2. `npm install drizzle @drizzle/client zod`
3. `npx drizzle init`
4. Configure schema
5. `npm run db:push`
6. `npm run dev`

---

## Best Practices

- Server Components by default
- Server Actions for mutations
- Drizzle for type-safe DB
- Zod for validation
- Edge runtime where possible
