FROM node:18-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY src/ ./src/
EXPOSE 3005
CMD [ "npm", "start" ]