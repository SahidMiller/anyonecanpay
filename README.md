# Anyonecanpay.me

Anyonecanpay.me is a permissionless, peer-to-peer crowdfunding application built with BitcoinCash and IPFS. For more information on the underlying technology (flipstarter), please visit [flipstarter.cash](https://flipstarter.cash).

# Getting started

### Installation

Install all package dependencies: 

```shell
yarn install
```

Run the standalone packages directly (instead of [developing w/ Docker](#docker)):

```shell
yarn workspace @ipfs-flipstarter/spa run dev --port 8080 --host 127.0.0.1
yarn workspace @ipfs-flipstarter/cli run build
```

### Docker

[Docker](https://www.docker.com) can be used with a modified [.example.env](-/blob/master/.env) in order to setup IPFS and Nginx services for e2e development.

```shell
cp .example.env .env
docker compose build 
docker compose up --force-recreate
```

### Configuration

If you plan on self-hosting anyonecanpay.me you must provide some configuration such as what's provided by [.example.env](-/blob/master/.env).


#### General
| ENV | Description |
| ----| ---- |
| FQDN | Fully qualified domain name of your application and gateway node. |
| DOCKER_VOLUMES_ROOT | Root path to store and retrieve docker files - *only needed if deploying w/ Docker* |

#### Nginx
| ENV | Description |
| ----| ---- |
| HTTPS_ONLY | Redirect all traffic to HTTPS. |


#### IPFS 

In order to connect to a particular IPFS node, peer id and keys must be known prior to running. .example.env provides some default keys for development.
> \.example.env keys are inherently insecure for production use \*

| ENV | Description |
| ----| ---- |
| IPFS_PEER_ID | Peer ID for your gateway node. |
| IPFS_PRIVATE_KEY | Corresponding private key for gateway node.|
| IPFS_LIBP2P_KEY | Corresponding libp2p key for gateway node. |

To generate IPFS related keys for production or development use, you can run the following script:

```shell
# will generate: IPFS_PEER_ID, IPFS_PRIVATE_KEY, and IPFS_LIBP2P_KEY
./setup.sh
```
