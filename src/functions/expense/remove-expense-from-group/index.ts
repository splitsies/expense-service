import { VpcConfig } from "src/config/vpc.config";
import { handlerPath } from "../../../libs/handler-resolver";

export default {
    handler: `${handlerPath(__dirname)}/handler.main`,
    timeout: 60,
    events: [
        {
            http: {
                method: "delete",
                path: "expenses/{expenseId}/children/{childExpenseId}",
                authorizer: { name: "verifyToken" },
            },
        },
    ],
    vpc: VpcConfig.vpc,
};
