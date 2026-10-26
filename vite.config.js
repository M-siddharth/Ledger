import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Local laptop browser: http://localhost:5173
// Android Studio emulator browser: http://10.0.2.2:5173
// Listen on the host interface so the emulator can reach Vite.
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
  },
});