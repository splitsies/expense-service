import { handlerPath } from "../../../libs/handler-resolver";
import { VpcConfig } from "../../../config/vpc.config";

export default {
    handler: `${handlerPath(__dirname)}/handler.main`,
    events: [
        {
            websocket: {
                route: "$connect",
            },
        },
    ],
    vpc: VpcConfig.vpc,
};
