import { handlerPath } from "../../../libs/handler-resolver";
import schema from "./schema";

export default {
    handler: `${handlerPath(__dirname)}/handler.main`,
    timeout: 60,
    events: [
        {
            http: {
                method: "put",
                path: "expenses/{expenseId}/children",
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
