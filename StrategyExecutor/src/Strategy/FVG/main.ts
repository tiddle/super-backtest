import { DataFrame } from 'npm:nodejs-polars';

import type {
	Candle,
	CreateOrderFunction,
	DynamicTradingFunction,
	initParams,
	orderState
} from '../../types.ts';

import { processOrders, processTrades } from '../../core/trades.ts';

import { SMA } from '../../core/indicators/sma.ts';
import { FVG } from '../../core/indicators/fvg.ts';

let createOrder: CreateOrderFunction;
let dynamicTrading: DynamicTradingFunction;

let state: orderState = {
	orders: [],
	trades: [],
	completedTrades: [],
	bank: -1
}

export function init({
	createOrderFunc,
	bankParam,
	dynamicTradingFunc,
}: initParams, df: DataFrame) {
	let localDf: DataFrame;

	state.bank = bankParam;

	if (createOrderFunc) {
		createOrder = createOrderFunc;
	}

	if (dynamicTradingFunc) {
		dynamicTrading = dynamicTradingFunc;
	}

	localDf = SMA(300, df, 'lineA');
	localDf = FVG(localDf, 'FVG');

	return localDf;
}

export function iterator(df: DataFrame): orderState {
	const candles = df.toRecords();

	candles.forEach((candle: Candle, i: number) => {
		state = processTrades(candle, df, i, state);
		state = processOrders(candle, i, state);
		state = checkForSignals(candle, df, state);
	});

	return state;
}

function checkForSignals(_candle: Candle, _df: DataFrame, state: orderState): orderState {
	return state;
}

