import { DataFrame, Series, col } from "npm:nodejs-polars";
import { ATR as ATRCalc } from 'npm:technicalindicators';

export function ATR(period = 14, df: DataFrame, columnName: string) {
  const name = columnName || 'ATR' + period;

  const filler = new Array(period);
  const closeValues = df.getColumn('Close').toArray();
  const lowValues = df.getColumn('Low').toArray();
  const highValues = df.getColumn('High').toArray();

  const ATRLine = [
    ...filler.fill(0),
    ...ATRCalc.calculate({ period: period, close: closeValues, low: lowValues, high: highValues }),
  ];

  const atrLineSeries = Series(name, ATRLine);

  return df.withColumn(atrLineSeries);
}
