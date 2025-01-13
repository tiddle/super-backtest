import { DataFrame } from 'npm:danfojs-node';
import { add } from 'npm:date-fns';
import { btcmarkets } from 'npm:ccxt@4.4.5';
import { SMA as SMACalc } from 'npm:technicalindicators';
import { createDataFrame } from './core/dataframe.ts';

const btcmarketsExchange = new btcmarkets();

const timestamp = add(new Date(), { hours: -3000 }).getTime();
const symbol = 'BTC/AUD';
const timeframe = '1h';

const historyCandlesDF = await btcmarketsExchange.fetchOHLCV(
  symbol,
  timeframe,
  timestamp
);


//const df = createDataFrame(historyCandlesDF);
const df = new DataFrame(historyCandlesDF);

//df['DateTime'] = df['DateTime'].map((d: number) => formatISO(new Date(d)));

const period = 2;
const ss = SMACalc.calculate({ period, values: df[2].values });

const filler = new Array(period - 1);

const newCol = [
  ...filler.fill(0),
  ...ss
]
df.addColumn("SMA", newCol);
