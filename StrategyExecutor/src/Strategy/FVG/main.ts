import { DataFrame, toJSON } from 'npm:danfojs-node';

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
  state.bank = bankParam;

  if (createOrderFunc) {
    createOrder = createOrderFunc;
  }

  if (dynamicTradingFunc) {
    dynamicTrading = dynamicTradingFunc;
  }

  const lineA = SMA(300, df, 'lineA');
  const FVGData = FVG(df, 'FVG');

  return df;
}

export function iterator(df: DataFrame): orderState {
  for (let i = 0; i < df.index.length; i++) {
    const row = df.iloc({ rows: [i] });
    const candle: Candle = (toJSON(row) as Candle[])[0];

    state = processTrades(candle, i, df, state, dynamicTrading);
    state = processOrders(candle, i, state);
    state = checkForSignals(candle, df, state);
  }

  return state;
}

function checkForSignals(_candle: Candle, _df: DataFrame, state: orderState): orderState {
  return state;
}

