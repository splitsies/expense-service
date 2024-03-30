import { handlerPath } from "../../../libs/handler-resolver";

export default {
    handler: `${handlerPath(__dirname)}/handler.main`,
    timeout: 60,
    events: [
        {
            http: {
                method: "get",
                authorizer: { name: "verifyToken" },
                path: "expenses/{expenseId}/requests",
            },
        },
    ],
    vpc: {
        securityGroupIds: [
            "sg-0c856a69027cbbe51",
            "sg-0f8a62286187fbab0"
        ],
        subnetIds: [
            "subnet-0301a21d6a9ca2e03",
        ]
    }
};
