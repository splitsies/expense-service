import type { AWS } from '@serverless/typescript';

import ocrApiConfig from "./src/config/ocr-api.config.json";
import algorithmsApiConfig from "./src/config/algorithms-api.config.json";
import dbConfig from "./src/config/db.config.json";
import connectionConfig from "./src/config/connection.config.json";

import createFromImage from '@functions/expense/create-from-image';
import create from '@functions/expense/create';
import update from '@functions/expense/update';

import connect from '@functions/connection/connect';

const serverlessConfiguration: AWS = {
    org: 'splitsies',
    app: 'expense-service',
    service: 'expense-service',
    frameworkVersion: '3',
    plugins: ['serverless-esbuild', 'serverless-offline'],
    provider: {
        name: 'aws',
        stage: 'dev',
        runtime: 'nodejs14.x',
        apiGateway: {
        minimumCompressionSize: 1024,
        shouldStartNameWithService: true,
        },
        environment: {
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
            NODE_OPTIONS: '--enable-source-maps --stack-trace-limit=1000',
            ...ocrApiConfig,
            ...algorithmsApiConfig,
            ...dbConfig,
            ...connectionConfig
        },
    },
    // import the function via paths
    functions: { create, createFromImage, update, connect },
    package: { individually: true },
    custom: {
        esbuild: {
            bundle: true,
            minify: false,
            sourcemap: true,
            exclude: ['aws-sdk'],
            target: 'node14',
            define: { 'require.resolve': undefined },
            platform: 'node',
            concurrency: 10,
        },
        "serverless-offline": {
            httpPort: 14623,
            websocketPort: 14624,
            lambdaPort: 14625
        }
    },
};

module.exports = serverlessConfiguration;
