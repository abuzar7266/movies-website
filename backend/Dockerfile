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
RUN npm run prisma:generate && npm run build && node -e "const fs=require('node:fs');const path=require('node:path');const root=path.resolve('dist','generated','prisma');function walk(d,o=[]){for(const e of fs.readdirSync(d,{withFileTypes:true})){const f=path.join(d,e.name);if(e.isDirectory())walk(f,o);else if(e.isFile()&&e.name.endsWith('.js'))o.push(f);}return o;}function patch(file){let s=fs.readFileSync(file,'utf8');const b=s;s=s.replace(/(from\\s+[\\"']\\.{1,2}\\/[^\\\"']+)([\\\"'];)/g,(m,p1,p2)=>(/\\.[cm]?js[\\\"'];$/.test(m)?m:`${p1}.js${p2}`));if(s!==b)fs.writeFileSync(file,s,'utf8');}if(fs.existsSync(root)){for(const f of walk(root))patch(f);}"

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/.env.example ./
EXPOSE 4000
CMD ["npm", "run", "start"]
