import { useState, useCallback, useEffect } from 'react';
import { encodeFunctionData, erc20Abi } from 'viem';
import { PaymasterMode, createPaymaster } from '@biconomy/account';
import { useWeb3Auth } from './web3AuthProvider';
import { abi } from './abi';
import { baseSepolia } from 'viem/chains';

interface Transaction {
  to: string;
  data: `0x${string}`;
  value?: bigint;
}

const paymentInputParams = {
  productId: 1,
  price: 3,
  adminShare: 3,
  buyer: '0xD14dc307f52442b6A36432AcA4520B7B07273325',
  buyerPoints: 5,
  seller: '0x8982828Ed33DC8cAEeF166eF4aBCB6B46d74b12a',
  sellerPoints: 5,
  paymentId: 1,
  token: '0x7683022d84F726a96c4A6611cD31DBf5409c0Ac9',
  donationAmount: 0,
  nonProfitVault: '0x7e883715EcFF611C3417170B9b926A113748A305',
  expiry: 2,
  sign: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
};

const MvmntManagerAddress = '0x96E9fEe2f3dDc81E9F8309D1d50a9bD14158123b';

const amount =
  paymentInputParams.adminShare + paymentInputParams.donationAmount;

export function usePayTransaction() {
  const { smartAccount } = useWeb3Auth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const prepareTransactions = useCallback(() => {
    if (
      paymentInputParams.token !== '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
    ) {
      const encodedCallERC20 = encodeFunctionData({
        abi: erc20Abi,
        functionName: 'approve',
        args: [MvmntManagerAddress, BigInt(amount)],
      });

      const TxnERC20: Transaction = {
        to: paymentInputParams.token,
        data: encodedCallERC20,
      };

      const encodedCallManager = encodeFunctionData({
        abi: abi,
        functionName: 'pay',
        args: [paymentInputParams],
      });

      const TxnManager: Transaction = {
        to: MvmntManagerAddress,
        data: encodedCallManager,
      };

      setTransactions([TxnERC20, TxnManager]);
    } else {
      const encodedCallManager = encodeFunctionData({
        abi: abi,
        functionName: 'pay',
        args: [paymentInputParams],
      });

      const TxnManager: Transaction = {
        to: MvmntManagerAddress,
        data: encodedCallManager,
        value: BigInt(amount),
      };
      setTransactions([TxnManager]);
    }
  }, [paymentInputParams]);

  const sendTransaction = useCallback(async () => {
    if (!smartAccount) {
      setError('Smart account is not available');
      return;
    }

    if (transactions.length === 0) {
      setError('No transactions to send');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const biconomyPaymaster = await createPaymaster({
        paymasterUrl: `https://paymaster.biconomy.io/api/v1/${baseSepolia.id}/EegseJJl5.0761a753-58e6-4cc0-b69f-db099d9592d6`,
      });

      const userOp = await smartAccount.buildUserOp(transactions);
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
      setError(
        error instanceof Error ? error.message : 'An unknown error occurred',
      );
    } finally {
      setIsLoading(false);
    }
  }, [smartAccount, transactions]);

  const onPay = useCallback(() => {
    prepareTransactions();
  }, [prepareTransactions]);

  useEffect(() => {
    if (transactions.length > 0 && !isLoading) {
      sendTransaction();
    }
  }, [transactions, sendTransaction, isLoading]);

  return { onPay, isLoading, error, transactions };
}
