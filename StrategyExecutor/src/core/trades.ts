import { DataFrame } from 'npm:danfojs-node';
import {
  parseISO,
  differenceInDays,
  differenceInHours,
} from 'npm:date-fns';

import {
  Order,
  Trade,
  Candle,
  SHORT,
  LONG,
  orderState,
  DynamicTradingFunction
} from '../types.ts';

export function processExitConditions(candle: Candle, trade: Trade) {
  const stopLoss = trade.exitConditions?.stopLoss ?? 0;
  const takeProfit = trade.exitConditions?.takeProfit ?? 0;
  const duration = trade.exitConditions?.duration ?? 0;

  if (trade.type === LONG) {
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

  if (trade.type === SHORT) {
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

export function processOrders(candle: Candle, candleRow: number, state: orderState): orderState {
  const myState = { ...state };

  myState.orders.forEach((order, i) => {
    myState.orders[i].duration++;

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

export function processTrades(candle: Candle, candleRow: number, df: DataFrame, state: orderState, dynamicTrading?: DynamicTradingFunction): orderState {
  const myState = { ...state };
  myState.trades.forEach((trade, i) => {
    myState.trades[i].duration++;

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

