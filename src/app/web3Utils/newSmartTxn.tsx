import { useState } from 'react';
import { encodeFunctionData, erc20Abi } from 'viem';
import { PaymasterMode, createPaymaster } from '@biconomy/account';
import { useWeb3Auth } from './web3AuthProvider';
import { abi } from './abi';

export function useSmartAccountTransaction() {
  const { smartAccount } = useWeb3Auth();
  const [isLoading, setIsLoading] = useState(false);

  // console.log('transaction loading', isLoading);

  const paymentInputParams = {
    productId: 1,
    price: 3,
    adminShare: 7,
    buyer: '0xD14dc307f52442b6A36432AcA4520B7B07273325',
    buyerPoints: 5,
    seller: '0x8982828Ed33DC8cAEeF166eF4aBCB6B46d74b12a',
    sellerPoints: 5,
    paymentId: 1,
    token: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    donationAmount: 0,
    nonProfitVault: '0x7e883715EcFF611C3417170B9b926A113748A305',
    expiry: 2,
    sign: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  };

  const executeTransaction = async () => {
    if (!smartAccount) {
      console.error('Smart account is not available');
      return;
    }

    setIsLoading(true);

    try {
      const biconomyPaymaster = await createPaymaster({
        paymasterUrl:
          'https://paymaster.biconomy.io/api/v1/84532/EegseJJl5.0761a753-58e6-4cc0-b69f-db099d9592d6',
      });

      const encodedCall = encodeFunctionData({
        abi: abi,
        functionName: 'pay',
        args: [paymentInputParams],
      });

      const transaction = {
        to: '0x96E9fEe2f3dDc81E9F8309D1d50a9bD14158123b',
        data: encodedCall,
        value: 7,
      };

      const userOp = await smartAccount.buildUserOp([transaction]);
      console.log('User operation:', userOp);

      const feeQuotesResponse =
        await biconomyPaymaster.getPaymasterFeeQuotesOrData(userOp, {
          mode: PaymasterMode.ERC20,
          tokenList: ['0x7683022d84f726a96c4a6611cd31dbf5409c0ac9'],
          preferredToken: '0x7683022d84f726a96c4a6611cd31dbf5409c0ac9',
        });

      if (
        !feeQuotesResponse.feeQuotes ||
        feeQuotesResponse.feeQuotes.length === 0
      ) {
        throw new Error('No fee quotes available');
      }

      const selectedFeeQuote = feeQuotesResponse.feeQuotes[0];
      console.log('Selected fee quote:', selectedFeeQuote);

      if (!feeQuotesResponse.tokenPaymasterAddress) {
        throw new Error('Token Paymaster Address is not available');
      }

      const finalUserOp = await smartAccount.buildTokenPaymasterUserOp(userOp, {
        feeQuote: selectedFeeQuote,
        spender: feeQuotesResponse.tokenPaymasterAddress,
        maxApproval: true,
      });

      const paymasterServiceData = {
        mode: PaymasterMode.ERC20,
        feeTokenAddress: selectedFeeQuote.tokenAddress,
        calculateGasLimits: true,
      };
      const paymasterAndDataWithLimits =
        await biconomyPaymaster.getPaymasterAndData(
          finalUserOp,
          paymasterServiceData,
        );
      finalUserOp.paymasterAndData =
        paymasterAndDataWithLimits.paymasterAndData;

      if (
        paymasterAndDataWithLimits.callGasLimit &&
        paymasterAndDataWithLimits.verificationGasLimit &&
        paymasterAndDataWithLimits.preVerificationGas
      ) {
        finalUserOp.callGasLimit = paymasterAndDataWithLimits.callGasLimit;
        finalUserOp.verificationGasLimit =
          paymasterAndDataWithLimits.verificationGasLimit;
        finalUserOp.preVerificationGas =
          paymasterAndDataWithLimits.preVerificationGas;
      }

      const userOpResponse = await smartAccount.sendUserOp(finalUserOp);
      const { receipt } = await userOpResponse.wait(1);

      console.log('Fee quotes response:', feeQuotesResponse);

      console.log('Transaction hash:', receipt.transactionHash);
      console.log('User operation receipt:', receipt);
    } catch (error) {
      console.error('Error sending transaction:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    executeTransaction,
  };
}
