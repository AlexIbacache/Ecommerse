FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npx prisma generate

EXPOSE 4000

# En cada arranque: regenera el cliente Prisma, aplica migraciones pendientes,
# carga datos de prueba (seed idempotente) y levanta la API en modo desarrollo.
CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && npx prisma db seed && exec npm run start:dev"]
