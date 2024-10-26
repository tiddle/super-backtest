import { FVGChart } from "./fvg/main";
import { SMACrossChart } from "./sma-cross/main";

document.querySelector('#menu')!.innerHTML = `
<ul>
  <li><button name="fvg">FVG</button></li>
  <li><button name="sma-cross">SMA Cross</button></li>
  <li><button name="clear">Clear</button></li>
</ul>
`

const buttons = document.querySelectorAll('button');
buttons.forEach((btn) => {
  btn.addEventListener('click', (ev) => { displayChart(ev.target?.name || '') })
});

function displayChart(chart: string) {

  switch (chart) {
    case 'fvg':
      FVGChart(document.querySelector(('#app')));
      return;
    case 'sma-cross':
      SMACrossChart(document.querySelector(('#app')));
      return;

    default:
      document.querySelector('#app')!.innerHTML = `Hello World`;

  }
}
