import "dotenv/config";
import { OpenAI } from "openai";
import { Agent, tool, run } from "@openai/agents";
import { z } from "zod";

const client = new OpenAI();

client.conversations.create({}).then((e) => {
    console.log(`Converation thread created: `, e.id)
});

// conv_693562f1da2c8193abe09b76d79fa75b045eee4a13adeec6