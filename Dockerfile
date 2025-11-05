FROM node:24-alpine AS runtime

RUN apk add --no-cache file

WORKDIR /app

FROM runtime AS dev
