import middy from "@middy/core";
import middyJsonBodyParser from "@middy/http-json-body-parser";
import wsJsonBodyParserMiddleware from "@middy/ws-json-body-parser";
import doNotWaitForEmptyEventLoop from '@middy/do-not-wait-for-empty-event-loop'

export const middyfy = (handler) => {
    return middy(handler).use(middyJsonBodyParser()).use(doNotWaitForEmptyEventLoop());
};

export const middyfyWs = (handler) => {
    return middy(handler).use(wsJsonBodyParserMiddleware());
};
