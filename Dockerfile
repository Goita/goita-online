FROM node:8.4.0

MAINTAINER yoskeoka <yoske.oka@gmail.com>

ENV HOME=/home/node

COPY package.json yarn.lock .yarnclean $HOME/goita-online/
RUN chown -R node:node $HOME/*

ENV TZ=Asia/Tokyo
# RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# use user 'node'(UID:1000) which is created in node docker image
USER node
WORKDIR $HOME/goita-online
RUN yarn install

USER root
COPY . $HOME/goita-online/
RUN chown -R node:node $HOME/*
USER node

RUN yarn run build

CMD ["node", "dist/server.js"]
