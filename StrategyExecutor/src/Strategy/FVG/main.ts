import { DataFrame, toJSON } from 'npm:danfojs-node';
import {
  parseISO,
  differenceInDays,
  differenceInHours,
} from 'npm:date-fns';

import type {
  Candle,
  CreateOrderFunction,
  DynamicTradingFunction,
  initParams,
  orderState
} from '../../types.ts';

import { LONG, SHORT } from '../../types.ts';

import { processExitConditions, createTrade } from '../../core/trades.ts';

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

    state = processTrades(candle, i, df, state);
    state = processOrders(candle, i, state);
    checkForSignals(candle, df);
  }

  return state;
}

function checkForSignals(_candle: Candle, _df: DataFrame) {
  return;
}

function processOrders(candle: Candle, candleRow: number, state: orderState): orderState {
  const myState = { ...state };

  state.orders.forEach((order) => {
    if (candle.Open < myState.bank) {
      if (order.price === 0) {
        myState.bank -= candle.Open;
        myState.trades.push(createTrade(order, candle, candleRow));
        myState.orders.splice(myState.orders.indexOf(order), 1);
        return;
      }

      if (order.type === LONG) {
        if (order.price < candle.High) {
          myState.bank -= candle.Open;
          myState.trades.push(createTrade(order, candle, candleRow));
          myState.orders.splice(myState.orders.indexOf(order), 1);
        }
      }

      if (order.type === SHORT) {
        if (order.price > candle.High) {
          myState.bank -= candle.Open;
          myState.trades.push(createTrade(order, candle, candleRow));
          myState.orders.splice(myState.orders.indexOf(order), 1);
        }
      }
    }

  });

  return myState;
}

function processTrades(candle: Candle, candleRow: number, df: DataFrame, state: orderState): orderState {
  const myState = { ...state };

  state.trades.forEach((trade, i) => {
    const exitPrice = processExitConditions(candle, trade);

    if (!exitPrice && dynamicTrading) {
      // Remove and potentially adjust stop loss
      myState.trades.splice(state.trades.indexOf(trade), 1);
      myState.trades.push(dynamicTrading(trade, candle, candleRow, df));
      return;
    }

    if (exitPrice) {
      const purchasePrice = trade.price === 0 ? candle['Open'] : trade.price;
      let profit = (exitPrice - purchasePrice) * trade.size;
      if (trade.type === 'short') {
        profit = -profit;
      }

      myState.bank += exitPrice * trade.size;

      myState.completedTrades.push({
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
      myState.trades.splice(myState.trades.indexOf(trade), 1);
    }
  });

  return myState;
}

