FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY services/shared ./services/shared
COPY services/api-gateway ./services/api-gateway

EXPOSE 5000

ENV PORT=5000
ENV NODE_ENV=production

CMD ["node", "services/api-gateway/server.js"]
