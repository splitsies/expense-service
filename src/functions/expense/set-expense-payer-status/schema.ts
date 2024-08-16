export default {
    type: "object",
    properties: {
        settled: { type: "boolean" },
    },
    required: ["settled"],
} as const;
