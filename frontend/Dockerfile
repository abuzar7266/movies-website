# Multi-stage build for Vite React app
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
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

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Build production assets
RUN npm run build

FROM nginx:1.27-alpine AS runner
# Copy custom nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Static assets
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

