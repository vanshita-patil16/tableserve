FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY services/shared ./services/shared
COPY services/reservation-service ./services/reservation-service

EXPOSE 5002

ENV PORT=5002
ENV NODE_ENV=production

CMD ["node", "services/reservation-service/server.js"]
