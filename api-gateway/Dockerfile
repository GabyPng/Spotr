# Spotr · API Gateway — imagen de producción ligera
FROM node:20-alpine

WORKDIR /app

# Instalar dependencias primero (mejor uso de la caché de capas)
COPY package*.json ./
RUN npm install --omit=dev

# Copiar el código de la aplicación
COPY . .

# Puerto en el que escucha el Gateway (ver index.js / variable PORT)
EXPOSE 5500

CMD ["npm", "start"]
