import { btcmarkets } from 'npm:ccxt@4.4.5';
import { add } from 'npm:date-fns';

import { init, iterator } from './Strategy/SMACross/main.ts';
import { createOutputFiles } from './Strategy/SMACross/output.ts';
import { createOrder, dynamicTrading } from './PurchaseStrategy/Basic/main.ts';
import type { initParams, marketDetails } from './types.ts';
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

const df = createDataFrame(historyCandlesDF);
const bank = 1000000;

const params: initParams = {
  name: 'SMA Cross',
  createOrderFunc: createOrder,
  dynamicTradingFunc: dynamicTrading,
  bankParam: bank,
};

const marketDetails: marketDetails = {
  symbol,
  exchange: 'BTCMarkets',
  timeframe
}

const dfIndicators = init(params, df);
const { completedTrades } = iterator(dfIndicators);

await createOutputFiles(df, completedTrades, params.name, marketDetails);

