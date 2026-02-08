# Email Outreach Application

## Overview
A full-stack email outreach application built with React, Express, and PostgreSQL. It allows users to manage contacts, configure SMTP settings, and send automated emails.

## Tech Stack
- **Frontend**: React 18 with Vite, TailwindCSS, shadcn/ui components
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth (OpenID Connect)

## Project Structure
```
├── client/           # React frontend
│   └── src/
│       ├── components/   # UI components
│       ├── hooks/        # Custom React hooks
│       ├── lib/          # Utilities
│       └── pages/        # Page components
├── server/           # Express backend
│   ├── replit_integrations/  # Auth integration
│   ├── routes.ts         # API routes
│   ├── storage.ts        # Database operations
│   └── index.ts          # Server entry point
├── shared/           # Shared types and schemas
│   ├── models/           # Auth models
│   ├── routes.ts         # API route definitions
│   └── schema.ts         # Drizzle schema
└── uploads/          # File upload directory
```

## Features
- Contact management (manual add, CSV import)
- SMTP email configuration
- Automated email queue processing
- Dashboard with statistics
- Replit Auth for secure access

## Running Locally
The application runs on port 5000 and serves both the API and frontend.

```bash
npm install
npm run dev
```

## Database
Uses PostgreSQL with Drizzle ORM. Push schema changes with:
```bash
npm run db:push
```

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption secret
- `REPL_ID` - Replit environment identifier
