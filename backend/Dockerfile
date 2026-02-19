FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl

FROM base AS deps
COPY package*.json ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV DATABASE_URL=postgres://postgres:postgres@localhost:5432/movieshelf

RUN npm run prisma:generate && npm run build

FROM base AS runner
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/.env.example ./.env

EXPOSE 4000
CMD ["npm", "run", "start"]
