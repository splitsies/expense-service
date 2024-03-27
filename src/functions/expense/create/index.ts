import schema from "./schema";
import { handlerPath } from "../../../libs/handler-resolver";

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
    vpc: {
        securityGroupIds: [
            "sg-0c856a69027cbbe51",
            "sg-0f8a62286187fbab0"
        ],
        subnetIds: [
            "subnet-0ca030cb2990146fd",
        ]
    }
};
