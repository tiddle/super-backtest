import { DataFrame } from 'npm:nodejs-polars';
import { parseISO } from 'npm:date-fns/parseISO';
import type { marketDetails, Trade } from '../../types.ts';
import { createFiles, createOHLCV, statsOutput, tradeDetails } from '../../core/output.ts';

export function createOutputFiles(
	df: DataFrame,
	completedTrades: Trade[],
	name: string,
	marketDetails: marketDetails
) {
	const SMA: number[][] = [];
	const FVG: number[][] = [];
	const OHLCV = createOHLCV(df);
	const path = `../data/${name}`;

	console.log(df.tail().toRecords(), OHLCV[OHLCV.length - 1]);

	OHLCV.forEach((curr) => {
		if (Array.isArray(curr)) {
			if (curr[6]) {
				SMA.push([curr[0] as number, curr[6] as number]);
			}

			// 7 Low, 8 High, 9 Close, 10 Type
			if (curr[7]) {
				const close = parseISO(curr[9] as string || 0).getTime();
				FVG.push([curr[0] as number, curr[7] as number, curr[8] as number, close || 0, curr[10] as number]);
			}
		}
	});

	const tradeDetailsArr = tradeDetails(completedTrades);
	const statsDF = statsOutput(tradeDetailsArr, OHLCV, df, name);

	createFiles(path, [{
		name: 'ohlcv',
		data: OHLCV
	}, {
		name: 'sma',
		data: SMA
	}, {
		name: 'fvg',
		data: FVG
	}, {
		name: 'trades',
		data: tradeDetailsArr
	}, {
		name: 'marketDetails',
		data: marketDetails
	}])

	return statsDF;
}
