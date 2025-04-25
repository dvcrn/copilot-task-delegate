// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

// Define the expected structure of parameters based on package.json schema
interface StartChatAgentParams {
  prompt: string;
  mode: "ask" | "edit" | "agent";
}

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
  console.log(
    'Congratulations, your extension "copilot-actions" is now active!'
  );

  const disposable = vscode.lm.registerTool(
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
  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
