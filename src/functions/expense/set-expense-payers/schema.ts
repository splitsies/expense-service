const payerShareSchema = {
    type: "object",
    properties: {
        userId: { type: "string" },
        share: { type: "number" },
    },
    required: ["userId", "share"],
} as const;

export default {
    type: "object",
    properties: {
        payerShares: { type: "array", items: payerShareSchema },
    },
    required: ["payerShares"],
} as const;
