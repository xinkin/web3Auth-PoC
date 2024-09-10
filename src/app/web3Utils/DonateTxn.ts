import { useState, useCallback } from 'react';
import { encodeFunctionData, erc20Abi } from 'viem';
import { PaymasterMode } from '@biconomy/account';
import { useWeb3Auth } from './web3AuthProvider';
import { abi } from './abi';

interface Transaction {
  to: string;
  data: `0x${string}`;
  value?: bigint;
}

const donateParams = {
  nonProfitVault: '0x7e883715EcFF611C3417170B9b926A113748A305',
  token: '0x7683022d84f726a96c4a6611cd31dbf5409c0ac9',
  donationAmount: 3,
  pointsEarned: 5,
  paymentId: 1,
  expiry: 2,
  sign: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
};

const MvmntManagerAddress = '0x96E9fEe2f3dDc81E9F8309D1d50a9bD14158123b';

export function useDonateTransaction() {
  const { smartAccount } = useWeb3Auth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDonate = useCallback(async () => {
    if (!smartAccount) {
      throw new Error('Smart account is not available');
    }

    setIsLoading(true);
    setError(null);

    try {
      const transactions = [];

      // If not native token, add approval transaction
      if (donateParams.token !== '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE') {
        const approvalCall = encodeFunctionData({
          abi: erc20Abi,
          functionName: 'approve',
          args: [MvmntManagerAddress, BigInt(donateParams.donationAmount)],
        });
        transactions.push({
          to: donateParams.token,
          data: approvalCall,
        });
      }

      // Add donation transaction
      const donationCall = encodeFunctionData({
        abi: abi,
        functionName: 'donate',
        args: [
          donateParams.nonProfitVault,
          donateParams.token,
          donateParams.donationAmount,
          donateParams.pointsEarned,
          donateParams.paymentId,
          donateParams.expiry,
          donateParams.sign,
        ],
      });
      transactions.push({
        to: MvmntManagerAddress,
        data: donationCall,
        value:
          donateParams.token === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
            ? BigInt(donateParams.donationAmount)
            : BigInt(0),
      });

      const { wait } = await smartAccount.sendTransaction(transactions, {
        paymasterServiceData: {
          mode: PaymasterMode.ERC20,
          preferredToken: '0x7683022d84f726a96c4a6611cd31dbf5409c0ac9',
        },
      });

      const {
        receipt: { transactionHash },
        userOpHash,
        success,
      } = await wait();

      if (success === 'true') {
        console.log('UserOp hash', userOpHash);
        console.log('Transaction hash', transactionHash);
      } else {
        throw new Error('Transaction failed');
      }
    } catch (err) {
      console.error('Error in donation:', err);
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred',
      );
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [smartAccount]);

  return { onDonate, isLoading, error };
}
