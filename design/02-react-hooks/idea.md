# React Hooks Library for Sugar SDK - Implementation Design

## Overview

This document outlines the design and implementation strategy for `@dromos-labs/react-hooks`, a React library that provides hooks and providers to simplify integration of the Sugar SDK into React applications.

## Architecture

### Core Principles

1. **Composable**: Works seamlessly with existing `wagmi` and `@tanstack/react-query` installations
2. **Performant**: Leverages React Query's caching, deduplication, and parallel query capabilities
3. **Type-Safe**: Full TypeScript support with proper type inference
4. **Testable**: Designed for easy testing at all layers
5. **Flexible**: Supports both server and client-side rendering patterns

### Dependency Structure

```json
{
  "peerDependencies": {
    "react": "^18.0.0",
    "@tanstack/react-query": "^5.0.0",
    "wagmi": "^2.0.0",
    "@dromos-labs/sugar-sdk": "workspace:*"
  }
}
```

## Provider Architecture

### 1. SugarClientProvider

The main provider wraps the application and provides Sugar SDK configuration context.

**Key Design Decision**: Instead of creating our own QueryClient or WagmiConfig, we detect and use existing providers in the tree.

```typescript
// packages/react-hooks/src/providers/SugarClientProvider.tsx

import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useConfig } from 'wagmi';
import type { SugarWagmiConfig } from '@dromos-labs/sugar-sdk';

interface SugarClientContextValue {
  config: SugarWagmiConfig;
}

const SugarClientContext = createContext<SugarClientContextValue | null>(null);

export interface SugarClientProviderProps {
  config: SugarWagmiConfig;
  children: ReactNode;
}

export function SugarClientProvider({ config, children }: SugarClientProviderProps) {
  // Validate that we're inside wagmi and react-query providers
  const queryClient = useQueryClient();
  const wagmiConfig = useConfig();

  // Ensure our config is compatible with wagmi provider
  if (config !== wagmiConfig) {
    console.warn(
      'SugarClientProvider: The provided config differs from the wagmi config. ' +
      'Make sure to pass the same config to both providers.'
    );
  }

  const value = useMemo(() => ({ config }), [config]);

  return (
    <SugarClientContext.Provider value={value}>
      {children}
    </SugarClientContext.Provider>
  );
}

export function useSugarClient() {
  const context = useContext(SugarClientContext);
  if (!context) {
    throw new Error('useSugarClient must be used within SugarClientProvider');
  }
  return context;
}
```

### 2. Application Setup Pattern

```typescript
// App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { SugarClientProvider } from '@dromos-labs/react-hooks';
import { getDefaultConfig, optimism, base } from '@dromos-labs/sugar-sdk';

// User creates their own QueryClient with custom config
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30,   // 30 minutes
    },
  },
});

// Initialize Sugar SDK config (which extends wagmi config)
const sugarConfig = getDefaultConfig({
  chains: [
    { chain: optimism, rpcUrl: process.env.OPTIMISM_RPC_URL },
    { chain: base, rpcUrl: process.env.BASE_RPC_URL },
  ],
});

function App() {
  return (
    <WagmiProvider config={sugarConfig}>
      <QueryClientProvider client={queryClient}>
        <SugarClientProvider config={sugarConfig}>
          <MyApp />
        </SugarClientProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

## Hook Implementations

### 1. useTokens Hook

Fetches and caches the list of available tokens across all configured chains.

```typescript
// packages/react-hooks/src/hooks/useTokens.ts

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { getListedTokens, type Token } from '@dromos-labs/sugar-sdk';
import { useSugarClient } from '../providers/SugarClientProvider';

export interface UseTokensOptions {
  /**
   * Filter tokens by chain ID
   */
  chainId?: number;

  /**
   * Filter tokens by symbol (case-insensitive partial match)
   */
  symbol?: string;

  /**
   * Only return tokens with balance > 0
   */
  withBalanceOnly?: boolean;

  /**
   * React Query options
   */
  query?: Omit<UseQueryOptions<Token[], Error>, 'queryKey' | 'queryFn'>;
}

export function useTokens(options: UseTokensOptions = {}) {
  const { config } = useSugarClient();
  const { chainId, symbol, withBalanceOnly, query: queryOptions } = options;

  const result = useQuery<Token[], Error>({
    queryKey: ['sugar', 'tokens', { chainId, symbol, withBalanceOnly }],
    queryFn: async () => {
      const tokens = await getListedTokens({ config });

      let filtered = tokens;

      if (chainId !== undefined) {
        filtered = filtered.filter(t => t.chainId === chainId);
      }

      if (symbol) {
        const searchSymbol = symbol.toLowerCase();
        filtered = filtered.filter(t =>
          t.symbol.toLowerCase().includes(searchSymbol)
        );
      }

      if (withBalanceOnly) {
        filtered = filtered.filter(t => t.balance > 0n);
      }

      return filtered;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes - tokens don't change often
    ...queryOptions,
  });

  return {
    tokens: result.data ?? [],
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
}
```

**Usage Example:**

```typescript
function TokenList() {
  const { tokens, isLoading, error } = useTokens({
    chainId: 10, // Optimism only
    withBalanceOnly: true,
  });

  if (isLoading) return <div>Loading tokens...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {tokens.map(token => (
        <li key={`${token.chainId}-${token.address}`}>
          {token.symbol} - Balance: {formatUnits(token.balance, token.decimals)}
        </li>
      ))}
    </ul>
  );
}
```

### 2. useSwapQuote Hook

Fetches a swap quote with automatic refetching and caching.

```typescript
// packages/react-hooks/src/hooks/useSwapQuote.ts

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { getQuoteForSwap, type Quote, type Token } from '@dromos-labs/sugar-sdk';
import { useSugarClient } from '../providers/SugarClientProvider';

export interface UseSwapQuoteOptions {
  fromToken?: Token;
  toToken?: Token;
  amountIn?: bigint;

  /**
   * Enable/disable the query
   */
  enabled?: boolean;

  /**
   * Batch size for quote calculations
   * @default 50
   */
  batchSize?: number;

  /**
   * Concurrent request limit
   * @default 10
   */
  concurrentLimit?: number;

  /**
   * React Query options
   */
  query?: Omit<UseQueryOptions<Quote | null, Error>, 'queryKey' | 'queryFn'>;
}

export function useSwapQuote(options: UseSwapQuoteOptions) {
  const { config } = useSugarClient();
  const {
    fromToken,
    toToken,
    amountIn,
    enabled = true,
    batchSize = 50,
    concurrentLimit = 10,
    query: queryOptions,
  } = options;

  const isEnabled = enabled &&
    fromToken !== undefined &&
    toToken !== undefined &&
    amountIn !== undefined &&
    amountIn > 0n;

  const result = useQuery<Quote | null, Error>({
    queryKey: [
      'sugar',
      'quote',
      {
        from: fromToken?.address,
        to: toToken?.address,
        chainId: fromToken?.chainId,
        amount: amountIn?.toString(),
      },
    ],
    queryFn: async () => {
      if (!fromToken || !toToken || !amountIn) {
        return null;
      }

      return getQuoteForSwap({
        config,
        fromToken,
        toToken,
        amountIn,
        batchSize,
        concurrentLimit,
      });
    },
    enabled: isEnabled,
    staleTime: 1000 * 10, // 10 seconds - quotes change quickly
    gcTime: 1000 * 60,    // 1 minute
    ...queryOptions,
  });

  return {
    quote: result.data,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
}
```

**Usage Example:**

```typescript
function SwapQuoteDisplay() {
  const { tokens } = useTokens();
  const usdc = tokens.find(t => t.symbol === 'USDC' && t.chainId === 10);
  const weth = tokens.find(t => t.symbol === 'WETH' && t.chainId === 10);

  const [amount, setAmount] = useState('100');
  const amountIn = useMemo(
    () => usdc ? parseUnits(amount, usdc.decimals) : undefined,
    [amount, usdc]
  );

  const { quote, isLoading, error } = useSwapQuote({
    fromToken: usdc,
    toToken: weth,
    amountIn,
  });

  if (isLoading) return <div>Getting quote...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!quote) return <div>No route found</div>;

  return (
    <div>
      <p>You'll receive: {formatUnits(quote.amountOut, weth.decimals)} WETH</p>
      <p>Price impact: {formatUnits(quote.priceImpact, 2)}%</p>
    </div>
  );
}
```

### 3. useSwap Hook

Executes a swap with transaction state management.

```typescript
// packages/react-hooks/src/hooks/useSwap.ts

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';
import { swap, type Quote } from '@dromos-labs/sugar-sdk';
import { useAccount, useWaitForTransactionReceipt } from 'wagmi';
import { useSugarClient } from '../providers/SugarClientProvider';
import { useState } from 'react';

export interface SwapParams {
  quote: Quote;
  slippage?: number;
}

export interface UseSwapOptions {
  /**
   * Callback after transaction is sent (but before confirmation)
   */
  onTransactionSent?: (txHash: string) => void;

  /**
   * Callback after transaction is confirmed
   */
  onSuccess?: (txHash: string) => void;

  /**
   * Callback on error
   */
  onError?: (error: Error) => void;

  /**
   * React Query mutation options
   */
  mutation?: Omit<
    UseMutationOptions<string, Error, SwapParams>,
    'mutationFn' | 'onSuccess' | 'onError'
  >;
}

export function useSwap(options: UseSwapOptions = {}) {
  const { config } = useSugarClient();
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const [txHash, setTxHash] = useState<string | undefined>();

  // Track transaction confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: txHash as `0x${string}` | undefined,
    });

  const mutation = useMutation<string, Error, SwapParams>({
    mutationFn: async ({ quote, slippage }) => {
      const hash = await swap({
        config,
        quote,
        slippage,
        waitForReceipt: false, // We'll wait using wagmi hook
        account: address,
      });

      setTxHash(hash);
      options.onTransactionSent?.(hash);

      return hash;
    },
    onSuccess: (hash) => {
      // Invalidate token balances after swap
      queryClient.invalidateQueries({ queryKey: ['sugar', 'tokens'] });
      options.onSuccess?.(hash);
    },
    onError: options.onError,
    ...options.mutation,
  });

  return {
    swap: mutation.mutate,
    swapAsync: mutation.mutateAsync,

    // Transaction states
    isPreparing: mutation.isPending,
    isConfirming,
    isConfirmed,

    // Combined loading state
    isLoading: mutation.isPending || isConfirming,

    error: mutation.error,
    txHash,

    reset: () => {
      mutation.reset();
      setTxHash(undefined);
    },
  };
}
```

**Usage Example:**

```typescript
function SwapButton({ quote }: { quote: Quote }) {
  const { swap, isLoading, isPreparing, isConfirming, isConfirmed, error, txHash } = useSwap({
    onTransactionSent: (hash) => {
      console.log('Transaction sent:', hash);
      toast.success('Swap submitted!');
    },
    onSuccess: (hash) => {
      console.log('Swap confirmed:', hash);
      toast.success('Swap completed!');
    },
    onError: (error) => {
      toast.error(`Swap failed: ${error.message}`);
    },
  });

  return (
    <div>
      <button
        onClick={() => swap({ quote, slippage: 0.01 })}
        disabled={isLoading}
      >
        {isPreparing && 'Preparing...'}
        {isConfirming && 'Confirming...'}
        {isConfirmed && 'Success!'}
        {!isLoading && 'Swap'}
      </button>

      {error && <p className="error">{error.message}</p>}
      {txHash && <a href={`https://etherscan.io/tx/${txHash}`}>View on Explorer</a>}
    </div>
  );
}
```

### 4. useApprove Hook

Handles ERC20 token approvals.

```typescript
// packages/react-hooks/src/hooks/useApprove.ts

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';
import { approve, type Token } from '@dromos-labs/sugar-sdk';
import { useAccount, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { useSugarClient } from '../providers/SugarClientProvider';
import { useState } from 'react';
import { erc20Abi, type Address } from 'viem';

export interface ApproveParams {
  token: Token;
  spender: Address;
  amount: bigint;
}

export interface UseApproveOptions {
  onSuccess?: (txHash: string) => void;
  onError?: (error: Error) => void;
  mutation?: Omit<
    UseMutationOptions<string, Error, ApproveParams>,
    'mutationFn' | 'onSuccess' | 'onError'
  >;
}

export function useApprove(options: UseApproveOptions = {}) {
  const { config } = useSugarClient();
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const [txHash, setTxHash] = useState<string | undefined>();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: txHash as `0x${string}` | undefined,
    });

  const mutation = useMutation<string, Error, ApproveParams>({
    mutationFn: async ({ token, spender, amount }) => {
      const hash = await approve({
        config,
        tokenAddress: token.address as Address,
        spenderAddress: spender,
        amount,
        chainId: token.chainId,
        waitForReceipt: false,
      });

      setTxHash(hash);
      return hash;
    },
    onSuccess: (hash) => {
      // Invalidate allowance queries
      queryClient.invalidateQueries({ queryKey: ['allowance'] });
      options.onSuccess?.(hash);
    },
    onError: options.onError,
    ...options.mutation,
  });

  return {
    approve: mutation.mutate,
    approveAsync: mutation.mutateAsync,
    isPreparing: mutation.isPending,
    isConfirming,
    isConfirmed,
    isLoading: mutation.isPending || isConfirming,
    error: mutation.error,
    txHash,
    reset: () => {
      mutation.reset();
      setTxHash(undefined);
    },
  };
}

/**
 * Check if approval is needed for a token
 */
export function useAllowance(token?: Token, spender?: Address, amount?: bigint) {
  const { address } = useAccount();

  const { data: allowance, ...rest } = useReadContract({
    address: token?.address as Address | undefined,
    abi: erc20Abi,
    functionName: 'allowance',
    args: address && spender ? [address, spender] : undefined,
    chainId: token?.chainId,
    query: {
      enabled: !!token && !!address && !!spender,
      queryKey: ['allowance', token?.address, address, spender],
    },
  });

  const needsApproval = amount !== undefined &&
    allowance !== undefined &&
    allowance < amount;

  return {
    allowance: allowance ?? 0n,
    needsApproval,
    ...rest,
  };
}
```

**Usage Example:**

```typescript
function ApproveAndSwap({ quote }: { quote: Quote }) {
  const { allowance, needsApproval } = useAllowance(
    quote.fromToken,
    quote.spenderAddress,
    quote.amount
  );

  const { approve, isLoading: isApproving } = useApprove({
    onSuccess: () => toast.success('Approval confirmed!'),
  });

  const { swap, isLoading: isSwapping } = useSwap({
    onSuccess: () => toast.success('Swap confirmed!'),
  });

  if (needsApproval) {
    return (
      <button
        onClick={() => approve({
          token: quote.fromToken,
          spender: quote.spenderAddress,
          amount: quote.amount,
        })}
        disabled={isApproving}
      >
        {isApproving ? 'Approving...' : 'Approve'}
      </button>
    );
  }

  return (
    <button
      onClick={() => swap({ quote, slippage: 0.01 })}
      disabled={isSwapping}
    >
      {isSwapping ? 'Swapping...' : 'Swap'}
    </button>
  );
}
```

### 5. Additional Utility Hooks

```typescript
// packages/react-hooks/src/hooks/useTokenBalance.ts

import { useTokens } from './useTokens';
import type { Token } from '@dromos-labs/sugar-sdk';

export function useTokenBalance(tokenAddress?: string, chainId?: number) {
  const { tokens, ...rest } = useTokens({
    chainId,
    query: {
      select: (tokens) =>
        tokens.find(t =>
          t.address.toLowerCase() === tokenAddress?.toLowerCase() &&
          (!chainId || t.chainId === chainId)
        ),
    },
  });

  return {
    token: tokens[0],
    balance: tokens[0]?.balance ?? 0n,
    ...rest,
  };
}
```

```typescript
// packages/react-hooks/src/hooks/useTokenPrice.ts

import { useTokens } from './useTokens';

export function useTokenPrice(tokenAddress?: string, chainId?: number) {
  const { tokens, ...rest } = useTokens({
    chainId,
    query: {
      select: (tokens) =>
        tokens.find(t =>
          t.address.toLowerCase() === tokenAddress?.toLowerCase() &&
          (!chainId || t.chainId === chainId)
        ),
    },
  });

  return {
    token: tokens[0],
    price: tokens[0]?.price ?? 0n,
    ...rest,
  };
}
```

## Performance Strategies

### 1. Parallel HTTP Requests with React Query

React Query handles parallel requests automatically:

```typescript
function MultiChainView() {
  // These queries run in parallel automatically
  const optimismTokens = useTokens({ chainId: 10 });
  const baseTokens = useTokens({ chainId: 8453 });
  const celoTokens = useTokens({ chainId: 42220 });

  // All three requests execute concurrently
  const isLoading = optimismTokens.isLoading ||
    baseTokens.isLoading ||
    celoTokens.isLoading;

  return (
    <div>
      {isLoading ? 'Loading...' : 'All chains loaded!'}
    </div>
  );
}
```

### 2. Batch Multiple Quotes

For comparing multiple routes or tokens:

```typescript
// packages/react-hooks/src/hooks/useMultipleQuotes.ts

import { useQueries } from '@tanstack/react-query';
import { getQuoteForSwap, type Token } from '@dromos-labs/sugar-sdk';
import { useSugarClient } from '../providers/SugarClientProvider';

export interface QuoteRequest {
  fromToken: Token;
  toToken: Token;
  amountIn: bigint;
}

export function useMultipleQuotes(requests: QuoteRequest[]) {
  const { config } = useSugarClient();

  const results = useQueries({
    queries: requests.map((request) => ({
      queryKey: [
        'sugar',
        'quote',
        {
          from: request.fromToken.address,
          to: request.toToken.address,
          chainId: request.fromToken.chainId,
          amount: request.amountIn.toString(),
        },
      ],
      queryFn: () => getQuoteForSwap({ config, ...request }),
      staleTime: 1000 * 10,
    })),
  });

  return {
    quotes: results.map(r => r.data),
    isLoading: results.some(r => r.isLoading),
    errors: results.map(r => r.error).filter(Boolean),
  };
}
```

**Usage:**

```typescript
function BestRouteSelector() {
  const { tokens } = useTokens();
  const usdc = tokens.find(t => t.symbol === 'USDC' && t.chainId === 10);
  const targets = tokens.filter(t => ['WETH', 'OP', 'USDT'].includes(t.symbol));

  const amount = parseUnits('100', usdc.decimals);

  // Get quotes for all target tokens in parallel
  const { quotes, isLoading } = useMultipleQuotes(
    targets.map(toToken => ({
      fromToken: usdc,
      toToken,
      amountIn: amount,
    }))
  );

  const bestQuote = quotes
    .filter(q => q !== null)
    .reduce((best, current) =>
      current.amountOut > best.amountOut ? current : best
    );

  return <div>Best route: {bestQuote?.toToken.symbol}</div>;
}
```

### 3. Query Deduplication

React Query automatically deduplicates identical requests:

```typescript
function ComponentA() {
  const { tokens } = useTokens({ chainId: 10 });
  // First request to this endpoint
}

function ComponentB() {
  const { tokens } = useTokens({ chainId: 10 });
  // Deduped - uses same request as ComponentA
}

function ComponentC() {
  const { tokens } = useTokens({ chainId: 8453 });
  // Different query key - separate request
}
```

### 4. Prefetching

```typescript
// packages/react-hooks/src/hooks/usePrefetchTokens.ts

import { useQueryClient } from '@tanstack/react-query';
import { getListedTokens } from '@dromos-labs/sugar-sdk';
import { useSugarClient } from '../providers/SugarClientProvider';

export function usePrefetchTokens() {
  const { config } = useSugarClient();
  const queryClient = useQueryClient();

  const prefetchTokens = (chainId?: number) => {
    queryClient.prefetchQuery({
      queryKey: ['sugar', 'tokens', { chainId }],
      queryFn: async () => {
        const tokens = await getListedTokens({ config });
        return chainId
          ? tokens.filter(t => t.chainId === chainId)
          : tokens;
      },
      staleTime: 1000 * 60 * 5,
    });
  };

  return { prefetchTokens };
}
```

**Usage:**

```typescript
function SwapPage() {
  const { prefetchTokens } = usePrefetchTokens();

  // Prefetch on hover
  return (
    <nav>
      <Link
        to="/swap/optimism"
        onMouseEnter={() => prefetchTokens(10)}
      >
        Optimism
      </Link>
    </nav>
  );
}
```

### 5. Optimistic Updates

```typescript
function useOptimisticSwap() {
  const queryClient = useQueryClient();
  const { swap, ...rest } = useSwap({
    onSuccess: (txHash) => {
      // After swap, optimistically update token balances
      queryClient.setQueryData<Token[]>(
        ['sugar', 'tokens'],
        (old) => {
          if (!old) return old;
          // Update balances based on swap
          return old.map(token => {
            // ... optimistically adjust balances
            return token;
          });
        }
      );
    },
  });

  return { swap, ...rest };
}
```

## Testing Strategy

### 1. Unit Testing Hooks

Using `@testing-library/react`:

```typescript
// packages/react-hooks/src/hooks/__tests__/useTokens.test.tsx

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTokens } from '../useTokens';
import { SugarClientProvider } from '../../providers/SugarClientProvider';
import * as sdk from '@dromos-labs/sugar-sdk';

// Mock the SDK
vi.mock('@dromos-labs/sugar-sdk', () => ({
  getListedTokens: vi.fn(),
}));

const mockTokens = [
  {
    chainId: 10,
    address: '0x123',
    symbol: 'USDC',
    decimals: 6,
    balance: 1000000n,
    price: 1000000n,
    listed: true,
  },
  {
    chainId: 10,
    address: '0x456',
    symbol: 'WETH',
    decimals: 18,
    balance: 5000000000000000000n,
    price: 3000000000n,
    listed: true,
  },
];

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const mockConfig = {
    sugarConfig: {},
  } as any;

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <SugarClientProvider config={mockConfig}>
        {children}
      </SugarClientProvider>
    </QueryClientProvider>
  );
}

describe('useTokens', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch and return tokens', async () => {
    vi.mocked(sdk.getListedTokens).mockResolvedValue(mockTokens);

    const { result } = renderHook(() => useTokens(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.tokens).toEqual(mockTokens);
    expect(sdk.getListedTokens).toHaveBeenCalledTimes(1);
  });

  it('should filter tokens by chainId', async () => {
    const multiChainTokens = [
      ...mockTokens,
      { ...mockTokens[0], chainId: 8453 },
    ];

    vi.mocked(sdk.getListedTokens).mockResolvedValue(multiChainTokens);

    const { result } = renderHook(
      () => useTokens({ chainId: 10 }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.tokens).toHaveLength(2);
    expect(result.current.tokens.every(t => t.chainId === 10)).toBe(true);
  });

  it('should filter tokens by symbol', async () => {
    vi.mocked(sdk.getListedTokens).mockResolvedValue(mockTokens);

    const { result } = renderHook(
      () => useTokens({ symbol: 'USD' }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.tokens).toHaveLength(1);
    expect(result.current.tokens[0].symbol).toBe('USDC');
  });

  it('should handle errors', async () => {
    const error = new Error('Network error');
    vi.mocked(sdk.getListedTokens).mockRejectedValue(error);

    const { result } = renderHook(() => useTokens(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.error).toEqual(error);
    });
  });
});
```

### 2. Integration Testing

```typescript
// packages/react-hooks/src/__tests__/integration.test.tsx

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import * as sdk from '@dromos-labs/sugar-sdk';
import { TestProviders } from './test-utils';

vi.mock('@dromos-labs/sugar-sdk');

function SwapComponent() {
  const { tokens } = useTokens();
  const [fromToken, setFromToken] = useState(tokens[0]);
  const [toToken, setToToken] = useState(tokens[1]);
  const [amount, setAmount] = useState('100');

  const amountIn = useMemo(
    () => fromToken ? parseUnits(amount, fromToken.decimals) : undefined,
    [amount, fromToken]
  );

  const { quote, isLoading } = useSwapQuote({
    fromToken,
    toToken,
    amountIn,
  });

  const { swap } = useSwap();

  return (
    <div>
      <input
        data-testid="amount-input"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      {isLoading && <div>Loading quote...</div>}
      {quote && <div data-testid="quote-output">{quote.amountOut.toString()}</div>}
      <button
        onClick={() => quote && swap({ quote })}
        disabled={!quote}
      >
        Swap
      </button>
    </div>
  );
}

describe('Swap Integration', () => {
  it('should fetch quote and execute swap', async () => {
    const mockQuote = {
      amountOut: 3000000000000000000n,
      fromToken: mockTokens[0],
      toToken: mockTokens[1],
      priceImpact: 50n,
    };

    vi.mocked(sdk.getListedTokens).mockResolvedValue(mockTokens);
    vi.mocked(sdk.getQuoteForSwap).mockResolvedValue(mockQuote);
    vi.mocked(sdk.swap).mockResolvedValue('0xabc123');

    render(
      <TestProviders>
        <SwapComponent />
      </TestProviders>
    );

    // Wait for tokens to load
    await waitFor(() => {
      expect(screen.queryByText('Loading quote...')).not.toBeInTheDocument();
    });

    // Quote should be displayed
    expect(screen.getByTestId('quote-output')).toHaveTextContent('3000000000000000000');

    // Click swap button
    const swapButton = screen.getByText('Swap');
    await userEvent.click(swapButton);

    await waitFor(() => {
      expect(sdk.swap).toHaveBeenCalledWith(
        expect.objectContaining({ quote: mockQuote })
      );
    });
  });
});
```

### 3. Test Utilities

```typescript
// packages/react-hooks/src/__tests__/test-utils.tsx

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { optimism } from 'wagmi/chains';
import { SugarClientProvider } from '../providers/SugarClientProvider';

export function createTestConfig() {
  return createConfig({
    chains: [optimism],
    transports: {
      [optimism.id]: http(),
    },
  }) as any;
}

export function TestProviders({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const config = createTestConfig();

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <SugarClientProvider config={config}>
          {children}
        </SugarClientProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

### 4. Mock Service Worker (MSW) for API Mocking

```typescript
// packages/react-hooks/src/__tests__/mocks/handlers.ts

import { http, HttpResponse } from 'msw';

export const handlers = [
  // Mock blockchain RPC calls
  http.post('https://mainnet.optimism.io', async ({ request }) => {
    const body = await request.json();

    // Mock contract read calls
    if (body.method === 'eth_call') {
      return HttpResponse.json({
        jsonrpc: '2.0',
        id: body.id,
        result: '0x0000000000000000000000000000000000000000000000000000000000000001',
      });
    }

    return HttpResponse.json({
      jsonrpc: '2.0',
      id: body.id,
      result: null,
    });
  }),
];
```

### 5. Testing Coverage Requirements

```json
// packages/react-hooks/vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/__tests__/',
        '**/*.test.{ts,tsx}',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
```

## Package Structure

```
packages/react-hooks/
├── src/
│   ├── index.ts                      # Main exports
│   ├── providers/
│   │   ├── SugarClientProvider.tsx
│   │   └── index.ts
│   ├── hooks/
│   │   ├── useTokens.ts
│   │   ├── useSwapQuote.ts
│   │   ├── useSwap.ts
│   │   ├── useApprove.ts
│   │   ├── useAllowance.ts
│   │   ├── useTokenBalance.ts
│   │   ├── useTokenPrice.ts
│   │   ├── useMultipleQuotes.ts
│   │   ├── usePrefetchTokens.ts
│   │   └── index.ts
│   ├── utils/
│   │   ├── queryKeys.ts              # Query key factory
│   │   ├── formatters.ts             # Token/amount formatters
│   │   └── index.ts
│   └── __tests__/
│       ├── setup.ts
│       ├── test-utils.tsx
│       ├── integration.test.tsx
│       └── mocks/
│           └── handlers.ts
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

## Query Key Strategy

Centralized query key factory for consistency:

```typescript
// packages/react-hooks/src/utils/queryKeys.ts

export const sugarQueryKeys = {
  all: ['sugar'] as const,

  tokens: () => [...sugarQueryKeys.all, 'tokens'] as const,
  tokensByChain: (chainId?: number) =>
    [...sugarQueryKeys.tokens(), { chainId }] as const,
  tokensFiltered: (filters: {
    chainId?: number;
    symbol?: string;
    withBalanceOnly?: boolean;
  }) => [...sugarQueryKeys.tokens(), filters] as const,

  quotes: () => [...sugarQueryKeys.all, 'quote'] as const,
  quote: (params: {
    from?: string;
    to?: string;
    chainId?: number;
    amount?: string;
  }) => [...sugarQueryKeys.quotes(), params] as const,

  allowance: (tokenAddress?: string, owner?: string, spender?: string) =>
    ['allowance', tokenAddress, owner, spender] as const,
};
```

## Advanced Patterns

### 1. Infinite Scroll for Large Token Lists

```typescript
export function useInfiniteTokens(options: { chainId?: number } = {}) {
  const { config } = useSugarClient();

  return useInfiniteQuery({
    queryKey: sugarQueryKeys.tokensByChain(options.chainId),
    queryFn: async ({ pageParam = 0 }) => {
      const tokens = await getListedTokens({ config });
      const filtered = options.chainId
        ? tokens.filter(t => t.chainId === options.chainId)
        : tokens;

      const pageSize = 50;
      const start = pageParam * pageSize;
      const end = start + pageSize;

      return {
        tokens: filtered.slice(start, end),
        nextPage: end < filtered.length ? pageParam + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });
}
```

### 2. Suspense Support

```typescript
export function useTokensSuspense(options: UseTokensOptions = {}) {
  const { config } = useSugarClient();

  const result = useSuspenseQuery({
    queryKey: sugarQueryKeys.tokensFiltered(options),
    queryFn: async () => {
      const tokens = await getListedTokens({ config });
      // Apply filters...
      return tokens;
    },
  });

  return {
    tokens: result.data,
  };
}
```

### 3. Real-time Price Updates with Polling

```typescript
export function useTokensWithLivePrices(options: UseTokensOptions = {}) {
  return useTokens({
    ...options,
    query: {
      ...options.query,
      refetchInterval: 10000, // Refetch every 10 seconds
      refetchIntervalInBackground: true,
    },
  });
}
```

## TypeScript Configuration

```json
// packages/react-hooks/tsconfig.json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.test.tsx"]
}
```

## Complete Example Application

```typescript
// example/App.tsx

import { useState, useMemo } from 'react';
import { formatUnits, parseUnits } from 'viem';
import {
  useTokens,
  useSwapQuote,
  useSwap,
  useAllowance,
  useApprove,
} from '@dromos-labs/react-hooks';

export function SwapApp() {
  const { tokens, isLoading: loadingTokens } = useTokens({ chainId: 10 });

  const [fromSymbol, setFromSymbol] = useState('USDC');
  const [toSymbol, setToSymbol] = useState('WETH');
  const [amount, setAmount] = useState('100');

  const fromToken = tokens.find(t => t.symbol === fromSymbol);
  const toToken = tokens.find(t => t.symbol === toSymbol);

  const amountIn = useMemo(() => {
    try {
      return fromToken ? parseUnits(amount, fromToken.decimals) : undefined;
    } catch {
      return undefined;
    }
  }, [amount, fromToken]);

  const { quote, isLoading: loadingQuote } = useSwapQuote({
    fromToken,
    toToken,
    amountIn,
  });

  const { allowance, needsApproval } = useAllowance(
    fromToken,
    quote?.spenderAddress,
    amountIn
  );

  const { approve, isLoading: isApproving } = useApprove({
    onSuccess: () => alert('Approval confirmed!'),
  });

  const { swap, isLoading: isSwapping, txHash } = useSwap({
    onSuccess: () => alert('Swap confirmed!'),
  });

  if (loadingTokens) {
    return <div>Loading tokens...</div>;
  }

  return (
    <div className="swap-container">
      <h1>Sugar Swap</h1>

      <div className="input-section">
        <select
          value={fromSymbol}
          onChange={e => setFromSymbol(e.target.value)}
        >
          {tokens.map(t => (
            <option key={t.address} value={t.symbol}>
              {t.symbol}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="Amount"
        />

        <div>
          Balance: {fromToken && formatUnits(fromToken.balance, fromToken.decimals)}
        </div>
      </div>

      <button onClick={() => {
        const temp = fromSymbol;
        setFromSymbol(toSymbol);
        setToSymbol(temp);
      }}>
        ↓
      </button>

      <div className="output-section">
        <select
          value={toSymbol}
          onChange={e => setToSymbol(e.target.value)}
        >
          {tokens.map(t => (
            <option key={t.address} value={t.symbol}>
              {t.symbol}
            </option>
          ))}
        </select>

        <div>
          {loadingQuote && 'Loading quote...'}
          {quote && (
            <>
              <div>
                You'll receive: {formatUnits(quote.amountOut, toToken.decimals)} {toSymbol}
              </div>
              <div>
                Price impact: {formatUnits(quote.priceImpact, 2)}%
              </div>
            </>
          )}
        </div>
      </div>

      <div className="action-section">
        {needsApproval && (
          <button
            onClick={() => fromToken && quote && approve({
              token: fromToken,
              spender: quote.spenderAddress,
              amount: amountIn!,
            })}
            disabled={isApproving}
          >
            {isApproving ? 'Approving...' : `Approve ${fromSymbol}`}
          </button>
        )}

        {!needsApproval && (
          <button
            onClick={() => quote && swap({ quote, slippage: 0.01 })}
            disabled={!quote || isSwapping}
          >
            {isSwapping ? 'Swapping...' : 'Swap'}
          </button>
        )}

        {txHash && (
          <div>
            <a
              href={`https://optimistic.etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View transaction
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
```

## Summary

This design provides a comprehensive React hooks library for the Sugar SDK with the following key features:

1. **Seamless Integration**: Works with existing wagmi and React Query providers
2. **Performance**: Leverages React Query's automatic deduplication, caching, and parallel query execution
3. **Type Safety**: Full TypeScript support with proper inference
4. **Developer Experience**: Simple, intuitive API that follows React patterns
5. **Testability**: Comprehensive testing strategy covering all layers
6. **Flexibility**: Supports various use cases from simple to advanced

The library achieves high-performance parallel HTTP calls through React Query's built-in capabilities:
- Automatic request deduplication
- Parallel query execution via `useQueries`
- Configurable batching and concurrency at the SDK level
- Query key-based caching and invalidation

All components are thoroughly testable using standard React testing tools, with clear separation between hooks, providers, and business logic.
