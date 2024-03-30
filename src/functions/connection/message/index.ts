import { VpcConfig } from "src/config/vpc.config";
import { handlerPath } from "../../../libs/handler-resolver";

export default {
    handler: `${handlerPath(__dirname)}/handler.main`,
    events: [
        {
            websocket: {
                route: "$default",
            },
        },
    ],
    vpc: VpcConfig.vpc
};
