import { aerodromeConfig, initDrome } from "sugar-sdk";
import { createConfig, http, injected } from "wagmi";
import { base, optimism } from "wagmi/chains";

const { VITE_ALCHEMY_API_KEY } = import.meta.env;

if (!VITE_ALCHEMY_API_KEY) {
  throw new Error(
    "Please pass VITE_ALCHEMY_API_KEY as an environment variable."
  );
}

export const config = initDrome(
  createConfig({
    chains: [base, optimism],
    connectors: [injected()],
    transports: {
      [base.id]: http(
        "https://base-mainnet.g.alchemy.com/v2/" + VITE_ALCHEMY_API_KEY,
        { batch: true }
      ),
      [optimism.id]: http(
        "https://opt-mainnet.g.alchemy.com/v2/" + VITE_ALCHEMY_API_KEY,
        { batch: true }
      ),
    },
  }),
  {
    ...aerodromeConfig,
    onError(error) {
      console.log(error);
    },
  }
);

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
