# Deep Dive: Mastering Hundreds of Concurrent HTTP Requests in the Browser

## Executive Summary

Effectively managing hundreds of concurrent HTTP requests is critical for building responsive, high-performance web applications. This guide provides a developer-focused approach, moving from browser fundamentals to advanced, actionable patterns. We will explore how modern browsers handle requests, how to control concurrency with client-side patterns, and which libraries to use. The key takeaway is to leverage HTTP/2 and control client-side parallelism with promise-pooling libraries like `p-limit` or `p-queue`, while using frameworks like React Query or SWR to handle complexity automatically in React applications.

---

## 1. Understanding the Foundation: HTTP/1.1 vs. HTTP/2

Your browser's ability to handle concurrent requests fundamentally depends on the HTTP version in use.

### HTTP/1.1: The 6-Connection Limit

For years, browsers were constrained by a strict limit of **6 parallel TCP connections per domain**. Any requests beyond this limit were queued, waiting for a connection to free up. This led to the "domain sharding" hack, where assets were served from multiple subdomains (`assets1.example.com`, `assets2.example.com`) to increase the connection pool.

### HTTP/2: Multiplexing and the 100-Stream Guideline

HTTP/2 revolutionizes this with **multiplexing**, allowing multiple requests to share a single TCP connection per domain.

-   **Single TCP Connection**: Eliminates the overhead of opening new connections.
-   **Concurrent Streams**: The RFC specifies a minimum of **100 concurrent streams**, though servers can configure this. This means you can fire off at least 100 requests in parallel over one connection without browser-imposed queuing.
-   **No More Domain Sharding**: This practice is now an anti-pattern that negates the benefits of HTTP/2.

**Caveat: Head-of-Line Blocking**
While HTTP/2 is a massive improvement, it's not a silver bullet. A single dropped TCP packet can still block all streams on that connection. This is known as TCP-level head-of-line (HOL) blocking and is fully resolved in HTTP/3 (which uses QUIC).

---

## 2. Core Strategy: Client-Side Concurrency Control

Even with HTTP/2's high stream limit, you still need to control concurrency from your application code. Firing 500 requests simultaneously can overwhelm the server (triggering rate limits), exhaust browser memory, or simply be less efficient than a controlled approach.

### Pattern 1: Request Pooling (The Workhorse)

**Concept**: Maintain a fixed number of in-flight requests. As one finishes, a new one from the queue begins. This ensures consistent load and maximum throughput.

**When to Use**: The default choice for processing a large number of requests as fast as possible without hitting rate limits.

**Implementation (`p-limit`)**: The `p-limit` library is a minimal, highly effective tool for this.

```javascript
import pLimit from 'p-limit';

// Create a pool that allows 50 concurrent requests
const limit = pLimit(50);

const urls = Array.from({ length: 500 }, (_, i) =>
  `https://api.example.com/item/${i}`
);

console.log('Starting 500 requests with a concurrency of 50...');
const startTime = Date.now();

// Map each URL to a limited promise
const requests = urls.map(url =>
  limit(() => fetch(url).then(r => r.json()))
);

// Execute all requests
const results = await Promise.all(requests);

const duration = Date.now() - startTime;
console.log(`Completed all ${results.length} requests in ${duration}ms.`);
// Active requests: 0, Pending requests: 0
console.log(`Active: ${limit.activeCount}, Pending: ${limit.pendingCount}`);
```

### Pattern 2: Advanced Control with a Priority Queue

**Concept**: For more complex scenarios, a full-featured queue provides fine-grained control over concurrency, rate-limiting, and request priority.

**When to Use**:
-   You need to enforce strict API rate limits (e.g., "no more than 100 requests per second").
-   Some requests are more important than others (e.g., fetch critical data first).
-   You need pause/resume capabilities.

**Implementation (`p-queue`)**: `p-queue` is the gold standard for this.

```javascript
import PQueue from 'p-queue';

const queue = new PQueue({
  concurrency: 50,      // 50 requests at a time
  intervalCap: 100,     // Max 100 requests...
  interval: 1000,       // ...per second (rate limiting)
  timeout: 15000        // 15s timeout per request
});

// Add a high-priority request
queue.add(
  () => fetch('https://api.example.com/critical-data'),
  { priority: 10 }
);

// Add 500 normal priority requests
urls.forEach(url => {
  queue.add(() => fetch(url).then(r => r.json()));
});

queue.on('active', () => {
  console.log(`Queue status: Size=${queue.size}, Pending=${queue.pending}`);
});

await queue.onIdle();
console.log('All queue tasks completed.');
```

### Library Comparison

| Library | Concurrency | Rate Limiting | Retries | Priority | Best For |
|---|---|---|---|---|---|
| **p-limit** | ✅ | ❌ | ❌ | ❌ | Simple, fast, and efficient pooling. |
| **p-queue** | ✅ | ✅ | ❌ | ✅ | Complex scenarios with rate limits and priorities. |
| **axios-retry** | ❌ | ❌ | ✅ | ❌ | Adding automatic retries to `axios`. Combine with `p-limit`. |

---

## 3. Essential Request Management Techniques

Beyond concurrency, robust applications must handle cancellation, retries, and redundant requests.

### Cancellation with `AbortController`

**Problem**: A component unmounts or a user navigates away while a request is in-flight. You need to cancel it to prevent memory leaks and race conditions.

**Solution**: The `fetch` API natively supports cancellation via `AbortController`.

```javascript
const controller = new AbortController();

// Set a 5-second timeout
const timeoutId = setTimeout(() => controller.abort(), 5000);

try {
  const response = await fetch(url, { signal: controller.signal });
  // If fetch succeeds, clear the timeout
  clearTimeout(timeoutId);
  const data = await response.json();
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Request was cancelled (e.g., timed out or user navigated away).');
  }
}
```
**Modern Approach**: `AbortSignal.timeout()` provides a cleaner way to implement timeouts.
```javascript
try {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(5000) // Supported in modern browsers
  });
} catch (error) {
  if (error.name === 'TimeoutError') {
    console.log('Request timed out.');
  }
}
```

### Retries with Exponential Backoff

**Problem**: A request fails due to a transient server error (e.g., `503 Service Unavailable`) or rate limiting (`429 Too Many Requests`). Retrying immediately can make the problem worse.

**Solution**: Retry with an exponentially increasing delay, plus some randomness ("jitter") to avoid a "thundering herd" of clients retrying at the same instant.

```javascript
async function fetchWithBackoff(url, maxRetries = 5) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) return await response.json();

      // Respect the server's rate limit header if present
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '1') * 1000;
        await new Promise(resolve => setTimeout(resolve, retryAfter));
        continue;
      }
      // For other server errors, use exponential backoff
      throw new Error(`HTTP Error: ${response.status}`);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      // Delay = 2^i * 1000ms + random jitter
      const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
      console.log(`Request failed. Retrying in ${Math.round(delay/1000)}s...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```
**Library Solution**: For `axios` users, `axios-retry` implements this logic automatically.

### Deduplication and Caching

**Problem**: Multiple components in your application request the exact same data at the same time, resulting in redundant `fetch` calls.

**Solution**: Use a data-fetching library that automatically deduplicates identical requests. **React Query (TanStack Query)** and **SWR** are the industry standards for this in React.

```javascript
// With React Query or SWR, this is automatic.
// Both components below will trigger only ONE network request.

// Component A
function UserAvatar({ userId }) {
  const { data: user } = useUserQuery(userId); // Triggers fetch for user 123
  return <img src={user.avatarUrl} />;
}

// Component B
function UserHeader({ userId }) {
  const { data: user } = useUserQuery(userId); // Re-uses the in-flight request for user 123
  return <h1>{user.name}</h1>;
}
```

---

## 4. Common Pitfall: Misusing Web Workers

There's a common misconception that Web Workers can be used to bypass browser connection limits or parallelize HTTP requests. **This is incorrect.**

-   **What They Do**: Web Workers provide a separate thread for **CPU-intensive computation**, keeping the main UI thread responsive.
-   **What They Don't Do**: They do not have their own connection pool. A `fetch` call inside a worker still uses the same browser-level queue and limits.
-   **High Overhead**: Workers have significant startup and communication costs (`postMessage`). The serialization of data can easily negate any benefits for tasks that aren't heavily computational.

**Conclusion**: Do not use Web Workers for managing HTTP request concurrency. They are for offloading heavy calculations (e.g., parsing large files, cryptography, image processing) *after* the data has been fetched. For I/O-bound tasks like `fetch`, stick to `async/await` with pooling on the main thread.

---

## 5. Putting It All Together: Recommended Approaches

### For React Applications: Use a Data-Fetching Library

**Recommendation**: **TanStack Query (React Query)** or **SWR**.

These libraries are the canonical solution. They provide a production-ready framework that handles almost everything for you out-of-the-box:
-   Request deduplication
-   Caching and stale-while-revalidate
-   Retries with exponential backoff
-   Cancellation on unmount
-   Parallel queries for fetching multiple resources concurrently

```javascript
// Example: Fetching 100 users in parallel with TanStack Query
import { useQueries } from '@tanstack/react-query';

function UserGrid({ userIds }) {
  const userQueries = useQueries({
    queries: userIds.map(id => ({
      queryKey: ['user', id],
      queryFn: () => fetch(`/api/users/${id}`).then(r => r.json()),
    })),
    // The library handles concurrency, caching, and retries.
  });

  return (/* ... render users ... */);
}
```

### For Vanilla JS or Other Frameworks

**Recommendation**: Combine `p-queue` with `AbortController`.

This gives you a powerful, flexible, and robust setup.
1.  Use `p-queue` to manage concurrency and rate limits.
2.  Integrate `AbortController` for timeouts and cancellation.
3.  Implement a manual `fetchWithBackoff` wrapper or use `axios` with `axios-retry`.

### For Simple Scripts

**Recommendation**: `p-limit`.

For one-off scripts or simple use cases where you just need to limit concurrency without complex features, `p-limit` is the perfect, lightweight choice.
