import { injectable } from "inversify";
import { randomUUID } from "crypto";
import { ExpenseItem, IOcrResult, ITextBlock, IBoundingBox, IExpenseItem } from "@splitsies/shared-models";
import { IExpenseItemsProcessor } from "./expense-items-processor-interface";
import { IExpenseOcrMetadata } from "../../models/expense-ocr-metadata/expense-ocr-metadata-interface";
import { ExpenseRegex } from "src/constants/expense-regex";

@injectable()
export class ExpenseItemsProcessor implements IExpenseItemsProcessor {
    private readonly STANDARD_DEV_THRESHOLD = 2.5;

    process(ocrResult: IOcrResult, metadata: IExpenseOcrMetadata): IExpenseItem[] {
        const items = new Array<IExpenseItem>();

        for (let i = 0; i < ocrResult.textBlocks.length; i++) {
            const block = ocrResult.textBlocks[i];
            if (block.boundingBox.top > metadata.lastTotalPosition) break;

            const priceSearchResult = ExpenseRegex.Price.exec(block.text);
            if (!priceSearchResult || !priceSearchResult.length || block.text.includes("%")) continue;

            const priceBlock = ocrResult.textBlocks[i];
            const itemName = this.getMatchingItem(ocrResult, i, metadata);
            if (!itemName) continue;

            const percentSearchResult = ExpenseRegex.Percent.test(itemName);
            const price = this.formatPrice(priceBlock.text);

            if (price !== 0 && price < metadata.maxPrice && !percentSearchResult) {
                const item = this.getLineItem(itemName, priceBlock.text);
                if (item) items.push(item);
            }
        }

        return items;
    }

    protected formatPrice(priceText: string): number {
        // Formats price string to (-)0.00 format
        if (priceText[0] === priceText && priceText[priceText.length - 1] === ")") {
            // Negative denoted by parentheses -- Replace the parentheses with negative sign
            priceText = `$-${priceText.slice(1, priceText.length)}`;
        }

        // Reformat the price by stripping all non-numeric characters and replacing the decimal
        const strippedPrice = priceText.replace(/[^\-\d\.]/, "");
        return parseFloat(strippedPrice);
    }

    protected createExpenseItem(
        itemText: string,
        priceText: string,
        isTax: boolean,
        isTip: boolean,
        isSubtotal: boolean,
        isSubtotalAbbrev: boolean,
        isTotal: boolean,
    ): IExpenseItem | undefined {
        if (isTax && !(isSubtotal || isSubtotalAbbrev)) {
            return undefined;
        } else if (isTip && !(isSubtotal || isSubtotalAbbrev)) {
            return undefined;
        } else if (!(isSubtotal || isTotal || (isTax && isSubtotalAbbrev))) {
            return new ExpenseItem(randomUUID(), itemText, this.formatPrice(priceText), []);
        }
    }

    private getLineItem(itemText: string, priceText: string): IExpenseItem {
        const isTax = ExpenseRegex.Tax.test(itemText);
        const isTip = ExpenseRegex.Tip.test(itemText);
        const isSubtotal = ExpenseRegex.Subtotal.test(itemText);
        const isSubtotalAbbrev = ExpenseRegex.SubtotalAbbrev.test(itemText);
        const isTotal = ExpenseRegex.Total.test(itemText);

        return this.createExpenseItem(itemText, priceText, isTax, isTip, isSubtotal, isSubtotalAbbrev, isTotal);
    }

    private getMatchingItem(ocrResult: IOcrResult, priceBlockIndex: number, metadata: IExpenseOcrMetadata): string {
        const priceBlock = ocrResult.textBlocks[priceBlockIndex];

        // join the text of everything preceding the price block until we don't have a valid slope
        // i.e. find the words before the price on the same line
        let prev = priceBlockIndex - 1;
        let blocks = [];
        while (prev >= 0 && this.isValidSlope(ocrResult.textBlocks[prev], priceBlock, metadata)) {
            blocks = [ocrResult.textBlocks[prev], ...blocks];
            prev -= 1;
        }

        if (blocks.length === 0) return undefined;

        return blocks.map((b) => b.text).join(" ");
    }

    private getSlope(itemBox: IBoundingBox, priceBox: IBoundingBox): number {
        if (priceBox.left <= itemBox.left) return Infinity;
        return (priceBox.top - itemBox.top) / (priceBox.left - itemBox.left);
    }

    /**
     * Returns true if the slope between item and price is within 3 standard deviations from the mean slope
     */
    private isValidSlope(itemBlock: ITextBlock, priceBlock: ITextBlock, metadata: IExpenseOcrMetadata): boolean {
        const slope = this.getSlope(itemBlock.boundingBox, priceBlock.boundingBox);
        const threshold = this.STANDARD_DEV_THRESHOLD * metadata.slopeStandardDeviation;

        // 65-95-99.7 rule - 99.7% of distribution is within 3 std from the mean
        return slope > metadata.slopeMean - threshold && slope < metadata.slopeMean + threshold;
    }
}
