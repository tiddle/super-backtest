import { btcmarkets } from 'npm:ccxt@4.4.5';
import { add } from 'npm:date-fns/add';

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

const bank = 1000000;

const params: initParams = {
	name: 'SMA Cross',
	historyCandlesDF,
	createOrderFunc: createOrder,
	dynamicTradingFunc: dynamicTrading,
	bankParam: bank,
};

const df = init(params);
const completedTrades = iterator(df);

await createOutputFiles(df, completedTrades, params.name);

