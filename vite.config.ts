import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import UnoCSS from "unocss/vite";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [vue(), UnoCSS()],

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
    // 配置代理解决跨域问题
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8200/",
        changeOrigin: true,
        ws: true,
        rewrite: (path: string) => path.replace(/^\/api/, ''),
        // secure: true, // 启用 SSL 验证
        // 确保转发所有请求头，特别是 Authorization
        configure: (proxy, _options) => {
          proxy.on("proxyReq", (proxyReq, req, _res) => {
            console.log("[Proxy]", req.method, req.url);
            console.log(
              "[Proxy] Headers:",
              JSON.stringify(proxyReq.getHeaders()),
            );
          });
          proxy.on("proxyRes", (proxyRes, req, _res) => {
            console.log("[Proxy] Response:", proxyRes.statusCode, req.url);
          });
          proxy.on("error", (err, req, _res) => {
            console.error("[Proxy] Error:", err.message, req.url);
          });
        },
      },
    },
  },
}));
