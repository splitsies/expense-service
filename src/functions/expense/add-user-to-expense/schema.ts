export default {
    type: "object",
    properties: {
        userId: { type: "string" },
        requestingUserId: { type: "string" },
    },
    required: ["userId"],
} as const;
