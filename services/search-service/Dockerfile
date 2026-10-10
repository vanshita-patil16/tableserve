FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY services/shared ./services/shared
COPY services/search-service ./services/search-service

EXPOSE 5004

ENV PORT=5004
ENV NODE_ENV=production

CMD ["node", "services/search-service/server.js"]
