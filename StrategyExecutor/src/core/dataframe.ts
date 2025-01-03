import { DataFrame } from 'npm:danfojs-node';
import {
  formatISO,
} from 'npm:date-fns';


export function createDataFrame(historyCandlesDF: any) {
  const df = new DataFrame(historyCandlesDF, {
    columns: ['DateTime', 'Open', 'High', 'Low', 'Close', 'Volume'],
  });

  df['DateTime'] = df['DateTime'].map((d: number) => formatISO(new Date(d)));

  return df;
}
