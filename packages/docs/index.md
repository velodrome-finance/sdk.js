---
layout: home

hero:
  name: "Sugar SDK"
  text: "Multi-chain DeFi made simple"
  tagline: TypeScript client for accessing smart contracts across 12+ chains
  actions:
    - theme: brand
      text: Get Started
      link: /using-node
    - theme: alt
      text: API Reference
      link: /api/overview

features:
  - title: Multi-chain Support
    details: Access liquidity pools and swap tokens across Optimism, Base, Mode, Celo, and 8 other chains from a single SDK
  - title: Type-safe
    details: Built with TypeScript and powered by wagmi/viem for full type safety and autocomplete
  - title: Battle-tested
    details: Used in production by Velodrome Finance to power swaps and liquidity operations
---

## What Is Sugar SDK

Sugar SDK is a TypeScript client that wraps Velodrome's cross-chain smart contract suite behind a single, ergonomic API. It gives you strongly typed helpers for token discovery, pricing, routing, and swap execution across twelve supported L2 networks without having to wire contracts by hand.

- Built on top of `@wagmi/core` and `viem` for fully typed requests and wallet management.
- Ships with curated chain metadata, routing parameters, and error handling tuned for DeFi workloads.
- Designed for Node.js services, TypeScript backends, and scripts that need deterministic swap infrastructure.

## Why Builders Use It

- **Single config, many chains**: Provide RPC URLs once through `getDefaultConfig` and the SDK handles chain-specific addresses and routing constants.
- **Deterministic quoting**: `getQuoteForSwap` finds optimal routes using the same routing engine that powers Velodrome.
- **Production ready**: The SDK is used in live trading systems today, with opinionated defaults for pagination, batching, and error reporting.
- **Typed primitives**: Exports `Token`, `Quote`, `SugarWagmiConfig`, and other types so your editor can guardrail integration work.

Ready to build? Head to [Using with Node.js](/using-node) for install steps, token utilities, quoting, and swap execution flows.
