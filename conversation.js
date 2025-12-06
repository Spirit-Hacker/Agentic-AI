import "dotenv/config";
import { Agent, tool, run } from "@openai/agents";
import { z } from "zod";

let sharedHistory = [];

const executeSQL = tool({
  name: "sql_query_executer",
  description: "this executes the sql query",
  parameters: z.object({
    sql: z.string().describe("the sql query"),
  }),
  execute: async function ({ sql }) {
    console.log(`[SQL]: Executes ${sql}`);
    return "Done";
  },
});

const sqlAgent = new Agent({
  name: "SQL agent",
  tools: [executeSQL],
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
});

async function main(query) {
  sharedHistory.push({ role: "user", content: query });
  const res = await run(sqlAgent, sharedHistory);
  sharedHistory = res.history;
  console.log("OUTPUT: ", res.finalOutput);
  console.log("HISTORY: ", res.history);
}

main("My name is Pranil").then(() => main("get all the users with my name"));
