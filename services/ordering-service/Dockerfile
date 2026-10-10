FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY services/shared ./services/shared
COPY services/ordering-service ./services/ordering-service

EXPOSE 5003

ENV PORT=5003
ENV NODE_ENV=production

CMD ["node", "services/ordering-service/server.js"]
