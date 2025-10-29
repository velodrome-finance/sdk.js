# React Hooks Layer – Implementation Sketch

## Objectives
- Deliver an idiomatic React package `@dromos-labs/react-hooks` that wraps the low-level Sugar SDK with hooks and providers.
- Compose cleanly with existing `@tanstack/react-query` and `wagmi` providers while remaining usable standalone.
- Offer a path for high-volume, parallel Sugar API execution with cache-aware data access.
- Define a testing story that spans helper utilities, hooks, and provider wiring.

## Package Shape

```
packages/react-hooks/
├── package.json
├── src/
│   ├── SugarClient.ts
│   ├── context.tsx
│   ├── providers/
│   │   ├── SugarClientProvider.tsx
│   │   └── InternalSugarProvider.tsx
│   ├── hooks/
│   │   ├── useTokens.ts
│   │   ├── usePools.ts
│   │   ├── useSwapQuote.ts
│   │   ├── useApproval.ts
│   │   └── index.ts
│   ├── helpers/
│   │   ├── queryKeys.ts
│   │   ├── selectors.ts
│   │   └── scheduler.ts
│   └── index.ts
└── tests/...
```

### Dependency Strategy
- `peerDependencies`: `react`, `react-dom`, `@tanstack/react-query`, `wagmi`, `@dromos-labs/sdk.js`.
- `dependencies`: very small surface; consider `p-limit` for concurrency control and `zustand` only if local state becomes complex (avoid by default).
- `devDependencies`: `@testing-library/react`, `@testing-library/react-hooks`, `viem`, `vitest`, `msw` for network fakes.

## Core Concepts

### SugarClient Facade
Wrap the Sugar SDK config and expose high-level methods that mirror hook concerns. Keeps hook code minimal, improves testability, and centralizes concurrency logic.

```ts
// packages/react-hooks/src/SugarClient.ts
import { getListedTokens, getQuoteForSwap, approve, swap } from "@dromos-labs/sdk.js";
import type { BaseParams, Quote } from "@dromos-labs/sdk.js";
import pLimit from "p-limit";

export interface SugarClientOptions extends BaseParams {
  concurrency?: number;
}

export class SugarClient {
  private readonly params: BaseParams;
  private readonly limit: <T>(fn: () => Promise<T>) => Promise<T>;

  constructor({ concurrency = 8, ...params }: SugarClientOptions) {
    this.params = params;
    this.limit = pLimit(concurrency);
  }

  tokens(filters?: { chainIds?: number[] }) {
    return this.limit(() => getListedTokens(this.params).then((tokens) => {
      if (!filters?.chainIds?.length) return tokens;
      return tokens.filter((tok) => filters.chainIds!.includes(tok.chainId));
    }));
  }

  quote(args: Parameters<typeof getQuoteForSwap>[0]) {
    return this.limit(() => getQuoteForSwap({ ...args, ...this.params }));
  }

  // approval, swap, etc. delegate similarly
}
```

Hooks consume `SugarClient` via context, which lets upstream apps either reuse a singleton or provide custom subclasses (for instrumentation, logging, etc.).

### Context Contract
Expose three pieces of context:
1. `SugarClientContext` – required entry point.
2. `QueryClientContext` – re-export of React Query client (handy in tests).
3. `WagmiConfigContext` – points at the wagmi config used by Sugar.

`context.tsx` should export `useSugarClient()`, `useQueryClientOrThrow()`, `useWagmiConfigOrThrow()` helpers that surface consistent error messages.

## Provider Design

### SugarClientProvider
Coordinates bootstrapping while respecting existing providers. It accepts optional externally created clients; otherwise falls back to sensible defaults.

```tsx
// packages/react-hooks/src/providers/SugarClientProvider.tsx
import { ReactNode, useMemo } from "react";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { WagmiProvider, useConfig as useWagmiConfig } from "wagmi";
import { SugarClient, SugarClientOptions } from "../SugarClient";
import { SugarClientContext } from "../context";

export interface SugarClientProviderProps extends SugarClientOptions {
  children: ReactNode;
  client?: SugarClient;
  queryClient?: QueryClient;
  wagmiConfig?: ReturnType<typeof useWagmiConfig>;
  hydrate?: boolean;
}

export function SugarClientProvider({
  client,
  queryClient,
  wagmiConfig,
  children,
  ...options
}: SugarClientProviderProps) {
  // Detect parent providers; hooks throw if absent.
  const upstreamQueryClient = safeUseQueryClient();
  const upstreamWagmiConfig = safeUseWagmiConfig();

  const value = useMemo(
    () => client ?? new SugarClient(options),
    [client, options.config]
  );

  const renderWithQuery = (content: ReactNode) =>
    upstreamQueryClient
      ? content
      : (
        <QueryClientProvider client={queryClient ?? new QueryClient()}>
          {content}
        </QueryClientProvider>
      );

  const renderWithWagmi = (content: ReactNode) =>
    upstreamWagmiConfig
      ? content
      : (
        <WagmiProvider config={wagmiConfig ?? options.config}>
          {content}
        </WagmiProvider>
      );

  return renderWithQuery(
    renderWithWagmi(
      <SugarClientContext.Provider value={value}>
        {children}
      </SugarClientContext.Provider>
    )
  );
}
```

Helper hooks `safeUseQueryClient` and `safeUseWagmiConfig` catch the errors React Query and wagmi throw when a provider is missing. This enables “attach if missing” behavior without suppressing developer mistakes.

### Example Integration

```tsx
const queryClient = new QueryClient();
const sugarConfig = getDefaultConfig({ chains: [{ chain: base, rpcUrl: env.BASE }] });
const sugarClient = new SugarClient({ config: sugarConfig });

root.render(
  <WagmiProvider config={sugarConfig}>
    <QueryClientProvider client={queryClient}>
      <SugarClientProvider client={sugarClient}>
        <App />
      </SugarClientProvider>
    </QueryClientProvider>
  </WagmiProvider>
);
```

If the host app already wraps with `WagmiProvider` or `QueryClientProvider`, our provider slots into the tree without duplicating providers.

## Hook Surface

### `useTokens`

```ts
// packages/react-hooks/src/hooks/useTokens.ts
import { useQuery } from "@tanstack/react-query";
import { useSugarClient } from "../context";
import { tokensKey } from "../helpers/queryKeys";

export interface UseTokensArgs {
  chainIds?: number[];
  select?: (tokens: Token[]) => Token[];
}

export function useTokens({ chainIds, select }: UseTokensArgs = {}) {
  const sugar = useSugarClient();
  return useQuery({
    queryKey: tokensKey({ chainIds }),
    queryFn: () => sugar.tokens({ chainIds }),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    select,
  });
}
```

### `usePools`
Wraps `getPoolsPagination` and related primitives. We can expose an infinite query plus prefetch helpers for popular pool categories.

### `useSwapQuote`
Uses `useQuery` with request deduping and integrates with wallet state via wagmi hooks (`useAccount`, `useBalance`). It can accept a `debounceMs` option implemented via `scheduler.ts` to avoid firing the query until input stabilizes.

### `useApprove` + `useSwap`
Mutations that coordinate with React Query to invalidate dependent caches.

```ts
export function useSwap() {
  const sugar = useSugarClient();
  const queryClient = useQueryClientOrThrow();
  return useMutation({
    mutationFn: sugar.swap,
    onSuccess: (_, { chainIds }) => {
      queryClient.invalidateQueries(tokensKey({ chainIds }));
      queryClient.invalidateQueries(poolsKey());
    },
  });
}
```

### Parallel Fetching Patterns
- `useQueries` for fetching token balances from multiple chains in parallel while sharing the concurrency limiter.
- `queryClient.ensureQueryData` for preloading during navigation (SSR / RSC).
- Provide small utilities like `prefetchTokens` and `prefetchSwapQuote` for imperative usage inside routing frameworks.

## High-Performance Execution
- `SugarClient` centralizes concurrency via `p-limit`, allowing us to experiment with per-environment limits or even `navigator.hardwareConcurrency`.
- React Query already deduplicates requests by key; we layer on `notifyOnChangeProps` and `staleTime` tuning to minimize re-renders.
- For streaming updates, leverage wagmi’s on-chain subscriptions (`watchReadContract`, `watchAccount`) to invalidate queries rather than refetching on intervals.
- Support batch refetch with `queryClient.refetchQueries({ predicate })` triggered by events (e.g., swap completion, wallet change).

## Testing Strategy

| Layer | Tooling | Focus |
| --- | --- | --- |
| Helpers (`scheduler`, `queryKeys`) | `vitest` | Deterministic behavior, edge cases |
| SugarClient facade | `vitest`, stubbed Sugar SDK methods | Concurrency handling, error propagation |
| Hooks | `@testing-library/react`, `renderHook`, `msw` | Loading/error states, refetch triggers |
| Providers | React Testing Library | Composition with/without upstream providers |
| Integration | Example app inside `tests/integration` | Ensures hooks work together with mocked RPC |

CI should run `npm run test -- --runInBand` within the package plus lint/typecheck via repo tooling. Use `msw` to fake Sugar HTTP endpoints, ensuring deterministic parallel request handling in tests.

## Next Steps
1. Scaffold `packages/react-hooks` with workspace wiring and baseline config (tsconfig, eslint, vitest).
2. Implement `SugarClient` plus provider/context layers.
3. Port the first hook (`useTokens`) to validate patterns.
4. Expand hook coverage (`usePools`, `useSwap`, `useApproval`) and add prefetch/SSR helpers.
5. Backfill tests and story-based demos (React examples in `packages/demo-node` or a new `packages/demo-react`).
6. Evaluate performance under load using mocked responses and adjust concurrency defaults.
