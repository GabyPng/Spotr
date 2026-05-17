# Spotr · Frontend — build con Vite y servido por Nginx (multi-stage)

# ── Etapa 1: build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build          # genera /app/dist

# ── Etapa 2: servir estáticos ───────────────────────────────────────────────
FROM nginx:alpine

# Copiar el bundle estático generado por Vite
COPY --from=build /app/dist /usr/share/nginx/html

# Configuración con fallback SPA (React Router: /login, /, etc.)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
