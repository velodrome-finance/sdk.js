import { useMutation, useQuery } from "@tanstack/react-query";
import { Button, HelperText, Spinner, TextInput } from "flowbite-react";
import { useState } from "react";
import { getListedTokens, getQuoteForSwap, swap, type Token } from "sugar-sdk";
import { useDebounce } from "use-debounce";
import { BaseError, type Chain } from "viem";
import { erc20Abi, extractChain, formatUnits, parseUnits } from "viem";
import { useConfig, useWriteContract } from "wagmi";
import { hashFn } from "wagmi/query";

import { ChainPicker } from "./ChainPicker.tsx";
import { TokenPicker } from "./TokenPicker.tsx";

function isNativeToken(chains: Chain[], token: Token) {
  const chain = extractChain({ chains, id: token.chainId });
  return token.address === chain.nativeCurrency.symbol.toLowerCase();
}

export function Swapper() {
  const config = useConfig();
  const isVelodrome = config.dromeConfig.type === "velodrome";
  const chains = config.dromeConfig.CHAIN_IDS.map((id) =>
    extractChain({ chains: config.chains, id })
  );
  const [selectedChain, setSelectedChain] = useState(chains[0]);

  const { data: tokens } = useQuery({
    queryKey: ["tokens"],
    queryFn: () => getListedTokens(config),
    select: (tokens) =>
      tokens.filter((token) => token.chainId === selectedChain.id),
  });
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
      getQuoteForSwap(config, fromToken!, toToken!, debouncedAmount),
  });

  const approveMutation = useWriteContract();
  const swapMutation = useMutation({
    mutationFn: () => swap(config, quote!),
  });
  const swapSuccessful =
    swapMutation.isSuccess &&
    (approveMutation.isSuccess || isNativeToken(chains, fromToken!));

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
    const { fromToken, toToken, amount } = quote!;

    if (isNativeToken(chains, fromToken)) {
      // no token approval needed for native currency
      swapMutation.mutate();
      return;
    }

    approveMutation.writeContract(
      {
        chainId: fromToken.chainId,
        abi: erc20Abi,
        address: fromToken.wrappedAddress || fromToken.address,
        functionName: "approve",
        args: [
          config.dromeConfig.chains[toToken.chainId].UNIVERSAL_ROUTER_ADDRESS,
          amount,
        ],
      },
      {
        onSuccess: () => swapMutation.mutate(),
      }
    );
  }

  function getDisplayError() {
    if (inputError) {
      return inputError;
    }

    if (quoteStatus !== "pending" && !quote) {
      return "No quote available.";
    }

    if (approveMutation.error) {
      if (approveMutation.error instanceof BaseError) {
        return approveMutation.error.shortMessage;
      }
      return approveMutation.error.message;
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
    approveMutation.reset();
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
      className={`grid grid-cols-[80px_1fr] grid-rows-[${isVelodrome ? "1fr_" : ""}1fr_1fr_1fr_1fr_30px] gap-4`}
    >
      {isVelodrome && (
        <ChainPicker
          chains={chains}
          selectedChain={selectedChain}
          onChainSelected={(chain) => (
            setSelectedChain(chain), resetSwapState(true)
          )}
          className="col-span-2"
        />
      )}
      <TokenPicker
        tokens={tokens}
        selectedTokenAddress={fromToken?.address ?? ""}
        onTokenSelect={(token) => (
          setFromToken(token), updateAmount(displayAmount, token)
        )}
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
        onTokenSelect={(token) => (setToToken(token), resetSwapState())}
        excludeTokenAddresses={[fromToken?.address ?? ""]}
      />
      <TextInput
        readOnly={true}
        value={
          quote ? formatUnits(quote.amountOut, quote.toToken.decimals) : ""
        }
      />
      <Button
        disabled={
          !quote ||
          !!inputError ||
          approveMutation.isPending ||
          swapMutation.isPending
        }
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
