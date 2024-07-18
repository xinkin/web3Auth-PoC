"use client";
import React, { useEffect, useState } from 'react';
import { CHAIN_NAMESPACES, IProvider, WALLET_ADAPTERS, WEB3AUTH_NETWORK, UX_MODE } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { Web3AuthNoModal } from "@web3auth/no-modal";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import Web3 from "web3";

const clientId = "BObtAARkbvruKWhE7-GCeR8mLhZDoLs30lLzolozZn4ECxNbOdfeMLCQbn6ciXuvVJSzFAAcv38xCCXHFOIJsIQ";

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0x14a34", // Base Sepolia chain ID
  rpcTarget: "https://sepolia.base.org",
  displayName: "Base Sepolia Testnet",
  blockExplorerUrl: "https://sepolia.basescan.org/",
  ticker: "ETH",
  tickerName: "Ethereum",
};

const privateKeyProvider = new EthereumPrivateKeyProvider({ config: { chainConfig } });

const web3auth = new Web3AuthNoModal({
  clientId,
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET, 
  privateKeyProvider,
});

const openloginAdapter = new OpenloginAdapter({
  adapterSettings: {
    loginConfig: {
      google: {
        verifier: "mvmnt-aa",
        verifierSubIdentifier: "google-OAuth", 
        typeOfLogin: "google", 
        clientId: "920416771295-je94tajna6tno55mj7218d1na4hujnqb.apps.googleusercontent.com", 
      },
       emailpasswordless: {
        verifier: "mvmnt-aa", // Pass the Verifier name here. eg. w3a-agg-example
        verifierSubIdentifier: "email-pl-auth0", // Pass the Sub-Verifier here. eg w3a-a0-email-passwordless
        typeOfLogin: "jwt", // Pass the type of login provider. For Auth0, it's jwt and not Auth0.
        clientId: "kFe7frDBSHbO4vdbWTayIPamQ1BWshWr", // Pass the `Client ID` of your Auth0 Application.
      },
    },
  },
  privateKeyProvider,
});
web3auth.configureAdapter(openloginAdapter);

const Dashboard = () => {
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      try {
        await web3auth.init();
        setProvider(web3auth.provider);
        if (web3auth.connected) {
          setLoggedIn(true);
          getUserInfo();
        }
      } catch (error) {
        console.error(error);
        setResult(error);
      }
    };
    init();
  }, []);

  const loginWithGoogle = async () => {
    try {
      const web3authProvider = await web3auth.connectTo("openlogin", {
        loginProvider: "google",
      });
      setProvider(web3authProvider);
      if (web3auth.connected) {
        setLoggedIn(true);
        getUserInfo();
      }
    } catch (error) {
      console.error(error);
      setResult(error);
    }
  };

    const loginWithEmailPasswordless = async () => {
    try {
      const web3authProvider = await web3auth.connectTo("openlogin", {
        loginProvider: "emailpasswordless",
        extraLoginOptions: {
          domain: "https://dev-fab2qqercldmt2ge.us.auth0.com",
          verifierIdField: "email",
          isVerifierIdCaseSensitive: false,
        },
      });
      setProvider(web3authProvider);
      if (web3auth.connected) {
        setLoggedIn(true);
        getUserInfo();
      }
    } catch (error) {
      console.error(error);
      setResult(error);
    }
  };

  const getUserInfo = async () => {
    try {
      const user = await web3auth.getUserInfo();
      setResult(user);
    } catch (error) {
      console.error(error);
      setResult(error);
    }
  };

  const logout = async () => {
    try {
      await web3auth.logout();
      setProvider(null);
      setLoggedIn(false);
      setResult("Logged out");
    } catch (error) {
      console.error(error);
      setResult(error);
    }
  };

  const getAccounts = async () => {
    if (!provider) {
      setResult("Provider not initialized");
      return;
    }
    const web3 = new Web3(provider as any);
    try {
      const address = await web3.eth.getAccounts();
      setResult(address);
    } catch (error) {
      console.error(error);
      setResult(error);
    }
  };

  const getBalance = async () => {
    if (!provider) {
      setResult("Provider not initialized");
      return;
    }
    const web3 = new Web3(provider as any);
    try {
      const address = (await web3.eth.getAccounts())[0];
      const balance = await web3.eth.getBalance(address);
      setResult({ address, balance: balance.toString() });
    } catch (error) {
      console.error(error);
      setResult(error);
    }
  };

  const signMessage = async () => {
    if (!provider) {
      setResult("Provider not initialized");
      return;
    }
    const web3 = new Web3(provider as any);
    try {
      const fromAddress = (await web3.eth.getAccounts())[0];
      const originalMessage = "Hello Web3Auth on Base Sepolia";
      const signedMessage = await web3.eth.personal.sign(originalMessage, fromAddress, "");
      setResult({ originalMessage, signedMessage });
    } catch (error) {
      console.error(error);
      setResult(error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-800 text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-6">Web3Auth PoC on Base Sepolia</h1>
      
      <div className="w-full max-w-md mb-6">
        {!loggedIn ? (
          <div className="space-y-4">
            <button onClick={loginWithGoogle} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
              Login with Google
            </button>
            <button onClick={loginWithEmailPasswordless} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">
              Login with Email Passwordless
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <button onClick={getAccounts} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">
              Get Accounts
            </button>
            <button onClick={getBalance} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">
              Get Balance
            </button>
            <button onClick={signMessage} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">
              Sign Message
            </button>
            <button onClick={getUserInfo} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">
              Get User Info
            </button>
            <button onClick={logout} className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded">
              Logout
            </button>
          </div>
        )}
      </div>
      
      {result && (
        <div className="w-full max-w-3xl bg-gray-700 p-4 rounded overflow-auto">
          <h2 className="text-xl font-bold mb-2">Result</h2>
          <pre className="text-sm whitespace-pre-wrap break-words">
            {typeof result === 'object' ? JSON.stringify(result, null, 2) : result}
          </pre>
        </div>
      )}
    </div>
  );
};

export default Dashboard;