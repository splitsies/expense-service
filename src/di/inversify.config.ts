import "reflect-metadata";
import { Container } from "inversify";
import { IExpenseService } from "../services/expense-service/expense-service-interface";
import { ExpenseService } from "../services/expense-service/expense-service";
import { IExpenseManager } from "../managers/expense-manager/expense-manager-interface";
import {
    ApiKeyConfiguration,
    DynamoDbTransactionStrategy,
    IApiKeyConfiguration,
    IDynamoDbConfiguration,
    IDynamoDbTransactionStrategy,
    ILogger,
    IMessageQueueClient,
    IPageInfoMapper,
    Logger,
    MessageQueueClient,
    PageInfoMapper,
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
import { IExpensePayerDao } from "src/dao/expense-payer-dao/expense-payer-dao-interface";
import { ExpensePayerDao } from "src/dao/expense-payer-dao/expense-payer-dao";
import { ExpensePayerStatusDao } from "src/dao/expense-payer-status-dao/expense-payer-status-dao";
import { IExpensePayerStatusDao } from "src/dao/expense-payer-status-dao/expense-payer-status-dao-interface";
import { IExpenseOwnershipValidator } from "src/validators/expense-ownership-validator/expense-ownership-validator.i";
import { ExpenseOwnershipValidator } from "src/validators/expense-ownership-validator/expense-ownership-validator";
import { IParentChildUserSyncStrategy } from "src/strategies/parent-child-user-sync-strategy/parent-child-user-sync-strategy.i";
import { ParentChildUserSyncStrategy } from "src/strategies/parent-child-user-sync-strategy/parent-child-user-sync-strategy";
import { IUserExpenseStrategy } from "src/strategies/user-expense-strategy/user-expense-strategy.i";
import { UserExpenseStrategy } from "src/strategies/user-expense-strategy/user-expense-strategy";
import { ILeadingExpenseValidator } from "src/validators/leading-expense-validator/leading-expense-validator.i";
import { LeadingExpenseValidator } from "src/validators/leading-expense-validator/leading-expense-validator";
import { IExpenseWriteStrategy } from "src/strategies/expense-write-strategy/expense-write-strategy.i";
import { ExpenseWriteStrategy } from "src/strategies/expense-write-strategy/expense-write-strategy";
import { ILeadingExpenseDao } from "src/dao/leading-expense-dao/leading-expense-dao.i";
import { LeadingExpenseDao } from "src/dao/leading-expense-dao/leading-expense-dao";
import { ILeadingExpenseMapper } from "src/mappers/leading-expense-mapper/leading-expense-mapper.i";
import { LeadingExpenseMapper } from "src/mappers/leading-expense-mapper/leading-expense-mapper";
import { IExpenseGroupStrategy } from "src/strategies/expense-group-strategy/expense-group-strategy.i";
import { ExpenseGroupStrategy } from "src/strategies/expense-group-strategy/expense-group-strategy";
import { IUserExpenseDaMapper } from "src/mappers/user-expense-mapper/user-expense-mapper.i";
import { UserExpenseDaMapper } from "src/mappers/user-expense-mapper/user-expense-mapper";
import { IExpenseGroupDao } from "src/dao/expense-group-dao/expense-group-dao-interface";
import { ExpenseGroupDao } from "src/dao/expense-group-dao/expense-group-dao";
import { IUserDataStrategy } from "src/strategies/user-data-strategy/user-data-strategy.i";
import { UserDataStrategy } from "src/strategies/user-data-strategy/user-data-strategy";
import { ICrossGatewayTopicProvider } from "src/providers/cross-gateway-topic-provider/cross-gateway-topic-provider.i";
import { CrossStageTopicProvider } from "src/providers/cross-gateway-topic-provider/cross-gateway-topic-provider";
import { ISnsClientProvider } from "src/providers/sns-client-provider/sns-client-provider.i";
import { SnsClientProvider } from "src/providers/sns-client-provider/sns-client-provider";

const container = new Container({ defaultScope: "Singleton" });

container.bind<ILogger>(ILogger).to(Logger);

container.bind<IExpenseService>(IExpenseService).to(ExpenseService);
container.bind<IExpenseManager>(IExpenseManager).to(ExpenseManager);
container.bind<IDynamoDbConfiguration>(IDynamoDbConfiguration).to(DbConfiguration);
container.bind<IDbConfiguration>(IDbConfiguration).to(DbConfiguration);
container.bind<IConnectionConfiguration>(IConnectionConfiguration).to(ConnectionConfiguration);
container.bind<IExpenseDao>(IExpenseDao).to(ExpenseDao);

container.bind<IConnectionService>(IConnectionService).to(ConnectionService);
container.bind<IConnectionManager>(IConnectionManager).to(ConnectionManager);
container.bind<IConnectionDao>(IConnectionDao).to(ConnectionDao);

container.bind<IConnectionDaoStatements>(IConnectionDaoStatements).to(ConnectionDaoStatements);

container.bind<IUserExpenseDao>(IUserExpenseDao).to(UserExpenseDao);
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

container.bind<IExpensePayerDao>(IExpensePayerDao).to(ExpensePayerDao);
container.bind<IExpensePayerStatusDao>(IExpensePayerStatusDao).to(ExpensePayerStatusDao);
container.bind<IExpenseGroupDao>(IExpenseGroupDao).to(ExpenseGroupDao);
container.bind<IExpenseOwnershipValidator>(IExpenseOwnershipValidator).to(ExpenseOwnershipValidator);
container.bind<IParentChildUserSyncStrategy>(IParentChildUserSyncStrategy).to(ParentChildUserSyncStrategy);
container.bind<IUserExpenseStrategy>(IUserExpenseStrategy).to(UserExpenseStrategy);
container.bind<ILeadingExpenseValidator>(ILeadingExpenseValidator).to(LeadingExpenseValidator);
container.bind<IExpenseWriteStrategy>(IExpenseWriteStrategy).to(ExpenseWriteStrategy);
container.bind<ILeadingExpenseDao>(ILeadingExpenseDao).to(LeadingExpenseDao);
container.bind<ILeadingExpenseMapper>(ILeadingExpenseMapper).to(LeadingExpenseMapper);
container.bind<IExpenseGroupStrategy>(IExpenseGroupStrategy).to(ExpenseGroupStrategy);
container.bind<IDynamoDbTransactionStrategy>(IDynamoDbTransactionStrategy).to(DynamoDbTransactionStrategy);
container.bind<IUserExpenseDaMapper>(IUserExpenseDaMapper).to(UserExpenseDaMapper);
container.bind<IPageInfoMapper>(IPageInfoMapper).to(PageInfoMapper);
container.bind<IUserDataStrategy>(IUserDataStrategy).to(UserDataStrategy);
container.bind<ICrossGatewayTopicProvider>(ICrossGatewayTopicProvider).to(CrossStageTopicProvider);
container.bind<ISnsClientProvider>(ISnsClientProvider).to(SnsClientProvider);

export { container };
