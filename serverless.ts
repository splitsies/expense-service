import type { AWS } from "@serverless/typescript";

import apiConfig from "./src/config/api.config.json";
import dbConfig from "./src/config/db.config.json";
import connectionConfig from "./src/config/connection.config.json";
import firebaseConfig from "./src/config/firebase.config.json";

import create from "@functions/expense/create";
import connect from "@functions/connection/connect";
import disconnect from "@functions/connection/disconnect";
import message from "@functions/connection/message";
import deleteExpiredConnections from "@functions/connection/delete-expired";
import getForUser from "@functions/expense/get-for-user";
import addUserToExpense from "@functions/expense/add-user-to-expense";
import getExpense from "@functions/expense/get";
import verifyToken from "@functions/auth/verify-token";
import getUsersForExpense from "@functions/expense/get-users-for-expense";

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
        httpApi: {
            authorizers: {
                verifyToken: {
                    identitySource: "$request.header.Authorization",
                    issuerUrl: "https://securetoken.google.com/splitsies-${sls:stage}",
                    audience: ["splitsies-${sls:stage}"],
                },
            },
        },
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
            ...firebaseConfig,
        },
    },
    // import the function via paths
    functions: {
        verifyToken,
        create,
        connect,
        disconnect,
        message,
        deleteExpiredConnections,
        getForUser,
        addUserToExpense,
        getExpense,
        getUsersForExpense,
    },
    package: { individually: true },
    custom: {
        apigUri: { "Fn::GetAtt": ["HttpApi", "ApiEndpoint"] },
        esbuild: {
            bundle: true,
            minify: false,
            sourcemap: true,
            exclude: [],
            target: "node18",
            define: { "require.resolve": undefined },
            platform: "node",
            concurrency: 10,
        },
        "serverless-offline": {
            httpPort: 14623,
            websocketPort: 14624,
            lambdaPort: 14625,
            ignoreJWTSignature: true,
        },
    },
};

module.exports = serverlessConfiguration;
