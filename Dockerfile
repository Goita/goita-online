FROM node:6.10.3

MAINTAINER yoskeoka <yoske.oka@gmail.com>

ENV HOME=/home/node

COPY package.json yarn.lock $HOME/goita-online/
RUN chown -R node:node $HOME/*

# use user 'node'(UID:1000) which is created in node docker image
USER node
WORKDIR $HOME/goita-online
RUN yarn install

USER root
COPY . $HOME/goita-online/
RUN chown -R node:node $HOME/*
USER node

RUN yarn run build

CMD ["node", "lib/server.js"]
