import '../../style.css'
import { NightVision, Scripts } from 'night-vision'
import data from '../../../data/SMA Cross/ohlcv.json';
import TradesData from '../../../data/SMA Cross/purchases.json'
import Cross from '../../../data/SMA Cross/cross.json';
import Dots from '../nv-scripts/dots.navy';
import Trades from '../nv-scripts/trades.navy';

document.querySelector('#app').innerHTML = `
<style>
body {
    background-color: #0c0d0e;
}
</style>
<h1>SMA Cross</h1>
<div id="sma-cross-chart-container"></div>
`
let chart = new NightVision('sma-cross-chart-container', {
    width: '1280',
    height: '800',
    scripts: [Dots, Trades]
})
chart.data = {
    panes: [{
        overlays: [{
            name: 'BTC/AUD btcmarkets',
            type: 'Candles',
            data: data,
            settings: {
                precision: 4
            }
        }, {
            name: 'SMA',
            type: 'Spline',
            data: data.reduce((acc, p) => { 
                if(p[6]) 
                    acc.push([p[0], p[6]]);

                return acc;
            }, []),
            settings: {
                precision: 4
            },
            props: {
                color: 'red'
            }
        }, 
        {
            name: 'Cross',
            type: 'Dots',
            data: Cross,
            settings: {
                precision: 4
            }
        },
        {
            name: 'Trades',
            type: 'Trades',
            data: TradesData,
            settings: {
                precision: 4
            }
        }
      ]
    }]
}
