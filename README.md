![Sugar](sugar.png)

# Sugar SDK

Velodrome and Aerodrome SDK for JS and TS developers.

## Hacking on sugar locally

Make sure you have the right version of node activated and install all the dependencies 

```bash
nvm use && npm i
```

Make sure the SDK builds correctly:

```bash
cd packages/sugar-sdk && npm run build
```

## Tests

Start honey

```
cd packages/honey && npm start
```

Run tests

```
npm test
```

## Abis

Regenerate 

```
npx @wagmi/cli generate YOUR_ETHERSCAN_KEY_HERE
```