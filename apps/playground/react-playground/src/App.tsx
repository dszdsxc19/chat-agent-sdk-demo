import { useMemo, useEffect, useRef } from 'react';
import { BridgeSDK } from 'my-agent-sdk';
import 'agent-widget'; // Import for side effects (custom element registration)
import { z } from 'zod';
import { useLocalRuntime } from '@assistant-ui/react';
// import '@assistant-ui/react/styles/index.css';

const sdk = BridgeSDK.getInstance();

// Register tool (Stage 1)
sdk.registerTool({
  name: 'submitForm',
  description: 'Submits the form',
  parameters: z.object({
    name: z.string(),
    email: z.string().email(),
  }),
  execute: async (args) => {
    console.log('Host: submitForm executed with', args);
    alert(`Host: submitForm executed with ${JSON.stringify(args)}`);
    return { success: true };
  },
});

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);

  const adapter = useMemo(() => {
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      run: async ({ messages }: { messages: any[] }) => {
        const lastMessage = messages[messages.length - 1];
        console.log('Adapter run:', lastMessage);

        if (lastMessage.role === 'user') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const text = lastMessage.content.find((p: any) => p.type === 'text')?.text || '';
          if (text.toLowerCase().includes('submit')) {
            const args = { name: 'Alice', email: 'alice@example.com' };
            return {
              content: [
                { type: 'text' as const, text: 'Sure, submitting the form...' },
                {
                  type: 'tool-call' as const,
                  toolName: 'submitForm',
                  toolCallId: 'call_' + Math.random().toString(36).substr(2, 9),
                  args,
                  argsText: JSON.stringify(args)
                }
              ]
            };
          }
          return {
            content: [{ type: 'text' as const, text: "I didn't understand. Try saying 'submit'." }]
          };
        }

        return {
          content: [{ type: 'text' as const, text: 'Form submitted successfully!' }]
        };
      }
    };
  }, []);

  const runtime = useLocalRuntime(adapter, {
    initialMessages: [
      {
        id: '1',
        role: 'assistant',
        content: [{ type: 'text', text: 'Hello! I can help you submit a form. Just say "submit".' }],
      },
    ],
  });

  useEffect(() => {
    if (containerRef.current && runtime) {
      // Mount the widget using the SDK
      sdk.mount({
        container: containerRef.current,
        runtime: runtime
      });

      return () => {
        sdk.unmount();
      };
    }
  }, [runtime]);

  return (
    <div style={{ height: '100vh', padding: '20px' }}>
      <h1>Agent Widget Playground</h1>
      <p>The widget below is mounted via <code>sdk.mount()</code> into a container.</p>
      <div
        ref={containerRef}
        style={{ border: '1px solid #ccc', height: '600px', position: 'relative' }}
      />
    </div>
  );
}
