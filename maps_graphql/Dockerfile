# Spotr · Microservicio GraphQL de mapas — imagen de producción ligera
FROM node:20-alpine

WORKDIR /app

# Instalar dependencias primero (mejor uso de la caché de capas)
COPY package*.json ./
RUN npm install --omit=dev

# Copiar el código de la aplicación
COPY . .

# Puerto interno del microservicio (ver index.js / variable PORT)
EXPOSE 4001

CMD ["npm", "start"]
