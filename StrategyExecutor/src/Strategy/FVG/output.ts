import { DataFrame } from 'npm:danfojs-node';
import { parseISO } from 'npm:date-fns/parseISO';
import type { marketDetails, Trade } from '../../types.ts';
import { createFiles, createOHLCV, statsOutput, tradeDetails } from '../../core/output.ts';

export async function createOutputFiles(
  df: DataFrame,
  completedTrades: Trade[],
  name: string,
  marketDetails: marketDetails
) {
  const SMA: number[][] = [];
  const FVG: number[][] = [];
  const OHLCV = createOHLCV(df);
  const path = `../data/${name}`;

  OHLCV.forEach((curr) => {
    if (Array.isArray(curr)) {
      if (curr[6]) {
        SMA.push([curr[0] as number, curr[6] as number]);
      }

      if (curr[9] === -1) {
        console.log(curr);
      }
      // 7 Low, 8 High, 9 Type, 10 Close
      if (curr[7]) {
        const close = parseISO(curr[10] as string).getTime();
        FVG.push([curr[0] as number, curr[7] as number, curr[8] as number, curr[9] as number, close || 0]);
      }
    }
  });
  console.log(FVG);

  const tradeDetailsArr = tradeDetails(completedTrades);
  const statsDF = statsOutput(tradeDetailsArr, OHLCV, df, name);

  statsDF.print();

  createFiles(path, [{
    name: 'ohlcv',
    data: OHLCV
  }, {
    name: 'sma',
    data: SMA
  }, {
    name: 'fvg',
    data: FVG
  }, {
    name: 'trades',
    data: tradeDetailsArr
  }, {
    name: 'marketDetails',
    data: marketDetails
  }])
}
