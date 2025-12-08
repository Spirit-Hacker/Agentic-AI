import "dotenv/config";
import { Agent, run, tool } from "@openai/agents";
import { z } from "zod";
import axios from "axios";
import { Resend } from "resend";
import readline from "readline/promises";

const resend = new Resend(process.env.RESEND_API_KEY);

const emailSenderTool = tool({
  name: "send_emails",
  description: "sends weather report of the city to user the user",
  parameters: z.object({
    toEmail: z.string().describe("email to which report is to be sent"),
    subject: z.string().describe("subject of the email"),
    body: z.string().describe("body of the email"),
  }),
  execute: async function ({ toEmail, subject, body }) {
    try {
      const data = await resend.emails.send({
        from: "Weather <onboarding@resend.dev>",
        to: [toEmail],
        subject: subject,
        html: `<h4>${body}</h4>`,
      });
      // console.log(data);
      return data;
    } catch (error) {
      return error;
    }
  },
  needsApproval: true,
});

const weatherTool = tool({
  name: "get weather",
  description: "returns the weather information of the given city",
  parameters: z.object({
    city: z.string().describe("The city to get the weather information for"),
  }),
  execute: async function ({ city }) {
    // TODO: Add an API call to get the weather information
    const weather_api = `https://wttr.in/${city.toLowerCase()}`;
    const response = await axios.get(weather_api, { responseType: "text" });
    // console.log("Weather API Response:#1111", response.data);
    return `The weather in ${city} is ${response.data}`;
  },
});

async function askForUserConfirmation(question: string) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const answer = rl.question(`${question} y/n : `);
  const normalizedAnswer = (await answer).toLowerCase();
  rl.close();
  return normalizedAnswer === "y" || normalizedAnswer === "yes";
}

const agent = new Agent({
  name: "Weather Email Agent",
  instructions: `
          You are an exper agent in getting weather info and sending it using email
      `,
  tools: [weatherTool, emailSenderTool],
});

async function main(query: string) {
  let res = await run(agent, query);
  // console.log(res.interruptions);
  let hasInteruption = res.interruptions.length > 0;
  while (hasInteruption) {
    const currentState = res.state;
    for (const interupt of res.interruptions) {
      if (interupt.type === "tool_approval_item") {
        const isAllowed = await askForUserConfirmation(
          `Agent ${interupt.agent.name} is calling for a tool ${interupt.toolName} with arguments ${interupt.arguments}`
        );

        if (isAllowed) {
          currentState.approve(interupt);
        } else {
          currentState.reject(interupt);
        }
      }
    }

    res = await run(agent, currentState);
    hasInteruption = res.interruptions.length > 0;
  }
  console.log(res.finalOutput);
}

main(
  "What is the weather of paris and send me report on pranildhutraj@gmail.com"
);
