FROM node:22-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable && corepack prepare pnpm@10.12.2 --activate

FROM base AS deps

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder

WORKDIR /app

ARG NEXT_PUBLIC_APP_NAME="Talkhead Auth Demo"
ARG NEXT_PUBLIC_API_BASE_URL="http://localhost:9000/api/v1"
ARG NEXT_PUBLIC_API_URL="http://localhost:9000"

ENV NEXT_PUBLIC_APP_NAME="$NEXT_PUBLIC_APP_NAME"
ENV NEXT_PUBLIC_API_BASE_URL="$NEXT_PUBLIC_API_BASE_URL"
ENV NEXT_PUBLIC_API_URL="$NEXT_PUBLIC_API_URL"

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm build

FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --prod --frozen-lockfile

COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next ./.next
COPY --from=builder --chown=node:node /app/next.config.ts ./next.config.ts

USER node

EXPOSE 3000

CMD ["pnpm", "start"]
