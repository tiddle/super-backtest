import { DataFrame } from 'npm:danfojs-node';
import type { marketDetails, Trade } from '../../types.ts';
import { createFiles, createOHLCV, statsOutput, tradeDetails } from '../../core/output.ts';

export async function createOutputFiles(
  df: DataFrame,
  completedTrades: Trade[],
  name: string,
  marketDetails: marketDetails
) {
  const Cross: number[][] = [];
  const SMA: number[][] = [];
  const ATR: number[][] = [];
  const OHLCV = createOHLCV(df);
  const path = `../data/${name}`;

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

  const tradeDetailsArr = tradeDetails(completedTrades);
  const statsDF = statsOutput(tradeDetailsArr, OHLCV, df, name);

  statsDF.print();

  createFiles(path, [{
    name: 'ohlcv',
    data: OHLCV
  }, {
    name: 'cross',
    data: Cross
  }, {
    name: 'sma',
    data: SMA
  }, {
    name: 'atr',
    data: ATR
  }, {
    name: 'trades',
    data: tradeDetailsArr
  }, {
    name: 'marketDetails',
    data: marketDetails
  }])
}
