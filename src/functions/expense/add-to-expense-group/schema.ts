import { expenseSchema } from "../../../libs/expense-schema";

export default {
    type: "object",
    properties: {
        expense: expenseSchema,
    },
} as const;
