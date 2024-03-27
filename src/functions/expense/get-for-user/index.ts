import { handlerPath } from "../../../libs/handler-resolver";

export default {
    handler: `${handlerPath(__dirname)}/handler.main`,
    timeout: 60,
    events: [
        {
            http: {
                method: "get",
                authorizer: { name: "verifyToken" },
                path: "expenses",
            },
        },
    ],
    vpc: {
        securityGroupIds: [
            "sg-0c856a69027cbbe51"
        ],
        subnetIds: [
            "subnet-01628c50fc43d2a65",
            "subnet-073d80ceea6995302",
            "subnet-0ca030cb2990146fd",
            "subnet-058fb9347a6e48a46",
            "subnet-0d9647cee3c8a8a54"
        ]
    }
};
