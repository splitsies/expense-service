import "reflect-metadata";
import { Container } from "inversify";
import { IExpenseService } from "../services/expense-service/expense-service-interface";
import { ExpenseService } from "../services/expense-service/expense-service";
import { IExpenseManager } from "../managers/expense-manager/expense-manager-interface";
import {
    ExpenseMapper,
    ExpenseUpdateMapper,
    IExpenseMapper,
    IExpenseUpdateMapper,
    ILogger,
    Logger,
} from "@splitsies/utils";
import { IDbConfiguration } from "src/models/configuration/db/db-configuration-interface";
import { DbConfiguration } from "src/models/configuration/db/db-configuration";
import { ExpenseDao } from "src/dao/expense-dao/expense-dao";
import { IExpenseDao } from "src/dao/expense-dao/expense-dao-interface";
import { IAlgorithmsApiClient } from "src/api/algorithms-api-client/algorithms-api-client-interface";
import { AlgorithmsApiClient } from "src/api/algorithms-api-client/algorithms-api-client";
import { IConnectionDao } from "src/dao/connection-dao/connection-dao-interface";
import { ConnectionDao } from "src/dao/connection-dao/connection-dao";
import { IConnectionManager } from "src/managers/connection-manager/connection-manager-interface";
import { ConnectionManager } from "src/managers/connection-manager/connection-manager";
import { IConnectionService } from "src/services/connection-service/connection-service-interface";
import { ConnectionService } from "src/services/connection-service/connection-service";
import { IConnectionDaoStatements } from "src/dao/connection-dao/connection-dao-statements-interface";
import { ConnectionDaoStatements } from "src/dao/connection-dao/connection-dao-statements";
import { IConnectionConfiguration } from "src/models/configuration/connection/connection-configuration-interface";
import { ConnectionConfiguration } from "src/models/configuration/connection/connection-configuration";
import { ExpenseManager } from "src/managers/expense-manager/expense-manager";
import { IUserExpenseDao } from "src/dao/user-expense-dao/user-expense-dao-interface";
import { UserExpenseDao } from "src/dao/user-expense-dao/user-expense-dao";
import { IUserExpenseStatements } from "src/dao/user-expense-dao/user-expense-statements-interface";
import { UserExpenseStatements } from "src/dao/user-expense-dao/user-expense-statements";
import { IApiConfiguration } from "src/models/configuration/api/api-configuration-interface";
import { ApiConfiguration } from "src/models/configuration/api/api-configuration";
import { IOcrApiClient } from "src/api/ocr-api-client/ocr-api-client-interface";
import { OcrApiClient } from "src/api/ocr-api-client/ocr-api-client";
import { IUsersApiClient } from "src/api/users-api-client/users-api-client-interface";
import { UsersApiClient } from "src/api/users-api-client/users-api-client";

const container = new Container();

container.bind<ILogger>(ILogger).to(Logger).inSingletonScope();

container.bind<IExpenseService>(IExpenseService).to(ExpenseService).inSingletonScope();
container.bind<IExpenseManager>(IExpenseManager).to(ExpenseManager).inSingletonScope();
container.bind<IAlgorithmsApiClient>(IAlgorithmsApiClient).to(AlgorithmsApiClient).inSingletonScope();
container.bind<IOcrApiClient>(IOcrApiClient).to(OcrApiClient).inSingletonScope();
container.bind<IUsersApiClient>(IUsersApiClient).to(UsersApiClient).inSingletonScope();
container.bind<IApiConfiguration>(IApiConfiguration).to(ApiConfiguration).inSingletonScope();
container.bind<IDbConfiguration>(IDbConfiguration).to(DbConfiguration).inSingletonScope();
container.bind<IConnectionConfiguration>(IConnectionConfiguration).to(ConnectionConfiguration).inSingletonScope();
container.bind<IExpenseDao>(IExpenseDao).to(ExpenseDao).inSingletonScope();

container.bind<IExpenseMapper>(IExpenseMapper).to(ExpenseMapper).inSingletonScope();
container.bind<IExpenseUpdateMapper>(IExpenseUpdateMapper).to(ExpenseUpdateMapper).inSingletonScope();

container.bind<IConnectionService>(IConnectionService).to(ConnectionService).inSingletonScope();
container.bind<IConnectionManager>(IConnectionManager).to(ConnectionManager).inSingletonScope();
container.bind<IConnectionDao>(IConnectionDao).to(ConnectionDao).inSingletonScope();

container.bind<IConnectionDaoStatements>(IConnectionDaoStatements).to(ConnectionDaoStatements).inSingletonScope();

container.bind<IUserExpenseDao>(IUserExpenseDao).to(UserExpenseDao).inSingletonScope();
container.bind<IUserExpenseStatements>(IUserExpenseStatements).to(UserExpenseStatements).inSingletonScope();

export { container };
