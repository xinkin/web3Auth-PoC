import { useState, useCallback } from 'react';
import { encodeFunctionData, erc20Abi } from 'viem';
import { PaymasterMode } from '@biconomy/account';
import { useWeb3Auth } from './web3AuthProvider';
import { abi } from './abi';

const paymentInputParams = {
  productId: 1,
  price: 3,
  adminShare: 3,
  buyer: '0xdb5a2d5c54EbB6152a4abACC974FccC736C58e74',
  buyerPoints: 7,
  seller: '0x8982828Ed33DC8cAEeF166eF4aBCB6B46d74b12a',
  sellerPoints: 7,
  paymentId: 1,
  token: '0x7683022d84f726a96c4a6611cd31dbf5409c0ac9',
  donationAmount: 0,
  nonProfitVault: '0x7e883715EcFF611C3417170B9b926A113748A305',
  expiry: 2,
  sign: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
};

const MvmntManagerAddress = '0x96E9fEe2f3dDc81E9F8309D1d50a9bD14158123b';

const amount =
  paymentInputParams.adminShare + paymentInputParams.donationAmount;

export function useNewPayTransaction() {
  const { smartAccount } = useWeb3Auth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onNewPay = useCallback(async () => {
    if (!smartAccount) {
      throw new Error('Smart account is not available');
    }

    setIsLoading(true);
    setError(null);

    try {
      const transactions = [];

      if (
        paymentInputParams.token !==
        '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
      ) {
        const encodedCallERC20 = encodeFunctionData({
          abi: erc20Abi,
          functionName: 'approve',
          args: [MvmntManagerAddress, BigInt(amount)],
        });
        transactions.push({
          to: paymentInputParams.token,
          data: encodedCallERC20,
        });
      }

      const encodedCallManager = encodeFunctionData({
        abi: abi,
        functionName: 'pay',
        args: [paymentInputParams],
      });
      transactions.push({
        to: MvmntManagerAddress,
        data: encodedCallManager,
        value:
          paymentInputParams.token ===
          '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
            ? BigInt(amount)
            : BigInt(0),
      });

      console.log('Transactions:', transactions);
      console.log('debug', process.env.BICONOMY_SDK_DEBUG);

      const userop = await smartAccount.sendTransaction(transactions, {
        paymasterServiceData: {
          mode: PaymasterMode.ERC20,
          preferredToken: '0x7683022d84f726a96c4a6611cd31dbf5409c0ac9',
        },
      });

      console.log('UserOp:', userop);
      const txnhash = await userop.waitForTxHash();
      console.log('Txn hash:', txnhash);

      const {
        receipt: { transactionHash: transactionHash },
        userOpHash: userOpHash,
        success: success,
      } = await userop.wait();

      if (success === 'true') {
        console.log('UserOp hash', userOpHash);
        console.log('Transaction hash', transactionHash);
      }
      if (success === 'false') {
        console.error('Transaction failed');
      }
    } catch (err) {
      console.error('Error in transaction:', err);
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred',
      );
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [smartAccount]);

  return { onNewPay, isLoading, error };
}
