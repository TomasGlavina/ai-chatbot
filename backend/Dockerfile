FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY src ./src
COPY .env.example ./.env.example

EXPOSE 8080

CMD ["npm", "start"]
