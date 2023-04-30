export default {
    type: "object",
    properties: {
        queryStringParameters: {
            type: "object",
            properties: { expenseId: { type: "S" } },
            required: ["expenseId"],
        },
        requestContext: {
            type: "object",
            properties: { connectionId: { type: "S" } },
            required: ["connectionId"],
        },
    },
    required: ["name"],
} as const;
