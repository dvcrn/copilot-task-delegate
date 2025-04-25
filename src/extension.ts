// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

// Define the expected structure of parameters based on package.json schema
interface StartChatAgentParams {
  prompt: string;
  mode: "ask" | "edit" | "agent";
}

interface INewEditSessionActionContext {
  inputValue?: string;
  agentMode?: boolean;
  isPartialQuery?: boolean;
}

// Helper function for debug output
function debug(msg: string, obj?: any) {
  const out = obj ? `${msg} ${JSON.stringify(obj)}` : msg;
  vscode.window.showInformationMessage(`[copilot-actions] ${out}`);
  console.log(`[copilot-actions] ${out}`);
}

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
  debug("Registering copilot-actions_start-chat-agent tool");
  const disposable = vscode.lm.registerTool(
    "copilot-actions_start-chat-agent",
    {
      async invoke(options, token) {
        debug("Tool invoked with options:", options);
        const { prompt, mode } = options.input as StartChatAgentParams;
        debug("Parsed parameters:", { prompt, mode });
        if (
          typeof prompt !== "string" ||
          !["ask", "edit", "agent"].includes(mode)
        ) {
          vscode.window.showErrorMessage(
            "[copilot-actions] Failed to start chat: Invalid parameters for start-chat-agent tool."
          );
          throw new Error("Invalid parameters for start-chat-agent tool.");
        }
        setTimeout(() => {
          const newChatContext: INewEditSessionActionContext = {
            inputValue: prompt,
            agentMode: true,
            isPartialQuery: false,
          };
          vscode.commands.executeCommand("workbench.action.chat.newChat", newChatContext).then(() => {
            setTimeout(() => {
              vscode.commands.executeCommand(
                "workbench.action.chat.open",
                {
                  query: prompt,
                  mode: "agent",
                }
              ).then(execResult => {
                debug('Executed workbench.action.chat.open with:', { query: prompt, mode: "agent" });
                debug('executeCommand return:', execResult);
              }, (error: unknown) => {
                const errorMessage = error instanceof Error ? error.message : String(error);
                vscode.window.showErrorMessage(
                  `[copilot-actions] Failed to start chat: ${errorMessage}`
                );
              });
            }, 2000);
          });
        }, 3000);
        return {
          content: [
            new vscode.LanguageModelTextPart("Started Copilot chat session."),
          ],
        };
      },
    }
  );
  context.subscriptions.push(disposable);
  debug("copilot-actions_start-chat-agent tool registered");
}

// This method is called when your extension is deactivated
export function deactivate() {}
