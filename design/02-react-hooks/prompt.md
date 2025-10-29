Currently we have a low level js API that has been tested on nodejs but also works in the browser that provides basic functionality around accessing Sugar API. You can find its implementation in @packages/sugar-sdk.

We would like to introduce another layer of functionality that focuses on React applications via packages/react-hooks. This package should provide a collection of hooks (and potentially providers) that people can use in their react applications to get access to Sugar sdk APIs. This should look something like this:

````
import { SugarClientProvider, SugarClient, useTokens } from "@dromos-labs/react-hooks";

const sugarClient = new SugarClient({ /** sugar config here **/ })

const MyTokens = () => {
    const { loading, error, tokens } = useTokens({
        // additional parameters here for filtering etc
    });
    return <ul>{
        tokens.map(t => <li>{token.id}</li>)
    }</ul>
}

const App = () => {
    return <SugarClientProvider client={sugarClient}>
        <MyTokens />
    </SugarClientProvider>
}

```

This package should outsource data fetching, syncing and caching to react-query. It will also rely on Wagmi and its hooks for a lof different functionality.
A few things to consider:  

- both react-query and wagmi should be peer dependencies and we need to deal with situations where there is existing Wagmi and React query provider in the component tree; our library should be able to integrate this
- we will need high performance parallelizeable layer for executing many http calls via sugar-sdk API calls inside the library; how can we achieve this? does react-query have smth we can use?
- we need all the different layers of the lib tested: from low lever helpers to hooks and provider themselves. how do we accomplish this

Based on the description below and taking into consideration the list of requirements above please come up with implementation ideas for this library. Include sample snippets of code demonstrating how to accomplish key tasks.
