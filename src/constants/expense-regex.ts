export class ExpenseRegex {
    static readonly Price =
        /(USD|EUR)?(\-|\()?(€|\$|£)?\s?(\d{1,3}(?:[.,]\d{3})*|\d+)\s?(?:[.,]\s?\d{1,2})\s?\)?(USD|EUR|€|\$|£)?/;
    static readonly Date = /(1[0-2]|0?[1-9])[/\-.]([0-3]?[0-9])[/\-.]([0-9]{4}|[0-9]{2})/;
    static readonly Total = /(total|balance|amount\s?due)/gi;
    static readonly Tax = /tax/gi;
    static readonly Subtotal = /(net\s?|sub\s?)total?/gi;
    static readonly SubtotalAbbrev = /[sS][uU][bB]/;
    static readonly Tip = /(tip|gratuity)/gi;
    static readonly Percent = /\d{1-3}%/;
}
