FROM node:20-alpine

WORKDIR /app

# Copy root package for shared dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy shared modules and restaurant service
COPY services/shared ./services/shared
COPY services/restaurant-service ./services/restaurant-service

EXPOSE 5001

ENV PORT=5001
ENV NODE_ENV=production

CMD ["node", "services/restaurant-service/server.js"]
