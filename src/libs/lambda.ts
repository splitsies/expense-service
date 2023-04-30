import middy from "@middy/core";
import middyJsonBodyParser from "@middy/http-json-body-parser";
import wsJsonBodyParserMiddleware from "@middy/ws-json-body-parser";

export const middyfy = (handler) => {
    return middy(handler).use(middyJsonBodyParser());
};

export const middyfyWs = (handler) => {
    return middy(handler).use(wsJsonBodyParserMiddleware());
};
