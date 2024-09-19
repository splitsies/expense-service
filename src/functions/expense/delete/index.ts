import { handlerPath } from "../../../libs/handler-resolver";
import { VpcConfig } from "src/config/vpc.config";

export default {
    handler: `${handlerPath(__dirname)}/handler.main`,
    timeout: 60,
    events: [
        {
            http: {
                method: "delete",
                path: "expenses/{expenseId}",
                authorizer: { name: "verifyToken" },
            },
        },
    ],
    vpc: VpcConfig.vpc,
};
