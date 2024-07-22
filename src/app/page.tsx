"use client";
import React, { useEffect, useState } from "react";
import {
  initWeb3Auth,
  loginWithGoogle,
  loginWithEmailPasswordless,
  getUserInfo,
  logout,
  getAccounts,
  getBalance,
  signMessage,
  getSmartAccountInfo,
} from "./web3Utils/smartAccUtils";

const Dashboard = () => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const connected = await initWeb3Auth();
        if (connected) {
          setLoggedIn(true);
          const userInfo = await getUserInfo();
          setResult(userInfo);
        }
      } catch (error) {
        console.error(error);
        setResult(error);
      }
    };
    init();
  }, []);

  const handleLogin = async (loginMethod: "google" | "emailpasswordless") => {
    try {
      const success = await (loginMethod === "google"
        ? loginWithGoogle()
        : loginWithEmailPasswordless());
      if (success) {
        setLoggedIn(true);
        const userInfo = await getUserInfo();
        setResult(userInfo);
      }
    } catch (error) {
      console.error(error);
      setResult(error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setLoggedIn(false);
      setResult("Logged out");
    } catch (error) {
      console.error(error);
      setResult(error);
    }
  };

  const handleGetAccounts = async () => {
    try {
      const accounts = await getAccounts();
      setResult(accounts);
    } catch (error) {
      console.error(error);
      setResult(error);
    }
  };

  const handleGetBalance = async () => {
    try {
      const balance = await getBalance();
      setResult(balance);
    } catch (error) {
      console.error(error);
      setResult(error);
    }
  };

  const handleSignMessage = async () => {
    try {
      const signature = await signMessage();
      setResult({ message: "Hello Base Sepolia", signature });
    } catch (error) {
      console.error(error);
      setResult(error);
    }
  };

  const handleGetSmartAccount = () => {
    const { smartAccountAddress } = getSmartAccountInfo();
    setResult({ address: smartAccountAddress });
  };

  return (
    <div className="min-h-screen bg-gray-800 text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-6">Web3Auth PoC on Base Sepolia</h1>

      <div className="w-full max-w-md mb-6">
        {!loggedIn ? (
          <div className="space-y-4">
            <button
              onClick={() => handleLogin("google")}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
            >
              Login with Google
            </button>
            <button
              onClick={() => handleLogin("emailpasswordless")}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
            >
              Login with Email Passwordless
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <button
              onClick={handleGetAccounts}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
            >
              Get Web3Auth EOA
            </button>
            <button
              onClick={handleGetBalance}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
            >
              Get Balance
            </button>
            <button
              onClick={handleSignMessage}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
            >
              Sign Message
            </button>
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
            {typeof result === "object"
              ? JSON.stringify(result, null, 2)
              : result}
          </pre>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
