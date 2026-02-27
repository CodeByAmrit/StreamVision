# syntax=docker/dockerfile:1

FROM node:lts-slim AS base
WORKDIR /usr/src/app

RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
  --mount=type=cache,target=/var/lib/apt,sharing=locked \
  apt-get update && \
  apt-get install -y ffmpeg --no-install-recommends

FROM base AS build
COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm \
  npm ci --only=production

FROM base AS final
ENV NODE_ENV=production
WORKDIR /usr/src/app

RUN mkdir -p logs && chown -R node:node /usr/src/app

# Copy dependencies and application code with proper ownership
COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node . .

EXPOSE 3000
USER node
CMD [ "node", "app.js" ]