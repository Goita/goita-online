FROM node:8.11.0-alpine

ENV HOME=/home/node TZ=Asia/Tokyo

RUN apk add --no-cache git

WORKDIR $HOME/goita-online

CMD ["node", "dist/server.js"]
