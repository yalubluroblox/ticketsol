import './browser-polyfills';
import { AnchorProvider, Program, BN, type Idl } from '@coral-xyz/anchor';
import { Connection, PublicKey, Transaction, SystemProgram, ComputeBudgetProgram, type SendOptions } from '@solana/web3.js';
import { Buffer } from 'buffer';
import idl from './ticketsol-idl.json';
import nacl from 'tweetnacl';
import bs58 from 'bs58';

export const PROGRAM_ID = new PublicKey('F8B453fWqji2qE6MfLjsQMmmzp9PJDNmLdudrQsoXCuP');
export const ORGANIZER = new PublicKey('6hVPgsmGGMd4jqSJ2J4kd1XCzWoBbAKT9YHK231tgh81');
export const PLATFORM = new PublicKey('DeQkMFfTKFiHf5DE4R1XrFPWeaHSSEqfUFbq5aM3WuL');
export const [EVENT_ACCOUNT, EVENT_BUMP] = PublicKey.findProgramAddressSync([Buffer.from('ticketsol-event')], PROGRAM_ID);
export const FACE_VALUE = 100_000_000;
export const RPC_URL = 'https://api.devnet.solana.com';
export const connection = new Connection(RPC_URL, {commitment:'confirmed',disableRetryOnRateLimit:true});
export type WalletProvider = {publicKey:PublicKey|null; connect:()=>Promise<{publicKey:PublicKey}>; disconnect:()=>Promise<void>; signTransaction:(tx:Transaction)=>Promise<Transaction>; signAllTransactions:(txs:Transaction[])=>Promise<Transaction[]>; signMessage?:(message:Uint8Array,encoding?:string)=>Promise<{signature:Uint8Array}>; on?:(event:string,fn:(key:PublicKey|null)=>void)=>void; removeListener?:(event:string,fn:(key:PublicKey|null)=>void)=>void};
export type ChainTicket = {id:number;owner:string;price:number;generation:number;used:boolean};
export type EventInfo = {name:string;place:string;starts:number;supply:number;count:number};
export function walletProvider():WalletProvider|undefined {if(typeof window==='undefined')return;const w=window as unknown as {phantom?:{solana?:WalletProvider};solana?:WalletProvider};return w.phantom?.solana??w.solana;}
export function program(wallet?:WalletProvider, conn=connection) {
 const readonlyWallet={publicKey:ORGANIZER,signTransaction:async(t:Transaction)=>t,signAllTransactions:async(t:Transaction[])=>t};
 return new Program(idl as Idl,PROGRAM_ID,new AnchorProvider(conn,(wallet??readonlyWallet) as never,{commitment:'confirmed',preflightCommitment:'confirmed'}));
}
export async function chainStatus(){const acc=await connection.getAccountInfo(PROGRAM_ID);return Boolean(acc?.executable);}
export async function readEvent():Promise<EventInfo|null>{
 const acc=await connection.getAccountInfo(EVENT_ACCOUNT);if(!acc)return null;
 if(!acc.owner.equals(PROGRAM_ID))throw new Error('Invalid event account owner');
 const e=await program().methods.eventInfo().accounts({dataAccount:EVENT_ACCOUNT}).view();
 return {name:e.name,place:e.place,starts:e.starts.toNumber(),supply:e.supply.toNumber(),count:e.count.toNumber()};
}
export async function readTicket(id:number):Promise<ChainTicket>{if(!Number.isSafeInteger(id)||id<0||id>=64)throw new Error('Invalid ticket number');const t=await program().methods.ticketInfo(new BN(id)).accounts({dataAccount:EVENT_ACCOUNT}).view();return {id,owner:t.owner.toBase58(),price:t.price.toNumber(),generation:t.generation.toNumber(),used:t.used};}
export async function readTickets(count:number){const result:ChainTicket[]=[];for(let i=0;i<count;i+=4){result.push(...await Promise.all(Array.from({length:Math.min(4,count-i)},(_,j)=>readTicket(i+j))));}return result;}
export async function send(tx:Transaction,wallet:WalletProvider){
 if(!wallet.publicKey)throw new Error('Connect your wallet');
 const {blockhash,lastValidBlockHeight}=await connection.getLatestBlockhash('confirmed');
 tx.feePayer=wallet.publicKey;tx.recentBlockhash=blockhash;
 const signed=await wallet.signTransaction(tx);
 const signature=await connection.sendRawTransaction(signed.serialize(),{skipPreflight:false} as SendOptions);
 const result=await connection.confirmTransaction({signature,blockhash,lastValidBlockHeight},'confirmed');
 if(result.value.err)throw new Error('Transaction rejected by the program');return signature;
}
const system={systemAccount:SystemProgram.programId,systemProgram:SystemProgram.programId};
export async function buy(wallet:WalletProvider){return send(await program(wallet).methods.buy().accounts({dataAccount:EVENT_ACCOUNT,buyer:wallet.publicKey!,organizer:ORGANIZER,...system}).transaction(),wallet);}
export async function listTicket(wallet:WalletProvider,id:number,price:number){if(!Number.isSafeInteger(price)||price<0||price>FACE_VALUE)throw new Error('Price must be between 0 and 0.1 SOL');return send(await program(wallet).methods.list(new BN(id),new BN(price)).accounts({dataAccount:EVENT_ACCOUNT,seller:wallet.publicKey!}).transaction(),wallet);}
export async function buyResale(wallet:WalletProvider,t:ChainTicket){return send(await program(wallet).methods.resale(new BN(t.id),new BN(t.price),new BN(t.generation)).accounts({dataAccount:EVENT_ACCOUNT,buyer:wallet.publicKey!,seller:new PublicKey(t.owner),organizer:ORGANIZER,platform:PLATFORM,...system}).transaction(),wallet);}
export async function redeem(wallet:WalletProvider,id:number,generation:number){return send(await program(wallet).methods.redeem(new BN(id),new BN(generation)).accounts({dataAccount:EVENT_ACCOUNT,checker:wallet.publicKey!}).transaction(),wallet);}
export async function createEvent(wallet:WalletProvider,e:Omit<EventInfo,'count'>){
 const tx=await program(wallet).methods.new([EVENT_BUMP],e.name,e.place,new BN(e.starts),new BN(e.supply)).accounts({dataAccount:EVENT_ACCOUNT,payer:wallet.publicKey!,systemProgram:SystemProgram.programId}).transaction();
 tx.instructions.unshift(ComputeBudgetProgram.setComputeUnitLimit({units:400_000}));return send(tx,wallet);
}
export function ticketMessage(id:number,generation:number,owner:string){return new TextEncoder().encode(`Ticketsol:admission:devnet:${PROGRAM_ID}:${EVENT_ACCOUNT}:${id}:${generation}:${owner}`);}
export async function ticketURL(wallet:WalletProvider,t:ChainTicket){
 if(wallet.publicKey?.toBase58()!==t.owner)throw new Error('Only the ticket owner can create its QR');
 if(!wallet.signMessage)throw new Error('This wallet does not support QR signing. Please use Phantom.');
 const signed=await wallet.signMessage(ticketMessage(t.id,t.generation,t.owner),'utf8');
 return `${window.location.origin}/verify?t=${t.id}&g=${t.generation}&o=${t.owner}#s=${bs58.encode(signed.signature)}`;
}
export function verifySignature(id:number,generation:number,owner:string,signature:string){try{return nacl.sign.detached.verify(ticketMessage(id,generation,owner),bs58.decode(signature),new PublicKey(owner).toBytes());}catch{return false;}}
export function short(address:string){return address.slice(0,4)+'…'+address.slice(-4);}
export function sol(lamports:number){return (lamports/1e9).toLocaleString('en-US',{maximumFractionDigits:9});}
export function explorer(signature:string){return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;}
export function humanError(error:unknown){const msg=error instanceof Error?error.message:String(error);if(/reject|cancel/i.test(msg))return 'Action cancelled in the wallet.';if(/insufficient|debit|no prior credit/i.test(msg))return 'Not enough test SOL. Fund your wallet on Devnet.';if(/429|fetch|network|403/i.test(msg))return 'Solana RPC is unavailable. Please refresh in a minute.';if(/simulation|custom program/i.test(msg))return 'The program rejected this action. Refresh the status: this ticket may have changed owners or already been used.';return msg;}
