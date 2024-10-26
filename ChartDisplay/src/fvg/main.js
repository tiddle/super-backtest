import '../../style.css'
import { NightVision } from 'night-vision'
import data from '../../../data/FVG/ohlcv.json';
import marketDetails from '../../../data/FVG/marketDetails.json';
import TradesData from '../../../data/FVG/trades.json'
import SMA from '../../../data/FVG/sma.json';
import FVG from '../../../data/FVG/fvg.json';
import Trades from '../nv-scripts/trades.navy';
import FVGVisual from '../nv-scripts/fvg.navy';

export function FVGChart(el) {

  el.innerHTML = `
    <style>
    </style>
    <h1 style="margin-top: 0">fvg</h1>
    <div id="sma-cross-chart-container"></div>
    `
  const chart = new NightVision('sma-cross-chart-container', {
    width: '1280',
    height: '600',
    scripts: [FVGVisual, Trades]
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

  const FVGConfig = {
    name: 'FVG',
    type: 'FVG',
    data: FVG,
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
        FVGConfig,
        TradesConfig
      ]
    }]
  }
}


