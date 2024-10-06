import { DataFrame, Series } from 'npm:danfojs-node';
import { differenceInDays } from 'npm:date-fns/differenceInDays';
import { formatISO } from 'npm:date-fns/formatISO';
import { parseISO } from 'npm:date-fns/parseISO';
import type { Trade } from '../types.ts';

export function tradeDetails(completedTrades: Trade[]): number[][] {
	return completedTrades.map((trade: Trade) => {
		const purchaseCandleTimestamp = parseISO(
			trade.entryCandle.DateTime
		).getTime();
		const exitCandleTimestamp = parseISO(
			trade.exitCandle?.DateTime || '0'
		).getTime();
		const profitLossPercent =
			Math.sign(trade.size) * ((trade.exitPrice || 0) / trade.price - 1);
		return [
			purchaseCandleTimestamp,
			trade.price,
			exitCandleTimestamp,
			trade.exitPrice || 0,
			trade.type === 'long' ? 1 : -1,
			trade.entryCandleRow,
			trade.exitCandleRow || 0,
			trade.size,
			trade.profit || 0,
			profitLossPercent,
			trade.duration,
		];
	});
}

export function createOHLCV(df: DataFrame): number[][] {
	return df.values.map((curr) => {
		if (Array.isArray(curr)) {
			const arrayCurr = curr as (string | number)[];
			arrayCurr[0] = parseISO(arrayCurr[0] as string).getTime();
			arrayCurr[8] = arrayCurr[8] ? 1 : 0;
			arrayCurr[9] = arrayCurr[9] ? 1 : 0;
			return arrayCurr as number[];
		}

		// shouldn't get here
		return [Number(curr)];
	});
}

export function statsOutput(
	tradeOutput: number[][],
	OHLCV: number[][],
	df: DataFrame,
	name = ''
) {
	const tradesDF = new DataFrame(tradeOutput, {
		columns: [
			'EntryTime',
			'EntryPrice',
			'ExitTime',
			'ExitPrice',
			'Type',
			'EntryCandle',
			'ExitCandle',
			'Size',
			'Profit',
			'ProfitLossPercent',
			'Duration',
		],
	});

	const pl = tradesDF['Profit'] as Series;
	const returns = tradesDF['ProfitLossPercent'] as Series;
	const durations = tradesDF['Duration'] as Series;
	const tradeAmount = tradeOutput.length;

	const start = formatISO(OHLCV[0][0]);
	const end = formatISO(OHLCV[OHLCV.length - 1][0]);
	const totalDuration = differenceInDays(
		OHLCV[OHLCV.length - 1][0],
		OHLCV[0][0]
	);
	const candleCount = OHLCV.length;

	const exposureTime = computeExposureTime(OHLCV.length, tradesDF);
	const buyAndHoldReturn = computeReturnPct(df['Close']);
	const maxTradeDuration = tradeAmount ? Math.ceil(durations.max()) : NaN;
	const avgTradeDuration = tradeAmount ? Math.ceil(durations.mean()) : NaN;
	const winRate = tradeAmount ? pl.gt(0).mean() * 100 : NaN;
	const bestTrade = tradeAmount ? returns.max() * 100 : NaN;
	const worstTrade = tradeAmount ? returns.min() * 100 : NaN;
	const profitLoss = pl.sum();

	const results = new Series(
		[
			name,
			start,
			end,
			totalDuration,
			candleCount,
			exposureTime,
			buyAndHoldReturn,
			maxTradeDuration,
			avgTradeDuration,
			winRate,
			bestTrade,
			worstTrade,
			tradeAmount,
			profitLoss,
		],
		{
			index: [
				'Name',
				'Start',
				'End',
				'Duration',
				'Candle Amount',
				'ExposureTime',
				'BuyAndHoldReturn',
				'maxTradeDuration',
				'avgTradeDuration',
				'WinRate',
				'BestTrade',
				'WorstTrade',
				'Amount of trades',
				'Profit/Loss',
			],
		}
	);

	results.config.setMaxRow(results.index.length);

	return results;
}

function computeExposureTime(arrLength: number, df: DataFrame) {
	const trades = df.values as Array<number[]>;

	const havePosition = new Series(
		trades.reduce((havePosition: number[], t: number[]) => {
			const exitBar = t[6];
			const entryBar = t[5];
			return havePosition.map((value, index) => {
				return Array.from(
					{ length: exitBar - entryBar + 1 },
					(_, i) => i + entryBar
				).includes(index)
					? 1
					: value;
			});
		}, Array(arrLength).fill(0))
	);

	return havePosition.mean() * 100;
}

function computeReturnPct(values: Series) {
	const finalValue = values.iat(values.size - 1) as number;
	const initialValue = values.iat(0) as number;
	return ((finalValue - initialValue) / initialValue) * 100;
}
