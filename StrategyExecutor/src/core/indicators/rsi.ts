import { DataFrame, Series } from 'npm:nodejs-polars';
import { RSI as RSICalc } from 'npm:technicalindicators';

export function RSI(period = 30, df: DataFrame, columnName: string) {
	const name = columnName || 'RSI' + period;

	const filler = new Array(period - 1);

	const closeValues = df.getColumn('Close').toArray();

	const RSILine = [
		...filler.fill(0),
		...RSICalc.calculate({ period: period, values: closeValues }),
	];

	const RSILineSeries = Series(name, RSILine);

	return df.withColumn(RSILineSeries);

}
