export default {
    type: "object",
    properties: {
        image: { type: "string" }, // base64 encoded image
    },
    required: ["image"],
} as const;
