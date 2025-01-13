import { DataFrame, Series, col } from 'npm:nodejs-polars';
import { table } from "npm:table";
import { existsSync } from 'jsr:@std/fs';
import { differenceInDays } from 'npm:date-fns/differenceInDays';
import { formatISO } from 'npm:date-fns/formatISO';
import { parseISO } from 'npm:date-fns/parseISO';

import type { Trade, FileData } from '../types.ts';

export function tradeDetails(completedTrades: Trade[]): number[][] {
  if (!completedTrades) {
    //console.log(completedTrades);
  }
  return completedTrades.map((trade: Trade) => {
    const purchaseCandleTimestamp = parseISO(
      trade.entryCandle.DateTime
    ).getTime();
    const exitCandleTimestamp = parseISO(
      trade.exitCandle?.DateTime || '0'
    ).getTime();
    const profitLossPercent =
      (trade.type === 'short' ? -1 : 1) * ((trade.exitPrice || 0) / trade.price - 1);
    return [
      purchaseCandleTimestamp,
      trade.price,
      exitCandleTimestamp,
      trade.exitPrice || 0,
      trade.type === 'long' ? 1 : -1,
      trade.entryCandleRow,
      trade.exitCandleRow || 0,
      trade.size,
      trade.profit || 0,
      profitLossPercent,
      trade.duration,
    ];
  });
}

export function createOHLCV(df: DataFrame): number[][] {
  return df.toRecords().map((c) => {
    const curr = Object.values(c);
    if (Array.isArray(curr)) {
      const arrayCurr = curr as (string | number)[];
      arrayCurr[0] = parseISO(arrayCurr[0] as string).getTime();

      return arrayCurr as number[];
    }

    // shouldn't get here
    return [Number(curr)];
  });
}

export function statsOutput(
  tradeOutput: number[][],
  OHLCV: number[][],
  df: DataFrame,
  name = ''
) {
  const tradesDF = DataFrame(tradeOutput, {
    columns: [
      'EntryTime',
      'EntryPrice',
      'ExitTime',
      'ExitPrice',
      'Type',
      'EntryCandle',
      'ExitCandle',
      'Size',
      'Profit',
      'ProfitLossPercent',
      'Duration',
    ],
  });

  const pl = tradesDF.getColumn('Profit');
  const returns = tradesDF.getColumn('ProfitLossPercent');
  const durations = tradesDF.getColumn('Duration');
  const tradeAmount = tradeOutput.length;

  const start = formatISO(OHLCV[0][0]);
  const end = formatISO(OHLCV[OHLCV.length - 1][0]);
  const totalDuration = differenceInDays(
    OHLCV[OHLCV.length - 1][0],
    OHLCV[0][0]
  );
  const candleCount = OHLCV.length;

  const winTradeAmount = tradesDF.select(col('Profit').filter(col('Profit').gt(0))).toRecords().length;
  const losingTradeAmount = tradesDF.select(col('Profit').filter(col('Profit').lt(0))).toRecords().length;

  const exposureTime = computeExposureTime(OHLCV.length, tradesDF);
  const buyAndHoldReturn = computeReturnPct(df.getColumn('Close'));
  const maxTradeDuration = tradeAmount ? Math.ceil(durations.max()) : NaN;
  const avgTradeDuration = tradeAmount ? Math.ceil(durations.mean()) : NaN;
  const winRate = tradeAmount ? pl.gt(0).mean() * 100 : NaN;
  const bestTrade = tradeAmount ? returns.max() * 100 : NaN;
  const worstTrade = tradeAmount ? returns.min() * 100 : NaN;
  const profitLoss = pl.sum();

  const results = DataFrame(
    [[
      name,
      start,
      end,
      totalDuration,
      candleCount,
      exposureTime.toFixed(3),
      buyAndHoldReturn.toFixed(3),
      maxTradeDuration,
      avgTradeDuration,
      winRate.toFixed(3),
      bestTrade.toFixed(3),
      worstTrade.toFixed(3),
      winTradeAmount,
      losingTradeAmount,
      tradeAmount,
      profitLoss.toFixed(3),
    ]],
    {
      columns: [
        'Name',
        'Start',
        'End',
        'Duration',
        'Candle Amount',
        'ExposureTime',
        'BuyAndHoldReturn',
        'maxTradeDuration',
        'avgTradeDuration',
        'WinRate',
        'BestTrade',
        'WorstTrade',
        'Winning trades',
        'Losing trades',
        'Trades Amount',
        'Profit/Loss',
      ],
      orient: 'row'
    }
  );

  return results;
}

function computeExposureTime(arrLength: number, df: DataFrame) {
  const trades = df.toRecords();

  const havePosition = Series(
    trades.reduce((havePosition: number[], t: number[]) => {
      const exitBar = t['ExitCandle'];
      const entryBar = t['EntryCandle'];
      return havePosition.map((value, index) => {
        return Array.from(
          { length: exitBar - entryBar + 1 },
          (_, i) => i + entryBar
        ).includes(index)
          ? 1
          : value;
      });
    }, Array(arrLength).fill(0))
  );

  return havePosition.mean() * 100;
}

function computeReturnPct(values: Series) {
  const closeValues = values.toArray();

  const finalValue = closeValues[closeValues.length - 1] as number;
  const initialValue = closeValues[0] as number;

  return ((finalValue - initialValue) / initialValue) * 100;
}

export async function createFiles(path = '', valArr: FileData[] = []) {
  if (valArr.length === 0) {
    return;
  }

  if (!existsSync(path)) {
    await Deno.mkdirSync(path);
  }

  valArr.forEach((c) => {
    Deno.writeFile(
      `${path}/${c.name}.json`,
      new TextEncoder().encode(JSON.stringify(c.data))
    );
  });
}

export function display(df: DataFrame) {
  const stats = Object.entries(df.toRecords()[0]).reduce((acc, curr) => {
    acc.push([...curr])

    return acc;
  }, []);

  console.log();
  console.log(table(stats));
}

