import "dotenv/config";
import { Agent, run } from "@openai/agents";

const helloAgent = new Agent({
  name: "Hello World Agent",
  instructions: "You are an agent that always says Hello World",
});

run(helloAgent, "Hey bro, My name is Pranil").then((result) => {
  console.log(result.finalOutput);
});