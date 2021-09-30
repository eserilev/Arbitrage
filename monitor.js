
import qs from "qs";
import fetch from "node-fetch";


async function start(_buyToken, _sellToken, _dex1, _dex2) {
    const params1 = {
        buyToken: _buyToken,
        sellToken: _sellToken,
        sellAmount: '1000000000000000000',
        includedSources: _dex1
    }

    const response1 = await fetch(`https://ropsten.api.0x.org/swap/v1/quote?${qs.stringify(params1)}`);

    console.log(response1.status);

    if(response1.status !== 200) return;
    var DEX1 = await response1.json();
    

    const params2 = {
        buyToken: _buyToken,
        sellToken: _sellToken,
        buyAmount: '1000000000000000000',
        includedSources: _dex2
    }

    const response2 = await fetch(`https://ropsten.api.0x.org/swap/v1/quote?${qs.stringify(params2)}`);

    var DEX2 = await response2.json();

    let price1 = parseFloat(DEX1["price"].toString()).toFixed(8);
    let price2 = parseFloat(DEX2["price"].toString()).toFixed(8);
    
    // Calculate difference in prices
    let rawDiff = (price2 - price1).toFixed(8);

    console.log(rawDiff);
}

async function monitor() {
    await start("DAI", "WETH", "UniswapV2", "SushiSwap");
}

monitor();
