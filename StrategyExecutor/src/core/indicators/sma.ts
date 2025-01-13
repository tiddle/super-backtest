import { DataFrame, Series } from 'npm:nodejs-polars';
import { SMA as SMACalc } from 'npm:technicalindicators';

export function SMA(period = 30, df: DataFrame, columnName: string) {
  const name = columnName || 'SMA' + period;

  const filler = new Array(period - 1);

  const closeValues = df.getColumn('Close').toArray();

  const lineA = [
    ...filler.fill(0),
    ...SMACalc.calculate({ period: period, values: closeValues }),
  ];

  const lineASeries = Series(name, lineA);

  return df.withColumn(lineASeries);
}
