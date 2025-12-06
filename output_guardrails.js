import "dotenv/config";
import { Agent, run } from "@openai/agents";
import { z } from "zod";

const sqlGuardrailAgent = new Agent({
  name: "SQL guardrail",
  instructions: `
        Check is query is safe to execute. The query should be read only and should not modify, delete or drop any table or row from the DB.
    `,
  outputType: z.object({
    isSafe: z.boolean().describe("if query is safe to execute"),
    reason: z.string().optional().describe("reason if query is unsafe"),
  }),
});

const sqlGuardrail = {
  name: "SQL query guardrail",
  execute: async ({ agentOutput }) => {
    const res = await run(sqlGuardrailAgent, agentOutput.sqlQuery);
    return {
      outputInfo: res.finalOutput.reason,
      tripwireTriggered: !res.finalOutput.isSafe,
    };
  },
};

const sqlAgent = new Agent({
  name: "SQL expert agent",
  instructions: `
        You are an expert SQL agent that is specialized in generating SQL queries as per user request.
        Postgres Schema:
        -- users table
        CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) NOT NULL UNIQUE,
            email VARCHAR(100) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
        );

        -- comments table
        CREATE TABLE comments (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
        );
    `,
  outputType: z.object({
    sqlQuery: z.string().describe("sql query"),
  }),
  outputGuardrails: [sqlGuardrail],
});

async function main(query) {
  const result = await run(sqlAgent, query);
  console.log(result.finalOutput.sqlQuery);
}

main("Delete the user table");
