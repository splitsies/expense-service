import type { ValidatedEventAPIGatewayProxyEvent } from "../../../libs/api-gateway";
import { formatJSONResponse } from "@libs/api-gateway";
import { middyfy } from "../../../libs/lambda";
import { container } from "../../../di/inversify.config";
import { IExpenseService } from "../../../services/expense-service-interface";
import schema from "./schema";
import { DataResponse, HttpStatusCode, IExpense } from "@splitsies/shared-models";

const expenseService = container.get<IExpenseService>(IExpenseService);

const process: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
    let result: IExpense[] = [];
    let statusCode = HttpStatusCode.OK;

    try {
        result = await expenseService.createExpenseFromImage(event.body.image);
    } catch (ex) {
        console.error(ex);
        statusCode = HttpStatusCode.BAD_REQUEST;
    }

    return formatJSONResponse({ message: result, event }, statusCode);
};

export const main = middyfy(process);
