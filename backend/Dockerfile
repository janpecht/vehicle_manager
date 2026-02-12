# Build stage
FROM node:18-alpine AS build

RUN apk add --no-cache python3 make g++ openssl

WORKDIR /app

COPY package.json ./
COPY prisma ./prisma/

RUN npm install

RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src/

RUN npm run build

# Production stage
FROM node:18-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY --from=build /app/dist ./dist/
COPY --from=build /app/node_modules ./node_modules/
COPY --from=build /app/prisma ./prisma/
COPY --from=build /app/package.json ./

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
