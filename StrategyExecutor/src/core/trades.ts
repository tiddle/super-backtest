import { DataFrame } from 'npm:danfojs-node';
import {
  Order,
  Trade,
  Candle,
  SHORT,
  LONG
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

