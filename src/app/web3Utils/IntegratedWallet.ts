// import { ethers } from 'ethers';

// export const transferFromIntegratedWallet = async (
//   amountToTransfer: bigint,
//   smartAccountAddress: string | null,
// ) => {
//   try {
//     if (typeof (window as any).ethereum === 'undefined') {
//       throw new Error('MetaMask is not installed');
//     }
//     await (window as any).ethereum.request({
//       method: 'eth_requestAccounts',
//     });
//     const provider = new ethers.BrowserProvider((window as any).ethereum);
//     const signer = await provider.getSigner();
//     console.log('Connected to MetaMask');

//     // Calculate the amount to transfer (you may need to adjust this based on your requirements)

//     console.log('Amount to transfer:', amountToTransfer);
//     console.log('Smart account address:', smartAccountAddress);

//     // Transfer funds from MetaMask to smart account
//     const tx = await signer.sendTransaction({
//       to: smartAccountAddress,
//       value: BigInt(amountToTransfer),
//     });
//     await tx.wait();

//     console.log('Funds transferred to smart account');
//   } catch (err) {
//     console.error('Error in MetaMask payment:', err);
//   }
// };

import { createWalletClient, custom } from 'viem';
import { baseSepolia } from 'viem/chains';

export const transferFromIntegratedWallet = async (
  amountToTransfer: bigint,
  smartAccountAddress: string | null,
) => {
  try {
    if (typeof (window as any).ethereum === 'undefined') {
      throw new Error('MetaMask is not installed');
    }

    const walletClient = createWalletClient({
      chain: baseSepolia,
      transport: custom((window as any).ethereum),
    });

    const [address] = await walletClient.requestAddresses();
    console.log('Connected to MetaMask viem');

    if (!smartAccountAddress) {
      throw new Error('Smart account address is not provided');
    }

    console.log('Amount to transfer:', amountToTransfer.toString());
    console.log('Smart account address:', smartAccountAddress);

    // Transfer funds from MetaMask to smart account
    const hash = await walletClient.sendTransaction({
      account: address,
      to: smartAccountAddress as `0x${string}`,
      value: amountToTransfer,
    });

    console.log('Transaction hash:', hash);
    console.log('Funds transferred to smart account viem');

    return hash;
  } catch (err) {
    console.error('Error in MetaMask payment:', err);
    throw err;
  }
};
