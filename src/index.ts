import axios from 'axios';
import bignumber from 'bignumber.js';

const API_URL = 'https://api.trongrid.io/wallet/gettransactionbyid';
const DAYS_OF_THE_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat'];
const MONTH_OF_THE_YEAR = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sept',
  'Oct',
  'Nov',
  'Dec',
];

/**
 * Shorten a string by replacing some parts of the string with ellipsis (...)
 * @param str the string to be ellipsified
 * @param strPad number of characters that should be appended to ellipsis from both sidess
 * @returns string | ellipsified string
 */
const ellipsify = (str: string, strPad?: number): string => {
  const len = str.length;
  strPad = strPad || Math.ceil(len / 3); // if pad is specified, then use pad else use an appropriate value (in our case totalLength / 3)
  strPad = strPad > 8 ? strPad - 3 : strPad; // make max pad 8, as we dont want too long strings
  return `${str.slice(0, strPad)}...${str.slice(len - strPad, len)}`;
};

/**
 * Format a given timestamp to a specific date format `Day`, `Month` `Date`, `Year` **(e.g Sat, Sep 18, 2021)**
 * @param timestamp the timestamp to be formated into date
 * @returns string | formatted date string
 */
const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return `${DAYS_OF_THE_WEEK[date.getDay()]}, ${
    MONTH_OF_THE_YEAR[date.getMonth()]
  } ${date.getDate()}, ${date.getFullYear()}`;
};

/**
 * Get transaction or list of transactions by their transaction ID
 * @param transactionId transaction id or comma separated transaction ids to be fetched
 * @returns a single or array of transaction data
 */
const getTransactionById = async (
  transactionId: string,
  options?: { includeNoDecimalAmount?: boolean; log?: boolean }
) => {
  // normalize transaction(s) into a array of ids
  const transactions = transactionId.split(',').filter(tx => tx.trim().length);

  try {
    const txsData = await Promise.all(
      transactions.map(async (txId: string) => {
        // make request to the tron api to fetch transaction by its id
        const { data } = await axios.post(
          API_URL,
          JSON.stringify({
            value: txId,
          })
        );

        // if tron returns error
        if (data.Error) {
          // if its a single transaction then throw error else we just wanna return a null data
          if (transactions.length <= 1) throw new Error(data.Error);
          else return null;
        }

        const {
          amount,
          owner_address,
          to_address,
        } = data?.raw_data?.contract[0]?.parameter?.value;

        const bigDecimal = new bignumber(10).exponentiatedBy(6); // was gonna comment this so i thought i add it as an optional feature
        const txData = {
          HASH: ellipsify(data.txID),
          'From Address': owner_address,
          'To Address': to_address,
          Amount: amount,
          'Amount (no decimals)': options?.includeNoDecimalAmount
            ? new bignumber(amount).dividedBy(bigDecimal).toString()
            : undefined,
          'Time of Transaction': formatDate(data.raw_data.timestamp),
        };

        return txData;
      })
    );

    if (options?.log) console.table(txsData);

    return { data: txsData.length <= 1 ? txsData[0] : txsData };
  } catch (e) {
    if (options?.log) console.log(e);
    return { error: (e as any).message };
  }
};

export default getTransactionById;
