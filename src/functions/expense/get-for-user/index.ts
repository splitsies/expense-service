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
            "subnet-0ca030cb2990146fd",
        ]
    }
};
