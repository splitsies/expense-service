import type { AWS } from "@serverless/typescript";

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
import createConnectionToken from "@functions/connection/create-connection-token";
import broadcast from "@functions/connection/broadcast";
import deleteUserData from "@functions/expense/delete-user-data";
import getJoinRequestCountForUser from "@functions/expense/get-join-request-count";
import setExpensePayers from "@functions/expense/set-expense-payers";
import setExpensePayerStatus from "@functions/expense/set-expense-payer-status";
import addNewExpenseToGroup from "@functions/expense/add-new-expense-to-group";
import addExistingExpenseToGroup from "@functions/expense/add-existing-expense-to-group";
import removeExpenseFromGroup from "@functions/expense/remove-expense-from-group";
import deleteExpense from "@functions/expense/delete";

const serverlessConfiguration: AWS = {
    service: "expense-service",
    frameworkVersion: "3",
    plugins: ["serverless-esbuild", "serverless-offline"],
    provider: {
        name: "aws",
        stage: "dev",
        runtime: "nodejs18.x",
        iam: {
            role: {
                statements: [
                    {
                        Effect: "Allow",
                        Action: [
                            "dynamodb:*"
                        ],
                        Resource: [
                            "arn:aws:dynamodb:${param:DB_REGION}:${param:RESOURCE_ACCOUNT_ID}:table/*",
                            "arn:aws:dynamodb:${param:DB_REGION}:${param:RESOURCE_ACCOUNT_ID}:table/*/index/*",
                            "arn:aws:dynamodb:${param:DB_REGION}:${aws:accountId}:table/MessageQueue",
                            "${param:MESSAGE_QUEUE_ARN}",
                        ],
                    },
                ],
            },
        },
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
            NODE_OPTIONS: "--stack-trace-limit=1000",
            APIG_URL: "${param:APIG_URL}",
            FIREBASE_AUTH_EMULATOR_HOST: process.env.FIREBASE_AUTH_EMULATOR_HOST,
            STAGE: "${param:QUEUE_STAGE_NAME}",
            AWS_ACCOUNT_ID: "${aws:accountId}",
            ...dbConfig,
            ...connectionConfig,
            ...firebaseConfig,
        },
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
        addJoinRequest,
        removeJoinRequest,
        getJoinRequestsForExpense,
        mergeGuestUser,
        removeUserFromExpense,
        createConnectionToken,
        broadcast,
        deleteUserData,
        getJoinRequestCountForUser,
        setExpensePayers,
        setExpensePayerStatus,
        addNewExpenseToGroup,
        addExistingExpenseToGroup,
        removeExpenseFromGroup,
        deleteExpense,
    },
    package: { individually: true },
    custom: {
        apigUri: { "Fn::GetAtt": ["HttpApi", "ApiEndpoint"] },
        esbuild: {
            format: "esm",
            bundle: true,
            minify: true,
            sourcemap: false,
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
