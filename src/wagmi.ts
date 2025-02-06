import { getDefaultConfig, Chain } from '@rainbow-me/rainbowkit';
import {
  base,
  mainnet,
} from 'wagmi/chains';

const testnet = {
  id: 3151908,
  name: 'Testnet',
  iconBackground: '#ffc431',
  nativeCurrency: { name: 'Ether', symbol: 'KLK', decimals: 18 },
  rpcUrls: {
    default: { http: ['http://18.168.16.120:32859'] },
  },
  blockExplorers: {
    default: { name: 'base', url: 'https://sepolia.basescan.org' },
  },
  
} as const satisfies Chain;

const BinanceSmartChain = {
  id: 56,
  name: 'Binance Smart Chain',
  iconBackground: '#ffc431',
  nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://bsc-dataseed.binance.org/'] },
  },
  blockExplorers: {
    default: { name: 'base', url: 'https://bscscan.com' },
  },
} as const satisfies Chain;


export const config = getDefaultConfig({
  appName: 'nft-gp',
  projectId: '332e2c7e370d564a788b928d45b787a5',
  chains: [
    // testnet,
    BinanceSmartChain,
  ],
  ssr: true,
});
