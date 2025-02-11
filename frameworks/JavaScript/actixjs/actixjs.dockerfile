FROM node:20.8.0-slim

ARG TFB_TEST_NAME

COPY ./ ./

RUN npm install

ENV TFB_TEST_NAME=$TFB_TEST_NAME

EXPOSE 8080

CMD ["node", "app.js"]
