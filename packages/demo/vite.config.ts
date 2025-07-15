import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import flowbiteReact from "flowbite-react/plugin/vite";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), flowbiteReact()],
});
