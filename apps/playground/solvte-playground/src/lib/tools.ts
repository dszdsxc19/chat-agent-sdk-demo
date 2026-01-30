import { BridgeSDK } from "my-agent-sdk";
import { z } from "zod";

const sdk = BridgeSDK.getInstance();

export function registerTools() {
  sdk.registerTool({
    name: "calculateSum",
    description: "Calculates the sum of two numbers",
    parameters: z.object({
      a: z.number(),
      b: z.number(),
    }),
    execute: async ({ a, b }) => {
      console.log("Host: calculateSum executed with", { a, b });
      return { sum: a + b };
    },
  });

  sdk.registerTool({
    name: "reverseString",
    description: "Reverses a given string",
    parameters: z.object({
      input: z.string(),
    }),
    execute: async ({ input }) => {
      console.log("Host: reverseString executed with", { input });
      return { reversed: input.split("").reverse().join("") };
    },
  });
}
