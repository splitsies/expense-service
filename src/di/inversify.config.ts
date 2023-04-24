import "reflect-metadata";
import { Container } from "inversify";
import { IExpenseService } from "../services/expense-service-interface";
import { ExpenseService } from "../services/expense-service";
import { IExpenseEngine } from "../engines/expense-engine-interface";
import { ExpenseEngine } from "../engines/expense-engine";
import { IExpenseRepository } from "../repositories/expense-repository-interface";
import { ExpenseRepository } from "../repositories/expense-repository";
import { IImageExpenseProcessor } from "../processors/image-expense-processor/image-expense-processor-interface";
import { ImageExpenseProcessor } from "../processors/image-expense-processor/image-expense-processor";
import { IExpenseOcrMetadataProcessor } from "../processors/expense-ocr-metadata-processor/expense-ocr-metadata-processor-interface";
import { ExpenseOcrMetadataProcessor } from "../processors/expense-ocr-metadata-processor/expense-ocr-metadata-processor";
import { IExpenseNameProcessor } from "../processors/expense-name-processor/expense-name-processor-interface";
import { ExpenseNameProcessor } from "../processors/expense-name-processor/expense-name-processor";
import { ExpenseDateProcessor } from "../processors/expense-date-processor/expense-date-processor";
import { IExpenseDateProcessor } from "../processors/expense-date-processor/expense-date-processor-interface";
import { ExpenseItemsProcessor } from "../processors/expense-items-processor/expense-items-processor";
import { IExpenseItemsProcessor } from "../processors/expense-items-processor/expense-items-processor-interface";
import { IExpenseProportionalItemsProcessor } from "../processors/expense-proportional-items-processor/expense-proportional-items-processor-interface";
import { ExpenseProportionalItemsProcessor } from "../processors/expense-proportional-items-processor/expense-proportional-items-processor";

const container = new Container();

container.bind<IExpenseService>(IExpenseService).to(ExpenseService).inSingletonScope();
container.bind<IExpenseEngine>(IExpenseEngine).to(ExpenseEngine).inSingletonScope();
container.bind<IExpenseRepository>(IExpenseRepository).to(ExpenseRepository).inSingletonScope();
container.bind<IImageExpenseProcessor>(IImageExpenseProcessor).to(ImageExpenseProcessor).inSingletonScope();

container
    .bind<IExpenseOcrMetadataProcessor>(IExpenseOcrMetadataProcessor)
    .to(ExpenseOcrMetadataProcessor)
    .inSingletonScope();
container.bind<IExpenseNameProcessor>(IExpenseNameProcessor).to(ExpenseNameProcessor).inSingletonScope();
container.bind<IExpenseDateProcessor>(IExpenseDateProcessor).to(ExpenseDateProcessor).inSingletonScope();
container.bind<IExpenseItemsProcessor>(IExpenseItemsProcessor).to(ExpenseItemsProcessor).inSingletonScope();
container
    .bind<IExpenseProportionalItemsProcessor>(IExpenseProportionalItemsProcessor)
    .to(ExpenseProportionalItemsProcessor)
    .inSingletonScope();

export { container };
