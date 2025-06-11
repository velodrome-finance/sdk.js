import { metaMask } from "@wagmi/connectors";
import { connect, createConfig } from "@wagmi/core";
import {
  aerodromeConfig,
  getListedTokens,
  getQuoteForSwap,
  initDrome,
  swap,
} from "sugar";
import { http } from "viem";
import { base, optimism } from "viem/chains";

document.getElementById("button")?.addEventListener("click", onClick);

async function onClick() {
  const config = initDrome(
    createConfig({
      chains: [base, optimism],
      connectors: [metaMask()],
      transports: {
        [base.id]: http(
          "https://base-mainnet.g.alchemy.com/v2/o8G5U2UKFvW6aGp5ED6mXUtdIbMh52Co",
          { batch: true }
        ),
        [optimism.id]: http(
          "https://opt-mainnet.g.alchemy.com/v2/o8G5U2UKFvW6aGp5ED6mXUtdIbMh52Co",
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

  await connect(config, { connector: metaMask(), chainId: base.id });

  const tokens = await getListedTokens(config);
  console.log(tokens);

  const usdc = tokens.find((t) => t.symbol === "USDC")!;
  const usdbc = tokens.find((t) => t.symbol === "USDbC")!;
  const quote = await getQuoteForSwap(config, usdc, usdbc, 1n);
  console.log(quote);

  if (quote) {
    const result = await swap(config, quote);
    console.log("Swap complete: " + result);
  }
}
