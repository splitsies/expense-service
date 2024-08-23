export default {
    type: "object",
    properties: {
        childExpenseId: { type: "string" },
    },
    required: ["childExpenseId"]
} as const;
