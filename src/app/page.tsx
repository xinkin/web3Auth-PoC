'use client';
import React, { useState } from 'react';
import { useWeb3Auth } from './web3Utils/web3AuthProvider';
import { useSmartAccountTransaction } from './web3Utils/newSmartTxn';
import { usePayTransaction } from './web3Utils/PayTxn';

const Dashboard = () => {
  const {
    loginWithGoogle,
    getUserInfo,
    logout,
    getSmartAccountInfo,
    authenticateUser,
    customLogin,
    getAppPubKey,
    isLoading,
    isLoggedIn,
    error,
    isInitialized,
  } = useWeb3Auth();

  const { executeTransaction } = useSmartAccountTransaction();
  const { onPay } = usePayTransaction();

  const [result, setResult] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showCustomLogin, setShowCustomLogin] = useState(false);

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

  // const handleGetBalance = async () => {
  //   try {
  //     const balance = await getBalance();
  //     setResult(balance);
  //   } catch (error) {
  //     console.error(error);
  //     setResult(error);
  //   }
  // };

  // const handleSignMessage = async () => {
  //   try {
  //     const signature = await signMessage();
  //     setResult({ message: "Hello Base Sepolia", signature });
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

  return (
    <div className="min-h-screen bg-gray-800 text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-6">Web3Auth PoC on Base Sepolia</h1>

      <div className="w-full max-w-md mb-6">
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
            {/* <button
              onClick={handleSignMessage}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
            >
              Sign Message
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
              onClick={handleAuthenticateUser}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
            >
              Get Authenticated User
            </button>
            <button
              onClick={handleGetAppPubKey}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
            >
              Get App Pub Key
            </button>
            <button
              onClick={onPay}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
            >
              Txn
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
