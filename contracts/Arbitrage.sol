
pragma solidity ^0.6.6;

import '@uniswap/v2-periphery/contracts/libraries/UniswapV2Library.sol';
import '@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol';
import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol';
import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol';
import '@uniswap/v2-core/contracts/interfaces/IERC20.sol';

contract Arbitrage {
    // central hub within a uniswap like ecosystem
    // that provides info about liquidity pools.
    address public factory;

    // the date that the trade is due
    uint constant deadline = 10 days;

    // a central smart contract in the sushi swap
    // ecosystem that is used to trade in its liquidity pools
    IUniswapV2Router02 public sushiRouter;

    constructor(address _factory,  address _sushiRouter) public {
        factory = _factory;
        sushiRouter = IUniswapV2Router02(_sushiRouter);
    }

    // arguments
    // token0: the token we are going to borrow
    // token1: the token we are going to trade token0 for
    // amount0: the amount we're borrowing of token0
    // amount1: the amoubnt we're borrowing of token1
    // pairAddress: the address of the liquidity pool on uniswap that 
    // contains the pair we are borrowing/trading
    function startArbitrage(
        address token0,
        address token1,
        uint amount0,
        uint amount1
    ) external {
        address pairAddress = IUniswapV2Factory(factory).getPair(token0, token1);
        require(pairAddress != address(0), 'No such pool exists');

        // triggers the flashloan
        IUniswapV2Pair(pairAddress).swap(
            amount0,
            amount1,
            address(this),
            bytes('not empty')
        );
    }

    // uniswap expects the smart contract initiating the flashloan 
    // to have a function named uniswapV2Call which gets 
    // called by uniswap after a flashloan call
    function uniswapV2Call(
        address _sender, 
        uint _amount0, 
        uint _amount1, 
        bytes calldata _data
    ) external {
        address[] memory path = new address[](2);
        uint amountToken = _amount0 == 0 ? _amount1 : _amount0;

        address token0 = IUniswapV2Pair(msg.sender).token0();
        address token1 = IUniswapV2Pair(msg.sender).token1();

        require(msg.sender == UniswapV2Library.pairFor(factory, token0, token1), 'Unauthorized'); 
        require(_amount0 == 0 || _amount1 == 0);

        path[0] = _amount0 == 0 ? token1 : token0;
        path[1] = _amount0 == 0 ? token0 : token1;

        IERC20 token = IERC20(_amount0 == 0 ? token1 : token0);

        token.approve(address(sushiRouter), amountToken);

        uint amountRequired = UniswapV2Library.getAmountsIn(factory, amountToken, path)[0];
        uint amountReceived = sushiRouter.swapExactTokensForTokens(amountToken, amountRequired, path, msg.sender, deadline)[1];

        IERC20 otherToken = IERC20(_amount0 == 0 ? token0 : token1);
        otherToken.transfer(msg.sender, amountRequired); //Reimbursh Loan
        otherToken.transfer(tx.origin, amountReceived - amountRequired); //Keep Profit
    }
}