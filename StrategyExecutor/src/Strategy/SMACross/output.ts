import { DataFrame } from 'npm:danfojs-node';
import { existsSync } from 'jsr:@std/fs';
import type { Trade } from '../../types.ts';
import { createOHLCV, statsOutput, tradeDetails } from '../../core/output.ts';

export async function createOutputFiles(
  df: DataFrame,
  completedTrades: Trade[],
  name: string
) {
  const Cross: number[][] = [];
  const SMA: number[][] = [];
  const ATR: number[][] = [];
  const OHLCV = createOHLCV(df);
  const path = `../data/${name}`;

  if (!existsSync(path)) {
    await Deno.mkdirSync(path);
  }

  OHLCV.forEach((curr) => {
    if (Array.isArray(curr)) {
      if (curr[8]) {
        Cross.push([curr[0] as number, curr[2] as number, 1]);
      }

      if (curr[9]) {
        Cross.push([curr[0] as number, curr[3] as number, -1]);
      }

      if (curr[6]) {
        SMA.push([curr[0] as number, curr[6] as number]);
      }

      if (curr[7]) {
        ATR.push([curr[0] as number, curr[7] as number]);
      }
    }
  });

  Deno.writeFile(
    `${path}/ohlcv.json`,
    new TextEncoder().encode(JSON.stringify(OHLCV))
  );

  Deno.writeFile(
    `${path}/sma.json`,
    new TextEncoder().encode(JSON.stringify(SMA))
  );

  Deno.writeFile(
    `${path}/atr.json`,
    new TextEncoder().encode(JSON.stringify(ATR))
  );

  Deno.writeFile(
    `${path}/cross.json`,
    new TextEncoder().encode(JSON.stringify(Cross))
  );

  const tradeDetailsArr = tradeDetails(completedTrades);
  const statsDF = statsOutput(tradeDetailsArr, OHLCV, df, name);

  statsDF.print();

  Deno.writeFile(
    `${path}/trades.json`,
    new TextEncoder().encode(JSON.stringify(tradeDetailsArr))
  );
}
