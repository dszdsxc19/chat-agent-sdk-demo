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
      // 确保外部化处理那些你不想打包进库的依赖
      external: ['zod'],
      output: {
        // 在 UMD 构建模式下为这些外部化的依赖提供一个全局变量
        globals: {
          zod: 'Zod',
        },
      },
    },
  },
});
