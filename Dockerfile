FROM node:alpine

RUN mkdir /app
WORKDIR /app
COPY package*.json ./
COPY jest.config.ts ./
RUN npm i
COPY src src

CMD npm start
