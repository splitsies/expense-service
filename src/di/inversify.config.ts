import "reflect-metadata";
import { Container } from "inversify";
import { IExpenseService } from "../services/expense-service-interface";
import { ExpenseService } from "../services/expense-service";
import { IExpenseEngine } from "../engines/expense-engine-interface";
import { ExpenseEngine } from "../engines/expense-engine";
import { IOcrApiConfiguration } from "src/models/configuration/ocr-api/ocr-api-configuration-interface";
import { OcrApiConfiguration } from "src/models/configuration/ocr-api/ocr-api-configuration";
import { IOcrApi } from "src/api/ocr-api/ocr-api-client-interface";
import { OcrApiClient } from "src/api/ocr-api/ocr-api-client";
import { ILogger, Logger } from "@splitsies/utils";
import { IDbConfiguration } from "src/models/configuration/db/db-configuration-interface";
import { DbConfiguration } from "src/models/configuration/db/db-configuration";
import { ExpenseDao } from "src/dao/expense-dao/expense-dao";
import { IExpenseDao } from "src/dao/expense-dao/expense-dao-interface";
import { IExpenseMapper } from "src/mappers/expense-mapper/expense-mapper-interface";
import { ExpenseMapper } from "src/mappers/expense-mapper/expense-mapper";
import { IAlgorithmsApiClient } from "src/api/algorithms-api-client/algorithms-api-client-interface";
import { AlgorithmsApiClient } from "src/api/algorithms-api-client/algorithms-api-client";
import { IAlgorithmsApiConfiguration } from "src/models/configuration/algorithms-api/algorithms-api-configuration-interface";
import { AlgorithsmApiConfiguration } from "src/models/configuration/algorithms-api/algorithms-api-configuration";
import { IConnectionDao } from "src/dao/connection-dao/connection-dao-interface";
import { ConnectionDao } from "src/dao/connection-dao/connection-dao";
import { IConnectionEngine } from "src/engines/connection-engine/connection-engine-interface";
import { ConnectionEngine } from "src/engines/connection-engine/connection-engine";
import { IConnectionService } from "src/services/connection-service/connection-service-interface";
import { ConnectionService } from "src/services/connection-service/connection-service";
import { IConnectionDaoStatements } from "src/dao/connection-dao/connection-dao-statements-interface";
import { ConnectionDaoStatements } from "src/dao/connection-dao/connection-dao-statements";
import { IConnectionConfiguration } from "src/models/configuration/connection/connection-configuration-interface";
import { ConnectionConfiguration } from "src/models/configuration/connection/connection-configuration";

const container = new Container();

container.bind<ILogger>(ILogger).to(Logger).inSingletonScope();

container.bind<IExpenseService>(IExpenseService).to(ExpenseService).inSingletonScope();
container.bind<IExpenseEngine>(IExpenseEngine).to(ExpenseEngine).inSingletonScope();
container.bind<IAlgorithmsApiClient>(IAlgorithmsApiClient).to(AlgorithmsApiClient).inSingletonScope();
container
    .bind<IAlgorithmsApiConfiguration>(IAlgorithmsApiConfiguration)
    .to(AlgorithsmApiConfiguration)
    .inSingletonScope();
container.bind<IOcrApi>(IOcrApi).to(OcrApiClient).inSingletonScope();
container.bind<IOcrApiConfiguration>(IOcrApiConfiguration).to(OcrApiConfiguration).inSingletonScope();
container.bind<IDbConfiguration>(IDbConfiguration).to(DbConfiguration).inSingletonScope();
container.bind<IConnectionConfiguration>(IConnectionConfiguration).to(ConnectionConfiguration).inSingletonScope();
container.bind<IExpenseDao>(IExpenseDao).to(ExpenseDao).inSingletonScope();

container.bind<IExpenseMapper>(IExpenseMapper).to(ExpenseMapper).inSingletonScope();

container.bind<IConnectionService>(IConnectionService).to(ConnectionService).inSingletonScope();
container.bind<IConnectionEngine>(IConnectionEngine).to(ConnectionEngine).inSingletonScope();
container.bind<IConnectionDao>(IConnectionDao).to(ConnectionDao).inSingletonScope();

container.bind<IConnectionDaoStatements>(IConnectionDaoStatements).to(ConnectionDaoStatements).inSingletonScope();

export { container };
