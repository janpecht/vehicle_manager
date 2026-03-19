# Build stage
FROM node:22-alpine AS build

RUN apk add --no-cache python3 make g++ openssl

WORKDIR /app

COPY backend/package.json ./
COPY package-lock.json ./
COPY backend/prisma ./prisma/

RUN npm install

RUN npx prisma generate

COPY backend/tsconfig.json ./
COPY backend/src ./src/

RUN npm run build

# Remove devDependencies after build
RUN npm prune --omit=dev

# Production stage
FROM node:22-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY --from=build /app/dist ./dist/
COPY --from=build /app/node_modules ./node_modules/
COPY --from=build /app/prisma ./prisma/
COPY --from=build /app/package.json ./

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
