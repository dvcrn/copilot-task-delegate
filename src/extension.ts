// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as crypto from "crypto"; // Import crypto for UUID generation

// Define the structure for action state
interface ActionState {
  status: "pending" | "completed" | "error";
  result?: any;
  error?: string;
  startTime: number; // Track when the action was started
}

// Define the expected structure of parameters for start-chat-agent
interface StartChatAgentParams {
  prompt: string;
}

// Define the expected structure of parameters for complete_subaction
interface CompleteSubactionParams {
  sessionId: string;
  result?: any;
  error?: string;
}

// Define the expected structure of parameters for check_action_status
interface CheckActionStatusParams {
  sessionId: string;
}

// In-memory storage for action states
const actionStates: Map<string, ActionState> = new Map();

// Helper function for debug output
function debug(msg: string, obj?: any) {
  const out = obj ? `${msg} ${JSON.stringify(obj)}` : msg;
  // Use console.log for debug messages
  console.log(`[copilot-task-delegate] ${out}`); // Updated prefix for consistency
}

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
  // Register the main tool: start
  debug("Registering copilot-task-delegate_start tool");
  const startChatDisposable = vscode.lm.registerTool(
    "copilot-task-delegate_start", // Renamed tool
    {
      async invoke(options, token) {
        debug(
          "copilot-task-delegate_start tool invoked with options:",
          options
        );
        let { prompt } = options.input as StartChatAgentParams;
        debug("Parsed parameters:", { prompt });

        if (typeof prompt !== "string") {
          const errorMsg =
            "[copilot-task-delegate] Failed to start chat: Invalid parameters for start tool (prompt must be a string)."; // Updated prefix
          vscode.window.showErrorMessage(errorMsg);
          throw new Error(errorMsg);
        }

        // Generate a unique session ID
        const sessionId = crypto.randomUUID();
        const startTime = Date.now();
        debug(`Generated session ID: ${sessionId}`);

        // Store the initial state as pending
        actionStates.set(sessionId, { status: "pending", startTime });
        debug(`Initial state set for ${sessionId}: pending`);

        // --- Start the async work (don't await this) ---
        (async () => {
          try {
            debug(`[${sessionId}] Starting async chat setup...`);

            await new Promise((resolve) => setTimeout(resolve, 5000));

            prompt =
              `You are a tasked with the following instructions. Once you are finished with all actions, you MUST call \`copilot-task-delegate_complete\` with the sessionId \`${sessionId}\` and the result the action. You *must* call this even if you don't do anything or have anything to report.` + // Updated tool name
              prompt;

            const newChatContext = {
              inputValue: prompt,
              agentMode: true,
              isPartialQuery: false,
            };

            await vscode.commands.executeCommand(
              "workbench.action.chat.newChat",
              newChatContext
            );
            debug(`[${sessionId}] Executed workbench.action.chat.newChat`);

            await new Promise((resolve) => setTimeout(resolve, 2000));

            await vscode.commands.executeCommand("workbench.action.chat.open", {
              query: prompt,
              mode: "agent",
            });
            debug(`[${sessionId}] Executed workbench.action.chat.open`);

            actionStates.set(sessionId, {
              status: "completed",
              result: "Chat session initiated successfully.",
              startTime,
            });
            debug(`[${sessionId}] State updated to completed.`);
          } catch (error: unknown) {
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            debug(
              `[${sessionId}] Error during async chat setup: ${errorMessage}`
            );
            actionStates.set(sessionId, {
              status: "error",
              error: errorMessage,
              startTime,
            });
            debug(`[${sessionId}] State updated to error.`);
          }
        })();

        debug(`Returning session ID ${sessionId} to Copilot.`);
        return {
          content: [
            new vscode.LanguageModelTextPart(
              `Action initiated. Session ID: ${sessionId}. Use this ID to check the status of the action by using the tool 'copilot-task-delegate_status'. The sub-agent starts in 5 seconds.` // Updated tool name
            ),
          ],
        };
      },
    }
  );
  context.subscriptions.push(startChatDisposable);
  debug("copilot-task-delegate_start tool registered");

  // Register the complete tool
  debug("Registering copilot-task-delegate_complete tool");
  const completeSubactionDisposable = vscode.lm.registerTool(
    "copilot-task-delegate_complete", // Renamed tool
    {
      async invoke(options, token) {
        debug(
          "copilot-task-delegate_complete tool invoked with options:",
          options
        );
        const { sessionId, result, error } =
          options.input as CompleteSubactionParams;

        if (typeof sessionId !== "string") {
          throw new Error("Invalid parameters: sessionId must be a string.");
        }

        const currentState = actionStates.get(sessionId);
        if (!currentState) {
          debug(`Session ID ${sessionId} not found for completion.`);
          throw new Error(`Session ID ${sessionId} not found.`);
        }

        if (result === undefined && error === undefined) {
          throw new Error(
            "Invalid parameters: Either result or error must be provided."
          );
        }

        if (error !== undefined) {
          actionStates.set(sessionId, {
            ...currentState,
            status: "error",
            error: String(error),
          });
          debug(`Session ${sessionId} marked as error.`);
          return {
            content: [
              new vscode.LanguageModelTextPart(
                `Session ${sessionId} marked as error.`
              ),
            ],
          };
        } else {
          actionStates.set(sessionId, {
            ...currentState,
            status: "completed",
            result,
          });
          debug(`Session ${sessionId} marked as completed.`);
          const resultString =
            typeof result === "object"
              ? JSON.stringify(result)
              : String(result);
          return {
            content: [
              new vscode.LanguageModelTextPart(
                `Session ${sessionId} marked as completed.`
              ),
            ],
          };
        }
      },
    }
  );
  context.subscriptions.push(completeSubactionDisposable);
  debug("copilot-task-delegate_complete tool registered");

  // Register the status tool
  debug("Registering copilot-task-delegate_status tool");
  const checkStatusDisposable = vscode.lm.registerTool(
    "copilot-task-delegate_status", // Renamed tool
    {
      async invoke(options, token) {
        debug(
          "copilot-task-delegate_status tool invoked with options:",
          options
        );
        const { sessionId } = options.input as CheckActionStatusParams;

        if (typeof sessionId !== "string") {
          throw new Error("Invalid parameters: sessionId must be a string.");
        }

        const state = actionStates.get(sessionId);

        if (!state) {
          debug(`Session ID ${sessionId} not found for status check.`);
          throw new Error(`Session ID ${sessionId} not found.`);
        }

        debug(`Returning status for session ${sessionId}:`, state);
        const stateString = JSON.stringify(state);
        return { content: [new vscode.LanguageModelTextPart(stateString)] };
      },
    }
  );
  context.subscriptions.push(checkStatusDisposable);
  debug("copilot-task-delegate_status tool registered");
}

// This method is called when your extension is deactivated
export function deactivate() {
  actionStates.clear();
  debug("copilot-task-delegate deactivated, states cleared."); // Updated prefix
}
