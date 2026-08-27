FROM node:22-bookworm-slim AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --include=dev

COPY prisma ./prisma
COPY src ./src
COPY test ./test
COPY nest-cli.json tsconfig.json tsconfig.build.json ./
RUN npm run prisma:generate && npm run build

FROM node:22-bookworm-slim AS production

ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY prisma ./prisma
COPY --from=build /app/dist ./dist
RUN npm run prisma:generate

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:3000/api').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["sh", "-c", "npm run db:deploy && npm run db:seed && npm run start:prod"]
