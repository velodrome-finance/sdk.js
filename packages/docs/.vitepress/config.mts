import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: '/sdk.js/',
  title: "Sugar SDK",
  description: "TypeScript client for accessing DeFi smart contracts across multiple chains",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "Home", link: "/" },
      { text: "Using with Node.js", link: "/using-node" },
      { text: "Core API", link: "/api/overview" },
    ],
    search: {
      provider: "local",
    },

    sidebar: [
      {
        text: "Guide",
        items: [
          { text: "Introduction", link: "/" },
          { text: "Using with Node.js", link: "/using-node" },
          { text: "Using with React", link: "/using-react" },
        ],
      },
      {
        text: "Core API",
        items: [
          { text: "Overview", link: "/api/overview" },
          { text: "Configuration", link: "/api/config" },
          { text: "Tokens", link: "/api/tokens" },
          { text: "Swaps", link: "/api/swaps" },
          { text: "Approvals", link: "/api/approvals" },
        ],
      },
    ],

    socialLinks: [
      { icon: "github", link: "https://github.com/velodrome-finance/sdk.js" },
    ],
  },
});
