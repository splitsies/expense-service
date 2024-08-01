import type { AWS } from "@serverless/typescript";

const slsConfig = require("./serverless");

const serverlessConfiguration: AWS = {
    ...slsConfig.serverlessConfiguration,
    resources: undefined,
};

module.exports = serverlessConfiguration;
