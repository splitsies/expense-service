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
        name: { type: "string" },
        price: { type: "number" },
        owners: { type: "array", items: expenseUserDetailsSchema },
        isProportional: { type: "boolean" },
    },
    required: ["id", "name", "price", "owners"],
} as const;

const expenseMessageParamsSchema = {
    type: "object",
    properties: {
        expenseId: { type: "string" },
        expenseName: { type: "string" },
        item: expenseItemSchema,
        user: expenseUserDetailsSchema,
        itemName: { type: "string" },
        itemPrice: { type: "number" },
        itemOwners: { type: "array", items: expenseUserDetailsSchema },
        selectedItemIds: { type: "array", items: { type: "string" } },
        isItemProportional: { type: "boolean" },
        transactionDate: { type: "string" },
    },
    required: ["expenseId"],
} as const;

export default {
    type: "object",
    properties: {
        method: { type: "string" },
        params: expenseMessageParamsSchema,
        expense: {
            type: "object",
            properties: {
                name: { type: "string" },
                transactionDate: { type: "string", format: "date-time" },
                items: { type: "array", items: expenseItemSchema },
            },
        },
    },
    required: ["params", "method"],
} as const;
