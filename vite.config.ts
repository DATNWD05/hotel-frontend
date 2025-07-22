import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      components: path.resolve(__dirname, 'src/components'),
      layouts: path.resolve(__dirname, 'src/layouts'),
      routes: path.resolve(__dirname, 'src/routes'),
      assets: path.resolve(__dirname, 'src/assets'),
      theme: path.resolve(__dirname, 'src/theme'),
    },
  },
  optimizeDeps: {
    include: ['dayjs'], // 👈 Bắt buộc để MUI x-date-pickers hoạt động đúng
  },
});
