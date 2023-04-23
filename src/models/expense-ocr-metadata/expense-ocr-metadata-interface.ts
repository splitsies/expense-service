export interface IExpenseOcrMetadata {
    /**
     * The top of the last item read as "Total" on the expense image
     */
    lastTotalPosition: number;

    /**
     * Highest price found on the expense
     */
    maxPrice: number;

    /**
     * The mean slope of line items, i.e. the slope between item and price on the receipt. This aids in
     * determing the angle of the receipt in the image and improves matching prices to items.
     */
    slopeMean: number;

    /**
     * Standard deviation of slopes found between item and price
     */
    slopeStandardDeviation: number;
}
