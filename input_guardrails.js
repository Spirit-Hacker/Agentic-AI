import "dotenv/config";
import { Agent, InputGuardrailTripwireTriggered, run } from "@openai/agents";
import z from "zod";

const GetQuerySchema = z.object({
  isMaths: z
    .boolean()
    .describe("Tells if the user query was related to maths or not"),
  reason: z.string().optional().describe("Reason for rejecting the query"),
});

const validateQueryAgent = new Agent({
  name: "Maths Query Validator",
  instructions: `
        You are an input guardrail agent that checks if user query is math related ot not
        Rules:
        - The query has to be strictly related to maths equations
        - Reject anyother kind of request even if related to maths
    `,
  outputType: GetQuerySchema,
});

const mathsInputGuardrail = {
  name: "Math Homework Guardrail",
  execute: async ({ input }) => {
    // TODO: validate input to be a maths query only
    const res = await run(validateQueryAgent, input);
    // console.log(res.finalOutput);
    return {
      outputInfo: res.finalOutput.reason,
      tripwireTriggered: !res.finalOutput.isMaths,
    };
  },
};

const mathsAgent = new Agent({
  name: "Math Agent",
  instructions: "You are an expert at solving maths problems",
  inputGuardrails: [mathsInputGuardrail],
});

async function main(query) {
  try {
    const result = await run(mathsAgent, query);
    console.log(result.finalOutput);
  } catch (e) {
    if (e instanceof InputGuardrailTripwireTriggered) {
      console.log(`Invalid Input: Rejected because ${e.message}`);
    }
  }
}

main("Write code in javascript to add two numbers");
