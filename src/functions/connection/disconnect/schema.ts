export default {
    type: "object",
    properties: {
        requestContext: {
            type: "object",
            properties: {
                connectionId: { type: "S" },
            },
            required: ["connectionId"],
        },
    },
    required: ["requestContext"],
} as const;
