FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl

FROM base AS deps
COPY package*.json ./
ARG NPM_REGISTRY=https://registry.npmjs.org/
ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG NO_PROXY
ENV NPM_CONFIG_LOGLEVEL=warn \
    NPM_CONFIG_UPDATE_NOTIFIER=false \
    npm_config_audit=false \
    npm_config_fund=false \
    HTTP_PROXY=${HTTP_PROXY} \
    http_proxy=${HTTP_PROXY} \
    HTTPS_PROXY=${HTTPS_PROXY} \
    https_proxy=${HTTPS_PROXY} \
    NO_PROXY=${NO_PROXY} \
    no_proxy=${NO_PROXY}
RUN set -eux; \
    npm config set registry "${NPM_REGISTRY}"; \
    npm config set fetch-retries 5; \
    npm config set fetch-retry-factor 2; \
    npm config set fetch-timeout 120000; \
    npm config set fetch-retry-maxtimeout 600000; \
    if [ -n "${HTTP_PROXY:-}" ]; then npm config set proxy "${HTTP_PROXY}"; fi; \
    if [ -n "${HTTPS_PROXY:-}" ]; then npm config set https-proxy "${HTTPS_PROXY}"; fi; \
    npm ci --no-audit --no-fund

FROM base AS builder
ARG DATABASE_URL
ARG DATABASE_URL_TEST
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN DATABASE_URL=$DATABASE_URL DATABASE_URL_TEST=$DATABASE_URL_TEST npm run prisma:generate && npm run build

FROM base AS runner
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

EXPOSE 4000
CMD ["npm", "run", "start"]
