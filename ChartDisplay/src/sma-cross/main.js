import '../../style.css'
import { NightVision } from 'night-vision'
import data from '../../../data/SMA Cross/ohlcv.json';
import marketDetails from '../../../data/SMA Cross/marketDetails.json';
import TradesData from '../../../data/SMA Cross/trades.json'
import Cross from '../../../data/SMA Cross/cross.json';
import SMA from '../../../data/SMA Cross/sma.json';
import ATR from '../../../data/SMA Cross/atr.json';
import Dots from '../nv-scripts/dots.navy';
import Trades from '../nv-scripts/trades.navy';

export function SMACrossChart(el) {

  el.innerHTML = `
    <style>
    body {
        background-color: #0c0d0e;
    }
    </style>
    <h1 style="margin-top: 0">SMA Cross</h1>
    <div id="sma-cross-chart-container"></div>
    `
  let chart = new NightVision('sma-cross-chart-container', {
    width: '1280',
    height: '600',
    scripts: [Dots, Trades]
  });

  const SMAConfig = {
    name: 'SMA',
    type: 'Spline',
    data: SMA,
    settings: {
      precision: 4
    },
    props: {
      color: 'red'
    }
  };

  const ATRConfig = {
    name: 'ATR',
    type: 'Spline',
    data: ATR,
    settings: {
      precision: 4
    },
    props: {
      color: 'yellow'
    }
  }

  const CrossConfig = {
    name: 'Cross',
    type: 'Dots',
    data: Cross,
    settings: {
      precision: 4
    }
  };

  const TradesConfig = {
    name: 'Trades',
    type: 'Trades',
    data: TradesData,
    settings: {
      precision: 4
    }
  }

  chart.data = {
    panes: [{
      overlays: [{
        name: marketDetails.symbol + ' ' + marketDetails.timeframe + ' ' + marketDetails.exchange,
        type: 'Candles',
        data: data,
        settings: {
          precision: 4
        }
      },
        SMAConfig,
        CrossConfig,
        TradesConfig
      ]
    }, {
      overlays: [ATRConfig]
    }]
  }
}
