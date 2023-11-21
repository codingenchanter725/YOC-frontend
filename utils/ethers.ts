import { type WalletClient, getWalletClient, type PublicClient, getPublicClient } from '@wagmi/core'
import { ethers, providers } from 'ethers'
import { NETWORK } from "../src/config/contract"
import { type HttpTransport } from 'viem'

export function walletClientToSigner(walletClient: WalletClient) {
  const { account, chain, transport } = walletClient
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  }
  const provider = new providers.Web3Provider(transport, network)
  const signer = provider.getSigner(account.address)
  return signer
}

/** Action to convert a viem Wallet Client to an ethers.js Signer. */
export async function getEthersSigner() {
  const chainId = NETWORK.CHAIN_ID;
  const walletClient = await getWalletClient({ chainId })
  if (!walletClient) return undefined
  return walletClientToSigner(walletClient)
}

export function publicClientToProvider(publicClient: PublicClient) {
  const { chain, transport } = publicClient
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  }
  if (transport.type === 'fallback')
    return new providers.FallbackProvider(
      (transport.transports as ReturnType<HttpTransport>[]).map(
        ({ value }) => new providers.JsonRpcProvider(value?.url, network),
      ),
    )
  return new providers.JsonRpcProvider(transport.url, network)
}

/** Action to convert a viem Public Client to an ethers.js Provider. */
export function getEthersProvider() {
  const chainId = NETWORK.CHAIN_ID;
  const publicClient = getPublicClient({ chainId })
  return publicClientToProvider(publicClient)
}

export const WebSocketProvider = new ethers.providers.WebSocketProvider(NETWORK.wss);

export const JsonRpcProvider = new ethers.providers.JsonRpcProvider(NETWORK.RPC_URL);