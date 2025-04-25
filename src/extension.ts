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

  console.log("Registering copilot-actions_start-chat-agent tool");
  const disposable = vscode.lm.registerTool(
    "copilot-actions_start-chat-agent",
    {
      async invoke(options, token) {
        vscode.window.showInformationMessage(
          "[copilot-actions] Tool invoked with options: " +
            JSON.stringify(options)
        );
        console.log(
          "copilot-actions_start-chat-agent invoked with options:",
          options
        );
        const { prompt, mode } = options.input as StartChatAgentParams;
        vscode.window.showInformationMessage(
          "[copilot-actions] Parsed parameters: " +
            JSON.stringify({ prompt, mode })
        );
        console.log("Parsed parameters:", { prompt, mode });
        if (
          typeof prompt !== "string" ||
          !["ask", "edit", "agent"].includes(mode)
        ) {
          console.error("Invalid parameters for start-chat-agent tool:", {
            prompt,
            mode,
          });
          vscode.window.showErrorMessage(
            "[copilot-actions] Failed to start chat: Invalid parameters for start-chat-agent tool."
          );
          throw new Error("Invalid parameters for start-chat-agent tool.");
        }
        try {
          await vscode.commands.executeCommand("workbench.action.chat.open", {
            query: prompt,
            mode: "agent",
          });
          vscode.window.showInformationMessage(
            "[copilot-actions] Executed workbench.action.chat.open with: " +
              JSON.stringify({ query: prompt, mode: "agent" })
          );
          console.log("Executed workbench.action.chat.open with:", {
            query: prompt,
            mode: "agent",
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          console.error(
            "[copilot-actions] Error executing workbench.action.chat.open:",
            errorMessage
          );
          vscode.window.showErrorMessage(
            `[copilot-actions] Failed to start chat: ${errorMessage}`
          );
          throw new Error(`Failed to start chat session: ${errorMessage}`);
        }
        return {
          content: [
            new vscode.LanguageModelTextPart("Started Copilot chat session."),
          ],
        };
      },
    }
  );
  context.subscriptions.push(disposable);
  console.log("copilot-actions_start-chat-agent tool registered");
}

// This method is called when your extension is deactivated
export function deactivate() {}
