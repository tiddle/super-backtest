import { DataFrame, toJSON } from 'npm:danfojs-node';

import { Candle, FVGData } from '../../types.ts';

export function FVG(df: DataFrame, columnName: string) {
  // Fair Value Gap
  const name = columnName || 'FVG';


  const FVG = [
    ...new Array(2),
  ];

  const pp = calculateOpen(df);
  console.log(pp);


  df.addColumn(name, FVG, { inplace: true });

  return FVG;

}

function calculateOpen(df: DataFrame): FVGData[] {
  let output: FVGData[] = [];

  for (let i = 2; i < df.index.length; i++) {
    const currentRow = df.iloc({ rows: [i] });
    const firstCandleRow = df.iloc({ rows: [i - 2] });
    const secondCandleRow = df.iloc({ rows: [i - 1] });
    const preCandleRow = df.iloc({ rows: [i - 1] });
    const currentCandle: Candle = (toJSON(currentRow) as Candle[])[0];
    const secondCandle: Candle = (toJSON(secondCandleRow) as Candle[])[0];
    const firstCandle: Candle = (toJSON(firstCandleRow) as Candle[])[0];
    const preCandle: Candle = (toJSON(preCandleRow) as Candle[])[0];
    let result: FVGData = { high: 0, low: 0, type: 0 };

    // Green
    if (currentCandle.Open < currentCandle.Close) {
      if ((currentCandle.Low - firstCandle.High) > 0 && secondCandle.Open < secondCandle.Close) {
        result = {
          low: currentCandle.Low,
          high: firstCandle.High,
          type: 1
        }
      }
    }

    // Red
    if (currentCandle.Open > currentCandle.Close) {
      if ((firstCandle.Low - currentCandle.High) > 0 && secondCandle.Open > secondCandle.Close) {
        result = {
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
  return fvgArr.map((c, i) => {
    if (c.type === 0) {
      return { ...c };
    }

    for (let j = i; j < df.index.length; j++) {
      const currentRow = df.iloc({ rows: [j] });
      const currentCandle: Candle = (toJSON(currentRow) as Candle[])[0];

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

    return { ...c, close: 0 };
  });
}
