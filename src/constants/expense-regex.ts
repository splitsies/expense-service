export class ExpenseRegex {
  static readonly RE_PRICE =
    /(USD|EUR)?(\-|\()?(€|\$|£)?\s?(\d{1,3}(?:[.,]\d{3})*|\d+)\s?(?:[.,]\s?\d{1,2})\s?\)?(USD|EUR|€|\$|£)?/;
  static readonly RE_DATE =
    /(1[0-2]|0?[1-9])[/\-.]([0-3]?[0-9])[/\-.]([0-9]{4}|[0-9]{2})/;
  static readonly RE_TOTAL =
    /([tT][oO][tT][aA][lL]|[bB][aA][lL][aA][nN][cC][eE]|[aA]([mM]|[nN])[oO][uU][nN][tT]\s?[dD][uU][eE])/;
  static readonly RE_TAX = /[tT][aA][xX]/;
  static readonly RE_SUBTOTAL =
    /([nN][eE][tT]\s?|[sS]?[uU][bB]\s?)[tT][oO][tT][aA][lL]?/;
  static readonly RE_SUBTOTAL_ABBREV = /[sS][uU][bB]/;
  static readonly RE_TIP = /([tT][iI][pP]|[gG][rR][aA][tT][uU][iI][tT][yY])/;
  static readonly RE_PERCENT = /\d{1-3}%/;
}
