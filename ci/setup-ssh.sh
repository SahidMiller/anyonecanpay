#!/bin/sh

# # Setup DNS
# curl -Lo dnscontrol https://github.com/StackExchange/dnscontrol/releases/download/v3.20.0/dnscontrol-Linux
# chmod +x ./dnscontrol

# Setup canvas and ssh
apk add openssh-client rsync

# yarn global add node-gyp
mkdir -p ~/.ssh
chmod 700 ~/.ssh
