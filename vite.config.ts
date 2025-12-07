import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Log environment variables during build (visible in Vercel build logs)
  console.log('==========================================');
  console.log('Vite Build Configuration');
  console.log('Mode:', mode);
  console.log('VITE_API_URL:', process.env.VITE_API_URL);
  console.log('All VITE_ env vars:', Object.keys(process.env).filter(k => k.startsWith('VITE_')));
  console.log('==========================================');

  return {
    server: {
      host: "::",
      port: 8080,
      proxy: {
        "/api": {
          target: "http://127.0.0.1:8000",
          changeOrigin: true,
          secure: false,
        },
      },
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
