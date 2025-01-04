import { DataFrame, toJSON } from 'npm:danfojs-node';

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
  purchases.bank = bankParam;

  if (createOrderFunc) {
    createOrder = createOrderFunc;
  }

  if (dynamicTradingFunc) {
    dynamicTrading = dynamicTradingFunc;
  }

  const lineA = SMA(300, df, 'lineA');
  const atrLine = ATR(14, df, 'ATR');

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

    purchases = processTrades(candle, i, df, purchases);
    purchases = processOrders(candle, i, purchases);
    purchases = checkForSignals(candle, df, purchases);
  }

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

