import OpenAI from "openai";
import { readFile } from "node:fs/promises";

async function main() {
  const [, , flag, prompt] = process.argv;
  const apiKey = process.env.OPENROUTER_API_KEY;
  const baseURL =
    process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }
  if (flag !== "-p" || !prompt) {
    throw new Error("error: -p flag is required");
  }

  const client = new OpenAI({
    apiKey: apiKey,
    baseURL: baseURL,
  });

  const response = await client.chat.completions.create({
    model: "anthropic/claude-haiku-4.5",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 512,
    tools: [
      {
        type: "function",
        function: {
          name: "Read",
          description: "Read and return the contents of a file",
          parameters: {
            type: "object",
            properties: {
              file_path: {
                type: "string",
                description: "The path to the file to read",
              },
            },
            required: ["file_path"],
          },
        },
      },
    ],
  });

  if (!response.choices || response.choices.length === 0) {
    throw new Error("no choices in response");
  }

  // You can use print statements as follows for debugging, they'll be visible when running tests.
  console.error("Logs from your program will appear here!");

  console.error(JSON.stringify(response.choices[0].message, null, 2));

  const tool_call = response.choices[0].message?.tool_calls?.[0];

  if (tool_call && tool_call.type == "function") {
    // const tool_id = tool_call.id;
    const tool_name = tool_call.function.name;
    const tool_params = JSON.parse(tool_call.function.arguments);
    // console.error(`Params: ${tool_params} | Type: ${typeof tool_params}`);
    const file_path = tool_params.file_path;
    if (tool_name == "Read") {
      const file = await readFile(file_path, { encoding: "utf8" });
      // console.log(file);
      process.stdout.write(file);
    }
  } else {
    console.log(response.choices[0].message.content);
  }
}

main();
