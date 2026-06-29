# ---------- Build stage: compile TypeScript -> dist/ ----------
FROM node:20-alpine AS build
WORKDIR /app

# Install all deps (incl. dev) for the build.
COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---------- Runtime stage: production deps + compiled output ----------
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist

EXPOSE 4000
CMD ["node", "dist/server.js"]
