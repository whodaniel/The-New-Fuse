import { LLMClient } from "./packages/tnf-cli/src/utils/llm-client.js";

async function main() {
  const client = new LLMClient("orchestrator");
  
  console.log("=== TNF LLM Client Status ===");
  console.log("Provider:", client.providerName);
  console.log("Model:", client.model);
  console.log("Base URL:", client.baseUrl);
  console.log("API Key present:", client.apiKey ? "yes (" + client.apiKey.length + " chars)" : "MISSING");
  console.log("Provider Catalog:", client.providers.length, "entries");
  
  try {
    const response = await client.chatComplete([
      { role: "user", content: "Say exactly: TNF multi-provider operational" }
    ]);
    console.log("\nChat Test:", response ? "PASS (" + response.length + " chars)" : "FAIL");
    if (response) console.log("Response:", response.substring(0, 120));
  } catch (err: any) {
    console.log("\nChat Test: FAIL -", err.message);
  }
}

main().catch(console.error);
