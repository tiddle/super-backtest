import { DataFrame } from "npm:danfojs-node";
import { OHLCV } from "npm:ccxt@4.4.5";

export interface Order {
	size: number;
	price: number;
	duration: number;
	type: PurchaseType;
	exitConditions?: ExitConditions;
}

export interface Trade extends Order {
	entryCandle: Candle;
    entryCandleRow: number;
	orderDuration: number;
    exitPrice?: number;
    exitCandle?: Candle;
    exitCandleRow?: number;
	profit?: number;
	durationInHours?: number;
}

export interface ExitConditions {
	stopLoss?: number;
	takeProfit?: number;
	duration?: number;
}

export interface Candle {
	DateTime: string;
	Open: number;
	High: number;
	Low: number;
	Close: number;
	CrossUp: boolean;
	CrossDown: boolean;
}

export type CreateOrderFunction = (price: number, type: PurchaseType, candle: Candle, df: DataFrame) => Order;
export type ExitConditionsFunction = (exitConditions: ExitConditions, candle: Candle, trade: Trade, df: DataFrame) => number | undefined;
export type DynamicTradingFunction = (trade: Trade, candle: Candle, candleRow: number, df: DataFrame) => Trade;

export type initParams = {
	name: string;
	historyCandlesDF: OHLCV[];
	createOrderFunc: CreateOrderFunction;
	dynamicTradingFunc?: DynamicTradingFunction;
	bankParam: number;
}

const PurchaseValues = ['short', 'long'];
export type PurchaseType = typeof PurchaseValues[number];