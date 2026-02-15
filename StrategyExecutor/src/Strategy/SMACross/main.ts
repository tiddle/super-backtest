import { DataFrame, Series } from 'npm:nodejs-polars';

import type {
	Candle,
	CreateOrderFunction,
	DynamicTradingFunction,
	initParams,
	orderState
} from '../../types.ts';

import { processTrades, processOrders } from '../../core/trades.ts';

import { barCrossDown, barCrossUp } from './util.ts';
import { SMA } from '../../core/indicators/sma.ts';
import { ATR } from '../../core/indicators/atr.ts';

let createOrder: CreateOrderFunction;
let dynamicTrading: DynamicTradingFunction;

let purchases: orderState = {
	orders: [],
	trades: [],
	completedTrades: [],
	bank: -1
};

export function init({
	createOrderFunc,
	bankParam,
	dynamicTradingFunc,
}: initParams, df: DataFrame) {
	let localDf: DataFrame;
	purchases.bank = bankParam;

	if (createOrderFunc) {
		createOrder = createOrderFunc;
	}

	if (dynamicTradingFunc) {
		dynamicTrading = dynamicTradingFunc;
	}

	localDf = SMA(300, df, 'SMA');
	localDf = ATR(14, localDf, 'ATR');

	const crossUpData = barCrossUp(localDf);
	const crossDownData = barCrossDown(localDf);

	const crossUpSeries = Series('CrossUp', crossUpData);
	const crossDownSeries = Series('CrossDown', crossDownData);

	localDf = localDf.withColumns([crossUpSeries, crossDownSeries]);

	return localDf;
}

export function iterator(df: DataFrame) {
	const candles = df.toRecords();

	candles.forEach((candle: Candle, i: number) => {
		purchases = processTrades(candle, i, df, purchases, dynamicTrading);
		purchases = processOrders(candle, i, purchases);
		purchases = checkForSignals(candle, df, purchases);
	});

	return purchases;
}

function checkForSignals(candle: Candle, df: DataFrame, purchases: orderState) {
	const myState = { ...purchases };

	if (candle['CrossUp']) {
		myState.orders.push(createOrder(0, 'long', candle, df));
	} else if (candle['CrossDown']) {
		myState.orders.push(createOrder(0, 'short', candle, df));
	}

	return purchases;
}

