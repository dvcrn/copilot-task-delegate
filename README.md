# Copilot Actions VS Code Extension

This extension exposes a Language Model Tool for Copilot agent mode. It allows Copilot to programmatically start a new Copilot chat session in agent mode with a specified prompt. The tool is intended for Copilot to create another Copilot session, not for direct user invocation.

## Features
- Copilot can create a new Copilot chat session in agent mode with a custom prompt
- Debug output for all major steps

## Usage
This extension is not intended to be run directly by the user. It is invoked by Copilot agent mode or other LLMs that support tool calling.

## Packaging
To build a VSIX package:

```sh
npm run vsix
```

## License
AGPL-3.0-or-later with non-commercial clause
