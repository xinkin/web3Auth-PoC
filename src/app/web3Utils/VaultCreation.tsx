import { useState, useCallback } from 'react';
import { encodeFunctionData } from 'viem';
import { PaymasterMode } from '@biconomy/account';
import { useWeb3Auth } from './web3AuthProvider';
import { abi } from './abi';

const MvmntManagerAddress = '0x96E9fEe2f3dDc81E9F8309D1d50a9bD14158123b';

export function useVaultCreation() {
  const { smartAccount, smartAccountAddress } = useWeb3Auth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setAdminVault = useCallback(async () => {
    if (!smartAccount || !smartAccountAddress) {
      setError('Smart account is not available');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const encodedCall = encodeFunctionData({
        abi: abi,
        functionName: 'setAdminVault',
        args: ['0xd14dc307f52442b6a36432aca4520b7b07273325'],
      });

      const transaction = {
        to: MvmntManagerAddress,
        data: encodedCall,
      };

      const { wait } = await smartAccount.sendTransaction(transaction, {
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
        console.log('UserOp receipt', userOpHash);
        console.log('Transaction receipt', transactionHash.receipt);
        console.log('Transaction hash', transactionHash);
        return { transactionHash, userOpHash };
      } else {
        throw new Error('Transaction failed');
      }
    } catch (err) {
      console.error('Error in setAdminVault:', err);
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred',
      );
    } finally {
      setIsLoading(false);
    }
  }, [smartAccount, smartAccountAddress]);

  const createNonProfitVault = useCallback(async () => {
    if (!smartAccount) {
      setError('Smart account is not available');
      return;
    }
    try {
      const encodedCall = encodeFunctionData({
        abi: abi,
        functionName: 'createNonProfitVault',
      });

      const transaction = {
        to: MvmntManagerAddress,
        data: encodedCall,
      };

      console.log('Transaction:', transaction);

      const { wait } = await smartAccount.sendTransaction(transaction, {
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
        return { transactionHash, userOpHash };
      } else {
        throw new Error('Transaction failed');
      }
    } catch (err) {
      console.error('Error in createNonProfitVault:', err);
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred',
      );
    } finally {
      setIsLoading(false);
    }
  }, [smartAccount]);

  return { setAdminVault, createNonProfitVault, isLoading, error };
}
