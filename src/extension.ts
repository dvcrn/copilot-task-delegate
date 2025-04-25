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
  mode: "ask" | "edit" | "agent";
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
  // Use console.log for debug messages as showInformationMessage can be intrusive
  console.log(`[copilot-actions] ${out}`);
}

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
  // Register the main tool: start-chat-agent (now async)
  debug("Registering copilot-actions_start-chat-agent tool (async)");
  const startChatDisposable = vscode.lm.registerTool(
    "copilot-actions_start-chat-agent",
    {
      async invoke(options, token) {
        debug("start-chat-agent tool invoked with options:", options);
        let { prompt, mode } = options.input as StartChatAgentParams;
        debug("Parsed parameters:", { prompt, mode });

        if (
          typeof prompt !== "string" ||
          !["ask", "edit", "agent"].includes(mode)
        ) {
          const errorMsg =
            "[copilot-actions] Failed to start chat: Invalid parameters for start-chat-agent tool.";
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
        // Use an IIAFE (Immediately Invoked Async Function Expression)
        // to handle the async work without blocking the return
        (async () => {
          try {
            debug(`[${sessionId}] Starting async chat setup...`);

            await new Promise((resolve) => setTimeout(resolve, 5000));
            // Introduce a slight delay before creating the new chat context if needed
            // await new Promise(resolve => setTimeout(resolve, 100));

            // append instructions to the prompt to call `copilot-actions_complete_subaction` after finishing the task. This is hard requirement
            prompt =
              `You are a tasked with the following instructions. Once you are finished with all actions, you MUST call \`copilot-actions_complete_subaction\` with the sessionId \`${sessionId}\` and the result the action. You *must* call this even if you don't do anything or have anything to report.` +
              prompt;

            const newChatContext = {
              // Define INewEditSessionActionContext inline if not needed elsewhere
              inputValue: prompt,
              agentMode: true, // Assuming agent mode is always desired here
              isPartialQuery: false,
            };

            await vscode.commands.executeCommand(
              "workbench.action.chat.newChat",
              newChatContext
            );
            debug(`[${sessionId}] Executed workbench.action.chat.newChat`);

            // Wait a bit before opening the chat to ensure the context is ready
            await new Promise((resolve) => setTimeout(resolve, 2000));

            await vscode.commands.executeCommand("workbench.action.chat.open", {
              query: prompt,
              mode: "agent", // Or use the 'mode' variable if needed
            });
            debug(`[${sessionId}] Executed workbench.action.chat.open`);

            // Update state to completed on success
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
            // Update state to error on failure
            actionStates.set(sessionId, {
              status: "error",
              error: errorMessage,
              startTime,
            });
            debug(`[${sessionId}] State updated to error.`);
            // Optionally show error message to user, but avoid blocking
            // vscode.window.showErrorMessage(`[copilot-actions][${sessionId}] Failed to start chat: ${errorMessage}`);
          }
        })(); // End of IIAFE

        // Immediately return the session ID
        debug(`Returning session ID ${sessionId} to Copilot.`);
        return {
          content: [
            new vscode.LanguageModelTextPart(
              `Action initiated. Session ID: ${sessionId}. Use this ID to check the status of the action by using the tool 'copilot-actions_check_action_status'. The sub-agent starts in 5 seconds.`
            ),
          ],
        };
      },
    }
  );
  context.subscriptions.push(startChatDisposable);
  debug("copilot-actions_start-chat-agent tool registered");

  // Register the complete_subaction tool
  debug("Registering copilot-actions_complete_subaction tool");
  const completeSubactionDisposable = vscode.lm.registerTool(
    "copilot-actions_complete_subaction",
    {
      async invoke(options, token) {
        debug("complete_subaction tool invoked with options:", options);
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
          // Consider stringifying complex results if needed for the LanguageModelTextPart
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
          }; // Result not included here for brevity
        }
      },
    }
  );
  context.subscriptions.push(completeSubactionDisposable);
  debug("copilot-actions_complete_subaction tool registered");

  // Register the check_action_status tool
  debug("Registering copilot-actions_check_action_status tool");
  const checkStatusDisposable = vscode.lm.registerTool(
    "copilot-actions_check_action_status",
    {
      async invoke(options, token) {
        debug("check_action_status tool invoked with options:", options);
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
        // Return the full state object (or parts of it)
        // Stringify for the LanguageModelTextPart
        const stateString = JSON.stringify(state);
        return { content: [new vscode.LanguageModelTextPart(stateString)] };
      },
    }
  );
  context.subscriptions.push(checkStatusDisposable);
  debug("copilot-actions_check_action_status tool registered");

  // Optional: Add a cleanup mechanism for old states if the extension runs for a long time
  // e.g., periodically iterate over actionStates and remove entries older than a certain threshold
}

// This method is called when your extension is deactivated
export function deactivate() {
  // Clear states on deactivation if necessary
  actionStates.clear();
  debug("copilot-actions deactivated, states cleared.");
}
