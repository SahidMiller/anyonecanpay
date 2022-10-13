FROM node:18.10.0-alpine3.15 as backend
WORKDIR /app
RUN apk add git
ENV YARN_VERSION 3.2.3
RUN yarn set version 3.2.3
COPY package.json ./
COPY .yarnrc.yml yarn.lock ./
COPY ./packages/utils/package.json \
  ./packages/utils/tsconfig.json \
  ./packages/utils/decs.d.ts \
  ./packages/utils/
COPY ./packages/utils/src/ ./packages/utils/src/
COPY ./packages/backend/package.json ./packages/backend/package.json
RUN yarn plugin import workspace-tools
ENV NODE_ENV "production"
RUN yarn workspace @ipfs-flipstarter/cli workspaces focus
COPY ./packages/backend/src/ ./packages/backend/src/
COPY ./packages/backend/bin.js ./packages/backend


# INTERNAL API PORT
EXPOSE 8088

ENTRYPOINT NODE_OPTIONS='--openssl-legacy-provider --no-experimental-fetch' NODE_ENV=production yarn workspace @ipfs-flipstarter/cli run start --host 0.0.0.0 --port 8088 --api http://spa:5001 --verbose