import {
    allowAllModules,
    FREIGHTER_ID,
    StellarWalletsKit,
    WalletNetwork,
  } from "@creit.tech/stellar-wallets-kit";
  
  // functions to set and load values for public key in the app state
  export const kit: StellarWalletsKit = new StellarWalletsKit({
    modules: allowAllModules(),
    network: WalletNetwork.TESTNET,
    selectedWalletId: FREIGHTER_ID,
  });
  
  const connectionState: { publicKey: string | undefined } = {
    publicKey: undefined,
  };
  
  export function loadedPublicKey(): string | undefined {
    return connectionState.publicKey;
  }
  
  export function setPublicKey(data: string): void {
    connectionState.publicKey = data;
  }
  
  // export { kit, loadedPublicKey, setPublicKey };