export default {
    type: "object",
    properties: {
        registeredUser: {
            type: "object",
            properties: {
                isRegistered: { type: "boolean" },
                id: { type: "string" },
                givenName: { type: "string" },
                familyName: { type: "string" },
                phoneNumber: { type: "string" },
            },
            required: ["isRegistered", "id", "givenName", "familyName", "phoneNumber"],
        },
    },
    required: ["registeredUser"],
} as const;
