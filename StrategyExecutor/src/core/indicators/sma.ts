import { SMA as SMACalc } from 'npm:technicalindicators';

export function SMA(period = 30, df: DataFrame, columnName: string) {
  const name = columnName || 'SMA'+period;
  
	const lineA = [
		...new Array(period - 1),
		...SMACalc.calculate({ period: period, values: df['Close'].values }),
	];

	df.addColumn(name, lineA, { inplace: true });

  return lineA;
}
