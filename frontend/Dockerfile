# ---------- Build stage: produce the static Vite bundle with Bun ----------
FROM oven/bun:1-alpine AS build
WORKDIR /app

# Vite inlines env vars at BUILD time, so VITE_API_URL must be provided as a build arg
# (wired from docker-compose) and exported before the build runs.
ARG VITE_API_URL=http://localhost:4000
ENV VITE_API_URL=$VITE_API_URL

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

# ---------- Runtime stage: serve static files with nginx ----------
FROM nginx:alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
