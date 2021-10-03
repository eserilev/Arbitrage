
import qs from "qs";
import fetch from "node-fetch";


const ONE_ETHER = 1000000000000000000;
// params
// _buyToken: The ERC20 token address or symbol of the token you want to receive.
// _sellToken: The ERC20 token address or symbol of the token you want to send.
// _dex1: a dex where we are making a request for quote
// _dex2: a dex where we are making a request for quote
async function start(_buyToken, _sellToken, _dex1, _dex2) {

    const params1 = {
        buyToken: _buyToken,
        sellToken: _sellToken,
        sellAmount: ONE_ETHER,
        includedSources: _dex1,
    }

    const response1 = await fetch(`https://api.0x.org/swap/v1/quote?${qs.stringify(params1)}`);

    if (response1.status !== 200) return;

    var DEX1 = await response1.json();

    const params2 = {
        buyToken: _buyToken,
        sellToken: _sellToken,
        sellAmount: ONE_ETHER,
        includedSources: _dex2
    }

    const response2 = await fetch(`https://api.0x.org/swap/v1/quote?${qs.stringify(params2)}`);
    if(response2.status !== 200) return;

    var DEX2 = await response2.json();

    let result1 = buildResult(DEX1, _dex1, "SELL");
    let result2 = buildResult(DEX2, _dex2, "SELL");

    console.log(result1);
    console.log(result2);

    const price1 = parseFloat(DEX1["price"].toString()).toFixed(8);
    const gasPrice1 = parseFloat(DEX1["gasPrice"].toString()).toFixed(8);
    const price2 = parseFloat(DEX2["price"].toString()).toFixed(8);
    const gasPrice2 = parseFloat(DEX2["gasPrice"].toString()).toFixed(8);
    
    const ethPriceInUSD = await getEthPrice();
    
    const profit = calculateProfit(result1, result2, ethPriceInUSD);

    if (profit > 0) {
        // we found an arbitrage opportunity
    } else {
        // we didnt find an arbitrage opportunity
    }

}


function calculateProfit(dex1Result, dex2Result, ethPriceInUSD) {
    // get the arbitrage price difference between the two dexs
    const priceDiff = Math.abs(dex1Result.price - dex2Result.price);
    // const diffRatio = priceDiff / Math.max(dex1Result.price, dex2Result.price);

    // total gas for the two transactions
    const totalGas = parseFloat(dex1Result.gas) + parseFloat(dex2Result.gas);
    // get the gas cost in either
    const gasInEther = calculateGasCost(totalGas, dex1Result.gasPrice);
    // get the gas cost in USD
    const gasUSD = gasInEther * ethPriceInUSD;
    // profit after gas costs
    const profit = priceDiff - gasUSD;

    return profit;
}

function calculateGasCost(totalGas, gasPrice) {
    return totalGas * gasPrice /  ONE_ETHER; 
}

async function getEthPrice() {
    const params1 = {
        buyToken: 'DAI',
        sellToken: 'WETH',
        sellAmount: '1000000000000000000',
        includedSources: 'UniswapV2',
    }

    const response1 = await fetch(`https://api.0x.org/swap/v1/quote?${qs.stringify(params1)}`);

    if(response1.status !== 200) return;

    var DEX = await response1.json();

    const ethPriceInUSD = parseFloat(DEX["price"].toString()).toFixed(18);

    return ethPriceInUSD;
}

function buildResult(response, dex, transactionType) {
    return {
        price: parseFloat(response["price"].toString()).toFixed(8),
        guaranteedPrice: parseFloat(response["guaranteedPrice"].toString()).toFixed(18),
        dex: dex,
        gas: parseFloat(response["gas"].toString()).toFixed(18),
        gasPrice: parseFloat(response["gasPrice"].toString()).toFixed(18),
        estimatedGas: parseFloat(response["estimatedGas"].toString()).toFixed(18),
        transactionType: transactionType,
        protocolFee: parseFloat(response["protocolFee"].toString()).toFixed(18),
        minimumProtocolFee:  parseFloat(response["minimumProtocolFee"].toString()).toFixed(18),
    }
}

async function monitor() {
    await start("DAI", "WETH", "UniswapV2", "SushiSwap");
}

monitor();
