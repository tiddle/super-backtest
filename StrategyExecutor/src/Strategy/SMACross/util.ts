import { DataFrame } from 'npm:danfojs-node';

export function barCrossUp(
  df: DataFrame,
): number[] {
  const close = df.getColumn('Close').toArray();
  const open = df.getColumn('Open').toArray();
  const lineA = df.getColumn('SMA').toArray();


  return close.reduce((acc: number[], curr: number, i: number) => {
    if (!lineA[i]) {
      acc[i] = 0;
      return acc;
    }

    if (curr > open[i] && curr > lineA[i] && open[i] < lineA[i] && open[i - 1] < close[i - 1] && acc[i - 1] !== 1) {
      acc[i] = 1;
    } else {
      acc[i] = 0;
    }

    return acc;
  }, [] as number[]);
}

export function barCrossDown(
  df: DataFrame,
): number[] {
  const close = df.getColumn('Close').toArray();
  const open = df.getColumn('Open').toArray();
  const lineA = df.getColumn('SMA').toArray();

  return close.reduce((acc: number[], curr: number, i: number) => {
    if (!lineA[i]) {
      acc[i] = 0;
      return acc;
    }

    if (curr < open[i] && curr < lineA[i] && open[i] > lineA[i] && open[i - 1] > close[i - 1] && acc[i - 1] !== 1) {
      acc[i] = 1;
    } else {
      acc[i] = 0;
    }

    return acc;
  }, [] as number[]);
}
