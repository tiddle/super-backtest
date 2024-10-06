import { DataFrame, toJSON } from 'npm:danfojs-node';
import type { Candle, Order, PurchaseType, Trade } from '../../types.ts';

export function createOrder(
	price: number,
	type: PurchaseType,
	candle: Candle,
	_df: DataFrame
): Order {
	let stopLoss = candle.High * 1.05;
	if (type === 'long') {
		stopLoss = candle.Low * 0.95;
		// const takeProfit = candle.Close * 1.02;
	}

	return {
		size: 1,
		price,
		duration: 0,
		type,
		exitConditions: {
			stopLoss,
			duration: 0,
		},
	};
}

export function dynamicTrading(
	trade: Trade,
	_candle: Candle,
	candleRow: number,
	df: DataFrame
): Trade {
	// Move stop loss to previous candle low if higher

	const row = df.iloc({ rows: [candleRow - 1] });
	const previousCandleData: Candle = (toJSON(row) as Candle[])[0];
	const previousCandleLow = previousCandleData.Low;
	const previousCandleHigh = previousCandleData.High;

	if (trade.type === 'long') {
		if (
			trade.exitConditions?.stopLoss &&
			trade.exitConditions?.stopLoss < previousCandleLow
		) {
			return {
				...trade,
				exitConditions: {
					...trade.exitConditions,
					stopLoss: previousCandleLow,
				},
			};
		}

		return trade;
	}

	if (trade.type === 'short') {
		if (
			trade.exitConditions?.stopLoss &&
			trade.exitConditions?.stopLoss > previousCandleHigh
		) {
			return {
				...trade,
				exitConditions: {
					...trade.exitConditions,
					stopLoss: previousCandleHigh,
				},
			};
		}
	}

	return trade;
}
