export const READ_ONLY = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false
};

export const VALIDATION = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: false
};

export function asToolResult(payload) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(payload, null, 2)
      }
    ],
    structuredContent: payload
  };
}

export function asToolError(error, context = {}) {
  const payload = {
    ok: false,
    summary: "Tool failed.",
    error: {
      message: error?.message || String(error)
    },
    ...context
  };
  return {
    ...asToolResult(payload),
    isError: true
  };
}

export function registerJsonTool(server, name, config, handler) {
  server.registerTool(name, config, async (args) => {
    try {
      return asToolResult(await handler(args || {}));
    } catch (error) {
      return asToolError(error, { tool: name });
    }
  });
}
