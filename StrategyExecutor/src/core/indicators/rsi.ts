import { DataFrame } from 'npm:danfojs-node';
import { RSI as RSICalc } from 'npm:technicalindicators';

export function RSI(period = 30, df: DataFrame, columnName: string) {
  const name = columnName || 'RSI' + period;

  const RSILine = [
    ...new Array(period - 1),
    ...RSICalc.calculate({ period: period, values: df['Close'].values }),
  ];

  df.addColumn(name, RSILine, { inplace: true });

  return RSILine;

}
