export default {
    type: "object",
    properties: {
        expenseId: { type: "string" },
        userId: { type: "string" },
    },
    required: ["expenseId", "userId"],
} as const;
