import {
  AlphaRouter,
  SwapOptionsSwapRouter02,
  SwapRoute,
  SwapType,
} from '@uniswap/smart-order-router';
import { TradeType, CurrencyAmount, Percent, ChainId } from '@uniswap/sdk-core';
import { CurrentConfig } from './config';
import { ethers } from 'ethers';
import { BaseProvider } from '@ethersproject/providers';
import { fromReadableAmount } from './conversions';

export async function generateRoute(): Promise<SwapRoute | null> {
  const provider = new ethers.JsonRpcProvider(CurrentConfig.rpc.local);
  const router = new AlphaRouter({
    chainId: ChainId.BASE,
    provider: provider as unknown as BaseProvider,
  });

  const options: SwapOptionsSwapRouter02 = {
    recipient: CurrentConfig.wallet.address,
    slippageTolerance: new Percent(50, 10_000),
    deadline: Math.floor(Date.now() / 1000 + 1800),
    type: SwapType.SWAP_ROUTER_02,
  };

  const route = await router.route(
    CurrencyAmount.fromRawAmount(
      CurrentConfig.tokens.in,
      fromReadableAmount(
        CurrentConfig.tokens.amountIn,
        CurrentConfig.tokens.in.decimals,
      ).toString(),
    ),
    CurrentConfig.tokens.out,
    TradeType.EXACT_INPUT,
    options,
  );

  return route;
}
