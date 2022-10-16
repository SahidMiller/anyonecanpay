FROM golang:latest
WORKDIR /root
RUN git clone https://github.com/whyrusleeping/ipfs-key.git 
RUN cd ./ipfs-key go get && go install && go build && chmod +x ./ipfs-key
# RUN mv /root/ipfs-key/ipfs-key /usr/bin/ipfs-key
COPY --from=ipfs/kubo:v0.16.0 /usr/local/bin/ipfs /usr/local/bin/ipfs
RUN ipfs init > /dev/null
CMD ((((ipfs-key --type ed25519 > /tmp/tmp.key) 2>&1) | sed -z 's/.*key: \(.*\)$/IPFS_PEER_ID=\1/' >&1) \
  && (cat /tmp/tmp.key | echo "IPFS_PRIVATE_KEY=$(base64 -w0)" )) \
  && (echo "IPFS_LIBP2P_KEY=$(ipfs key import tmp-key /tmp/tmp.key)")