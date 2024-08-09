import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK, UX_MODE } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { Web3AuthNoModal } from "@web3auth/no-modal";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import Web3 from "web3";
import { ethers } from "ethers";
import { baseSepolia } from "viem/chains";
import {
  createSmartAccountClient,
  BiconomySmartAccountV2,
} from "@biconomy/account";
// import { WalletServicesPlugin } from "@web3auth/wallet-services-plugin";
import { useSmartAccountStore } from "./store";
import { getPublicCompressed } from "@toruslabs/eccrypto";

const clientId =
  "BObtAARkbvruKWhE7-GCeR8mLhZDoLs30lLzolozZn4ECxNbOdfeMLCQbn6ciXuvVJSzFAAcv38xCCXHFOIJsIQ";

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0x14a34", // Base Sepolia chain ID
  rpcTarget: "https://sepolia.base.org",
  displayName: "Base Sepolia Testnet",
  blockExplorerUrl: "https://sepolia.basescan.org",
  ticker: "ETH",
  tickerName: "Ethereum",
};

const privateKeyProvider = new EthereumPrivateKeyProvider({
  config: { chainConfig },
});

const web3auth = new Web3AuthNoModal({
  clientId,
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
  privateKeyProvider,
});

// const walletServicesPlugin = new WalletServicesPlugin({
//   wsEmbedOpts: {
//     web3AuthClientId: clientId,
//     web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
//     modalZIndex: 99999,
//   },
// });

const openloginAdapter = new OpenloginAdapter({
  adapterSettings: {
    uxMode: UX_MODE.REDIRECT,
    redirectUrl: "http://localhost:3000",
    whiteLabel: {
      appName: "MVMNT Account Abstraction",
      mode: "dark",
      useLogoLoader: true,
    },
    loginConfig: {
      google: {
        verifier: "mvmnt-aa",
        verifierSubIdentifier: "google-OAuth",
        typeOfLogin: "google",
        clientId:
          "920416771295-je94tajna6tno55mj7218d1na4hujnqb.apps.googleusercontent.com",
      },
      emailpasswordless: {
        verifier: "mvmnt-aa",
        verifierSubIdentifier: "email-pl-auth0",
        typeOfLogin: "jwt",
        clientId: "kFe7frDBSHbO4vdbWTayIPamQ1BWshWr",
      },
      jwt: {
        verifier: "mvmnt-aa", // name of the verifier created on Web3Auth Dashboard
        verifierSubIdentifier: "custom-auth",
        typeOfLogin: "jwt",
        clientId: clientId, // Web3Auth Client ID
      },
    },
  },
  privateKeyProvider,
});
web3auth.configureAdapter(openloginAdapter);

const { setSmartAccount, setSmartAccountAddress } =
  useSmartAccountStore.getState();

let smartAccount: BiconomySmartAccountV2 | null = null;
let smartAccountAddress: string | null = null;

export const getAppPubKey = async () => {
  if (!web3auth.provider) {
    throw new Error("Web3Auth provider not initialized");
  }

  try {
    // Request the private key from Web3Auth
    const app_scoped_privkey = await web3auth.provider.request({
      method: "eth_private_key",
    });

    // Ensure the private key is padded to 64 characters
    const paddedPrivKey = (app_scoped_privkey as string).padStart(64, "0");

    // Derive the public key from the private key
    const app_pub_key = getPublicCompressed(
      Buffer.from(paddedPrivKey, "hex")
    ).toString("hex");

    return app_pub_key;
  } catch (error) {
    console.error("Error getting app public key:", error);
    throw error;
  }
};

export const initWeb3Auth = async () => {
  try {
    // web3auth.addPlugin(walletServicesPlugin);
    await web3auth.init();

    return web3auth.connected;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const initializeSmartAccount = async () => {
  // const { setSmartAccount, setSmartAccountAddress } =
  //   useSmartAccountStore.getState();
  try {
    const ethersProvider = new ethers.BrowserProvider(web3auth.provider as any);
    const web3AuthSigner = await ethersProvider.getSigner();
    const config = {
      biconomyPaymasterApiKey: "EegseJJl5.0761a753-58e6-4cc0-b69f-db099d9592d6",
      bundlerUrl: `https://bundler.biconomy.io/api/v2/${baseSepolia.id}/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44`,
    };
    smartAccount = await createSmartAccountClient({
      signer: web3AuthSigner,
      biconomyPaymasterApiKey: config.biconomyPaymasterApiKey,
      bundlerUrl: config.bundlerUrl,
      rpcUrl: "https://sepolia.base.org",
    });
    setSmartAccount(smartAccount);
    smartAccountAddress = await smartAccount.getAccountAddress();
    setSmartAccountAddress(smartAccountAddress);
    return { smartAccount, smartAccountAddress };
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const loginWithGoogle = async () => {
  try {
    await web3auth.connectTo("openlogin", {
      loginProvider: "google",
    });
    if (web3auth.connected) {
      await initializeSmartAccount();
      return true;
    }
    return false;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const customLogin = async (id_token: string) => {
  try {
    await web3auth.connectTo("openlogin", {
      loginProvider: "jwt",
      extraLoginOptions: {
        id_token: id_token,
        verifierIdField: "email", // sub, email, or custom
      },
    });
    if (web3auth.connected) {
      await initializeSmartAccount();
      return true;
    }
    return false;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const loginWithEmailPasswordless = async () => {
  try {
    await web3auth.connectTo("openlogin", {
      loginProvider: "emailpasswordless",
      extraLoginOptions: {
        domain: "https://dev-fab2qqercldmt2ge.us.auth0.com",
        verifierIdField: "email",
        isVerifierIdCaseSensitive: false,
      },
    });
    if (web3auth.connected) {
      await initializeSmartAccount();
      return true;
    }
    return false;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getUserInfo = async () => {
  try {
    return await web3auth.getUserInfo();
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await web3auth.logout();
    setSmartAccount(null);
    setSmartAccountAddress(null);
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getAccounts = async () => {
  if (!web3auth.provider) {
    throw new Error("Provider not initialized");
  }
  const web3 = new Web3(web3auth.provider as any);
  try {
    return await web3.eth.getAccounts();
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getBalance = async () => {
  if (!web3auth.provider) {
    throw new Error("Provider not initialized");
  }
  const web3 = new Web3(web3auth.provider as any);
  try {
    const balance = await web3.eth.getBalance(smartAccountAddress as string);
    return { address: smartAccountAddress, balance: balance.toString() };
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const signMessage = async () => {
  if (!smartAccount) {
    throw new Error("Smart Account not initialized");
  }
  const message = "Hello Base Sepolia";
  try {
    return await smartAccount.signMessage(message);
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const authenticateUser = async () => {
  try {
    const res = await web3auth.authenticateUser();
    return res;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// export const OnRamp = async () => {
//   try {
//     if (web3auth.connected) {
//       await walletServicesPlugin.showCheckout();
//     }
//   } catch (error) {
//     console.error(error);
//     // throw error;
//   }
// };

export const getSmartAccountInfo = () => {
  return { smartAccountAddress };
};
