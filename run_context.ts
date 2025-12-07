import "dotenv/config";
import { Agent, run, RunContext, tool } from "@openai/agents";
import { z } from "zod";

interface MyContext {
  userId: string;
  userName: string;
  fetchUserInfoFromDb: () => Promise<string>;
}

const getUserInfoTool = tool({
  name: "get_user_info",
  description: "This tool retrives the users information",
  parameters: z.object({}),
  execute: async (_, ctx?: RunContext<MyContext>): Promise<string | undefined> => {
    return await ctx?.context.fetchUserInfoFromDb();
  },
});

const customerSupportAgent = new Agent<MyContext>({
  name: "Customer Support Agent",
  instructions: ({ context }) => {
    return `You are an expert customer support agent.`;
  },
  tools: [getUserInfoTool],
});

async function main(query: string, ctx: MyContext) {
  const res = await run(customerSupportAgent, query, {
    context: ctx,
  });
  console.log(res.finalOutput);
}

main("Give me my user info", {
  userId: "1",
  userName: "pranil",
  fetchUserInfoFromDb: async () => {
    return `user id = 1 and username = pranil`;
  },
});
