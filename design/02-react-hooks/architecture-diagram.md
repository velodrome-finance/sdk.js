# React Hooks Library - High-Level Architecture

## Main Architecture Diagram

```mermaid
flowchart TB
    subgraph APP["Application Layer"]
        ReactApp[React Application]
        Components[React Components]
    end

    subgraph PROVIDERS["Provider Layer"]
        WagmiProv["WagmiProvider (wagmi)"]
        QueryProv["QueryClientProvider (@tanstack/react-query)"]
        SugarProv["SugarClientProvider (Sugar SDK Config)"]
    end

    subgraph HOOKS["Hook Layer"]
        subgraph DATA["Data Hooks"]
            useTokens["useTokens - Token listings & balances"]
            usePools["usePools - Pool information"]
            useQuote["useSwapQuote - Quote fetching"]
            useAllowance["useAllowance - ERC20 allowance"]
        end

        subgraph ACTIONS["Action Hooks"]
            useSwap["useSwap - Execute swaps"]
            useApprove["useApprove - Token approvals"]
        end

        subgraph UTILS["Utility Hooks"]
            useBalance["useTokenBalance - Single token balance"]
            usePrice["useTokenPrice - Token pricing"]
            useMultiQuote["useMultipleQuotes - Parallel quotes"]
        end
    end

    subgraph CORE["Core Layer"]
        SugarClient["SugarClient Facade (Concurrency Control)"]
        QueryKeys["Query Key Factory (Cache Management)"]
        Context["React Context (Sugar | Query | Wagmi)"]
    end

    subgraph SDK["SDK Layer"]
        SugarSDK["@dromos-labs/sugar-sdk (Low-level API calls)"]
        Viem["viem (Blockchain interactions)"]
    end

    subgraph EXTERNAL["External Dependencies"]
        ReactQuery["@tanstack/react-query<br/>- Data fetching & caching<br/>- Parallel execution<br/>- Request deduplication"]
        WagmiLib["wagmi<br/>- Wallet connections<br/>- Transaction tracking<br/>- Chain management"]
    end

    ReactApp --> Components
    Components --> useTokens
    Components --> usePools
    Components --> useQuote
    Components --> useSwap
    Components --> useApprove
    Components --> useAllowance

    WagmiProv -.->|wraps| QueryProv
    QueryProv -.->|wraps| SugarProv
    SugarProv --> Context

    useTokens --> Context
    usePools --> Context
    useQuote --> Context
    useSwap --> Context
    useApprove --> Context
    useAllowance --> WagmiLib
    useBalance --> useTokens
    usePrice --> useTokens
    useMultiQuote --> Context

    Context --> SugarClient
    Context --> QueryKeys
    SugarClient --> SugarSDK
    SugarSDK --> Viem

    QueryProv --> ReactQuery
    WagmiProv --> WagmiLib

    useTokens --> ReactQuery
    usePools --> ReactQuery
    useQuote --> ReactQuery
    useSwap --> ReactQuery
    useApprove --> ReactQuery
    QueryKeys --> ReactQuery

    style ReactApp fill:#e1f5ff
    style SugarProv fill:#ffe1e1
    style ReactQuery fill:#fff3e1
    style WagmiLib fill:#e1ffe1
    style SugarSDK fill:#f0e1ff
    style SugarClient fill:#ffe1f5
    style useTokens fill:#d4edff,stroke:#0066cc
    style usePools fill:#d4edff,stroke:#0066cc
    style useQuote fill:#d4edff,stroke:#0066cc
    style useSwap fill:#d4edff,stroke:#0066cc
    style useApprove fill:#d4edff,stroke:#0066cc
    style useAllowance fill:#d4edff,stroke:#0066cc
    style useBalance fill:#d4edff,stroke:#0066cc
    style usePrice fill:#d4edff,stroke:#0066cc
    style useMultiQuote fill:#d4edff,stroke:#0066cc
```

## Key Design Principles

### 1. **Provider Integration**
- Detects existing `WagmiProvider` and `QueryClientProvider` in component tree
- Creates missing providers automatically if not present
- Enables flexible integration with existing React applications

### 2. **Performance Optimization**
- **React Query Features:**
  - Automatic request deduplication (same query keys = single request)
  - Parallel query execution via `useQueries`
  - Configurable caching strategies (`staleTime`, `gcTime`)
  - Background refetching and invalidation
- **Concurrency Control:**
  - `SugarClient` facade with `p-limit` for controlled parallelization
  - Batch quote fetching with `useMultipleQuotes`
  - Prefetching capabilities for navigation optimization

### 3. **Data Flow Pattern**

```mermaid
sequenceDiagram
    participant C as Component
    participant H as Hook
    participant RQ as React Query
    participant SC as SugarClient
    participant SDK as Sugar SDK
    participant BC as Blockchain

    C->>H: useTokens()
    H->>RQ: useQuery with queryKey and queryFn
    RQ->>RQ: Check cache
    alt Cache Hit
        RQ-->>H: Return cached data
    else Cache Miss
        RQ->>SC: tokens with filters
        SC->>SDK: getListedTokens with params
        SDK->>BC: RPC calls
        BC-->>SDK: Token data
        SDK-->>SC: Formatted tokens
        SC-->>RQ: Results
        RQ->>RQ: Store in cache
        RQ-->>H: Return data
    end
    H-->>C: tokens, isLoading, error
```

### 4. **Testing Architecture**

```mermaid
flowchart LR
    L1["Layer 1: Helpers<br/>queryKeys, selectors<br/>vitest"]
    L2["Layer 2: SugarClient<br/>Concurrency logic<br/>vitest + mocks"]
    L3["Layer 3: Hooks<br/>Loading states<br/>@testing-library/react"]
    L4["Layer 4: Providers<br/>Integration testing<br/>React Testing Library"]
    L5["Layer 5: E2E<br/>Full app flow<br/>MSW for API mocking"]

    L1 --> L2 --> L3 --> L4 --> L5

    style L1 fill:#e3f2fd
    style L2 fill:#e8f5e9
    style L3 fill:#fff3e0
    style L4 fill:#fce4ec
    style L5 fill:#f3e5f5
```

### 5. **Hook Categories**

| Category | Hooks | Purpose | Query Type |
|----------|-------|---------|------------|
| **Data Fetching** | `useTokens`, `usePools` | Read blockchain state | `useQuery` |
| **Quote Management** | `useSwapQuote`, `useMultipleQuotes` | Get swap quotes | `useQuery` with short staleTime |
| **Transactions** | `useSwap`, `useApprove` | Execute blockchain transactions | `useMutation` |
| **State Checking** | `useAllowance`, `useTokenBalance` | Check allowances & balances | `useQuery` or derived from `useTokens` |
| **Utilities** | `usePrefetchTokens` | Performance optimization | Imperative prefetch |

### 6. **Parallel Execution Strategy**

```mermaid
flowchart TB
    C["Component renders"]
    Q1["useTokens chainId: 10"]
    Q2["useTokens chainId: 8453"]
    Q3["useTokens chainId: 42220"]
    RQ["React Query"]
    Cache["Query Cache"]
    Limiter["p-limit: 8 concurrent"]
    API1["Sugar SDK Call 1"]
    API2["Sugar SDK Call 2"]
    API3["Sugar SDK Call 3"]
    BC1["Blockchain RPC 1"]
    BC2["Blockchain RPC 2"]
    BC3["Blockchain RPC 3"]

    C --> Q1
    C --> Q2
    C --> Q3

    Q1 --> RQ
    Q2 --> RQ
    Q3 --> RQ

    RQ --> Cache
    RQ --> Limiter

    Limiter --> API1
    Limiter --> API2
    Limiter --> API3

    API1 --> BC1
    API2 --> BC2
    API3 --> BC3

    style C fill:#e1f5ff
    style RQ fill:#fff3e1
    style Cache fill:#e8f5e9
    style Limiter fill:#ffe1e1
```

### 7. **Cache Invalidation Flow**

```mermaid
sequenceDiagram
    participant U as User
    participant C as Component
    participant HS as useSwap Hook
    participant RQ as React Query
    participant BC as Blockchain

    U->>C: Click Swap button
    C->>HS: swap with quote and slippage
    HS->>BC: Execute transaction
    BC-->>HS: Transaction hash
    HS->>U: onTransactionSent callback
    HS->>BC: Wait for receipt
    BC-->>HS: Transaction confirmed
    HS->>RQ: invalidateQueries for sugar and tokens
    RQ->>RQ: Mark all token queries as stale
    RQ->>RQ: Trigger background refetch
    RQ-->>C: Updated data
    HS->>U: onSuccess callback
```

## Implementation Priorities

1. **Phase 1: Foundation**
   - `SugarClientProvider` with provider detection
   - `SugarClient` facade with concurrency control
   - Context setup and helper hooks

2. **Phase 2: Core Hooks**
   - `useTokens` with filtering and caching
   - `useSwapQuote` with debouncing
   - `useAllowance` for approval checks

3. **Phase 3: Transaction Hooks**
   - `useApprove` with transaction tracking
   - `useSwap` with state management
   - Cache invalidation strategy

4. **Phase 4: Performance**
   - `useMultipleQuotes` for parallel quotes
   - Prefetching utilities
   - Optimistic updates

5. **Phase 5: Testing & Polish**
   - Comprehensive test suite
   - Example applications
   - Performance benchmarking
