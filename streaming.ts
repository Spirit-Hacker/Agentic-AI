import "dotenv/config";
import { Agent, run } from "@openai/agents";

const agent = new Agent({
  name: "Storyteller",
  instructions:
    "You are an expert story teller. You tell a story on a topic given to you.",
});

async function* streamOutput(query: string) {
  const res = await run(agent, query, {
    stream: true,
  });
  const stream = res.toTextStream();

  for await (const val of stream) {
    yield { isCompleted: false, value: val };
  }

  yield { isCompleted: true, value: res.finalOutput };
}

async function main(query: string) {
  for await (const val of streamOutput(query)) {
    console.log(val);
  }
}

main("Tell story about how macbook came in existence 100 words");
