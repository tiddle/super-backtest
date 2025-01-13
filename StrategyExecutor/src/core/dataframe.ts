import { DataFrame } from 'npm:nodejs-polars';
import {
  formatISO,
} from 'npm:date-fns';


export function createDataFrame(historyCandlesDF: any) {
  const candles = historyCandlesDF.map((row) => {
    const output = [...row];
    output[0] = formatISO(new Date(row[0]));

    return output;
  });
  const df = new DataFrame(candles, {
    columns: ['DateTime', 'Open', 'High', 'Low', 'Close', 'Volume'],
  });

  return df;
}
