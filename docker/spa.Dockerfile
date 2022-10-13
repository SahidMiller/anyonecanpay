FROM node:18.10.0-alpine3.15 as spa
WORKDIR /app
RUN apk add --update --no-cache \
  build-base \
  g++ \
  cairo-dev \
  jpeg-dev \
  pango-dev \
  giflib-dev \
  git \
  gettext-dev
ENV NODE_ENV="production" \
    YARN_VERSION=3.2.3
RUN yarn set version 3.2.3
COPY package.json .yarnrc.yml yarn.lock ./
COPY ./packages/utils/package.json \
  ./packages/utils/tsconfig.json \
  ./packages/utils/decs.d.ts \
  ./packages/utils/
COPY ./packages/utils/src/ ./packages/utils/src/
COPY ./packages/spa/package.json ./packages/spa/
RUN yarn plugin import workspace-tools
RUN yarn workspace @ipfs-flipstarter/spa workspaces focus
ARG IPFS_PEER_ID
ARG DEV_TIPS_ADDRESS="bitcoincash:qpclad9r4zah39du3n55xj3mwdrkeuh0nyx8dqfqut"
ARG FQDN="flipstarter.me"
ARG ELECTRUM_SERVERS="[{\"address\":\"bch.imaginary.cash\",\"scheme\":\"wss\"},{\"address\":\"electroncash.dk\",\"scheme\":\"wss\"},{\"address\":\"electrum.imaginary.cash\",\"scheme\":\"wss\"}]"
ARG DEFAULT_GATEWAY_URL="https://${FQDN}"
ARG DEFAULT_API_URL="https://${FQDN}"
ARG DEFAULT_API_MULTIADDR="/dns4/${FQDN}/tcp/443/wss/p2p/${IPFS_PEER_ID}"
ARG SIGNING_NODE_WIF
ARG SIGNING_NODE_ADDRESS
ENV SIGNING_NODE_WIF=$SIGNING_NODE_WIF \
  SIGNING_NODE_ADDRESS=$SIGNING_NODE_ADDRESS \
  DEFAULT_GATEWAY_URL=$DEFAULT_GATEWAY_URL \
  DEFAULT_API_URL=$DEFAULT_API_URL \
  DEFAULT_API_MULTIADDR=$DEFAULT_API_MULTIADDR \
  ELECTRUM_SERVERS=$ELECTRUM_SERVERS
RUN echo salam $SIGNING_NODE_ADDRESS $SIGNING_NODE_WIF $DEFAULT_GATEWAY_URL
COPY ./packages/spa ./packages/spa
RUN NODE_OPTIONS=--openssl-legacy-provider yarn workspace @ipfs-flipstarter/spa run build

FROM ipfs/kubo:v0.16.0 as ipfs
WORKDIR /root/
EXPOSE 8080
EXPOSE 5001
EXPOSE 4001
EXPOSE 4001/udp
EXPOSE 4002

VOLUME /container-init.d/

COPY ./docker/bin/envsubst /usr/bin/envsubst
COPY ./docker/bin/inotifywait /usr/bin/inotifywait
COPY ./docker/ipfs/init-docker-spa.sh /container-init.d/setup.sh
COPY ./docker/ipfs/ipfs.conf.template /etc/ipfs/templates/ipfs.conf.template
COPY --from=stackexchange/dnscontrol:v3.20.0 /usr/local/bin/dnscontrol /usr/local/bin
COPY --from=spa /app/packages/spa/dist/ ./
RUN chmod +x  /usr/bin/envsubst
RUN chown ipfs ./
ENV USE_SUBDOMAINS=true