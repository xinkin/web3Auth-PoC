'use client';
import React, { useState } from 'react';
import { useWeb3Auth } from './web3Utils/web3AuthProvider';
import { useSmartAccountTransaction } from './web3Utils/newSmartTxn';
import { usePayTransaction } from './web3Utils/PayTxn';
import { useNewPayTransaction } from './web3Utils/newPayTxn';
import { useVaultCreation } from './web3Utils/VaultCreation';
import { useDonateTransaction } from './web3Utils/DonateTxn';
import { newPayTransaction } from './web3Utils/payfunc';
import { ethers } from 'ethers';
import { transferFromIntegratedWallet } from './web3Utils/IntegratedWallet';

const paymentInputParams = {
  productId: 1,
  price: '30000000000000',
  adminShare: '30000000000000',
  buyer: '0xdb5a2d5c54EbB6152a4abACC974FccC736C58e74',
  buyerPoints: 7,
  seller: '0x8982828Ed33DC8cAEeF166eF4aBCB6B46d74b12a',
  sellerPoints: 7,
  paymentId: 1,
  token: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
  donationAmount: '0',
  nonProfitVault: '0x7e883715EcFF611C3417170B9b926A113748A305',
  expiry: 2,
  sign: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
};

const Dashboard = () => {
  const {
    loginWithGoogle,
    getUserInfo,
    logout,
    getSmartAccountInfo,
    authenticateUser,
    customLogin,
    getAppPubKey,
    isLoggedIn,
    smartAccount,
  } = useWeb3Auth();

  // const { executeTransaction } = useSmartAccountTransaction();
  // const { onDonate } = useDonateTransaction();
  const { createNonProfitVault, setAdminVault } = useVaultCreation();
  // const { onPay } = usePayTransaction();
  const { onNewPay } = useNewPayTransaction();

  const [result, setResult] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showCustomLogin, setShowCustomLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const [isMetaMaskConnected, setIsMetaMaskConnected] = useState(false);

  // useEffect(() => {
  //   const init = async () => {
  //     try {
  //       const connected = await initWeb3Auth();
  //       if (connected) {
  //         setLoggedIn(true);
  //         await initializeSmartAccount();
  //         const userInfo = await getUserInfo();
  //         setResult(userInfo);
  //       }
  //     } catch (error) {
  //       console.error(error);
  //       setResult(error);
  //     }
  //   };
  //   init();
  // }, []);

  const handleLogin = async (loginMethod: string) => {
    try {
      let success = false;
      switch (loginMethod) {
        case 'google':
          success = await loginWithGoogle();
          break;
        // case "emailpasswordless":
        //   success = await loginWithEmailPasswordless();
        //   break;
        // case "custom":
        //   success = await customLogin();
        //   break;
        default:
          throw new Error('Invalid login method');
      }
      if (success) {
        // setLoggedIn(true);
        const userInfo = await getUserInfo();
        setResult(userInfo);
      }
    } catch (error) {
      console.error(error);
      setResult(error);
    }
  };

  const handleCustomLogin = async () => {
    try {
      const id_Token =
        'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjRmMDEwZjRjOWJhNDZlYjUyMGNmIn0.eyJlbWFpbCI6Inlhc2hjaG93ZGh1cnlzbkBnbWFpbC5jb20iLCJ0YWxlbnQiOiJmcm9udGVuZCIsImNvbW11bmljYXRpb24iOiJzbGFjayIsImZpcnN0TmFtZSI6Illhc2giLCJsYXN0TmFtZSI6IkNob3dkaHVyeSIsImFnZSI6MjIsImlhdCI6MTcyMTk5NDMxMSwiZXhwIjoxNzIyMDgwNzExLCJhdWQiOiJ1cm46bXZtbnQtZGV2ZWxvcDp1c2VyIiwiaXNzIjoiaHR0cHM6Ly9tdm1udC1kZXZlbG9wLnMzLmFtYXpvbmF3cy5jb20ifQ.PkYaLrJ-rvPoKm86kGhn_HEJYmkfGnZZpd3CbNZshIUJjfiVk979BgUuVMDzrj3VWd3QGrWh1pIMSJ_8XeczrL2JRsqpvHpGUDTKwlkcLVisk7kH2PrQOeHQcfNcwGX9687tJI8xIXGIHfuRA8FJzSMzWdEMPDmPyCbOstzD4On8HQdtHoybjjcmTX4hrfKE40kUnMLYPNsFbQr6YUlaMsUWvdlkQljA79rZ0ZspfQdSoyop_g7ogaU7kgBef1NLv0MmTxlGrfwWFQ7YhrLAw3NGjDfUKVZddSpzBXEr31uNN0MAx0aOBH8UewkBOxSGEJP8Dxh04xdcboCUnbnf3A';
      const success = await customLogin(id_Token);
      if (success) {
        // setLoggedIn(true);
        const userInfo = await getUserInfo();
        setResult(userInfo);
        setShowCustomLogin(false);
        setEmail('');
        setPassword('');
      }
      // } else {
      //   throw new Error("Custom login failed");
      // }
    } catch (error) {
      console.error(error);
      setResult(error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      // setLoggedIn(false);
      setResult('Logged out');
    } catch (error) {
      console.error(error);
      setResult(error);
    }
  };

  // const handleGetAccounts = async () => {
  //   try {
  //     const accounts = await getAccounts();
  //     setResult(accounts);
  //   } catch (error) {
  //     console.error(error);
  //     setResult(error);
  //   }
  // };

  const handleGetSmartAccount = () => {
    const { smartAccountAddress } = getSmartAccountInfo();
    setResult({ address: smartAccountAddress });
  };

  const handleAuthenticateUser = () => {
    authenticateUser().then((res) => {
      setResult(res);
    });
  };

  const handleGetAppPubKey = async () => {
    try {
      const pubKey = await getAppPubKey();
      setResult(pubKey);
    } catch (error) {
      console.error(error);
      setResult(error);
    }
  };

  const handlePayment = async (isIntegratedWallet?: boolean) => {
    setIsLoading(true);
    setError(undefined);
    console.log(isLoading);

    try {
      const result = await newPayTransaction(
        smartAccount,
        paymentInputParams,
        isIntegratedWallet,
      );
      if (result.success) {
        console.log('Payment successful', result);
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('Error in payment:', err);
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleMetaMaskPayment = async () => {
    try {
      if (typeof (window as any).ethereum === 'undefined') {
        throw new Error('MetaMask is not installed');
      }
      await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      setIsMetaMaskConnected(true);
      console.log('Connected to MetaMask');

      // Get the smart account address
      const { smartAccountAddress } = getSmartAccountInfo();

      // Calculate the amount to transfer (you may need to adjust this based on your requirements)
      const amountToTransfer =
        BigInt(paymentInputParams.adminShare) +
        BigInt(paymentInputParams.donationAmount);

      console.log('Amount to transfer:', amountToTransfer);
      console.log('Smart account address:', smartAccountAddress);

      // Transfer funds from MetaMask to smart account
      const tx = await signer.sendTransaction({
        to: smartAccountAddress,
        value: BigInt(amountToTransfer),
      });
      await tx.wait();

      console.log('Funds transferred to smart account');

      // Now proceed with the smart account payment
      await handlePayment();
    } catch (err) {
      console.error('Error in MetaMask payment:', err);
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleIntegratedWalletPayment = async () => {
    const amountToTransfer =
      BigInt(paymentInputParams.adminShare) +
      BigInt(paymentInputParams.donationAmount);

    const { smartAccountAddress } = getSmartAccountInfo();
    try {
      await transferFromIntegratedWallet(amountToTransfer, smartAccountAddress);
      await handlePayment(true);
    } catch (err) {
      console.error('Error in integrated wallet payment:', err);
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-800 text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-6">Web3Auth PoC on Base Sepolia</h1>

      <div className="w-full max-w-md mb-6">
        {/* <div>
          <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
            Route
          </button>
        </div> */}
        {!isLoggedIn ? (
          <div className="space-y-4">
            {!showCustomLogin ? (
              <>
                <button
                  onClick={() => handleLogin('google')}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                >
                  Login with Google
                </button>
                <button
                  onClick={() => setShowCustomLogin(true)}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-4 rounded"
                >
                  Custom Login
                </button>
              </>
            ) : (
              <div className="space-y-4">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 rounded text-black"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 rounded text-black"
                />
                <button
                  onClick={handleCustomLogin}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
                >
                  Login
                </button>
                <button
                  onClick={() => setShowCustomLogin(false)}
                  className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
                >
                  Back
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* <button
              onClick={handleGetAccounts}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
            >
              Get Web3Auth EOA
            </button> */}
            <button
              onClick={() => getUserInfo().then(setResult)}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
            >
              Get User Info
            </button>
            <button
              onClick={handleGetSmartAccount}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
            >
              Get Smart Account Address
            </button>

            <button
              onClick={onNewPay}
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded"
            >
              Pay Txn
            </button>
            <button
              onClick={createNonProfitVault}
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded"
            >
              Create Non-Profit Vault
            </button>
            <button
              onClick={() => handlePayment(false)}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-4 rounded"
            >
              {isLoading ? 'Processing...' : 'Make Payment (Stateless)'}
            </button>
            <button
              onClick={handleIntegratedWalletPayment}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-4 rounded"
            >
              Integrated Wallet Payment
            </button>
            <button
              onClick={handleLogout}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
            >
              Logout
            </button>
          </div>
        )}
      </div>

      {result && (
        <div className="w-full max-w-3xl bg-gray-700 p-4 rounded overflow-auto">
          <h2 className="text-xl font-bold mb-2">Result</h2>
          <pre className="text-sm whitespace-pre-wrap break-words">
            {typeof result === 'object'
              ? JSON.stringify(result, null, 2)
              : result}
          </pre>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

//"failed with 45000000 gas: insufficient funds for gas * price + value: address 0xD14dc307f52442b6A36432AcA4520B7B07273325 have 2000443591506059574 want 3000000000000000000"
