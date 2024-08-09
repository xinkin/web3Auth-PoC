import { useState, useCallback, useEffect } from 'react';
import { encodeFunctionData, erc20Abi } from 'viem';
import { PaymasterMode, createPaymaster } from '@biconomy/account';
import { useWeb3Auth } from './web3AuthProvider';
import { abi } from './abi';
import { baseSepolia } from 'viem/chains';


