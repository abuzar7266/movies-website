FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
# Provide a safe default DATABASE_URL during build for Prisma client generation.
# It is NOT used to connect to any database at build time; it only satisfies prisma.config.ts.
# Platforms can still override it with --build-arg DATABASE_URL=...
ARG DATABASE_URL="postgresql://user:pass@localhost:5432/placeholder?schema=public"
ENV DATABASE_URL=$DATABASE_URL
RUN npm run prisma:generate && npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/.env.example ./
EXPOSE 4000
CMD ["npm", "run", "start"]
