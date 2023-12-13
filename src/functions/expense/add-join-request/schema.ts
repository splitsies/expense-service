export default {
    type: "object",
    properties: {
        userId: { type: "string" },
        expenseId: { type: "string" },
        requestingUserId: { type: "string" },
    },
    required: ["userId", "expenseId", "requestingUserId"],
} as const;
