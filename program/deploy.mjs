import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import anchor from '@coral-xyz/anchor';
import {Connection,Keypair,PublicKey,SystemProgram} from '@solana/web3.js';
const {AnchorProvider,Program,Wallet,BN}=anchor;
const rpc='https://api.devnet.solana.com';
const idl=JSON.parse(fs.readFileSync('program/build/Ticketsol.json','utf8'));
const organizer=Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync('.local-keys/organizer.json','utf8'))));
const connection=new Connection(rpc,'confirmed');
const id=new PublicKey(idl.metadata.address);
const account=await connection.getAccountInfo(id);
if(!account?.executable){
 const size=fs.statSync('program/build/Ticketsol.so').size;
 const rent=await connection.getMinimumBalanceForRentExemption(size+45);
 const balance=await connection.getBalance(organizer.publicKey);
 if(balance<rent+100000000)throw new Error(`Need ${(rent/1e9+.1).toFixed(3)} Devnet SOL; balance ${(balance/1e9).toFixed(3)}. Address: ${organizer.publicKey}`);
 const result=spawnSync('solana',['program','deploy','program/build/Ticketsol.so','--program-id','.local-keys/program.json','--keypair','.local-keys/organizer.json','--url',rpc],{stdio:'inherit',shell:false});
 if(result.status!==0)process.exit(result.status??1);
}
const [dataAccount,bump]=PublicKey.findProgramAddressSync([Buffer.from('ticketsol-event')],id);
if(!await connection.getAccountInfo(dataAccount)){
 const program=new Program(idl,id,new AnchorProvider(connection,new Wallet(organizer),{commitment:'confirmed',preflightCommitment:'confirmed'}));
 const signature=await program.methods.new([bump],'AFTER HOURS','Almaty · Demo Space',new BN(1792854000),new BN(64)).accounts({dataAccount,payer:organizer.publicKey,systemProgram:SystemProgram.programId}).rpc();
 console.log('Event created:',signature);
}
console.log('Program:',id.toBase58(),'Event:',dataAccount.toBase58());
console.log('Deployment verified:',Boolean((await connection.getAccountInfo(id))?.executable));
