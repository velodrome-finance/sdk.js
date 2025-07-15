import { Button, DarkThemeToggle } from "flowbite-react";
import { injected, useAccount, useConnect, useDisconnect } from "wagmi";

import { Swapper } from "./components/Swapper.tsx";

function App() {
  const { status } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white dark:bg-gray-900">
      <div className="absolute top-4 right-4 flex gap-6">
        <Button
          disabled={status === "connecting" || status === "reconnecting"}
          onClick={() =>
            status === "connected"
              ? disconnect()
              : connect({ connector: injected() })
          }
        >
          {status === "connected" ? "Disconnect wallet" : "Connect wallet"}
        </Button>
        <DarkThemeToggle />
      </div>

      {status === "connected" ? (
        <Swapper />
      ) : (
        <span className="text-3xl text-gray-900 dark:text-white">
          Please connect your wallet.
        </span>
      )}
    </main>
  );
}

export default App;
