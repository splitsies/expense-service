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
import verifyApiKey from "@functions/auth/verify-api-key";
import getUsersForExpense from "@functions/expense/get-users-for-expense";
import getJoinRequests from "@functions/expense/get-join-requests";
import addJoinRequest from "@functions/expense/add-join-request";
import removeJoinRequest from "@functions/expense/remove-join-request";
import getJoinRequestsForExpense from "@functions/expense/get-join-requests-for-expense";
import mergeGuestUser from "@functions/expense/merge-guest-user";
import removeUserFromExpense from "@functions/expense/delete-user-from-expense";

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
        // vpc: {
        //     securityGroupIds: [
        //         "sg-e7cc00b2"
        //     ],
        //     subnetIds: [
        //         "subnet-0a5b5a6d",
        //         "subnet-e2d4d6be",
        //         "subnet-74e93839",
        //         "subnet-4ca6f372",
        //         "subnet-3bdc2735",
        //         "subnet-d7ede1f9"
        //     ]
        // }
    },
    // import the function via paths
    functions: {
        verifyToken,
        verifyApiKey,
        create,
        connect,
        disconnect,
        message,
        deleteExpiredConnections,
        getForUser,
        addUserToExpense,
        getExpense,
        getUsersForExpense,
        getJoinRequests,
        addJoinRequest: addJoinRequest,
        removeJoinRequest,
        getJoinRequestsForExpense,
        mergeGuestUser,
        removeUserFromExpense,
    },
    package: { individually: true },
    custom: {
        apigUri: { "Fn::GetAtt": ["HttpApi", "ApiEndpoint"] },
        esbuild: {
            format: "esm",
            bundle: true,
            minify: true,
            sourcemap: true,
            sourcesContent: false,
            keepNames: false,
            outputFileExtension: ".mjs",
            exclude: ["aws-sdk"],
            target: "node18",
            define: { "require.resolve": undefined },
            platform: "node",
            concurrency: 10,
            banner: {
                // https://github.com/evanw/esbuild/issues/1921
                js: "import { createRequire } from 'module';const require = createRequire(import.meta.url);",
            },
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
