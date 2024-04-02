import schema from "./schema";
import { handlerPath } from "../../../libs/handler-resolver";
import { VpcConfig } from "src/config/vpc.config";

export default {
    handler: `${handlerPath(__dirname)}/handler.main`,
    timeout: 60,
    events: [
        {
            http: {
                method: "post",
                path: "expenses",
                authorizer: { name: "verifyToken" },
                request: {
                    schemas: {
                        "application/json": schema,
                    },
                },
            },
        },
    ],
    vpc: VpcConfig.vpc
};
