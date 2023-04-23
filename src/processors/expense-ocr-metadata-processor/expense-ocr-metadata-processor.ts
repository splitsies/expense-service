import { injectable } from "inversify";
import { std, mean } from "mathjs";
import { IExpenseOcrMetadataProcessor } from "./expense-ocr-metadata-processor-interface";
import { IBoundingBox, IOcrResult } from "@splitsies/shared-models";
import { ExpenseOcrMetadata } from "../../models/expense-ocr-metadata/expense-ocr-metadata";
import { IExpenseOcrMetadata } from "../../models/expense-ocr-metadata/expense-ocr-metadata-interface";
import { ExpenseRegex } from "../../constants/expense-regex";

@injectable()
export class ExpenseOcrMetadataProcessor
  implements IExpenseOcrMetadataProcessor
{
  private static readonly OUTLIER_SLOPE_THRESHOLD = 1;

  process(ocrResult: IOcrResult): IExpenseOcrMetadata {
    let maxPrice = -Infinity;
    const lastTotalPosition = this.getBoundingBoxUpperLimit(ocrResult);
    const slopes: number[] = [];

    for (let i = 1; i < ocrResult.textBlocks.length; i++) {
      // Assume item is the block preceding the price
      const priceBlock = ocrResult.textBlocks[i];
      const itemBlock = ocrResult.textBlocks[i - 1];

      // Stop iteration if past the stop marker (lastTotalPosition)
      if (
        Math.min(priceBlock.boundingBox.top, itemBlock.boundingBox.top) >
        lastTotalPosition
      )
        continue;

      const priceSearchResult = ExpenseRegex.RE_PRICE.exec(priceBlock.text);
      if (!priceSearchResult.length || priceBlock.text.includes("%")) continue;

      const slope = this.getSlope(
        itemBlock.boundingBox,
        priceBlock.boundingBox
      );
      if (Math.abs(slope) < ExpenseOcrMetadataProcessor.OUTLIER_SLOPE_THRESHOLD)
        slopes.push(slope);

      // Match price_block against both price and total in case it was picked up as one line
      if (
        ExpenseRegex.RE_TOTAL.test(priceBlock.text) ||
        ExpenseRegex.RE_TOTAL.test(itemBlock.text)
      ) {
        maxPrice = Math.max(maxPrice, parseFloat(priceSearchResult[0]));
      }
    }

    const slopeMean = mean(...slopes) as number;
    const slopeStandardDeviation = std(...slopes);
    return new ExpenseOcrMetadata(
      lastTotalPosition,
      maxPrice,
      slopeMean,
      slopeStandardDeviation
    );
  }

  /**
   * Gets the Top of the BoundingBox of the last found Total on the receipt
   * The bounding boxes are already in reading order from textract, so Top elements are
   * generally increasing
   */
  private getBoundingBoxUpperLimit(ocrResult: IOcrResult): number {
    let topOfLastTotal = -Infinity;
    for (let i = 1; i < ocrResult.textBlocks.length; i++) {
      const itemBlock =
        ocrResult.textBlocks[i - 1].text === "$"
          ? ocrResult.textBlocks[i - 2]
          : ocrResult.textBlocks[i - 1];
      const priceBlock = ocrResult.textBlocks[i];

      if (
        ExpenseRegex.RE_PRICE.test(priceBlock.text) &&
        ExpenseRegex.RE_TOTAL.test(priceBlock.text)
      ) {
        // Match price_block against both price and total in case it was picked up as one line
        topOfLastTotal = priceBlock.boundingBox.top;
      } else if (
        ExpenseRegex.RE_PRICE.test(priceBlock.text) &&
        ExpenseRegex.RE_TOTAL.test(itemBlock.text)
      ) {
        // Otherwise match the price and item block separately
        topOfLastTotal = Math.max(
          itemBlock.boundingBox.top,
          priceBlock.boundingBox.top
        );
      }
    }

    if (topOfLastTotal === -Infinity) return 1;

    return topOfLastTotal;
  }

  private getSlope(itemBox: IBoundingBox, priceBox: IBoundingBox): number {
    return (priceBox.top - itemBox.top) / (priceBox.left - itemBox.left);
  }
}
