#!/bin/sh
if test -f /etc/ipfs/config; then
  cp /etc/ipfs/config /data/ipfs/config
fi

if test -f /etc/ipfs/templates/ipfs.conf.template; then
  envsubst < /etc/ipfs/templates/ipfs.conf.template > /data/ipfs/config
fi

if test -f ./manifest.json; then
  cp ./manifest.json /data/ipfs/
fi

IPFS_ID=$(ipfs id -f='<id>')
SPA_CID=$(ipfs add -rQ ./)
IPNS_ID=$(ipfs name publish $SPA_CID --offline --allow-offline -Q)

echo "ID: $IPFS_ID"
echo "ID: $IPNS_ID"
echo "SPA: $SPA_CID"