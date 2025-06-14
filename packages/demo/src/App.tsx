import { useMutation, useQuery } from "@tanstack/react-query";
import { Button, DarkThemeToggle } from "flowbite-react";
import { getListedTokens, getQuoteForSwap, swap } from "sugar-sdk";
import {
  injected,
  useAccount,
  useConfig,
  useConnect,
  useDisconnect,
} from "wagmi";
import { base } from "wagmi/chains";

function App() {
  const { isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const config = useConfig();

  const { data: tokens } = useQuery({
    queryKey: ["tokens"],
    queryFn: () => getListedTokens(config),
  });

  const { data: quote } = useQuery({
    queryKey: ["quote"],
    enabled: !!tokens,
    queryFn: () => {
      const usdc = tokens!.find((t) => t.symbol === "USDC")!;
      const usdbc = tokens!.find((t) => t.symbol === "USDbC")!;
      return getQuoteForSwap(config, usdc, usdbc, 1n);
    },
  });

  const swapMutation = useMutation({
    mutationFn: () => swap(config, quote!),
  });

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 bg-white dark:bg-gray-900">
      <DarkThemeToggle className="absolute top-4 right-4" />

      <Button
        onClick={() =>
          isConnected
            ? disconnect()
            : connect({ connector: injected(), chainId: base.id })
        }
      >
        {isConnected ? "Disconnect" : "Connect"}
      </Button>

      <Button
        disabled={!isConnected || !quote}
        onClick={() => swapMutation.mutate()}
      >
        Swap
      </Button>
    </main>
  );
}

export default App;
