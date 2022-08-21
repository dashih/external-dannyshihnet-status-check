FROM node:18.7.0
WORKDIR /home/node/app
COPY . .
CMD [ "node", "app.js" ]
