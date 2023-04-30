const expenseItemSchema = {
    type: "object",
    properties: {
        id: { type: "string" },
        name: { type: "string" },
        price: { type: "number" },
        owners: { type: "array", items: "string" },
    },
} as const;

export default {
    type: "object",
    properties: {
        id: { type: "string" },
        expense: {
            type: "object",
            properties: {
                name: { type: "string" },
                transactionDate: { type: "string", format: "date-time" },
                items: { type: "array", items: expenseItemSchema },
                proportionalItems: { type: "array", items: expenseItemSchema },
            },
        },
    },
    required: ["id", "expense"],
} as const;
