# Super Backtest

By Carlo Cruz

Working title

## How to use

### Terminal 1

1. `cd StrategyExecutor`
1. `deno run dev`

### Terminal 2

1. `cd ChartDisplay`
1. `npm i`
1. `npm run dev`

Terminal 2 is only required if you want your strategy visualised.

## Backtesting Framework

A backtesting framework that iterates through a set of candles.

- `/StrategyExecutor`
  - Contains all the strategies
- `/ChartDisplay`
  - Contains the software that visualises the strategy
  - Uses [Night Vision](https://nightvision.dev/)
- `/data/<strategy name>`
  - Contains data required for visualisation of strategy
  - Mostly json files

## Roadmap
- Optimisation
  - Add functionality that allows params to be passed in so that it can find the right balance
- Modularity
  - Make it more generic


## Licenses

MIT License available 

