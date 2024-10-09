import { DataFrame } from 'npm:danfojs-node';
import { btcmarkets } from 'npm:ccxt@4.4.5';
import {
	formatISO,
  add
} from 'npm:date-fns';

import { init, iterator } from './Strategy/SMACross/main.ts';
import { createOutputFiles } from './Strategy/SMACross/output.ts';
import { createOrder, dynamicTrading } from './PurchaseStrategy/Basic/main.ts';
import type { initParams } from './types.ts';

const btcmarketsExchange = new btcmarkets();

const timestamp = add(new Date(), { hours: -3000 }).getTime();

const historyCandlesDF = await btcmarketsExchange.fetchOHLCV(
	'BTC/AUD',
	'1h',
	timestamp
);

const df = new DataFrame(historyCandlesDF, {
  columns: ['DateTime', 'Open', 'High', 'Low', 'Close', 'Volume'],
});

df['DateTime'] = df['DateTime'].map((d: number) => formatISO(new Date(d)));

const bank = 1000000;

const params: initParams = {
	name: 'SMA Cross',
	df,
	createOrderFunc: createOrder,
	dynamicTradingFunc: dynamicTrading,
	bankParam: bank,
};

const dfIndicators = init(params);
const completedTrades = iterator(dfIndicators);

await createOutputFiles(df, completedTrades, params.name);

