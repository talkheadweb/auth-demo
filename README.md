# Talkhead demo frontend

A Next.js App Router frontend in `demo-fe` that talks to the existing backend auth API.

## Setup

```bash
cp .env.example .env.local
pnpm install
pnpm dev
```

Frontend: `http://localhost:3000`  
Backend API base: `http://localhost:9000/api/v1`

## Implemented flows

- Register
- Login with backend httpOnly cookies
- Logout
- Forgot password
- Reset password
- Verify email
- Resend verification email
- Protected profile page
- Update profile
- Change password
