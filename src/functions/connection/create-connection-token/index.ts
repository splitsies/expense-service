import schema from "./schema";
import { handlerPath } from "../../../libs/handler-resolver";

export default {
    handler: `${handlerPath(__dirname)}/handler.main`,
    timeout: 60,
    events: [
        {
            http: {
                method: "post",
                path: "expenses/{expenseId}/connections/tokens",
                authorizer: { name: "verifyToken" },
                request: {
                    schemas: {
                        "application/json": schema,
                    },
                },
            },
        },
    ],
};
