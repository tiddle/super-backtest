import { SMA } from 'npm:technicalindicators';
import { DataFrame, toJSON } from 'npm:danfojs-node';
import {
	formatISO,
	parseISO,
	differenceInDays,
	differenceInHours,
} from 'npm:date-fns';

import type {
	Order,
	Trade,
	Candle,
	CreateOrderFunction,
	DynamicTradingFunction,
	initParams,
} from '../../types.ts';

import { barCrossDown, barCrossUp } from './util.ts';

const orders: Order[] = [];
const trades: Trade[] = [];
const completedTrades: Trade[] = [];
let createOrder: CreateOrderFunction;
let dynamicTrading: DynamicTradingFunction;
let bank = -1;

export function init({
	createOrderFunc,
	historyCandlesDF,
	bankParam,
	dynamicTradingFunc,
}: initParams) {
	createOrder = createOrderFunc;
	bank = bankParam;

	if (dynamicTradingFunc) {
		dynamicTrading = dynamicTradingFunc;
	}

	const params = { n1: 300 };
	const df = new DataFrame(historyCandlesDF, {
		columns: ['DateTime', 'Open', 'High', 'Low', 'Close', 'Volume'],
	});

	df['DateTime'] = df['DateTime'].map((d: number) => formatISO(new Date(d)));

	const lineA = [
		...new Array(params.n1 - 1),
		...SMA.calculate({ period: params.n1, values: df['Close'].values }),
	];

	df.addColumn('LineA', lineA, { inplace: true });

	const crossUpData = barCrossUp(lineA, df);
	const crossDownData = barCrossDown(lineA, df);

	df.addColumn('CrossUp', crossUpData, { inplace: true });
	df.addColumn('CrossDown', crossDownData, { inplace: true });

	return df;
}

export function iterator(df: DataFrame) {
	for (let i = 0; i < df.index.length; i++) {
		const row = df.iloc({ rows: [i] });
		const candle: Candle = (toJSON(row) as Candle[])[0];

		processTrades(candle, i, df);
		processOrders(candle, i, bank);
		checkForSignals(candle, df);
	}

	return completedTrades;
}

function checkForSignals(candle: Candle, df: DataFrame) {
	if (candle['CrossUp']) {
		orders.push(createOrder(0, 'long', candle, df));
	} else if (candle['CrossDown']) {
		orders.push(createOrder(0, 'short', candle, df));
	}
}

function processOrders(candle: Candle, candleRow: number, bankParam: number) {
	orders.forEach((order) => {
		order.duration++;

		if (candle.Open < bankParam) {
			if (order.price === 0) {
				bank -= candle.Open;
				trades.push(createTrade(order, candle, candleRow));
				orders.splice(orders.indexOf(order), 1);
				return;
			}

			if (order.type === 'long') {
				if (order.price < candle.High) {
					bank -= candle.Open;
					trades.push(createTrade(order, candle, candleRow));
					orders.splice(orders.indexOf(order), 1);
				}
			}

			if (order.type === 'short') {
				if (order.price > candle.High) {
					bank -= candle.Open;
					trades.push(createTrade(order, candle, candleRow));
					orders.splice(orders.indexOf(order), 1);
				}
			}
		}
	});
}

function processTrades(candle: Candle, candleRow: number, df: DataFrame) {
	trades.forEach((trade) => {
		trade.duration++;

		const exitPrice = processExitConditions(candle, trade);

		if (!exitPrice && dynamicTrading) {
			trades.splice(trades.indexOf(trade), 1);
			trades.push(dynamicTrading(trade, candle, candleRow, df));
			return;
		}

		if (exitPrice) {
			const purchasePrice = trade.price === 0 ? candle['Open'] : trade.price;
			let profit = (exitPrice - purchasePrice) * trade.size;
			if (trade.type === 'short') {
				profit = -profit;
			}

			bank += exitPrice * trade.size;

			completedTrades.push({
				...trade,
				exitPrice: exitPrice,
				exitCandle: candle,
				exitCandleRow: candleRow,
				profit,
				orderDuration: differenceInDays(
					parseISO(candle.DateTime),
					parseISO(trade.entryCandle.DateTime)
				),
				durationInHours: differenceInHours(
					parseISO(candle.DateTime),
					parseISO(trade.entryCandle.DateTime)
				),
			});
			trades.splice(trades.indexOf(trade), 1);
		}
	});
}

export function createTrade(order: Order, candle: Candle, candleRow: number) {
	return {
		...order,
		price: order.price === 0 ? candle['Open'] : order.price,
		entryCandle: candle,
		entryCandleRow: candleRow,
		orderDuration: order.duration,
		duration: 0,
	};
}

function processExitConditions(candle: Candle, trade: Trade) {
	const stopLoss = trade.exitConditions?.stopLoss ?? 0;
	const takeProfit = trade.exitConditions?.takeProfit ?? 0;
	const duration = trade.exitConditions?.duration ?? 0;

	if (trade.type === 'long') {
		if (stopLoss && stopLoss > candle.Low) {
			return stopLoss;
		}

		if (takeProfit && takeProfit < candle.High) {
			return takeProfit;
		}

		if (duration && trade.duration > duration) {
			return candle.Close;
		}
	}

	if (trade.type === 'short') {
		if (stopLoss && stopLoss < candle.Low) {
			return stopLoss;
		}

		if (takeProfit && takeProfit > candle.High) {
			return takeProfit;
		}

		if (duration && trade.duration > duration) {
			return candle.Close;
		}
	}

	return;
}
