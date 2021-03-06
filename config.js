const fs = require("fs");
const log = require('./lib/log');
const pjson = require("./package");

const config = {
  api: process.env.CPBB_TEST
    ? "https://api-public.sandbox.pro.coinbase.com"
    : "https://api.pro.coinbase.com",
  // default run once per 12 hours at the 5th minute (crontab syntax)
  // testing mode will run every minute
  freq: process.env.CPBB_TEST
    ? "* * * * *"
    : process.env.CPBB_FREQ || "5 */12 * * *",
  // default $10 action
  vol: Number(process.env.CPBB_VOL || 10),
  // default 15% APY target (we aim to shave off any excess from this gain)
  apy: Number(process.env.CPBB_APY || 15) / 100,
  // if the trading pair ordering doesn't exist (e.g. BTC-LTC)
  // we have to reverse our logic to run from the trading pair that does exist (e.g. LTC-BTC)
  reverse: false,
  // default ticker currency is BTC
  ticker: process.env.CPBB_TICKER || "BTC",
  // default home currency is USD
  currency: process.env.CPBB_CURRENCY || "USD",
  pjson,
};
config.productID = `${config.ticker}-${config.currency}`;
let historyName = config.productID
// currenly, we only support reversing BTC orders to support ticker pairs that don't exist
if (config.ticker === 'BTC' && !['USD', 'USDC', 'GBP', 'EUR'].includes(config.currency)) {
  config.reverse = true;
  historyName = config.productID; // still save as history.BTC-LTC...
  // ask coinbase for LTCBTC pair
  config.productID = `${config.currency}-${config.ticker}`;
  log.zap(`running in reverse logic mode to support inverted ticker`);
}
let historySubName = "";
if (process.env.CPBB_TEST) historySubName = ".sandbox";
if (process.env.CPBB_DRY_RUN) historySubName = ".dryrun";
config.history_file = `${__dirname}/data/history.${historyName}${historySubName}.tsv`;
log.ok(config.history_file);
if (!fs.existsSync(config.history_file)) {
  // copy the template
  console.log("creating log file from template", config.history_file);
  fs.copyFileSync(`${__dirname}/data/history.tsv`, config.history_file);
}
module.exports = config;
