import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [react(), dts({ rollupTypes: false, tsconfigPath: './tsconfig.app.json' })],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'AgentWidget',
      fileName: 'agent-widget',
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'my-agent-sdk',
        'zod',
        '@assistant-ui/react',
        '@assistant-ui/react-ui',
        '@assistant-ui/react-ai-sdk',
        'ai'
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'my-agent-sdk': 'MyAgentSDK',
          '@assistant-ui/react': 'AssistantUI',
          '@assistant-ui/react-ui': 'AssistantUIReactUI',
          'ai': 'AI'
        }
      }
    }
  }
});
