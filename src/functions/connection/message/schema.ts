const expenseItemSchema = {
    type: "object",
    properties: {
        id: { type: "string" },
        name: { type: "string" },
        price: { type: "number" },
        owners: { type: "array", items: { type: "string" } },
        isProportional: { type: "boolean" },
    },
} as const;

export default {
    type: "object",
    properties: {
        id: { type: "string" },
        method: { type: "string" },
        expense: {
            type: "object",
            properties: {
                name: { type: "string" },
                transactionDate: { type: "string", format: "date-time" },
                items: { type: "array", items: expenseItemSchema },
            },
        },
        item: expenseItemSchema,
    },
    required: ["id", "method"],
} as const;
