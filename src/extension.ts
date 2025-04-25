// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

// Define the expected structure of parameters based on package.json schema
interface StartChatParameters {
  prompt: string;
  mode: "ask" | "edit" | "agent";
}

interface StartChatAgentParams {
  prompt: string;
  mode: "ask" | "edit" | "agent";
}

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
  console.log(
    'Congratulations, your extension "copilot-actions" is now active!'
  );

  // Define the Language Model Tool implementation
  const startChatTool: vscode.LanguageModelTool = {
    name: "copilotActions.startChat", // Must match the name in package.json
    description: "Starts a new VS Code Copilot chat session with a specific mode and prompt.", // Description for the tool

    // The core logic executed when the tool is invoked by an LLM
    invoke: async (
      parameters: unknown, // Parameters provided by the LLM, matching the input_schema
      token: vscode.CancellationToken
    ): Promise<StartChatResult> => {
      // Validate and cast parameters based on the defined schema
      const { prompt, mode } = parameters as StartChatParameters;

      // Basic validation
      if (
        typeof prompt !== "string" ||
        !["ask", "edit", "agent"].includes(mode)
      ) {
        console.error(
          "[copilot-actions] Invalid parameters received:",
          parameters
        );
        // Throwing an error signals failure to the LLM
        throw new Error("Invalid parameters received for startChat tool.");
      }

      console.log(
        `[copilot-actions] Tool invoked: mode='${mode}', prompt='${prompt}'`
      );

      try {
        // Execute the command to open the chat panel
        await vscode.commands.executeCommand("workbench.action.chat.open", {
          query: prompt,
          mode: mode,
        });
        console.log("[copilot-actions] workbench.action.chat.open executed.");
        // Return a success result object
        return { message: "Chat session started successfully." };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(
          `[copilot-actions] Error executing workbench.action.chat.open: ${errorMessage}`
        );
        vscode.window.showErrorMessage(
          `[copilot-actions] Failed to start chat: ${errorMessage}`
        );
        // Throw an error to signal failure back to the invoking LLM
        throw new Error(`Failed to start chat session: ${errorMessage}`);
      }
    },
  };

  // Register the tool with VS Code's Language Model API
  const disposableStartChat = vscode.lm.registerTool(startChatTool);

  const disposableStartChatAgent = vscode.lm.registerTool(
    "copilot-actions_start-chat-agent",
    {
      async invoke(options, token) {
        const { prompt, mode } = options.input as StartChatAgentParams;
        if (typeof prompt !== "string" || !["ask", "edit", "agent"].includes(mode)) {
          throw new Error("Invalid parameters for start-chat-agent tool.");
        }
        await vscode.commands.executeCommand("workbench.action.chat.open", { query: prompt, mode });
        return {
          content: [new vscode.LanguageModelTextPart("Started Copilot chat session.")]
        };
      }
    }
  );

  context.subscriptions.push(disposableStartChat);
  context.subscriptions.push(disposableStartChatAgent);
}

// This method is called when your extension is deactivated
export function deactivate() {}
