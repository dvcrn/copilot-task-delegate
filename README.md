# Copilot Actions VS Code Extension

This extension exposes a Language Model Tool for Copilot agent mode. It allows Copilot to programmatically start a new chat session in agent mode with a specified prompt. The tool can be referenced in agent mode and is designed for automation and advanced workflows.

## Features

- Start a new Copilot chat session in agent mode with a custom prompt
- Can be invoked by Copilot agent mode as a tool
- Debug output for all major steps

## Usage

This extension is not intended to be run directly by the user. It is invoked by Copilot agent mode or other LLMs that support tool calling.

## Packaging

To build a VSIX package:

```sh
npm run vsix
```

## License

MIT
