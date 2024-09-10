import { encodeFunctionData, erc20Abi } from 'viem';
import { PaymasterMode, BiconomySmartAccountV2 } from '@biconomy/account';
import { abi } from './abi';
import { transferFromIntegratedWallet } from './IntegratedWallet';

const MvmntManagerAddress = '0x96E9fEe2f3dDc81E9F8309D1d50a9bD14158123b';

export async function newPayTransaction(
  smartAccount: BiconomySmartAccountV2 | null,
  paymentInputParams: {
    productId: number;
    price: string;
    adminShare: string;
    buyer: string;
    buyerPoints: number;
    seller: string;
    sellerPoints: number;
    paymentId: number;
    token: string;
    donationAmount: string;
    nonProfitVault: string;
    expiry: number;
    sign: string;
  },
  isIntegratedWallet?: boolean,
) {
  if (!smartAccount) {
    throw new Error('Smart account is not available');
  }

  const amount =
    paymentInputParams.adminShare + paymentInputParams.donationAmount;

  const transactions = [];

  if (
    paymentInputParams.token !== '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
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
      paymentInputParams.token === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
        ? BigInt(amount)
        : BigInt(0),
  });

  console.log('Transactions:', transactions);
  if (isIntegratedWallet) {
    const amountInWei = await smartAccount.getGasEstimate(transactions, {
      paymasterServiceData: {
        mode: PaymasterMode.ERC20,
        preferredToken: '0x7683022d84f726a96c4a6611cd31dbf5409c0ac9',
      },
    });
    // await transferFromIntegratedWallet(
    //   amountInWei,
    //   await smartAccount.getAccountAddress(),
    // );
    console.log('Amount in Wei:', amountInWei);
  }

  // console.log('debug', process.env.BICONOMY_SDK_DEBUG);

  // const amountInWei = await smartAccount.getGasEstimate(transactions, {
  //   paymasterServiceData: {
  //     mode: PaymasterMode.ERC20,
  //     preferredToken: '0x7683022d84f726a96c4a6611cd31dbf5409c0ac9',
  //   },
  // });

  // console.log('Amount in Wei:', amountInWei);

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
    receipt: { transactionHash },
    userOpHash,
    success,
  } = await userop.wait();

  if (success === 'true') {
    console.log('UserOp hash', userOpHash);
    console.log('Transaction hash', transactionHash);
    return { success: true, userOpHash, txnhash, transactionHash };
  } else {
    console.error('Transaction failed');
    return { success: false, error: 'Transaction failed' };
  }
}
