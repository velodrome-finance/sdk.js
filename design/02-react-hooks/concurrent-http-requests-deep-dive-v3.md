# Deep Dive v3: Managing Hundreds of Concurrent HTTP Requests in React

## Executive Summary
- Browser transport limits still gate throughput—assume ~6 connections per origin on HTTP/1.1 and validate the HTTP/2 or HTTP/3 stream budgets your backend actually exposes.
- Keep request pressure intentional: pool or rate limit concurrent fetches, wire in cancellation, and surface progress so the UI stays responsive.
- In React, lean on data-fetching hooks (TanStack Query, SWR) for the heavy lifting, and fall back to custom hooks when you need bespoke concurrency semantics.

---

## 1. Transport Constraints You Cannot Pretend Away

### HTTP/1.1
- Browsers cap concurrent TCP connections per origin at roughly 6 (`fetch` calls beyond that queue) and handshake costs stack up.
- Legacy mitigations like domain sharding or inlined assets now complicate caching and HTTPS; reserve them only for true edge cases.

### HTTP/2
- Requests share a single TCP connection through multiplexed streams. The `SETTINGS_MAX_CONCURRENT_STREAMS` limit is server-controlled—most CDNs expose 100–256, but lower ceilings are legal, so test against your production edge before assuming capacity.
- Head-of-line blocking still exists at the TCP layer: one lost packet can stall every in-flight stream. Keep bursts modest if latency matters.

### HTTP/3 / QUIC
- QUIC multiplexes at the transport layer and removes TCP head-of-line blocking. Adoption is growing (Chrome, Edge, Safari, Firefox) but still depends on server support and load-balancer upgrades.
- Expect different fallback behavior per browser: always profile HTTP/2 and HTTP/3 paths separately when you enable both.

### Cross-Origin Overhead
- CORS preflight requests count against concurrency budgets. Batch operations that share headers or methods to minimize preflight amplification.

---

## 2. Decide on a Concurrency Budget Up Front

1. **Collect constraints**: Rate-limit headers, SLA targets, and peak throughput goals from your backend teams.
2. **Baseline production**: Measure how many parallel requests the real edge allows (e.g., Lighthouse traces, `chrome://net-export`, custom telemetry).
3. **Pick a starting pool**: Begin around 25–50 requests for large fan-outs; step down if latency spikes or servers throttle.
4. **Expose overrides**: Make batch sizes and concurrency configurable so ops can tune without a redeploy.

---

## 3. JavaScript Concurrency Patterns

### 3.1 Pooling With `p-limit`

Keep a fixed number of active fetches for maximal throughput without spikes.

```js
import pLimit from 'p-limit';

export async function fetchAll(urls, { concurrency = 32, parser = r => r.json() } = {}) {
  const limit = pLimit(concurrency);

  const tasks = urls.map(url =>
    limit(async () => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Request failed: ${response.status}`);
      return parser(response);
    }),
  );

  return Promise.all(tasks);
}
```

### 3.2 Rate Limiting With `p-queue`

Throttle both concurrency and requests-per-window when APIs enforce quotas.

```js
import PQueue from 'p-queue';

const queue = new PQueue({
  concurrency: 20,
  intervalCap: 80, // Max requests per interval
  interval: 1000,  // Interval length in ms
  timeout: 15000,
});

queue.on('active', () => {
  console.log(`Queue size=${queue.size} pending=${queue.pending}`);
});

export async function schedule(url, opts) {
  return queue.add(async () => {
    const response = await fetch(url, opts);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }, { priority: opts?.priority });
}
```

### 3.3 Batching or Streaming?
- **Batching** reduces round-trips but can create large payloads and blunt retry granularity.
- **Streaming / incremental rendering** lets you surface partial results quickly; keep the pool small and flush UI updates in chunks.

---

## 4. React Hook Patterns for Concurrent Fetching

### 4.1 Prefer Data-Fetching Libraries
- **TanStack Query** (`useQueries`, `useInfiniteQuery`) coordinates parallel fetches, dedupes identical requests, retries with exponential backoff, and integrates with Suspense.
- **SWR** (`useSWR`, `useSWRMutation`) offers stale-while-revalidate and request coalescing with minimal setup.

```tsx
import { useQueries } from '@tanstack/react-query';

export function useUsers(userIds) {
  return useQueries({
    queries: userIds.map(id => ({
      queryKey: ['user', id],
      queryFn: () => fetch(`/api/users/${id}`).then(r => r.json()),
      staleTime: 30_000,
    })),
  });
}
```

### 4.2 Build a Custom Concurrent Hook When Needed

Use a pool internally, wire abort signals, and clean up when the component unmounts.

```tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import pLimit from 'p-limit';

export function useConcurrentFetch(urls, { concurrency = 24, parser = r => r.json() } = {}) {
  const [state, setState] = useState({ data: [], errors: [] });
  const abortRef = useRef(new AbortController());

  const limit = useMemo(() => pLimit(concurrency), [concurrency]);

  useEffect(() => {
    const controller = new AbortController();
    abortRef.current = controller;

    let cancelled = false;

    (async () => {
      const tasks = urls.map((url, index) =>
        limit(async () => {
          const response = await fetch(url, { signal: controller.signal });
          if (!response.ok) throw new Error(`Request ${index} failed`);
          return parser(response, index);
        }).catch(error => ({ error, index })),
      );

      const results = await Promise.all(tasks);

      if (cancelled) return;

      const data = [];
      const errors = [];
      results.forEach((result, index) => {
        if (result?.error) {
          errors.push(result.error);
        } else {
          data[index] = result;
        }
      });

      setState({ data, errors });
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [urls, limit, parser]);

  return {
    data: state.data,
    errors: state.errors,
    abort: () => abortRef.current.abort(),
    isLoading: state.data.length + state.errors.length === 0,
  };
}
```

### 4.3 Keep the UI Responsive
- Wrap expensive renders in `useTransition` so large result sets do not freeze the main thread.
- Surface progressive results by storing partial completions (e.g., use a reducer that appends each finished response).
- Expose cancellation affordances (AbortController plus a "Stop" button) for long-running fetch waves.

---

## 5. Reliability: Cancellation, Timeouts, Retries

### Abort Early
- Prefer `AbortSignal.timeout(ms)` in modern Chromium and Firefox; for Safari or Node fallback, race `setTimeout` with the fetch.
- Cancel dependent requests when their parent component unmounts to avoid orphaned work and misleading analytics.

### Handle Transient Failures

```js
export async function fetchWithBackoff(url, { retries = 4, baseDelay = 500 } = {}) {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 429) {
          const retryAfter = Number(response.headers.get('Retry-After') ?? 0) * 1000;
          if (retryAfter) await new Promise(r => setTimeout(r, retryAfter));
        }
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json();
    } catch (error) {
      if (attempt === retries) throw error;
      const jitter = Math.random() * baseDelay;
      const delay = baseDelay * 2 ** attempt + jitter;
      await new Promise(r => setTimeout(r, delay));
    }
  }
}
```

### Deduplicate Requests
- TanStack Query and SWR dedupe in-flight requests automatically; reuse those hooks instead of rolling your own promise cache.
- For custom stacks, centralize fetches behind a request memoizer keyed by URL + params.

### Avoid Misapplied Web Workers
- Workers shine for CPU-heavy post-processing (parsing, cryptography) once data arrives. They reuse the same network stack and do not provide extra HTTP sockets.

---

## 6. Instrumentation, Testing, and Capacity Guards

- **Browser tooling**: Record Web Vitals, network waterfalls, and CPU profiles with the Chrome DevTools Performance panel to verify concurrency gains.
- **Synthetic monitoring**: Automate benchmark runs (Playwright, WebPageTest) that sweep concurrency levels and capture p95/avg latencies.
- **In-app telemetry**: Emit metrics (active requests, queue depth, retry counts) so ops can spot regressions quickly.
- **Load tests**: Mirror the client strategy in server load harnesses to ensure backend quotas and caches tolerate the access pattern.

---

## 7. Checklist Before Shipping
- Confirm server-side HTTP/2 or HTTP/3 configuration and stream limits.
- Start with conservative concurrency, observe latency and error rates, then iterate.
- Implement cancellation, retry with backoff, and user-visible progress.
- Prefer React data-fetching libraries; reach for custom hooks only for specialized needs.
- Log queue depth and request durations in production to catch degradations early.
- Document override knobs (concurrency, batch size, timeouts) for operations and support teams.

---

**Key Takeaway**: Pair accurate knowledge of your transport limits with deliberate concurrency controls, then surface the behavior through React hooks that keep the UI responsive and resilient.

*Document created: 2025-03-05*

