# ---------- Build stage: produce the static Vite bundle ----------
FROM node:20-alpine AS build
WORKDIR /app

# Vite inlines env vars at BUILD time, so VITE_API_URL must be provided as a build arg
# (wired from docker-compose) and exported before `npm run build`.
ARG VITE_API_URL=http://localhost:4000
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------- Runtime stage: serve static files with nginx ----------
FROM nginx:alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
