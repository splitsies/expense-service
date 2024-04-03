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
import { IFirebaseConfiguration } from "src/models/configuration/firebase/firebase-configuration-interface";
import { FirebaseConfiguration } from "src/models/configuration/firebase/firebase-configuration";
import { IAdminAuthProvider } from "src/providers/admin-auth-provider-interface";
import { AdminAuthProvider } from "src/providers/admin-auth-provider";
import { IJwtStrategyProvider } from "src/providers/jwt-strategy-provider/jwt-strategy-provider-interface";
import { JwtStrategyProvider } from "src/providers/jwt-strategy-provider/jwt-strategy-provider";
import { IEmulatedJwtAuthStrategy } from "src/strategies/jwt-auth-strategy/emulated-jwt-auth-strategy/emulated-jwt-auth-strategy-interface";
import { EmulatedJwtAuthStrategy } from "src/strategies/jwt-auth-strategy/emulated-jwt-auth-strategy/emulated-jwt-auth-strategy";
import { IFirebaseJwtAuthStrategy } from "src/strategies/jwt-auth-strategy/firebase-jwt-auth-strategy/firebase-jwt-auth-strategy-interface";
import { FirebaseJwtAuthStrategy } from "src/strategies/jwt-auth-strategy/firebase-jwt-auth-strategy/firebase-jwt-auth-strategy";
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
import { IExpenseJoinRequestDao } from "src/dao/expense-join-request-dao/expense-join-request-dao-interface";
import { ExpenseJoinRequestDao } from "src/dao/expense-join-request-dao/expense-join-request-dao";
import { IExpenseJoinRequestStatements } from "src/dao/expense-join-request-dao/expense-join-request-statements-interface";
import { ExpenseJoinRequestStatements } from "src/dao/expense-join-request-dao/expense-join-request-statements";
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
const container = new Container();

container.bind<ILogger>(ILogger).to(Logger).inSingletonScope();

container.bind<IExpenseService>(IExpenseService).to(ExpenseService).inSingletonScope();
container.bind<IExpenseManager>(IExpenseManager).to(ExpenseManager).inSingletonScope();
container.bind<IDbConfiguration>(IDbConfiguration).to(DbConfiguration).inSingletonScope();
container.bind<IConnectionConfiguration>(IConnectionConfiguration).to(ConnectionConfiguration).inSingletonScope();
container.bind<IExpenseDao>(IExpenseDao).to(ExpenseDao).inSingletonScope();

container.bind<IConnectionService>(IConnectionService).to(ConnectionService).inSingletonScope();
container.bind<IConnectionManager>(IConnectionManager).to(ConnectionManager).inSingletonScope();
container.bind<IConnectionDao>(IConnectionDao).to(ConnectionDao).inSingletonScope();

container.bind<IConnectionDaoStatements>(IConnectionDaoStatements).to(ConnectionDaoStatements).inSingletonScope();

container.bind<IUserExpenseDao>(IUserExpenseDao).to(UserExpenseDao).inSingletonScope();
container.bind<IFirebaseConfiguration>(IFirebaseConfiguration).to(FirebaseConfiguration).inSingletonScope();
container.bind<IAdminAuthProvider>(IAdminAuthProvider).to(AdminAuthProvider).inSingletonScope();
container.bind<IJwtStrategyProvider>(IJwtStrategyProvider).to(JwtStrategyProvider).inSingletonScope();
container.bind<IEmulatedJwtAuthStrategy>(IEmulatedJwtAuthStrategy).to(EmulatedJwtAuthStrategy).inSingletonScope();
container.bind<IFirebaseJwtAuthStrategy>(IFirebaseJwtAuthStrategy).to(FirebaseJwtAuthStrategy).inSingletonScope();
container.bind<IExpenseStatements>(IExpenseStatements).to(ExpenseStatements).inSingletonScope();
container.bind<IExpenseUserDetailsMapper>(IExpenseUserDetailsMapper).to(ExpenseUserDetailsMapper).inSingletonScope();
container.bind<IExpenseJoinRequestDao>(IExpenseJoinRequestDao).to(ExpenseJoinRequestDao).inSingletonScope();
container
    .bind<IExpenseJoinRequestStatements>(IExpenseJoinRequestStatements)
    .to(ExpenseJoinRequestStatements)
    .inSingletonScope();
container
    .bind<IExpenseJoinRequestDaMapper>(IExpenseJoinRequestDaMapper)
    .to(ExpenseJoinRequestDaMapper)
    .inSingletonScope();
container.bind<IExpenseBroadcaster>(IExpenseBroadcaster).to(ExpenseBroadcaster).inSingletonScope();
container.bind<IApiKeyConfiguration>(IApiKeyConfiguration).to(ApiKeyConfiguration).inSingletonScope();

container.bind<IExpenseMessageStrategy>(IExpenseMessageStrategy).to(ExpenseMessageStrategy).inSingletonScope();
container
    .bind<IExpenseMessageParametersMapper>(IExpenseMessageParametersMapper)
    .to(ExpenseMessageParametersMapper)
    .inSingletonScope();

container.bind<IExpenseDaMapper>(IExpenseDaMapper).to(ExpenseDaMapper).inSingletonScope();
container.bind<IExpenseItemDao>(IExpenseItemDao).to(ExpenseItemDao).inSingletonScope();
container.bind<IExpenseDtoMapper>(IExpenseDtoMapper).to(ExpenseDtoMapper).inSingletonScope();
container.bind<IConnectionTokenDao>(IConnectionTokenDao).to(ConnectionTokenDao).inSingletonScope();
container
    .bind<IConnectionTokenDaoStatements>(IConnectionTokenDaoStatements)
    .to(ConnectionTokenDaoStatements)
    .inSingletonScope();
container.bind<IMessageQueueClient>(IMessageQueueClient).to(MessageQueueClient).inSingletonScope();
export { container };
