import { useMutation, useQuery } from "@tanstack/react-query";
import { Button, HelperText, Spinner, TextInput } from "flowbite-react";
import { useEffect, useMemo, useState } from "react";
import {
  getListedTokens,
  getQuoteForSwap,
  type SugarWagmiConfig,
  swap,
  type Token,
} from "sugar-sdk";
import { useDebounce } from "use-debounce";
import { BaseError, extractChain, formatUnits, parseUnits } from "viem";
import { useConfig } from "wagmi";
import { hashFn } from "wagmi/query";

import { ChainPicker } from "./ChainPicker.tsx";
import { TokenPicker } from "./TokenPicker.tsx";

export function Swapper() {
  const config = useConfig() as SugarWagmiConfig;
  const sugarChainIds = useMemo(
    () => config.sugarConfig.chains.map((chain) => chain.CHAIN.id),
    [config]
  );
  const [selectedChainId, setSelectedChainId] = useState<number>(
    () => sugarChainIds[0]
  );

  useEffect(() => {
    if (!sugarChainIds.includes(selectedChainId)) {
      setSelectedChainId(sugarChainIds[0]);
    }
  }, [selectedChainId, sugarChainIds]);

  const chains = useMemo(
    () =>
      sugarChainIds.map((id) => extractChain({ chains: config.chains, id })),
    [config.chains, sugarChainIds]
  );
  const selectedChain = useMemo(
    () => extractChain({ chains: config.chains, id: selectedChainId }),
    [config.chains, selectedChainId]
  );
  const showChainPicker = chains.length > 1;

  const { data: allTokens } = useQuery({
    queryKey: ["tokens"],
    queryFn: () => getListedTokens({ config }),
  });
  const tokens = useMemo(
    () => allTokens?.filter((token) => token.chainId === selectedChain.id),
    [allTokens, selectedChain.id]
  );
  const [fromToken, setFromToken] = useState<Token | null>(null);
  const [toToken, setToToken] = useState<Token | null>(null);

  if (tokens && !fromToken && !toToken) {
    setFromToken(tokens[0]);
    setToToken(tokens[1]);
  }

  const [amount, setAmount] = useState(0n);
  const [debouncedAmount] = useDebounce(amount, 200);
  const [displayAmount, setDisplayAmount] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);

  const { data: quote, status: quoteStatus } = useQuery({
    queryKey: ["quote", fromToken, toToken, debouncedAmount],
    queryKeyHashFn: hashFn,
    enabled: !inputError && !!fromToken && !!toToken && debouncedAmount > 0n,
    queryFn: () =>
      getQuoteForSwap({
        config,
        fromToken: fromToken!,
        toToken: toToken!,
        amountIn: debouncedAmount,
      }),
  });

  const swapMutation = useMutation({
    mutationFn: () => swap({ config, quote: quote! }),
  });
  const swapSuccessful = swapMutation.isSuccess;

  function handleAmountInput(input: string) {
    const sanitizedInput = input.replace(",", ".").replace(/[^0-9.]/g, "");
    setDisplayAmount(sanitizedInput);
    updateAmount(sanitizedInput, fromToken!);
  }

  function updateAmount(displayAmount: string, token: Token) {
    let amount: bigint;
    resetSwapState();

    try {
      amount = parseUnits(displayAmount, token.decimals);
    } catch {
      setInputError("Invalid value.");
      return;
    }

    if (amount > token.balance) {
      setInputError("Insufficient funds.");
      return;
    }

    setInputError(null);
    setAmount(amount);
  }

  function handleSwapClick() {
    if (!quote) {
      return;
    }

    swapMutation.mutate();
  }

  function getDisplayError() {
    if (inputError) {
      return inputError;
    }

    if (quoteStatus !== "pending" && !quote) {
      return "No quote available.";
    }

    if (swapMutation.error) {
      if (swapMutation.error instanceof BaseError) {
        return swapMutation.error.shortMessage;
      }
      return swapMutation.error.message;
    }

    return "";
  }

  function resetSwapState(resetTokens = false) {
    if (resetTokens) {
      setFromToken(null);
      setToToken(null);
    }

    setInputError(null);
    swapMutation.reset();
  }

  if (!tokens) {
    return (
      <div className="text-center">
        <Spinner></Spinner>
      </div>
    );
  }

  return (
    <div
      className={`grid grid-cols-[80px_1fr] grid-rows-[${showChainPicker ? "1fr_" : ""}1fr_1fr_1fr_1fr_30px] gap-4`}
    >
      {showChainPicker && (
        <ChainPicker
          chains={chains}
          selectedChain={selectedChain}
          onChainSelected={(chain) => {
            setSelectedChainId(chain.id);
            resetSwapState(true);
          }}
          className="col-span-2"
        />
      )}
      <TokenPicker
        tokens={tokens}
        selectedTokenAddress={fromToken?.address ?? ""}
        onTokenSelect={(token) => {
          setFromToken(token);
          updateAmount(displayAmount, token);
        }}
        excludeTokenAddresses={[toToken?.address ?? ""]}
      />
      <TextInput
        disabled={!fromToken}
        value={displayAmount}
        onChange={(e) => handleAmountInput(e.target.value)}
      />
      <TokenPicker
        tokens={tokens}
        selectedTokenAddress={toToken?.address ?? ""}
        onTokenSelect={(token) => {
          setToToken(token);
          resetSwapState();
        }}
        excludeTokenAddresses={[fromToken?.address ?? ""]}
      />
      <TextInput
        readOnly={true}
        value={
          quote ? formatUnits(quote.amountOut, quote.toToken.decimals) : ""
        }
      />
      <Button
        disabled={!quote || !!inputError || swapMutation.isPending}
        onClick={handleSwapClick}
        className="col-span-2"
      >
        Swap
      </Button>
      <HelperText className="col-span-2">
        <span className={swapSuccessful ? "text-green-500" : "text-red-500"}>
          {swapSuccessful ? "Swap successful!" : getDisplayError()}
        </span>
      </HelperText>
    </div>
  );
}
