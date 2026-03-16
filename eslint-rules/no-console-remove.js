/**
 * Wrapper around no-console that adds a fixer to remove the statement.
 * Respects the same options as no-console (e.g. allow: ["warn", "error"]).
 */

const ALLOWED_BY_DEFAULT = ["warn", "error"];

function getAllowedMethods(options) {
  const opts = options && options[0];
  if (!opts || !opts.allow || !Array.isArray(opts.allow)) {
    return ALLOWED_BY_DEFAULT;
  }
  return opts.allow.map((m) => (typeof m === "string" ? m : "").toLowerCase());
}

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow console statements (with auto-remove fix)",
      category: "Possible Errors",
      recommended: false,
    },
    fixable: "code",
    schema: [
      {
        type: "object",
        properties: {
          allow: {
            type: "array",
            items: { type: "string" },
            minItems: 1,
            uniqueItems: true,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      unexpected:
        "Unexpected console statement. Only these console methods are allowed: {{ allowed }}.",
    },
  },

  create(context) {
    const allowed = getAllowedMethods(context.options);

    return {
      CallExpression(node) {
        const callee = node.callee;
        if (
          callee.type !== "MemberExpression" ||
          callee.object?.type !== "Identifier" ||
          callee.object?.name !== "console"
        ) {
          return;
        }

        const method = callee.property?.name;
        if (typeof method !== "string" || allowed.includes(method.toLowerCase())) {
          return;
        }

        const allowedStr = allowed.join(", ");

        context.report({
          node,
          messageId: "unexpected",
          data: { allowed: allowedStr },
          fix(fixer) {
            const parent = node.parent;
            if (!parent) return null;
            return fixer.remove(parent);
          },
        });
      },
    };
  },
};
