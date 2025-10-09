import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Sugar SDK",
  description: "TypeScript client for accessing DeFi smart contracts across multiple chains",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "Home", link: "/" },
      { text: "Guide", link: "/getting-started" },
      { text: "API Reference", link: "/api/overview" },
    ],

    sidebar: [
      {
        text: "Guide",
        items: [
          { text: "Getting Started", link: "/getting-started" },
          { text: "Swapping Tokens", link: "/swapping" },
          { text: "Getting Calldata", link: "/calldata" },
        ],
      },
      {
        text: "API Reference",
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
