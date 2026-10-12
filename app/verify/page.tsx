"use client";
import dynamic from 'next/dynamic';
const VerifyTicket=dynamic(()=>import('@/components/verify-ticket'),{ssr:false,loading:()=> <main className="verify-shell"><div className="verify-brand">TICKETSOL®</div><p>Loading ticket verification…</p></main>});
export default function VerifyPage(){return <VerifyTicket/>;}
