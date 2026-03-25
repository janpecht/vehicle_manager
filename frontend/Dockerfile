# Build stage
FROM node:22-alpine AS build

WORKDIR /app

COPY frontend/package.json ./
COPY package-lock.json ./

RUN npm install

COPY frontend/ .

RUN npm run build

# Production stage
FROM nginxinc/nginx-unprivileged:alpine

USER root
RUN apk add --no-cache curl
USER nginx

COPY --from=build /app/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
