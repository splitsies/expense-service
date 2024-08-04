export default {
    type: "object",
    properties: {
        queryStringParameters: {
            type: "object",
            properties: { expenseId: { type: "S" }, authToken: { type: "S" }, ping: { type: "B" } },
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
