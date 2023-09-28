export default {
    type: "object",
    properties: {
        userId: { type: "string" },
        image: { type: "string" }, // base64 encoded image
    },
    required: ["userId"],
} as const;
