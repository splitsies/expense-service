import { injectable } from "inversify";
import { IOcrResult, ITextBlock, IBoundingBox, IExpenseItem } from "@splitsies/shared-models";
import { IExpenseItemsProcessor } from "./expense-items-processor-interface";
import { IExpenseOcrMetadata } from "../../models/expense-ocr-metadata/expense-ocr-metadata-interface";
import { ExpenseRegex } from "src/constants/expense-regex";

@injectable()
export class ExpenseItemsProcessor implements IExpenseItemsProcessor {
    private readonly STANDARD_DEV_THRESHOLD = 3;

    process(ocrResult: IOcrResult, metadata: IExpenseOcrMetadata): IExpenseItem[] {
        // '''
        // Iterates over the blocks and inserts line items into the orderDto
        // '''
        // stop_marker, max_price, slope_mean, slope_std = self.metadata
        // print(
        //     f'top_of_last_total: {stop_marker}, max_price: {max_price}, mean: {slope_mean}, std: {slope_std}')
        // self.order_dto.items = self.order_dto.items or []

        // for i in range(len(self.blocks)):
        // # Stop iteration if past the stop marker (Top of last Total)
        // if self.blocks[i]['BoundingBox']['Top'] > stop_marker:
        //     break

        // price_search_result = re.search(regex.RE_PRICE, self.blocks[i]['Text'])

        // if price_search_result and '%' not in self.blocks[i]['Text']:
        //     price_block = self.blocks[i]
        //     item_block = self.__get_matching_item(price_index=i)
        //     if not item_block:
        //     continue
        //     price_block['Text'] = format_price(price_search_result.group())
        //     percent_search_result = re.match(regex.RE_PERCENT, item_block['Text'])
        //     price = float(price_block['Text'])

        //     if price != 0 and price < max_price and (not percent_search_result):
        //     self.load_line_item(item_block, price_block)

        // self.order_dto.subtotal = sum([float(item['price']) for item in self.order_dto.items])
        // self.order_dto.tax = self.order_dto.tax or 0.00
        // self.order_dto.tip = self.order_dto.tip or 0.00
        // self.order_dto.total = float(self.order_dto.subtotal) + float(self.order_dto.tax) + float(self.order_dto.tip)
        const items = new Array<IExpenseItem>();

        for (let i = 0; i < ocrResult.textBlocks.length, i++) {
            const block = ocrResult.textBlocks[i];
            if (block.boundingBox.top > metadata.lastTotalPosition) break;

            const priceSearchResult = ExpenseRegex.Price.exec(block.text);
            if (!priceSearchResult.length || block.text.includes("%")) continue;



        }

    }


    private getMatchingItem(priceBlockIndex; number, metadata: IExpenseOcrMetadata): ITextBlock {
        //     '''
        //  Iterates back from price_index to find the left - most line indicating the item name
        //     '''
        // # item_index = price_index - 1
        //     mean_slope = self.metadata[2]
        //     search_space = [block for block in
        //         self.blocks[price_index - 3:price_index]+
        //             self.blocks[price_index + 1: price_index + 3]
        //     if self.is_valid_slope(block, self.blocks[price_index])]

        //     search_space.sort(key = lambda x: abs(
        //         mean_slope * parameters.MEAN_SLOPE_SCALE - get_slope(x, self.blocks[price_index])))
        //     match = None
        // if len(search_space) > 1:
        //   # Items are likeky on the same line if the difference between slopes is small
        //   if abs(get_slope(search_space[0], self.blocks[price_index])
        //          - get_slope(search_space[1], self.blocks[price_index])) \
        //      <= parameters.SLOPE_DIFFERENCE_THRESHOLD:

        //     # Check if one of the top two matches a quantity or dollar sign
        //     if re.match(r'\s?\d+\s?$', search_space[0]['Text']) or re.match(r'\s?\$\s?$', search_space[0]['Text']):
        //       match = search_space[1]
        //     elif re.match(r'\s?\d+\s?$', search_space[1]['Text']) or re.match(r'\s?\$\s?$', search_space[1]['Text']):
        //       match = search_space[0]

        //     # If neither matches non-qualifying item names, choose the one with the greater distance
        //     else:
        //       if get_distance(search_space[0], self.blocks[price_index]) \
        //          > get_distance(search_space[1], self.blocks[price_index]):
        //         match = search_space[0]
        //       else:
        //         match = search_space[1]
        //   else:
        //     match = search_space[0] if not (re.match(r'\s?\d+\s?$', search_space[0]['Text']) or re.match(
        //         r'\s?\$\s?$', search_space[0]['Text'])) else search_space[1]

        // elif len(search_space) > 0:
        //   match = search_space[0]

        // return match
        let itemBlockIndex = priceBlockIndex
    }

    private getDistanceSquared(box1: IBoundingBox, box2: IBoundingBox): number {
        return Math.pow(box1.left - box2.left, 2) + Math.pow(box1.top - box2.top, 2);
    }

    private getSlope(itemBox: IBoundingBox, priceBox: IBoundingBox): number {
        if (priceBox.left <= itemBox.left) return Infinity;
        return (priceBox.top - itemBox.top) / (priceBox.left - itemBox.left);
    }

    /**
     * Returns true if the slope between item and price is within 3 standard deviations from the mean slope
     */
    private isSlopeValid(itemBlock: ITextBlock, priceBlock: ITextBlock, metadata: IExpenseOcrMetadata): boolean {
        const slope = this.getSlope(itemBlock, priceBlock);
        const threshold = this.STANDARD_DEV_THRESHOLD * metadata.slopeStandardDeviation

        // 65-95-99.7 rule - 99.7% of distribution is within 3 std from the mean
        return slope > (metadata.slopeMean - threshold)
            && slope < (metadata.slopeMean + threshold)
    }
}
