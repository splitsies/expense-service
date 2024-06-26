import { VpcConfig } from "src/config/vpc.config";
import { handlerPath } from "../../../libs/handler-resolver";

export default {
    handler: `${handlerPath(__dirname)}/handler.main`,
    timeout: 60,
    events: [
        {
            http: {
                method: "post",
                authorizer: { name: "verifyToken" },
                path: "expenses/requests",
            },
        },
    ],
    vpc: VpcConfig.vpc,
};
