import { encodeFunctionData } from 'viem';
import { PaymasterMode } from '@biconomy/account';
import { abi } from './abi';

interface Payment {
  productId: string;
  price: string;
  adminShare: string;
  buyerPoints: string;
  sellerPoints: string;
  paymentId: string;
  donationAmount: string;
  nonProfitVault: string;
}

interface TokenData {
  payments: Payment[];
  signature: string;
  expiry: string;
}

interface ApiResponse {
  message: string;
  success: boolean;
  data: Record<string, TokenData>;
}

const MvmntManagerAddress = '0x96E9fEe2f3dDc81E9F8309D1d50a9bD14158123b';

export async function processBatchPayments(
  smartAccount: any,
  apiResponse: ApiResponse,
  buyer: string,
  seller: string,
  tokenAddresses: Record<string, string>,
  path: string[],
) {
  if (!smartAccount) {
    throw new Error('Smart account is not available');
  }

  const results = [];

  for (const [token, tokenData] of Object.entries(apiResponse.data)) {
    const tokenAddress = tokenAddresses[token];
    if (!tokenAddress) {
      console.error(`Token address not found for ${token}`);
      continue;
    }

    const payments = tokenData.payments.map((payment) => ({
      productId: BigInt(payment.productId),
      price: BigInt(payment.price),
      adminShare: BigInt(payment.adminShare),
      buyerPoints: BigInt(payment.buyerPoints),
      sellerPoints: BigInt(payment.sellerPoints),
      paymentId: BigInt(payment.paymentId),
      donationAmount: BigInt(payment.donationAmount),
      nonProfitVault: payment.nonProfitVault,
    }));

    const common = {
      buyer,
      seller,
      token: tokenAddress,
      expiry: tokenData.expiry,
      sign: tokenData.signature,
    };

    try {
      const transactions = [];

      // Calculate total amount for approval
      const totalAmount = payments.reduce(
        (sum, payment) =>
          sum + BigInt(payment.adminShare) + BigInt(payment.donationAmount),
        BigInt(0),
      );

      // If not native token, add approval transaction
      if (tokenAddress !== '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE') {
        const approvalCall = encodeFunctionData({
          abi: abi,
          functionName: 'approve',
          args: [MvmntManagerAddress, totalAmount],
        });
        transactions.push({
          to: tokenAddress,
          data: approvalCall,
        });
      }

      // Add batchPay transaction
      const batchPayCall = encodeFunctionData({
        abi: abi,
        functionName: 'batchPay',
        args: [payments, common, path],
      });

      transactions.push({
        to: MvmntManagerAddress,
        data: batchPayCall,
        value:
          tokenAddress === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
            ? totalAmount
            : BigInt(0),
      });

      const { wait } = await smartAccount.sendTransaction(transactions, {
        paymasterServiceData: {
          mode: PaymasterMode.ERC20,
          preferredToken: tokenAddress,
        },
      });

      const {
        receipt: { transactionHash },
        userOpHash,
        success,
      } = await wait();

      if (success === 'true') {
        console.log(`Batch payment for ${token} successful`);
        console.log('UserOp hash', userOpHash);
        console.log('Transaction hash', transactionHash);
        results.push({ token, success: true, userOpHash, transactionHash });
      } else {
        throw new Error(`Transaction failed for ${token}`);
      }
    } catch (err) {
      console.error(`Error in batch payment for ${token}:`, err);
      results.push({
        token,
        success: false,
        error: err instanceof Error ? err.message : 'An unknown error occurred',
      });
    }
  }

  return results;
}
