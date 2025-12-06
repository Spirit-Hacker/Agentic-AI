import "dotenv/config";
import { Agent, run, tool } from "@openai/agents";
import { z } from "zod";
import axios from "axios";
import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);

const GetWeatherResultSchema = z.object({
  city: z.string().describe("Name of the city"),
  degree_c: z.number().describe("temperature of the city in degree celcius"),
  condition: z.string().optional().describe("condition of the weather"),
});

// TODO: Write a tool to send this weather report to user on email
const emailSenderTool = new tool({
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
        html: `<div style="font-family: 'Arial', sans-serif; background:#f6f9fc; padding:30px;">
    <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.08);">

      <div style="background:#4f46e5; padding:20px; text-align:center;">
        <h2 style="color:white; margin:0;">Weather Update</h2>
      </div>

      <div style="padding:25px; color:#333; line-height:1.6;">
        <p style="font-size:16px;">Hello,</p>
        <p style="font-size:16px;">
          ${body}
        </p>

        <div style="margin:25px 0; padding:15px; background:#f1f5f9; border-radius:8px; text-align:center;">
          <p style="margin:0; font-size:15px; color:#475569;">
            Stay prepared. Stay updated. 🌤️
          </p>
        </div>

        <p style="font-size:14px; color:#94a3b8; text-align:center;">
          — Weather Notification Service
        </p>
      </div>

    </div>
  </div>`,
      });
      // console.log(data);
      return data;
    } catch (error) {
      return error;
    }
  },
});

const weatherTool = new tool({
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

const agent = new Agent({
  name: "Weather Agent",
  instructions:
    "You are an expert weather agent that can answer questions about the weather",
  tools: [weatherTool, emailSenderTool],
  outputType: GetWeatherResultSchema,
});

async function main(query) {
  const result = await run(agent, query);
  console.log(result.finalOutput);
}

main(
  "What is weather of tokyo and send me weather report of tokyo as email on pranildhutraj@gmail.com"
);