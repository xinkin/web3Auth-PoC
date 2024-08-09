import { encodeFunctionData, parseEther } from 'viem';
import { PaymasterMode, createPaymaster } from '@biconomy/account';
import { useSmartAccountStore } from './store';
import { abi } from './abi';
import { useWeb3Auth } from './web3AuthProvider';

const paymentInputParams = {
  productId: 1,
  price: 1,
  adminShare: 5,
  buyer: '0xD14dc307f52442b6A36432AcA4520B7B07273325',
  buyerPoints: 5,
  seller: '0x8982828Ed33DC8cAEeF166eF4aBCB6B46d74b12a',
  sellerPoints: 5,
  paymentId: 1,
  token: '0x4200000000000000000000000000000000000006',
  donationAmount: 0,
  nonProfitVault: '0x7e883715EcFF611C3417170B9b926A113748A305',
  expiry: 2,
  sign: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
};

export async function smartAccTxn() {
  // const { smartAccount } = useWeb3Auth();
  const { smartAccount } = useSmartAccountStore.getState();

  if (!smartAccount) {
    console.error('Smart account is not available');
    return;
  }
  const biconomyPaymaster = await createPaymaster({
    paymasterUrl:
      'https://paymaster.biconomy.io/api/v1/84532/EegseJJl5.0761a753-58e6-4cc0-b69f-db099d9592d6',
  });
  //TODO: Replace the following with the address MVMNT Manager Contract and required Arguments
  const encodedCall = encodeFunctionData({
    abi: abi,
    functionName: 'pay',

    args: [paymentInputParams],
  });
  //TODO: Replace the following with the address of the MVMNT Manager Contract
  const transaction = {
    to: '0x96E9fEe2f3dDc81E9F8309D1d50a9bD14158123b',
    data: encodedCall,
    value: parseEther('0.001'),
  };

  try {
    const userOp = await smartAccount.buildUserOp([transaction]);

    // 2. Get paymaster fee quote
    const feeQuotesResponse =
      await biconomyPaymaster.getPaymasterFeeQuotesOrData(userOp, {
        mode: PaymasterMode.ERC20,
        tokenList: ['0x7683022d84f726a96c4a6611cd31dbf5409c0ac9'], // You can specify a list of token addresses here
        preferredToken: '0x7683022d84f726a96c4a6611cd31dbf5409c0ac9', // You can specify a preferred token here
      });

    if (
      !feeQuotesResponse.feeQuotes ||
      feeQuotesResponse.feeQuotes.length === 0
    ) {
      throw new Error('No fee quotes available');
    }

    const selectedFeeQuote = feeQuotesResponse.feeQuotes[0];

    if (!feeQuotesResponse.tokenPaymasterAddress) {
      throw new Error('Token Paymaster Address is not available');
    }

    const finalUserOp = await smartAccount.buildTokenPaymasterUserOp(userOp, {
      feeQuote: selectedFeeQuote,
      spender: feeQuotesResponse.tokenPaymasterAddress,
      maxApproval: false,
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
    finalUserOp.paymasterAndData = paymasterAndDataWithLimits.paymasterAndData;

    if (
      paymasterAndDataWithLimits.callGasLimit &&
      paymasterAndDataWithLimits.verificationGasLimit &&
      paymasterAndDataWithLimits.preVerificationGas
    ) {
      // Returned gas limits must be replaced in your op as you update paymasterAndData.
      // Because these are the limits paymaster service signed on to generate paymasterAndData
      // If you receive AA34 error check here...

      finalUserOp.callGasLimit = paymasterAndDataWithLimits.callGasLimit;
      finalUserOp.verificationGasLimit =
        paymasterAndDataWithLimits.verificationGasLimit;
      finalUserOp.preVerificationGas =
        paymasterAndDataWithLimits.preVerificationGas;
    }

    const userOpResponse = await smartAccount.sendUserOp(finalUserOp);
    const { receipt } = await userOpResponse.wait(1);
    console.log('feeQuote:', feeQuotesResponse);

    console.log('Transaction hash:', receipt.transactionHash);
    console.log('User operation receipt:', receipt);
  } catch (error) {
    console.error('Error sending transaction:', error);
  }
}
