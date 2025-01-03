import { DataFrame, toJSON } from 'npm:danfojs-node';
import {
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
  orderState,
} from '../../types.ts';

import { LONG, SHORT } from '../../types.ts';

import { processExitConditions, createTrade } from '../../core/trades.ts';

import { barCrossDown, barCrossUp } from './util.ts';
import { SMA } from '../../core/indicators/sma.ts';
import { ATR } from '../../core/indicators/atr.ts';
import { createDataFrame } from '../../core/dataframe.ts';

let createOrder: CreateOrderFunction;
let dynamicTrading: DynamicTradingFunction;

let purchases: Purchases = {
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

function processOrders(candle: Candle, candleRow: number, purchases: orderState) {
  const myState = { ...purchases };

  myState.orders.forEach((order) => {
    order.duration++;

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

function processTrades(candle: Candle, candleRow: number, df: DataFrame) {
  const myState = { ...purchases };

  myState.trades.forEach((trade) => {
    trade.duration++;

    const exitPrice = processExitConditions(candle, trade);

    if (!exitPrice && dynamicTrading) {
      myState.trades.splice(myState.trades.indexOf(trade), 1);
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

