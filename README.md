# Copilot Actions VS Code Extension

This extension provides a set of Language Model Tools for Copilot agent mode, enabling one Copilot instance to initiate, monitor, and receive results from another asynchronous Copilot task.

It allows a primary Copilot agent to delegate a task to a secondary Copilot agent running in a separate chat session, track the progress of this sub-task, and retrieve its outcome.

## Features

*   **Asynchronous Task Delegation:** Copilot can start a new Copilot agent session (sub-agent) with a custom prompt without blocking its own execution.
*   **Session Tracking:** Uses unique session IDs (UUIDs) to track each delegated task.
*   **Status Monitoring:** Provides a tool for the primary agent to poll the status (`pending`, `completed`, `error`) of the sub-task.
*   **Result Retrieval:** Allows the primary agent to retrieve the final result or error message from the completed sub-task.
*   **Completion Signaling:** Includes a tool for the sub-agent to signal its completion or failure back to the tracking system.

## Workflow

1.  **Initiation:** The primary Copilot agent calls the `copilotActionsStartChatAgent` tool with a prompt.
2.  **Session ID:** The tool immediately returns a unique `sessionId` (UUID) to the primary agent.
3.  **Sub-Agent Spawn:** In the background, the extension prepares a modified prompt (instructing the sub-agent to report back upon completion) and opens a new VS Code agent chat session with this prompt, effectively spawning the sub-agent.
4.  **Polling (Optional):** The primary agent can periodically call the `copilotActionsCheckActionStatus` tool with the `sessionId` to check if the sub-task is still `pending` or has finished.
5.  **Completion:** Once the sub-agent completes its assigned task, it **must** call the `copilotActionsCompleteSubaction` tool, providing the original `sessionId` and either a `result` or an `error` message.
6.  **Result Retrieval:** The primary agent calls `copilotActionsCheckActionStatus` again. The status will now be `completed` or `error`, and the corresponding result or error message will be included in the response.

## Provided Tools

*   **`copilotActionsStartChatAgent`**
    *   **Purpose:** Starts the asynchronous sub-agent task.
    *   **Input:** `prompt` (string, Markdown supported).
    *   **Output:** Confirmation message with the unique `sessionId` (string, UUID).
*   **`copilotActionsCheckActionStatus`**
    *   **Purpose:** Checks the status and result/error of a sub-agent task.
    *   **Input:** `sessionId` (string, UUID).
    *   **Output:** JSON string representing the current state (`{status: 'pending'|'completed'|'error', result?: any, error?: string, startTime: number}`).
*   **`copilotActionsCompleteSubaction`**
    *   **Purpose:** Used by the sub-agent to signal completion or failure.
    *   **Input:** `sessionId` (string, UUID), `result` (string, optional), `error` (string, optional). One of `result` or `error` must be provided.
    *   **Output:** Confirmation message.

## Usage

This extension is designed for interaction between Copilot agents via tool calling. Direct user invocation of these tools is not the intended use case.

## Packaging

To build a VSIX package:

```sh
npm run vsix
```

## License

AGPL-3.0-or-later with non-commercial clause
