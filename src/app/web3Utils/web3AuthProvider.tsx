'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK, UX_MODE } from '@web3auth/base';
import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider';
import { Web3AuthNoModal } from '@web3auth/no-modal';
import { OpenloginAdapter } from '@web3auth/openlogin-adapter';
import { ethers } from 'ethers';
import { baseSepolia } from 'viem/chains';
import {
  createSmartAccountClient,
  BiconomySmartAccountV2,
  createBundler,
  Bundler,
} from '@biconomy/account';
import { getPublicCompressed } from '@toruslabs/eccrypto';

const clientId =
  'BObtAARkbvruKWhE7-GCeR8mLhZDoLs30lLzolozZn4ECxNbOdfeMLCQbn6ciXuvVJSzFAAcv38xCCXHFOIJsIQ';

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: '0x14a34', // Base Sepolia chain ID
  rpcTarget: 'https://rpc.ankr.com/base_sepolia',
  displayName: 'Base Sepolia Testnet',
  blockExplorerUrl: 'https://sepolia.basescan.org',
  ticker: 'ETH',
  tickerName: 'Ethereum',
};

const privateKeyProvider = new EthereumPrivateKeyProvider({
  config: { chainConfig },
});
const web3authInstance = new Web3AuthNoModal({
  clientId,
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
  privateKeyProvider,
});

const openloginAdapter = new OpenloginAdapter({
  adapterSettings: {
    uxMode: UX_MODE.POPUP,
    whiteLabel: {
      appName: 'MVMNT Account Abstraction',
      mode: 'dark',
      useLogoLoader: true,
    },
    loginConfig: {
      google: {
        verifier: 'mvmnt-aa',
        verifierSubIdentifier: 'google-OAuth',
        typeOfLogin: 'google',
        clientId:
          '920416771295-je94tajna6tno55mj7218d1na4hujnqb.apps.googleusercontent.com',
      },
      jwt: {
        verifier: 'mvmnt-aa',
        verifierSubIdentifier: 'custom-auth',
        typeOfLogin: 'jwt',
        clientId: clientId,
      },
    },
  },
  privateKeyProvider,
});

web3authInstance.configureAdapter(openloginAdapter);

interface Web3AuthContextType {
  web3auth: Web3AuthNoModal | null;
  isInitialized: boolean;
  isLoading: boolean;
  isLoggedIn: boolean;
  error: Error | null;
  smartAccount: BiconomySmartAccountV2 | null;
  smartAccountAddress: string | null;
  initWeb3Auth: () => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  customLogin: (id_token: string) => Promise<boolean>;
  getUserInfo: () => Promise<any>;
  logout: () => Promise<void>;
  getSmartAccountInfo: () => { smartAccountAddress: string | null };
  getAppPubKey: () => Promise<string>;
  authenticateUser: () => Promise<any>;
}

const Web3AuthContext = createContext<Web3AuthContextType | null>(null);

export const Web3AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [web3auth, setWeb3auth] = useState<Web3AuthNoModal | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [smartAccount, setSmartAccount] =
    useState<BiconomySmartAccountV2 | null>(null);
  const [smartAccountAddress, setSmartAccountAddress] = useState<string | null>(
    null,
  );

  const initializeWeb3Auth = async () => {
    setIsLoading(true);
    try {
      await web3authInstance.init();
      setWeb3auth(web3authInstance);
      setIsInitialized(true);

      // Check if the user is already connected
      if (web3authInstance.connected) {
        setIsLoggedIn(true);
      }
    } catch (err) {
      console.error('Failed to initialize Web3Auth:', err);
      setError(
        err instanceof Error ? err : new Error('Failed to initialize Web3Auth'),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const checkAndInitializeConnection = async () => {
    if (isInitialized && web3auth?.connected && !smartAccount) {
      try {
        await initializeSmartAccount();
      } catch (error) {
        console.error('Failed to initialize smart account:', error);
        // Optionally set an error state here if needed
      }
    }
  };

  useEffect(() => {
    initializeWeb3Auth();
  }, []);

  useEffect(() => {
    checkAndInitializeConnection();
  }, [isInitialized, web3auth?.connected]);

  const initializeSmartAccount = async () => {
    if (!web3auth || !web3auth.provider)
      throw new Error('Web3Auth not initialized');
    try {
      const ethersProvider = new ethers.BrowserProvider(
        web3auth.provider as any,
      );
      const web3AuthSigner = await ethersProvider.getSigner();

      //Bundler Runtime Fix
      const bundlerAddress = await createBundler({
        bundlerUrl: `https://bundler.biconomy.io/api/v2/${baseSepolia.id}/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44`,
        entryPointAddress: '0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789',
        chainId: baseSepolia.id,
        userOpReceiptMaxDurationIntervals: { 84532: 60000 },
      });

      const config = {
        biconomyPaymasterApiKey:
          'EegseJJl5.0761a753-58e6-4cc0-b69f-db099d9592d6',
        // bundlerUrl: `https://bundler.biconomy.io/api/v2/84532/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44`,
        // bundlerUrl: bundlerAddress as any,
      };
      const smartAccountInstance = await createSmartAccountClient({
        signer: web3AuthSigner,
        biconomyPaymasterApiKey: config.biconomyPaymasterApiKey,
        // bundlerUrl: config.bundlerUrl,
        bundler: bundlerAddress,
        chainId: 84532,
        rpcUrl: 'https://rpc.ankr.com/base_sepolia',
      });
      setSmartAccount(smartAccountInstance);
      const address = await smartAccountInstance.getAccountAddress();
      setSmartAccountAddress(address);
      return {
        smartAccount: smartAccountInstance,
        smartAccountAddress: address,
      };
    } catch (error) {
      console.error('Failed to initialize smart account:', error);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    if (!web3auth) throw new Error('Web3Auth not initialized');
    setIsLoading(true);
    try {
      await web3auth.connectTo('openlogin', { loginProvider: 'google' });
      if (web3auth.connected) {
        setIsLoggedIn(true);
        await initializeSmartAccount();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Google login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const customLogin = async (id_token: string) => {
    if (!web3auth) throw new Error('Web3Auth not initialized');
    setIsLoading(true);
    try {
      await web3auth.connectTo('openlogin', {
        loginProvider: 'jwt',
        extraLoginOptions: {
          id_token: id_token,
          verifierIdField: 'email',
        },
      });
      if (web3auth.connected) {
        setIsLoggedIn(true);
        await initializeSmartAccount();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Custom login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getUserInfo = async () => {
    if (!web3auth) throw new Error('Web3Auth not initialized');
    try {
      return await web3auth.getUserInfo();
    } catch (error) {
      console.error('Failed to get user info:', error);
      throw error;
    }
  };

  const logout = async () => {
    if (!web3auth) throw new Error('Web3Auth not initialized');
    setIsLoading(true);
    try {
      await web3auth.logout();
      setIsLoggedIn(false);
      setSmartAccount(null);
      setSmartAccountAddress(null);
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getAppPubKey = async () => {
    if (!web3auth || !web3auth.provider)
      throw new Error('Web3Auth provider not initialized');
    try {
      const app_scoped_privkey = await web3auth.provider.request({
        method: 'eth_private_key',
      });
      const paddedPrivKey = (app_scoped_privkey as string).padStart(64, '0');
      const app_pub_key = getPublicCompressed(
        Buffer.from(paddedPrivKey, 'hex'),
      ).toString('hex');
      return app_pub_key;
    } catch (error) {
      console.error('Error getting app public key:', error);
      throw error;
    }
  };

  const authenticateUser = async () => {
    if (!web3auth) throw new Error('Web3Auth not initialized');
    try {
      return await web3auth.authenticateUser();
    } catch (error) {
      console.error('User authentication failed:', error);
      throw error;
    }
  };

  const getSmartAccountInfo = () => ({ smartAccountAddress });

  const value = {
    web3auth,
    isInitialized,
    isLoading,
    isLoggedIn,
    error,
    smartAccount,
    smartAccountAddress,
    initWeb3Auth: async () => {
      if (!web3auth) throw new Error('Web3Auth not initialized');
      return web3auth.connected;
    },
    loginWithGoogle,
    customLogin,
    getUserInfo,
    logout,
    getSmartAccountInfo,
    getAppPubKey,
    authenticateUser,
  };

  return (
    <Web3AuthContext.Provider value={value}>
      {children}
    </Web3AuthContext.Provider>
  );
};

export const useWeb3Auth = () => {
  const context = useContext(Web3AuthContext);
  if (!context) {
    throw new Error('useWeb3Auth must be used within a Web3AuthProvider');
  }
  return context;
};
