import { ATR as ATRCalc } from 'npm:technicalindicators';

export function ATR(period = 14, df: DataFrame, columnName: string) {
  const name = columnName || 'ATR'+period;
  
	const ATRLine = [
		...new Array(period),
		...ATRCalc.calculate({ period: period, close: df['Close'].values, low: df['Low'].values, high: df['High'].values }),
	];

	df.addColumn(name, ATRLine, { inplace: true });

  return ATRLine;
  
}
