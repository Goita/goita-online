FROM node:8.6.0

LABEL yoskeoka <yoske.oka@gmail.com>
ENV TZ=Asia/Tokyo
ENV HOME=/home/node

COPY package.json yarn.lock .yarnclean $HOME/goita-online/
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

CMD ["node", "dist/server.js"]
