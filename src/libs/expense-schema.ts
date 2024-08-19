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
    required: ["isRegistered", "id", "givenName", "username", "familyName"],
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
    required: ["id", "expenseId", "name", "price", "owners", "createdAt", "isProportional"],
} as const;

const payerStatusSchema = {
    type: "object",
    properties: {
        expenseId: { type: "string" },
        userId: { type: "string" },
        settled: { type: "boolean" },
    },
    required: ["expenseId", "userId", "settled"]
} as const;

const payerSchema = {
    type: "object",
    properties: {
        "userId": { type: "string" },
        "share": { type: "number" }
    },
    required: ["userId", "share"]
} as const;

export const expenseSchema = {
    type: "object",
    properties: {
        id: { type: "string" },
        name: { type: "string" },
        transactionDate: { type: "string", format: "date-time" },
        items: { type: "array", items: expenseItemSchema },
        userIds: { type: "array", items: { type: "string" } },
        payers: { type: "array", items: payerSchema },
        payerStatuses: { type: "array", items: payerStatusSchema },
    },
    required: ["id", "name", "transactionDate", "items", "userIds", "payers", "payerStatuses"],    
} as const;