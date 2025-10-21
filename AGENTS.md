# AGENTS.md

This file provides guidance to LLM based coding agents when working with code in this repository.

## About the codebase

- This is a monorepo for Sugar SDK: a collection of typescript API bindings for underlying smart contracts
- It uses `npm` as a package manager


## Commands

- before running commands, make sure to activate appropriate node env using `nvm use`
- to build SDK use `cd packages/sugar-sdk && npm run build`
- to run tests use `npm test`

## Workflow

- carefully study the task that is given to you
- come up with a plan
- execute the plan
- try to confirm if results look good
- run tests to verify the integrity of the system
- if test fails, iterate on the solution until all tests pass

## Tech stack

TODO - fill this out

## Code Style Guidelines

TODO - might drop this altogether in favor of lints via hooks

## Documentation

Documentation is located in @packages/docs and uses vitepress (https://vitepress.dev/). Most of the docs are generated based on inline jsdocs in the corresponding modules in @packages/sugar-sdk. For usage examples, check code in packages/demo-node.

Here's the layout of the documentation that you must follow when generating docs:

- Introduction
    - What is Sugar SDK
- Using with node.js
    - Getting started
    - Tokens
    - Quotes
    - Swaps
- Using with React (coming soon)  

For the corresponding sections covering nodejs usage, locate publicly available API elements from @packages/sugar-sdk/src/index.ts and document them using inline jsdocs they have in their corresponding modules. Where examples exist, include them. For more advanced examples consult @packages/demo-node

We do NOT support react bindings at this moment so let's put a placeholder message for now

## Architecture Guidelines

TODO - should talk about primitives here and any additional stuff that comes up

### Key Concepts:

TODO - might need to mansplain some stuff to Claude
