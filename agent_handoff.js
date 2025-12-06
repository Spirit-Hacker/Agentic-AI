import "dotenv/config";
import { Agent, run, tool } from "@openai/agents";
import z from "zod";
import fs from "node:fs/promises";

const fetchAvailablePlans = new tool({
  name: "fetch_available_plans",
  description: "fetches the available plans for the internet",
  parameters: z.object({}),
  execute: async function () {
    return [
      { plan_id: "1", price_inr: 399, speed: "30MB/s" },
      { plan_id: "2", price_inr: 999, speed: "100MB/s" },
      { plan_id: "3", price_inr: 1499, speed: "200MB/s" },
    ];
  },
});

const processRefund = new tool({
  name: "process_refund",
  description: "This tool processes the refund for the customer",
  parameters: z.object({
    customerId: z.string().describe("Id of the customer"),
    reason: z.string().describe("reason for refund"),
  }),
  execute: async function ({ customerId, reason }) {
    await fs.appendFile(
      "./refunds.txt",
      `Refund for customer having ${customerId} for ${reason}\n`,
      "utf-8"
    );
    return { refundIssued: true };
  },
});

const refundAgent = new Agent({
  name: "Refund Agent",
  instructions: `
        You are an expert in issuing refunds to the customer
    `,
  tools: [processRefund],
});

const salesAgent = new Agent({
  name: "Sales Agent",
  instructions: `
        You are an expert sales agent for internet broadband company.
        Talk to the user and help them with what they need.
    `,
  tools: [
    fetchAvailablePlans,
    refundAgent.asTool({
      toolName: "refund_expert",
      toolDescription: "Handles refund questions and requests.",
    }),
  ],
});

const receptionAgent = new Agent({
  name: "Reception agent",
  instructions: `
        You are a customer facing agent expert in understanding what customer needs and route them or handoff them to the right agent
    `,
  handoffDescription: `
        You have two agents available:
        salesAgent: Expert in handling queries like handling plans and pricing available. Good for customers.
        refundAgent: Expert in handling user queries for existing customers and issue refunds and help them.
    `,
  handoffs: [salesAgent, refundAgent],
});

async function main(query) {
  const result = await run(receptionAgent, query);
  console.log(result.finalOutput);
  console.log(result.history);
}

main("Hey i need a refund for my 1499 plan cause i am shifting to a new place. My customer id is cust009");