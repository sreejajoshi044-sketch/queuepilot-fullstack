# QueueFlow Backend — Starter Structure

This folder is intentionally a **code-free scaffold** for our step-by-step lessons.

## Planned stack
Node.js, Express, TypeScript, PostgreSQL (`pg`), JWT, bcrypt, dotenv, CORS.

## Where to start
1. Open `backend` in VS Code terminal.
2. We will add `package.json` content and install packages in the next step.
3. Then configure `tsconfig.json`, `src/app.ts`, `src/server.ts`, and PostgreSQL.
4. Build routes/controllers and authentication incrementally.

All `.ts`, `.sql` and configuration files are placeholders; **this is not runnable yet**.

## Directory roles
- `src/config`: database configuration
- `src/controllers`: HTTP request handlers
- `src/routes`: endpoint definitions
- `src/middleware`: authentication and error handling
- `src/services`: reusable business logic
- `src/types`: TypeScript declaration augmentations
- `src/utils`: shared utilities
- `src/database`: SQL schema and optional seed data
