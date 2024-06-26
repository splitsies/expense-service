import "reflect-metadata";
import { Container } from "inversify";
import { IExpenseService } from "../services/expense-service/expense-service-interface";
import { ExpenseService } from "../services/expense-service/expense-service";
import { IExpenseManager } from "../managers/expense-manager/expense-manager-interface";
import {
    ApiKeyConfiguration,
    IApiKeyConfiguration,
    ILogger,
    IMessageQueueClient,
    Logger,
    MessageQueueClient,
} from "@splitsies/utils";
import { IDbConfiguration } from "src/models/configuration/db/db-configuration-interface";
import { DbConfiguration } from "src/models/configuration/db/db-configuration";
import { ExpenseDao } from "src/dao/expense-dao/expense-dao";
import { IExpenseDao } from "src/dao/expense-dao/expense-dao-interface";
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
import {
    ExpenseJoinRequestDaMapper,
    ExpenseMessageParametersMapper,
    ExpenseUserDetailsMapper,
    IExpenseJoinRequestDaMapper,
    IExpenseMessageParametersMapper,
    IExpenseUserDetailsMapper,
} from "@splitsies/shared-models";
import { IExpenseStatements } from "src/dao/expense-dao/expense-statements-interface";
import { ExpenseStatements } from "src/dao/expense-dao/expense-statements";
import { IExpenseBroadcaster } from "@libs/expense-broadcaster/expense-broadcaster-interface";
import { ExpenseBroadcaster } from "@libs/expense-broadcaster/expense-broadcaster";
import { IExpenseMessageStrategy } from "src/strategies/expense-message-strategy/expense-message-strategy-interface";
import { ExpenseMessageStrategy } from "src/strategies/expense-message-strategy/expense-message-strategy";
import { IExpenseDaMapper } from "src/mappers/expense-da-mapper-interface";
import { ExpenseDaMapper } from "src/mappers/expense-da-mapper";
import { IExpenseItemDao } from "src/dao/expense-item-dao/expense-item-dao-interface";
import { ExpenseItemDao } from "src/dao/expense-item-dao/expense-item-dao";
import { IExpenseDtoMapper } from "src/mappers/expense-dto-mapper/expense-dto-mapper-interface";
import { ExpenseDtoMapper } from "src/mappers/expense-dto-mapper/expense-dto-mapper";
import { IConnectionTokenDao } from "src/dao/connection-token-dao/connection-token-dao-interface";
import { ConnectionTokenDao } from "src/dao/connection-token-dao/connection-token-dao";
import { IConnectionTokenDaoStatements } from "src/dao/connection-token-dao/connection-token-dao-statements-interface";
import { ConnectionTokenDaoStatements } from "src/dao/connection-token-dao/connection-token-dao-statements";
const container = new Container({ defaultScope: "Singleton" });

container.bind<ILogger>(ILogger).to(Logger);

container.bind<IExpenseService>(IExpenseService).to(ExpenseService);
container.bind<IExpenseManager>(IExpenseManager).to(ExpenseManager);
container.bind<IDbConfiguration>(IDbConfiguration).to(DbConfiguration);
container.bind<IConnectionConfiguration>(IConnectionConfiguration).to(ConnectionConfiguration);
container.bind<IExpenseDao>(IExpenseDao).to(ExpenseDao);

container.bind<IConnectionService>(IConnectionService).to(ConnectionService);
container.bind<IConnectionManager>(IConnectionManager).to(ConnectionManager);
container.bind<IConnectionDao>(IConnectionDao).to(ConnectionDao);

container.bind<IConnectionDaoStatements>(IConnectionDaoStatements).to(ConnectionDaoStatements);

container.bind<IUserExpenseDao>(IUserExpenseDao).to(UserExpenseDao);
container.bind<IExpenseStatements>(IExpenseStatements).to(ExpenseStatements);
container.bind<IExpenseUserDetailsMapper>(IExpenseUserDetailsMapper).to(ExpenseUserDetailsMapper);
container.bind<IExpenseJoinRequestDaMapper>(IExpenseJoinRequestDaMapper).to(ExpenseJoinRequestDaMapper);
container.bind<IExpenseBroadcaster>(IExpenseBroadcaster).to(ExpenseBroadcaster);
container.bind<IApiKeyConfiguration>(IApiKeyConfiguration).to(ApiKeyConfiguration);

container.bind<IExpenseMessageStrategy>(IExpenseMessageStrategy).to(ExpenseMessageStrategy);
container.bind<IExpenseMessageParametersMapper>(IExpenseMessageParametersMapper).to(ExpenseMessageParametersMapper);

container.bind<IExpenseDaMapper>(IExpenseDaMapper).to(ExpenseDaMapper);
container.bind<IExpenseItemDao>(IExpenseItemDao).to(ExpenseItemDao);
container.bind<IExpenseDtoMapper>(IExpenseDtoMapper).to(ExpenseDtoMapper);
container.bind<IConnectionTokenDao>(IConnectionTokenDao).to(ConnectionTokenDao);
container.bind<IConnectionTokenDaoStatements>(IConnectionTokenDaoStatements).to(ConnectionTokenDaoStatements);
container.bind<IMessageQueueClient>(IMessageQueueClient).to(MessageQueueClient);
export { container };
