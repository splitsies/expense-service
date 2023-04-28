import type { AWS } from '@serverless/typescript';

import ocrApiConfig from "./src/config/ocr-api.config.json";

import createFromImage from '@functions/expense/create-from-image';

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
            ...ocrApiConfig
        },
    },
    // import the function via paths
    functions: { createFromImage },
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
