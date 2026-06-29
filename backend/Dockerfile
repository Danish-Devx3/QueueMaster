# QueueMaster backend — Bun as both package manager and runtime.
# Bun executes TypeScript directly, so there's no separate compile/dist step.
FROM oven/bun:1-alpine AS deps
WORKDIR /app

# Install production dependencies only, against the committed lockfile.
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

FROM oven/bun:1-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY package.json bun.lock tsconfig.json ./
COPY src ./src

EXPOSE 4000
CMD ["bun", "run", "src/server.ts"]
