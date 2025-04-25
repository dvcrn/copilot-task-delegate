// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

export enum ChatMode {
  Ask = "ask",
  Edit = "edit",
  Agent = "agent",
}

export interface IChatViewOpenRequestEntry {
  request: string;
  response: string;
}

export interface IChatViewOpenOptions {
  query: string;
  isPartialQuery?: boolean;
  toolIds?: string[];
  previousRequests?: IChatViewOpenRequestEntry[];
  attachScreenshot?: boolean;
  mode?: ChatMode;
}

function getPromptArg(prompt: string | string[] | undefined, fallback: string): string {
  if (Array.isArray(prompt)) {
    return prompt[0] || fallback;
  }
  return prompt || fallback;
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "copilot-actions" is now active!'
  );

  const DEFAULT_PROMPT = "Default Prompt, Hello";

  const runCopilotDisposable = vscode.commands.registerCommand(
    "copilot-actions.run-copilot",
    (prompt?: string | string[]) => {
      vscode.commands.executeCommand(
        "workbench.action.chat.open",
        getPromptArg(prompt, DEFAULT_PROMPT)
      );
    }
  );

  context.subscriptions.push(runCopilotDisposable);

  const runCopilotAsk = vscode.commands.registerCommand(
    "copilot-actions.run-copilot-ask",
    (prompt?: string | string[]) => {
      const options: IChatViewOpenOptions = {
        query: getPromptArg(prompt, DEFAULT_PROMPT),
        mode: ChatMode.Ask,
      };
      console.log("[copilot-actions] run-copilot-ask options:", options);
      vscode.window.showInformationMessage(`[copilot-actions] run-copilot-ask: ${JSON.stringify(options)}`);
      vscode.commands.executeCommand("workbench.action.chat.open", options);
    }
  );
  context.subscriptions.push(runCopilotAsk);

  const runCopilotEdit = vscode.commands.registerCommand(
    "copilot-actions.run-copilot-edit",
    (prompt?: string | string[]) => {
      const options: IChatViewOpenOptions = {
        query: getPromptArg(prompt, DEFAULT_PROMPT),
        mode: ChatMode.Edit,
      };
      console.log("[copilot-actions] run-copilot-edit options:", options);
      vscode.window.showInformationMessage(`[copilot-actions] run-copilot-edit: ${JSON.stringify(options)}`);
      vscode.commands.executeCommand("workbench.action.chat.open", options);
    }
  );
  context.subscriptions.push(runCopilotEdit);

  const runCopilotAgent = vscode.commands.registerCommand(
    "copilot-actions.run-copilot-agent",
    (prompt?: string | string[]) => {
      const options: IChatViewOpenOptions = {
        query: getPromptArg(prompt, DEFAULT_PROMPT),
        mode: ChatMode.Agent,
      };
      console.log("[copilot-actions] run-copilot-agent options:", options);
      vscode.window.showInformationMessage(`[copilot-actions] run-copilot-agent: ${JSON.stringify(options)}`);
      vscode.commands.executeCommand("workbench.action.chat.open", options);
    }
  );
  context.subscriptions.push(runCopilotAgent);
}

// This method is called when your extension is deactivated
export function deactivate() {}
