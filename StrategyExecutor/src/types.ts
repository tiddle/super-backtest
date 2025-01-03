import { DataFrame } from "npm:danfojs-node";

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

export interface initParams {
  name: string;
  createOrderFunc: CreateOrderFunction;
  dynamicTradingFunc?: DynamicTradingFunction;
  bankParam: number;
}

export interface orderState {
  trades: Trade[];
  completedTrades: Trade[];
  orders: Order[];
  bank: number;
}

export interface marketDetails {
  symbol: string;
  exchange: string;
  timeframe: string;
}

export interface FileData {
  name: string;
  data: number[][] | marketDetails;
}

export const SHORT = 'short';
export const LONG = 'long'
const PurchaseValues = [SHORT, LONG];
export type PurchaseType = typeof PurchaseValues[number];

export interface FVGData {
  high: number,
  low: number,
  close?: number,
  type: number
}

export interface Purchases {
  orders: Order[],
  trades: Trade[],
  completedTrades: Trade[],
  bank: number,
  createOrder?: CreateOrderFunction
  dynamicTrading?: DynamicTradingFunction
}
