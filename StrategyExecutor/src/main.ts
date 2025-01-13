import { btcmarkets } from 'npm:ccxt@4.4.5';
import { add } from 'npm:date-fns';

import { init as SMAInit, iterator as SMAIterator } from './Strategy/SMACross/main.ts';
import { init as FVGInit, iterator as FVGIterator } from './Strategy/FVG/main.ts';
import { createOutputFiles as SMACreateOutputFiles } from './Strategy/SMACross/output.ts';
import { createOutputFiles as FVGCreateOutputFiles } from './Strategy/FVG/output.ts';
import { createOrder, dynamicTrading } from './PurchaseStrategy/Basic/main.ts';
import type { initParams, marketDetails, strategyParams } from './types.ts';
import { createDataFrame } from './core/dataframe.ts';

const strategies: strategyParams[] = [{
  name: 'FVG',
  createOrderFunc: createOrder,
  dynamicTradingFunc: dynamicTrading,
  bankParam: 1000000,
  initFunc: FVGInit,
  iteratorFunc: FVGIterator,
  createOutputFunc: FVGCreateOutputFiles
}];


const btcmarketsExchange = new btcmarkets();

const timestamp = add(new Date(), { hours: -3000 }).getTime();
const symbol = 'BTC/AUD';
const timeframe = '1h';

const historyCandlesDF = await btcmarketsExchange.fetchOHLCV(
  symbol,
  timeframe,
  timestamp
);

const marketDetails: marketDetails = {
  symbol,
  exchange: 'BTCMarkets',
  timeframe
}

strategies.forEach(async strategy => {
  const df = createDataFrame(historyCandlesDF);
  const params = { ...strategy };

  // TODO: find a better way to do this
  delete params.initFunc;
  delete params.iteratorFunc;
  delete params.createOutputFunc;

  const dfIndicators = strategy.initFunc(params, df);
  const { completedTrades } = strategy.iteratorFunc(dfIndicators);
  //console.log(completedTrades);
  //
  //strategy.createOutputFunc(df, completedTrades, params.name, marketDetails);

});

