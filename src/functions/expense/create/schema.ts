const expenseUserDetailsSchema = {
    type: "object",
    properties: {
        isRegistered: { type: "boolean" },
        id: { type: "string" },
        givenName: { type: "string" },
        familyName: { type: "string" },
        phoneNumber: { type: "string" },
        username: { type: "string" },
    },
    required: ["isRegistered", "id", "givenName"],
} as const;

const expenseItemSchema = {
    type: "object",
    properties: {
        id: { type: "string" },
        expenseId: { type: "string" },
        name: { type: "string" },
        price: { type: "number" },
        owners: { type: "array", items: expenseUserDetailsSchema },
        isProportional: { type: "boolean" },
        createdAt: { type: "number" },
    },
    required: ["id", "expenseId", "name", "price", "owners"],
} as const;

export default {
    type: "object",
    properties: {
        userId: { type: "string" },
        expense: {
            type: "object",
            properties: {
                id: { type: "string" },
                name: { type: "string" },
                transactionDate: { type: "string", format: "date-time" },
                items: { type: "array", items: expenseItemSchema },
                userIds: { type: "array", items: { type: "string" } },
            },
            required: ["id", "name", "transactionDate", "items", "userIds"],
        },
    },
    required: ["userId"],
} as const;
