import { DataFrame, Series, col } from 'npm:nodejs-polars';

import { Candle, FVGData } from '../../types.ts';

export function FVG(df: DataFrame, columnName: string) {
  // Fair Value Gap
  const name = columnName || 'FVG';

  const FVG = calculateOpen(df);
  const FVGHigh = [
    ...new Array(1),
    ...FVG.map(c => c.high)
  ];

  const FVGLow = [
    ...new Array(1),
    ...FVG.map(c => c.low)
  ];

  const FVGClose = [
    ...new Array(1),
    ...FVG.map(c => c.close)
  ];

  const FVGType = [
    ...new Array(1),
    ...FVG.map(c => c.type)
  ];

  const FVGHighSeries = Series(name + 'High', FVGHigh);
  const FVGLowSeries = Series(name + 'Low', FVGLow);
  const FVGCloseSeries = Series(name + 'Close', FVGClose);
  const FVGTypeSeries = Series(name + 'Type', FVGType);

  const output: DataFrame = df.withColumns([FVGHighSeries, FVGLowSeries, FVGCloseSeries, FVGTypeSeries]);

  return output;
}

function calculateOpen(df: DataFrame): FVGData[] {
  let output: FVGData[] = [];
  const candles = df.toRecords();

  for (let i = 2; i < candles.length; i++) {
    const currentCandle: Candle = candles[i];
    const secondCandle: Candle = candles[i - 1];
    const firstCandle: Candle = candles[i - 2];
    const preCandle: Candle = candles[i - 1];
    let result: FVGData = { high: 0, low: 0, type: 0 };


    if ((currentCandle.Low - firstCandle.High) > 0 && secondCandle.Open < secondCandle.Close) {
      if (currentCandle.Low - firstCandle.High > currentCandle.Low * 0.008) {
        output[i - 2] = {
          low: currentCandle.Low,
          high: firstCandle.High,
          type: 1
        }
      }
    }

    if ((firstCandle.Low - currentCandle.High) > 0 && secondCandle.Open > secondCandle.Close) {
      if (firstCandle.High - currentCandle.High > currentCandle.Low * 0.008) {
        output[i - 2] = {
          low: currentCandle.High,
          high: firstCandle.Low,
          type: -1
        }
      }
    }

    output.push(result);
  }

  return calculateClose(df, output);
}

function calculateClose(df: DataFrame, fvgArr: FVGData[]): FVGData[] {
  const candles = df.toRecords();

  return fvgArr.map((c, i) => {
    if (c.type === 0) {
      return { ...c };
    }

    for (let j = i; j < candles.length; j++) {
      const currentCandle: Candle = candles[j];

      if (c.type === 1) {
        if (currentCandle.Low < c.high) {
          return {
            ...c,
            close: currentCandle.DateTime
          }
        }

      }

      if (c.type === -1) {
        if (currentCandle.High > c.low) {
          return {
            ...c,
            close: currentCandle.DateTime
          }
        }
      }
    }

    return { ...c, close: '' };
  });
}
