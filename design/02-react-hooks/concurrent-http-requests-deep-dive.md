# Deep Dive: Handling Hundreds of Concurrent HTTP Requests in Modern Browsers

## Executive Summary

When building applications that need to make hundreds of concurrent HTTP requests, understanding browser limitations, HTTP/2 capabilities, and JavaScript concurrency patterns is critical for maximizing performance and responsiveness.

## Table of Contents

1. [Browser Concurrency Limits](#browser-concurrency-limits)
2. [HTTP/2 Multiplexing Advantages](#http2-multiplexing-advantages)
3. [Concurrency Control Patterns](#concurrency-control-patterns)
4. [Open Source Libraries](#open-source-libraries)
5. [Request Management Strategies](#request-management-strategies)
6. [Real-World Implementations](#real-world-implementations)
7. [Performance Optimization Techniques](#performance-optimization-techniques)
8. [Recommendations](#recommendations)

---

## Browser Concurrency Limits

### HTTP/1.1 Constraints

Modern browsers impose strict connection limits per domain for HTTP/1.1:

- **Chrome, Firefox, Safari, Edge**: 6 concurrent TCP connections per domain
- **Implication**: When making more than 6 requests to the same domain, remaining requests are queued until existing connections free up

**Source**: [Stack Overflow - Max parallel HTTP connections](https://stackoverflow.com/questions/985431/max-parallel-http-connections-in-a-browser)

### HTTP/2 Improvements

HTTP/2 dramatically changes the concurrency model through multiplexing:

- **Single TCP connection per domain**: All requests share one connection
- **Minimum concurrent streams**: 100 (per RFC 7540, `SETTINGS_MAX_CONCURRENT_STREAMS`)
- **Typical browser support**: 100-256 concurrent streams per connection
- **No need for domain sharding**: Anti-pattern under HTTP/2

**Key Insight**: HTTP/2 allows at least 100 parallel requests over a single connection, vs. 6 connections in HTTP/1.1.

**Important Caveat**: TCP-level head-of-line blocking still exists. A single dropped packet can hold up every request on that connection. Performance may degrade with hundreds/thousands of streams.

**Sources**:
- [Stack Overflow - HTTP/2 concurrent requests](https://stackoverflow.com/questions/36835972/is-the-per-host-connection-limit-raised-with-http-2)
- [DEV.to - Understanding HTTP/2 Parallel Requests](https://dev.to/sibiraj/understanding-http2-parallel-requests-streams-vs-connections-3anf)

---

## HTTP/2 Multiplexing Advantages

### How Multiplexing Works

HTTP/2 multiplexing allows multiple requests to share a single TCP connection:

```javascript
// With fetch(), the browser automatically handles HTTP/2 multiplexing
const urls = Array.from({ length: 100 }, (_, i) =>
  `https://api.example.com/item/${i}`
);

// All these requests can share a single TCP connection under HTTP/2
const requests = urls.map(url => fetch(url));
const results = await Promise.all(requests);
```

### Benefits for Web Developers

1. **No domain sharding needed**: Serving assets from multiple CDN domains is now an anti-pattern
2. **Automatic optimization**: The browser handles connection reuse transparently
3. **Lower latency**: Reduced connection overhead means faster initial requests

### Limitations to Understand

- TCP-level head-of-line blocking persists (resolved in HTTP/3 with QUIC)
- Server `SETTINGS_MAX_CONCURRENT_STREAMS` configuration affects limits
- Hundreds of concurrent streams may degrade performance due to packet loss

**Sources**:
- [Cloudflare - HTTP/2 for Web Developers](https://blog.cloudflare.com/http-2-for-web-developers/)
- [Web.dev - HTTP/2 Performance](https://web.dev/performance-http2/)

---

## Concurrency Control Patterns

When dealing with hundreds of concurrent requests, controlling parallelism is essential for:
- Preventing API rate limits
- Avoiding browser/system resource exhaustion
- Managing memory usage
- Ensuring optimal throughput

### Pattern 1: Request Pooling

**Definition**: Maintains a constant number of in-flight requests. As each request completes, a new one starts immediately.

**Advantage**: Consistent resource usage, optimal throughput
**Use Case**: Maximizing speed when you have hundreds of requests and no strict rate limits

```javascript
import pLimit from 'p-limit';

// Limit to 50 concurrent requests
const limit = pLimit(50);

const urls = Array.from({ length: 500 }, (_, i) =>
  `https://api.example.com/item/${i}`
);

// Create limited promises
const requests = urls.map(url =>
  limit(() => fetch(url).then(r => r.json()))
);

// Execute with controlled concurrency
const results = await Promise.all(requests);
console.log(`Processed ${results.length} responses`);

// Monitor active requests
console.log(`Active: ${limit.activeCount}, Pending: ${limit.pendingCount}`);
```

**Library**: [p-limit](https://github.com/sindresorhus/p-limit)

### Pattern 2: Request Batching

**Definition**: Groups requests into batches, processing each batch sequentially.

**Advantage**: Predictable load patterns, easier debugging
**Disadvantage**: May be slower than pooling due to wait times between batches
**Use Case**: When you need controlled "waves" of requests or strict rate limiting

```javascript
// Process 500 requests in batches of 50
async function batchRequests(urls, batchSize = 50) {
  const results = [];

  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(url => fetch(url).then(r => r.json()))
    );
    results.push(...batchResults);
    console.log(`Completed batch ${Math.floor(i/batchSize) + 1}`);
  }

  return results;
}

const urls = Array.from({ length: 500 }, (_, i) =>
  `https://api.example.com/item/${i}`
);
const results = await batchRequests(urls, 50);
```

### Pattern 3: Queue with Priority

**Definition**: Advanced queue that supports priorities, rate limiting, and timeouts.

**Advantage**: Fine-grained control, ideal for complex scenarios
**Use Case**: Mixed priority requests, strict rate limits, need for pause/resume

```javascript
import PQueue from 'p-queue';

const queue = new PQueue({
  concurrency: 50,      // Max 50 concurrent requests
  intervalCap: 100,     // Max 100 requests
  interval: 1000,       // Per 1000ms (rate limiting)
  timeout: 10000        // 10s timeout per request
});

// Add high-priority requests
await queue.add(
  () => fetch('https://api.example.com/critical'),
  { priority: 10 }
);

// Add normal priority requests
urls.forEach(url => {
  queue.add(() => fetch(url).then(r => r.json()));
});

// Monitor queue status
queue.on('active', () => {
  console.log(`Working on item. Size: ${queue.size}, pending: ${queue.pending}`);
});

await queue.onIdle();
console.log('All requests completed');
```

**Library**: [p-queue](https://github.com/sindresorhus/p-queue)

### Performance Comparison: Pooling vs. Batching

**Pooling** maintains constant throughput:
```
Time: |═══════════════════════════════════|
Load: [████████████████████████████████████]
      ^ Constant 50 requests in flight
```

**Batching** creates load waves:
```
Time: |═══════════════════════════════════|
Load: [████████▁▁▁▁████████▁▁▁▁████████▁▁▁▁]
      ^ Peaks at 50, drops to 0 between batches
```

**Benchmarks**: Using asynchronous batching/pooling techniques, developers have achieved **11x performance improvement** (33,339 requests vs 2,977 without optimization).

**Source**: [alxolr - Asynchronous Request Batching](https://www.alxolr.com/articles/how-to-serve-10x-more-request-using-asynchronous-request-batching)

---

## Open Source Libraries

### 1. p-limit

**Purpose**: Simple concurrency control for promises
**GitHub**: [sindresorhus/p-limit](https://github.com/sindresorhus/p-limit)
**Weekly Downloads**: ~70M

**Pros**:
- Minimal API, easy to understand
- Works seamlessly with `Promise.all()`
- Dynamic concurrency adjustment

**Cons**:
- No built-in rate limiting
- No priority support
- No timeout handling

**Example**:
```javascript
import pLimit from 'p-limit';

const limit = pLimit(10);

const input = [
  limit(() => fetchSomething('foo')),
  limit(() => fetchSomething('bar')),
  limit(() => doSomethingElse())
];

// Only 10 promises run simultaneously
const result = await Promise.all(input);

// Dynamically adjust concurrency
limit.concurrency = 20;
```

### 2. p-queue

**Purpose**: Full-featured promise queue with advanced controls
**GitHub**: [sindresorhus/p-queue](https://github.com/sindresorhus/p-queue)
**Weekly Downloads**: ~12M

**Pros**:
- Priority queuing
- Rate limiting (`intervalCap` + `interval`)
- Timeout support
- Pause/resume capabilities
- Event monitoring

**Cons**:
- More complex API
- Slightly larger bundle size

**Example**:
```javascript
import PQueue from 'p-queue';
import got from 'got';

const queue = new PQueue({
  concurrency: 10,
  intervalCap: 50,     // Max 50 requests
  interval: 1000       // Per second
});

// Add with priority
await queue.add(() => got('https://critical.api.com'), { priority: 10 });

// Monitor progress
queue.on('active', () => {
  console.log(`Size: ${queue.size}, Pending: ${queue.pending}`);
});

await queue.onIdle();
```

### 3. axios + axios-retry

**Purpose**: HTTP client with automatic retry logic
**GitHub**: [axios/axios](https://github.com/axios/axios), [softonic/axios-retry](https://github.com/softonic/axios-retry)

**Pros**:
- Automatic retry with exponential backoff
- Intercepts and handles transient errors (5xx, network failures)
- Respects `Retry-After` headers

**Cons**:
- Doesn't provide built-in concurrency limiting (combine with p-limit/p-queue)

**Example**:
```javascript
import axios from 'axios';
import axiosRetry from 'axios-retry';

axiosRetry(axios, {
  retries: 5,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    return axiosRetry.isNetworkOrIdempotentRequestError(error)
      || error.response?.status === 429;  // Retry on rate limit
  }
});

// Combine with p-limit for concurrency control
import pLimit from 'p-limit';
const limit = pLimit(50);

const requests = urls.map(url =>
  limit(() => axios.get(url))
);

const results = await Promise.all(requests);
```

**Sources**:
- [axios-retry npm](https://www.npmjs.com/package/axios-retry)
- [ZenRows - Axios Retry Guide](https://www.zenrows.com/blog/axios-retry)

### 4. @supercharge/promise-pool

**Purpose**: Async pool for Node.js with clean API
**GitHub**: [supercharge/promise-pool](https://github.com/supercharge/promise-pool)

**Example**:
```javascript
import { PromisePool } from '@supercharge/promise-pool';

const { results, errors } = await PromisePool
  .for(urls)
  .withConcurrency(50)
  .process(async url => {
    return await fetch(url).then(r => r.json());
  });
```

### Library Comparison Summary

| Library | Concurrency | Rate Limiting | Retries | Priority | Bundle Size |
|---------|-------------|---------------|---------|----------|-------------|
| p-limit | ✅ | ❌ | ❌ | ❌ | ~1KB |
| p-queue | ✅ | ✅ | ❌ | ✅ | ~5KB |
| axios-retry | ❌ | ❌ | ✅ | ❌ | ~10KB |
| @supercharge/promise-pool | ✅ | ❌ | ❌ | ❌ | ~3KB |

**Recommendation**:
- **Simple use case**: `p-limit`
- **Complex requirements**: `p-queue`
- **Error handling focus**: `axios` + `axios-retry`

---

## Request Management Strategies

### 1. AbortController for Cancellation

Modern fetch API supports request cancellation using `AbortController`, critical for:
- Component unmount scenarios
- User navigation
- Implementing timeouts
- Preventing race conditions

```javascript
// Basic timeout implementation
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 5000);

try {
  const response = await fetch(url, { signal: controller.signal });
  clearTimeout(timeoutId);
  return await response.json();
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Request timed out or was cancelled');
  }
  throw error;
}
```

```javascript
// Modern approach with AbortSignal.timeout (Chrome 116+, Firefox 124+)
try {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(5000)
  });
  return await response.json();
} catch (error) {
  if (error.name === 'TimeoutError') {
    console.log('Request timed out');
  }
}
```

```javascript
// Managing concurrent requests with cancellation
const controllers = new Map();

async function fetchWithCancel(id, url) {
  // Cancel previous request for this ID
  if (controllers.has(id)) {
    controllers.get(id).abort();
  }

  const controller = new AbortController();
  controllers.set(id, controller);

  try {
    const response = await fetch(url, { signal: controller.signal });
    return await response.json();
  } finally {
    controllers.delete(id);
  }
}
```

**Sources**:
- [Better Stack - AbortController Guide](https://betterstack.com/community/guides/scaling-nodejs/understanding-abortcontroller/)
- [DEV.to - Adding timeout to fetch](https://dev.to/rashidshamloo/adding-timeout-and-multiple-abort-signals-to-fetch-typescriptreact-33bb)

### 2. Request Deduplication

**Problem**: Multiple components requesting the same data simultaneously creates unnecessary network requests.

**Solution**: Libraries like React Query (TanStack Query) and SWR automatically deduplicate requests.

```javascript
// React Query automatically deduplicates
import { useQuery } from '@tanstack/react-query';

// Multiple components calling this will only trigger ONE HTTP request
function useUser(userId) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetch(`/api/users/${userId}`).then(r => r.json())
  });
}

// Component A
function ComponentA() {
  const { data } = useUser(1); // Request triggered
}

// Component B
function ComponentB() {
  const { data } = useUser(1); // Reuses same request!
}
```

**SWR Implementation**:
```javascript
import useSWR from 'swr';

const fetcher = url => fetch(url).then(r => r.json());

// Four components using the same key = only 1 HTTP request
function Profile() {
  const { data } = useSWR('/api/user', fetcher);
  return <div>{data?.name}</div>;
}
```

**Manual Deduplication with fetch-dedupe**:
```javascript
import fetchDedupe from 'fetch-dedupe';

// First call makes the request
const promise1 = fetchDedupe('https://api.example.com/data');

// Second call returns the same promise
const promise2 = fetchDedupe('https://api.example.com/data');

console.log(promise1 === promise2); // true
```

**Sources**:
- [TanStack Query Comparison](https://tanstack.com/query/v4/docs/framework/react/comparison)
- [DEV.to - SWR Request Deduplication](https://dev.to/andykao1213/how-to-understand-the-request-deduplication-in-swr-28bb)

### 3. Stale-While-Revalidate Pattern

**Concept**: Show cached data immediately while fetching fresh data in the background.

```javascript
// SWR implementation (built-in)
import useSWR from 'swr';

function Profile() {
  const { data, error, isLoading } = useSWR('/api/user', fetcher);

  // 1. Shows cached data instantly (stale)
  // 2. Fetches fresh data in background (revalidate)
  // 3. Updates UI when new data arrives

  if (error) return <div>Failed to load</div>;
  if (isLoading) return <div>Loading...</div>;
  return <div>Hello {data.name}!</div>;
}
```

**Benefits**:
- Instant UI updates (perceived performance)
- Always fresh data
- Reduced loading states

### 4. Exponential Backoff for Retries

When requests fail due to rate limiting or transient errors, exponential backoff prevents overwhelming the server:

```javascript
async function fetchWithBackoff(url, maxRetries = 5) {
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const response = await fetch(url);

      if (response.ok) return await response.json();

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const delay = retryAfter
          ? parseInt(retryAfter) * 1000
          : Math.pow(2, retries) * 1000;  // Exponential: 1s, 2s, 4s, 8s...

        console.log(`Rate limited, waiting ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        retries++;
        continue;
      }

      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      if (retries === maxRetries - 1) throw error;

      const delay = Math.pow(2, retries) * 1000;
      console.log(`Retry ${retries + 1}/${maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
      retries++;
    }
  }
}
```

**Best Practices**:
- Start with 3-5 retries
- Respect `Retry-After` headers
- Use exponential backoff: 1s → 2s → 4s → 8s → 16s
- Add jitter to prevent thundering herd: `delay * (1 + random(0, 0.1))`

---

## Real-World Implementations

### 1. React Query (TanStack Query)

**Use Case**: Data fetching library for React with automatic caching, deduplication, and background refetching

**Key Features for Concurrent Requests**:
- Automatic request deduplication
- Parallel queries with `useQueries()`
- Dependent/serial queries
- Infinite scrolling with `useInfiniteQuery()`

```javascript
import { useQueries } from '@tanstack/react-query';

function UserDashboard({ userIds }) {
  // Fetch data for hundreds of users in parallel
  const userQueries = useQueries({
    queries: userIds.map(id => ({
      queryKey: ['user', id],
      queryFn: () => fetch(`/api/users/${id}`).then(r => r.json()),
      staleTime: 60000,  // Cache for 1 minute
    }))
  });

  const allLoaded = userQueries.every(q => q.isSuccess);
  const users = userQueries.map(q => q.data).filter(Boolean);

  return <div>{users.length} users loaded</div>;
}
```

**Performance Features**:
- Automatic cache management with garbage collection
- Smart refetching (on window focus, reconnect, interval)
- Optimistic updates for mutations
- Built-in DevTools for debugging

**Sources**:
- [TanStack Query Docs](https://tanstack.com/query/latest/docs/framework/react/overview)
- [Medium - TanStack Query Guide](https://medium.com/@ignatovich.dm/tanstack-query-a-powerful-tool-for-data-management-in-react-0c5ae6ef037c)

### 2. SWR (Vercel)

**Use Case**: Lightweight React Hooks library for data fetching with focus on UX

**Key Features**:
- Built-in request deduplication
- Automatic cache invalidation
- Optimistic UI updates
- Prefetching with `preload()`

```javascript
import useSWR from 'swr';

const fetcher = url => fetch(url).then(r => r.json());

// Handles hundreds of items efficiently
function ItemList({ itemIds }) {
  // Deduplicated requests for each item
  const items = itemIds.map(id => {
    const { data, error } = useSWR(`/api/items/${id}`, fetcher, {
      dedupingInterval: 2000,  // Dedupe for 2 seconds
      revalidateOnFocus: false
    });
    return data;
  }).filter(Boolean);

  return <div>{items.length} items</div>;
}
```

**Source**: [SWR Documentation](https://swr.vercel.app/)

### 3. Hoppscotch (API Testing Tool)

**Use Case**: Open-source API development tool that needs to handle multiple concurrent requests

**GitHub**: [hoppscotch/hoppscotch](https://github.com/hoppscotch/hoppscotch)

**Relevant Features**:
- Real-time request/response handling
- Support for various HTTP methods
- WebSocket and GraphQL support

### 4. Benchmarking Projects

**GitHub**: [jordinl/concurrent-http-requests-comparison](https://github.com/jordinl/concurrent-http-requests-comparison)

**Findings**: Comparison of concurrent HTTP request performance across languages:
- **Rust + reqwest**: Best performing
- **Go**: Excellent concurrency
- **Node.js with proper pooling**: Good performance
- **Python with async**: Competitive

---

## Performance Optimization Techniques

### 1. Choose Optimal Concurrency Limit

**Too Low**: Underutilizes available resources, slower completion
**Too High**: Resource exhaustion, increased error rates, browser unresponsiveness

**Finding the Sweet Spot**:

```javascript
// Benchmark different concurrency levels
async function benchmark(urls, concurrency) {
  const limit = pLimit(concurrency);
  const start = Date.now();

  const requests = urls.map(url =>
    limit(() => fetch(url).then(r => r.json()))
  );

  await Promise.all(requests);
  const duration = Date.now() - start;

  console.log(`Concurrency ${concurrency}: ${duration}ms`);
  return duration;
}

// Test different levels
const urls = Array.from({ length: 500 }, (_, i) =>
  `https://api.example.com/item/${i}`
);

await benchmark(urls, 10);   // Conservative
await benchmark(urls, 50);   // Moderate
await benchmark(urls, 100);  // Aggressive
```

**Recommendations by Scenario**:
- **API with rate limits**: Match or slightly below rate limit (e.g., 10-20)
- **No rate limits + HTTP/2**: 50-100 concurrent requests
- **Large file downloads**: 5-10 to avoid memory issues
- **Microservices (no limits)**: 100+ if system can handle it

### 2. Memory Management for Large Datasets

When handling hundreds of responses, memory can become a bottleneck:

```javascript
// BAD: Loads all data into memory at once
const allData = await Promise.all(
  urls.map(url => fetch(url).then(r => r.json()))
);
// Now 'allData' holds 500 full responses in memory

// GOOD: Process and discard as you go
const limit = pLimit(50);
const processedCount = { value: 0 };

await Promise.all(
  urls.map(url =>
    limit(async () => {
      const data = await fetch(url).then(r => r.json());
      await processData(data);  // Process immediately
      processedCount.value++;
      // 'data' is garbage collected after this
    })
  )
);
```

**Streaming Approach for Large Responses**:
```javascript
async function processLargeFile(url) {
  const response = await fetch(url);
  const reader = response.body.getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    // Process chunk immediately
    processChunk(value);
  }
}
```

### 3. Progressive Loading UI Pattern

For better UX when loading hundreds of items:

```javascript
import { useState, useEffect } from 'react';
import pLimit from 'p-limit';

function ProgressiveLoader({ urls }) {
  const [results, setResults] = useState([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const limit = pLimit(50);
    let completed = 0;

    const requests = urls.map(url =>
      limit(async () => {
        const data = await fetch(url).then(r => r.json());
        completed++;
        setProgress((completed / urls.length) * 100);
        setResults(prev => [...prev, data]);
        return data;
      })
    );

    Promise.all(requests);
  }, [urls]);

  return (
    <div>
      <div>Progress: {progress.toFixed(0)}%</div>
      <div>Loaded {results.length} / {urls.length} items</div>
      <ul>
        {results.map((item, i) => (
          <li key={i}>{item.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

### 4. Web Workers for CPU-Intensive Post-Processing

**When to Use**: If you need to process hundreds of responses with heavy computation (parsing, transformation, encryption)

**Important**: Web Workers do NOT bypass browser connection limits for HTTP requests. They're useful for computation, not I/O parallelism.

```javascript
// main.js
const worker = new Worker('processor.worker.js');

// Fetch in main thread (controlled concurrency)
const limit = pLimit(50);
const responses = await Promise.all(
  urls.map(url => limit(() => fetch(url).then(r => r.json())))
);

// Process in worker thread (CPU-intensive)
worker.postMessage(responses);
worker.onmessage = (e) => {
  const processedData = e.data;
  updateUI(processedData);
};
```

```javascript
// processor.worker.js
self.onmessage = (e) => {
  const data = e.data;

  // CPU-intensive transformation
  const processed = data.map(item => {
    return expensiveTransformation(item);
  });

  self.postMessage(processed);
};
```

#### Web Workers: Important Drawbacks and Limitations

While Web Workers can improve UI responsiveness, they come with significant tradeoffs that often make them unsuitable for HTTP request handling:

**1. High Overhead Costs**

- **Creation overhead**: Creating a Web Worker involves loading a separate JavaScript file and spawning a real OS-level thread
- **Memory consumption**: Each worker consumes additional memory and processing resources
- **Startup time**: Initialization cost can exceed benefits for short-lived tasks

**2. Communication Bottleneck (Critical Issue)**

The `postMessage` API creates a major performance bottleneck:

- **Serialization overhead**: Data must be serialized (structured clone), transmitted, and deserialized
- **Performance impact**: Serialization can consume **16%+ of total CPU time** in worker-heavy applications
- **Size matters**: Transfer time correlates strongly with object size and complexity
  - Objects >100KB can blow your performance budget
  - Serializing 4,000 objects can take 20-30ms, potentially canceling out computation benefits
- **Rule of thumb**: Keep payloads under 10KB for JS-driven animations, under 100KB for general use

**Optimization**: Use Transferable Objects (ArrayBuffer, MessagePort, ImageBitmap) for zero-copy transfers when possible:

```javascript
// BAD: Copies entire array buffer (slow)
worker.postMessage({ data: largeArrayBuffer });

// GOOD: Transfers ownership (fast, zero-copy)
worker.postMessage({ data: largeArrayBuffer }, [largeArrayBuffer]);
// Note: largeArrayBuffer is now unusable in main thread
```

**3. Severe API Restrictions**

Web Workers **cannot** access:
- DOM manipulation (`document`, element APIs)
- `window` object
- `localStorage` or `sessionStorage`
- Canvas rendering (can't draw directly)
- Direct image loading
- Most browser-specific APIs

**4. Not Actually Faster**

- Workers don't make code execute faster—they run on the same CPU
- Benefit is **UI responsiveness** (keeping main thread free), not **raw speed**
- For computation <50ms, overhead makes workers **slower** overall

**5. When NOT to Use Web Workers**

Avoid Web Workers for:

- **HTTP requests**: Already async, no benefit. Workers don't bypass the 6-connection limit (HTTP/1.1) or improve request throughput
- **Simple/quick tasks**: Tasks completing in <50ms don't justify overhead
- **Frequent operations**: Creating workers repeatedly is prohibitively expensive
- **UI-heavy operations**: Tasks requiring DOM access or user interaction
- **Small, frequent messages**: Communication overhead dominates any benefit
- **Already async I/O**: Database queries, file operations gain nothing from workers

**Real-World Performance Issue**:

> "Web Workers may promise performance, but in some cases, like large logs and cursor states, they make problems worse... you'd expect a slight increase in overall CPU utilization, since now we have to transfer large amounts of data between the worker and the main thread."
>
> "The time spent calling JSON.stringify almost canceled out the benefits of using Web Workers"

**Best Use Cases** (when overhead is justified):

- CPU-intensive computation (>100ms)
- Cryptographic operations (hashing, encryption)
- Large-scale data parsing/transformation
- Image processing
- Complex algorithms (pathfinding, physics simulation)

**For Concurrent HTTP Requests**: Use `p-limit`/`p-queue` on the main thread instead. Web Workers add overhead without improving HTTP throughput.

**Sources**:
- [MDN - Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers)
- [Medium - Web Workers Parallel Processing](https://medium.com/@artemkhrenov/web-workers-parallel-processing-in-the-browser-e4c89e6cad77)
- [surma.dev - When should you be using Web Workers?](https://surma.dev/things/when-workers/)
- [Nolan Lawson - High-performance Web Worker messages](https://nolanlawson.com/2016/02/29/high-performance-web-worker-messages/)
- [Dagster - Why Web Workers Fall Short for Data UIs](https://dagster.io/blog/web-workers-performance-issue)

### 5. HTTP/2 Server Push (Advanced)

If you control the server, HTTP/2 Server Push can proactively send resources:

```javascript
// Server-side (Node.js with http2)
const http2 = require('http2');

const server = http2.createSecureServer(options);

server.on('stream', (stream, headers) => {
  if (headers[':path'] === '/') {
    // Push related resources before client requests them
    stream.pushStream({ ':path': '/api/user' }, (err, pushStream) => {
      pushStream.respond({ ':status': 200 });
      pushStream.end(JSON.stringify(userData));
    });

    stream.respond({ ':status': 200 });
    stream.end('<html>...</html>');
  }
});
```

**Note**: Server Push is deprecated in Chrome (2022+) in favor of Early Hints (103 status code), but still supported in Firefox and Safari.

---

## Recommendations

### General Best Practices

1. **Start with HTTP/2**: Ensure your servers support HTTP/2 for automatic multiplexing
2. **Use `p-limit` for simplicity**: Start here unless you need advanced features
3. **Implement cancellation**: Always support abort signals for better UX
4. **Add retry logic**: Use exponential backoff for transient failures
5. **Monitor progress**: Show loading states and progress bars for user feedback
6. **Respect rate limits**: Use `p-queue` if you need strict rate limiting
7. **Test thoroughly**: Benchmark different concurrency levels in production-like environments
8. **Handle errors gracefully**: Partial failure should not break the entire operation
9. **Consider memory**: Process and discard data as you go for large datasets
10. **Use React Query/SWR**: For React apps, these libraries handle most complexity

---

## Conclusion

Handling hundreds of concurrent HTTP requests in modern browsers requires understanding:

1. **Browser limitations**: HTTP/1.1 limits (6 per domain) vs HTTP/2 multiplexing (100+ streams)
2. **Concurrency patterns**: Pooling vs batching vs queuing
3. **Error handling**: Retries, exponential backoff, rate limiting
4. **User experience**: Progress indicators, cancellation, stale-while-revalidate

**Key Takeaway**: Use HTTP/2, implement request pooling with libraries like `p-limit` or `p-queue`, add proper error handling, and consider adopting React Query or SWR for React applications to get production-ready data fetching with minimal code.

### Further Reading

- [HTTP/2 RFC 7540](https://tools.ietf.org/html/rfc7540)
- [Fetch API Standard](https://fetch.spec.whatwg.org/)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Web.dev - Performance Best Practices](https://web.dev/performance/)

---

*Document created: 2025-10-29*
