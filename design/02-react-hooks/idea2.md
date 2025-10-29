
# Implementation Ideas for @dromos-labs/react-hooks

This document outlines the implementation plan for the `@dromos-labs/react-hooks` library, which will provide a set of React hooks for interacting with the Sugar SDK.

## 1. Project Setup and Dependencies

We will create a new package within the `packages` directory called `react-hooks`.

**`packages/react-hooks/package.json`:**

```json
{
  "name": "@dromos-labs/react-hooks",
  "version": "0.1.0",
  "private": true,
  "main": "dist/index.js",
  "module": "dist/index.mjs",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts",
    "dev": "tsup src/index.ts --format cjs,esm --dts --watch",
    "test": "vitest"
  },
  "peerDependencies": {
    "@tanstack/react-query": "^5.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "wagmi": "^2.5.0"
  },
  "dependencies": {
    "@dromos-labs/sugar-sdk": "workspace:*"
  },
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@types/react": "^18.2.0",
    "tsup": "^8.0.0",
    "typescript": "^5.3.0",
    "vitest": "^1.0.0"
  }
}
```

## 2. Architecture and Provider Setup

### `SugarClient`

We will create a `SugarClient` class that wraps the `sugar-sdk` configuration and provides methods for API interaction.

**`packages/react-hooks/src/client.ts`:**

```typescript
import { Sugar, SugarConfiguration } from '''@dromos-labs/sugar-sdk''';

export class SugarClient {
  public sdk: Sugar;

  constructor(config: SugarConfiguration) {
    this.sdk = new Sugar(config);
  }

  async getTokens(params?: any) {
    return this.sdk.getTokens(params);
  }

  // ... other methods
}
```

### `SugarClientProvider`

The provider will make the `SugarClient` instance available via React context. It will also handle the integration with `react-query` and `wagmi`.

**`packages/react-hooks/src/provider.tsx`:**

```tsx
import { QueryClient, QueryClientProvider, useQueryClient } from '''@tanstack/react-query''';
import React, { createContext, useContext, useMemo } from '''react''';
import { WagmiProvider, useWagmi } from '''wagmi''';
import { SugarClient } from '''./client''';

const SugarClientContext = createContext<SugarClient | null>(null);

export const useSugar = () => {
  const context = useContext(SugarClientContext);
  if (!context) {
    throw new Error('''useSugar must be used within a SugarClientProvider''');
  }
  return context;
};

interface SugarClientProviderProps {
  client: SugarClient;
  children: React.ReactNode;
}

export const SugarClientProvider = ({ client, children }: SugarClientProviderProps) => {
  const queryClient = useQueryClient(); // From parent provider?
  const wagmi = useWagmi(); // From parent provider?

  const app = useMemo(() => {
    if (queryClient && wagmi) {
      return <>{children}</>;
    }

    const newQueryClient = new QueryClient();
    return (
      <WagmiProvider config={client.sdk.config.wagmiConfig}>
        <QueryClientProvider client={newQueryClient}>
            {children}
        </QueryClientProvider>
      </WagmiProvider>
    );
  }, [children, client, queryClient, wagmi]);

  return (
    <SugarClientContext.Provider value={client}>
      {app}
    </SugarClientContext.Provider>
  );
};
```

This setup ensures that if `SugarClientProvider` is wrapped in existing `QueryClientProvider` and `WagmiProvider`, it will use them. Otherwise, it will create its own.

## 3. Hook Implementation

Hooks will use `useSugar()` to get the client and `useQuery` for data fetching.

**`packages/react-hooks/src/hooks/useTokens.ts`:**

```typescript
import { useQuery } from '''@tanstack/react-query''';
import { useSugar } from '''../provider''';

export const useTokens = (params?: any) => {
  const sugar = useSugar();

  return useQuery({
    queryKey: ['''tokens''', params],
    queryFn: () => sugar.getTokens(params),
  });
};
```

## 4. Performance and Parallel Queries

`react-query` provides the `useQueries` hook, which is ideal for fetching multiple queries in parallel. We can use this to build more complex hooks.

**Example: `useTokenPrices`**

```typescript
import { useQueries } from '''@tanstack/react-query''';
import { useSugar } from '''../provider''';

export const useTokenPrices = (tokenIds: string[]) => {
  const sugar = useSugar();

  return useQueries({
    queries: tokenIds.map(id => ({
      queryKey: ['''tokenPrice''', id],
      queryFn: () => sugar.getTokenPrice(id),
    })),
  });
};
```

This will execute all `getTokenPrice` calls in parallel, significantly improving performance for bulk data fetching.

## 5. Testing Strategy

We will adopt a multi-layered testing approach:

*   **Unit Tests (Vitest):** For utility functions and helpers. We will use mocking for external dependencies.
*   **Hook Tests (`@testing-library/react`):** We will test hooks in isolation by creating a wrapper component that provides the necessary context (`SugarClientProvider`, `QueryClientProvider`).

    **`packages/react-hooks/src/hooks/useTokens.test.ts`:**

    ```tsx
    import { renderHook, waitFor } from '''@testing-library/react''';
    import { SugarClient } from '''../client''';
    import { SugarClientProvider } from '''../provider''';
    import { useTokens } from '''./useTokens''';
    import React from '''react''';

    const mockClient = new SugarClient({ /* mock config */ });
    mockClient.getTokens = vi.fn().mockResolvedValue([{ id: '''TOKEN1''' }]);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SugarClientProvider client={mockClient}>{children}</SugarClientProvider>
    );

    test('''should return tokens''', async () => {
      const { result } = renderHook(() => useTokens(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual([{ id: '''TOKEN1''' }]);
    });
    ```

*   **Integration Tests:** We can create a small example app within the monorepo (or use `demo-web`) to test the library in a real-world scenario.

## 6. Proposed Directory Structure

```
packages/react-hooks/
├── src/
│   ├── client.ts
│   ├── provider.tsx
│   ├── hooks/
│   │   ├── useTokens.ts
│   │   └── index.ts
│   └── index.ts
├── tests/
│   └── hooks/
│       └── useTokens.test.ts
├── package.json
├── tsconfig.json
└── vitest.config.ts
```
