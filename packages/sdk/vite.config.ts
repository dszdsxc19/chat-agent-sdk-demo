import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [dts({ rollupTypes: true })],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'MyAgentSDK',
      fileName: 'index',
    },
    rollupOptions: {
      // Bundle all dependencies
      external: [],
      output: {
        // No globals needed as everything is bundled
        globals: {},
      },
    },
  },
});
