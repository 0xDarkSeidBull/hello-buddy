/** wallet.ts — real MetaMask wallet connect on LiteForge (zkLTC).
 *
 * Fundamentals (as specced):
 *  - User connects their own wallet (MetaMask).
 *  - Every bet is a FIXED 0.01 zkLTC stake (no more, no less).
 *  - Placing a bet sends 0.01 zkLTC to the house wallet (real tx).
 *  - Winners are paid out from the house wallet.
 *  - Balance shown is the user's real on-chain zkLTC.
 */
import { BrowserProvider, JsonRpcProvider, formatEther, parseEther } from "ethers";

export const BET_AMOUNT = "0.01";           // fixed stake, zkLTC
export const CHAIN_ID = 4441;
export const CHAIN_ID_HEX = "0x1159";
export const RPC = "https://liteforge.rpc.caldera.xyz/http";
// House wallet that collects stakes and pays winners. Set this to the funded
// wallet's PUBLIC address. (Private key lives only on the payout backend.)
export const HOUSE_ADDRESS = "0x3BC6348E1E569E97Bd8247b093475A4aC22B9fD4";

const read = new JsonRpcProvider(RPC, CHAIN_ID, { staticNetwork: true });

export function hasWallet(): boolean {
  return typeof (window as any).ethereum !== "undefined";
}

export async function connect(): Promise<string> {
  const eth = (window as any).ethereum;
  if (!eth) throw new Error("No wallet found. Install MetaMask.");
  const accounts: string[] = await eth.request({ method: "eth_requestAccounts" });
  await ensureChain();
  return accounts[0].toLowerCase();
}

export async function ensureChain() {
  const eth = (window as any).ethereum;
  try {
    await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: CHAIN_ID_HEX }] });
  } catch (e: any) {
    if (e?.code === 4902) {
      await eth.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: CHAIN_ID_HEX, chainName: "LiteForge",
          rpcUrls: [RPC], nativeCurrency: { name: "zkLTC", symbol: "zkLTC", decimals: 18 },
          blockExplorerUrls: ["https://liteforge.explorer.caldera.xyz"],
        }],
      });
    } else { throw e; }
  }
}

export async function getBalance(addr: string): Promise<number> {
  try {
    const wei = await read.getBalance(addr);
    return Number(formatEther(wei));
  } catch { return 0; }
}

/** Send the fixed 0.01 zkLTC stake to the house wallet. Returns the tx hash. */
export async function sendStake(): Promise<string> {
  const eth = (window as any).ethereum;
  if (!eth) throw new Error("No wallet");
  await ensureChain();
  const [from] = await eth.request({ method: "eth_accounts" });
  const valueHex = "0x" + parseEther(BET_AMOUNT).toString(16);
  const hash = await eth.request({
    method: "eth_sendTransaction",
    params: [{ from, to: HOUSE_ADDRESS, value: valueHex }],
  });
  return hash as string;
}

export function onAccountsChanged(cb: (addr: string | null) => void) {
  const eth = (window as any).ethereum;
  if (!eth) return;
  eth.on?.("accountsChanged", (accs: string[]) => cb(accs?.[0]?.toLowerCase() ?? null));
}
