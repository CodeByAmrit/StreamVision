# Stage 1: Build production dependencies
FROM node:24-alpine AS build
WORKDIR /usr/src/app

COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm \
  npm ci --only=production

FROM node:24-alpine AS final

RUN apk add --no-cache ffmpeg

ENV NODE_ENV=production
ARG APP_VERSION=v4.2.17
ENV APP_VERSION=$APP_VERSION

WORKDIR /usr/src/app

RUN mkdir -p logs streams && chown -R node:node /usr/src/app

COPY --from=build --chown=node:node /usr/src/app/node_modules ./node_modules

COPY --chown=node:node . .

EXPOSE 3000
USER node

CMD [ "node", "cluster.js" ]