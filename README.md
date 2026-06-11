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

## Docker

```bash
docker build -t talkhead-demo-fe .
docker run --rm -p 3000:3000 \
  -e NEXT_PUBLIC_APP_NAME="Talkhead Auth Demo" \
  -e NEXT_PUBLIC_API_BASE_URL="http://localhost:9000/api/v1" \
  -e NEXT_PUBLIC_API_URL="http://localhost:9000" \
  talkhead-demo-fe
```

The image serves the app with `next start` (non-standalone).

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
