import { injectable } from "inversify";
import { randomUUID } from "crypto";
import { ExpenseItem, IOcrResult, ITextBlock, IBoundingBox, IExpenseItem } from "@splitsies/shared-models";
import { IExpenseItemsProcessor } from "./expense-items-processor-interface";
import { IExpenseOcrMetadata } from "../../models/expense-ocr-metadata/expense-ocr-metadata-interface";
import { ExpenseRegex } from "src/constants/expense-regex";

@injectable()
export class ExpenseItemsProcessor implements IExpenseItemsProcessor {
    private readonly STANDARD_DEV_THRESHOLD = 3;
    private readonly SLOPE_DIFFERENCE_THRESHOLD = 3;
    private readonly SearchSpaceOffset = 3;

    process(ocrResult: IOcrResult, metadata: IExpenseOcrMetadata): IExpenseItem[] {
        const items = new Array<IExpenseItem>();

        for (let i = 0; i < ocrResult.textBlocks.length; i++) {
            const block = ocrResult.textBlocks[i];
            if (block.boundingBox.top > metadata.lastTotalPosition) break;

            const priceSearchResult = ExpenseRegex.Price.exec(block.text);
            if (!priceSearchResult.length || block.text.includes("%")) continue;
            const priceBlock = ocrResult.textBlocks[i];
            const itemBlock = this.getMatchingItem(ocrResult, i, metadata);
            if (!itemBlock) continue;
            // format price
            ExpenseRegex.Percent.exec(itemBlock.text);
            const percentSearchResult = ExpenseRegex.Percent.test(itemBlock.text);
            const price = parseFloat(priceBlock.text);

            if (price !== 0 && price < metadata.maxPrice && !percentSearchResult) {
                items.push(this.getLineItem(itemBlock, priceBlock));
            }
        }

        return items;
    }

    protected createExpenseItem(
        itemBlock: ITextBlock,
        priceBlock: ITextBlock,
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
            return new ExpenseItem(randomUUID(), itemBlock.text, parseFloat(priceBlock.text), []);
        }
    }

    private getLineItem(itemBlock: ITextBlock, priceBlock: ITextBlock): IExpenseItem {
        const isTax = ExpenseRegex.Tax.test(itemBlock.text);
        const isTip = ExpenseRegex.Tip.test(itemBlock.text);
        const isSubtotal = ExpenseRegex.Subtotal.test(itemBlock.text);
        const isSubtotalAbbrev = ExpenseRegex.SubtotalAbbrev.test(itemBlock.text);
        const isTotal = ExpenseRegex.Total.test(itemBlock.text);

        return this.createExpenseItem(itemBlock, priceBlock, isTax, isTip, isSubtotal, isSubtotalAbbrev, isTotal);
    }

    private getMatchingItem(ocrResult: IOcrResult, priceBlockIndex: number, metadata: IExpenseOcrMetadata): ITextBlock {
        const dollarRegex = /(\s?\d+\s?$|s?\$\s?$)/;
        // return match
        const priceBlock = ocrResult.textBlocks[priceBlockIndex];
        const searchSpace = [
            ...ocrResult.textBlocks.slice(Math.min(0, priceBlockIndex - this.SearchSpaceOffset)),
            ...ocrResult.textBlocks.slice(priceBlockIndex + 1 + this.SearchSpaceOffset, ocrResult.textBlocks.length),
        ].filter((b) => this.isValidSlope(b, priceBlock, metadata));

        if (searchSpace.length === 1) {
            return searchSpace[0];
        }

        // Items are likeky on the same line if the difference between slopes is small
        if (
            Math.abs(
                this.getSlope(searchSpace[0].boundingBox, priceBlock.boundingBox) -
                    this.getSlope(searchSpace[1].boundingBox, priceBlock.boundingBox),
            ) > this.SLOPE_DIFFERENCE_THRESHOLD
        ) {
            return dollarRegex.test(searchSpace[0].text) ? searchSpace[1] : searchSpace[0];
        }

        // Check if one of the top two matches a quantity or dollar sign
        if (dollarRegex.test(searchSpace[0].text)) {
            return searchSpace[1];
        }
        if (dollarRegex.test(searchSpace[1].text)) {
            return searchSpace[0];
        }

        // If neither matches non-qualifying item names, choose the one with the greater distance
        return this.getDistance(searchSpace[0].boundingBox, priceBlock.boundingBox) >
            this.getDistance(searchSpace[1].boundingBox, priceBlock.boundingBox)
            ? searchSpace[0]
            : searchSpace[1];
    }

    private getDistance(box1: IBoundingBox, box2: IBoundingBox): number {
        return Math.pow(box1.left - box2.left, 2) + Math.pow(box1.top - box2.top, 2);
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

    private formatPrice(priceText: string): string {
        //    Formats price string to (-)0.00 format
        //   '''
        if (priceText[0] === priceText && priceText[priceText.length - 1] === ")") {
            // Negative denoted by parentheses
            // Replace the parentheses with negative sign
            priceText = `$-${priceText.slice(1, priceText.length)}`;

            // Reformat the price by stripping all non-numeric characters and replacing the decimal
            // stripped_price = re.sub(r'[^\-\d]', '', price_text)
            // price_text = stripped_price[:-2] + '.' + \
            //     stripped_price[-2:] if len(stripped_price) > 2 else stripped_price

            // return price_text
        }
        return priceText;
    }
}
