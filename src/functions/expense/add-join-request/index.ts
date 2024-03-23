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
    vpc: {
        securityGroupIds: [
            "sg-e7cc00b2"
        ],
        subnetIds: [
            "subnet-0a5b5a6d",
            "subnet-e2d4d6be",
            "subnet-74e93839",
            "subnet-4ca6f372",
            "subnet-3bdc2735",
            "subnet-d7ede1f9"
        ]
    }
};
