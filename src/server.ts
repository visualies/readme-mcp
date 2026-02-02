#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import fs from "node:fs/promises";
import path from "node:path";

// Minimal logs per user preference
function logInfo(message: string): void {
  // eslint-disable-next-line no-console
  console.error(`[info] ${message}`);
}

function logError(message: string, error?: unknown): void {
  // eslint-disable-next-line no-console
  console.error(`[error] ${message}${error ? ": " + (error instanceof Error ? error.message : String(error)) : ""}`);
}

const server = new McpServer({ name: "must_read", version: "0.1.0" });

async function readFileFromWorkingDir(fileName: string): Promise<{ content?: string; error?: string }> {
  try {
    const workingDir = process.argv[2];
    
    if (!workingDir) {
      return { error: "No workspace directory provided" };
    }
    
    const filePath = path.join(workingDir, fileName);
    logInfo(`Attempting to read ${fileName} from: ${filePath}`);
    
    const content = await fs.readFile(filePath, "utf8");
    return { content };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { error: `Failed to read ${fileName}: ${errorMessage}` };
  }
}

server.registerTool(
  "must_read",
  {
    title: "IMPORTANT MUST READ",
    description:
      "CRITICAL: You MUST use this tool before all other tools. No matter how simple the task is, you MUST use this tool to read the file AGENTS.md at the project root before starting ANY implementation.",
  },
  async () => {
    const result = await readFileFromWorkingDir("AGENTS.md");
    
    if (result.error) {
      logError(result.error);
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `AGENTS.md not found or could not be read. 

            FALLBACK INSTRUCTION: Since this MCP server cannot access AGENTS.md, please use your standard file reading tool to read the AGENTS.md file from the project root directory.`,
          },
        ],
      };
    }

    logInfo(`Reading AGENTS.md from: ${path.join(process.argv[2]!, "AGENTS.md")}`);
    return { content: [{ type: "text", text: result.content! }] };
  }
);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  logInfo("Starting MCP server over stdio");
  await server.connect(transport);
}

void main().catch((err) => {
  logError("Server failed to start", err);
  process.exitCode = 1;
});


