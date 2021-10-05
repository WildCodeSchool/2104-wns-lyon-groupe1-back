FROM node:alpine

RUN mkdir /server
WORKDIR /server
COPY package*.json ./
COPY jest.config.ts ./
COPY tsconfig.json ./
RUN npm i
COPY src src

CMD npm start
