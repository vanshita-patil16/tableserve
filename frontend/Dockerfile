FROM node:20-alpine

WORKDIR /app

# Copy root dependencies needed for express server
COPY package*.json ./
RUN npm install --omit=dev

# Copy frontend source and static files
COPY frontend ./frontend

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production
ENV GATEWAY_URL=http://api-gateway:5000

CMD ["node", "frontend/server.cjs"]
