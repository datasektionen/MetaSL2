FROM node:21-alpine

WORKDIR /app

COPY . .

RUN npm install

CMD ["node", "index.js"]

EXPOSE 3000
