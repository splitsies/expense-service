import type { AWS } from "@serverless/typescript";

import apiConfig from "./src/config/api.config.json";
import dbConfig from "./src/config/db.config.json";
import connectionConfig from "./src/config/connection.config.json";

import create from "@functions/expense/create";
import connect from "@functions/connection/connect";
import disconnect from "@functions/connection/disconnect";
import updateExpense from "@functions/connection/update-expense";
import deleteExpiredConnections from "@functions/connection/delete-expired";
import getForUser from "@functions/expense/get-for-user";

const serverlessConfiguration: AWS = {
    org: "splitsies",
    app: "expense-service",
    service: "expense-service",
    frameworkVersion: "3",
    plugins: ["serverless-esbuild", "serverless-offline"],
    provider: {
        name: "aws",
        stage: "dev-pr",
        runtime: "nodejs18.x",
        apiGateway: {
            minimumCompressionSize: 1024,
            shouldStartNameWithService: true,
        },
        environment: {
            AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
            NODE_OPTIONS: "--enable-source-maps --stack-trace-limit=1000",
            APIG_URL: "${param:APIG_URL}",
            ...apiConfig,
            ...dbConfig,
            ...connectionConfig,
        },
    },
    // import the function via paths
    functions: { create, connect, disconnect, updateExpense, deleteExpiredConnections, getForUser },
    package: { individually: true },
    custom: {
        apigUri: { "Fn::GetAtt": ["HttpApi", "ApiEndpoint"] },
        esbuild: {
            bundle: true,
            minify: false,
            sourcemap: true,
            exclude: ["aws-sdk"],
            target: "node18",
            define: { "require.resolve": undefined },
            platform: "node",
            concurrency: 10,
        },
        "serverless-offline": {
            httpPort: 14623,
            websocketPort: 14624,
            lambdaPort: 14625,
        },
    },
};

module.exports = serverlessConfiguration;
