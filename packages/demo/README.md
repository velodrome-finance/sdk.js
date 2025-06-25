# Sugar SDK Demo App

This is a demo app showcasing the Sugar SDK swapping functionality.

## Configuration

To run the app you need to put `.env.aero` and/or `.env.velo` in its root directory. They need to contain the RPC URL of every used chain.

Aerodrome uses the following chains:

```
base
optimism
```

Velodrome uses the following chains:

```
optimism
mode
lisk
metalL2
fraxtal
ink
soneium
superseed
swellchain
unichain
celo
mainnet
```

The respective environment variable must be named `VITE_RPC_X` where `X` is the chain id. For example:

```
VITE_RPC_10=https://opt-mainnet.g.alchemy.com/v2/YOUR_API_KEY
```

## Running the app

- Open a prompt in the repository root.

- Install the dependencies:

```shell
npm i
```

- Build the SDK:

```shell
npm run build -w sugar-sdk
```

- To run the app for Aerodrome use:

```shell
npm run dev-aero -w demo
```

- To run the app for Velodrome use:

```shell
npm run dev-velo -w demo
```
