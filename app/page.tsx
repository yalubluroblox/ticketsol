"use client";
import dynamic from 'next/dynamic';
const TicketApp=dynamic(()=>import('@/components/ticket-app'),{ssr:false,loading:()=> <main className="verify-shell"><div className="verify-brand">TICKETSOL®</div><p>Setting the stage…</p></main>});
export default function Home(){return <TicketApp/>;}
