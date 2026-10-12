"use client";
import {useMemo,useRef,useState} from 'react';
import {Search,X,Plus,ShieldCheck} from 'lucide-react';
import {eventCatalog,eventDate,searchEvents,type CatalogEvent} from '@/lib/event-catalog';
import type {EventInfo} from '@/lib/chain';

export default function EventDiscovery({liveEvent,onBuy}:{liveEvent:EventInfo|null;onBuy:()=>void}) {
  const [query,setQuery]=useState('');
  const [selected,setSelected]=useState('after-hours');
  const searchRef=useRef<HTMLInputElement>(null);
  const featureRef=useRef<HTMLElement>(null);
  const events=useMemo(()=>eventCatalog.map(e=>e.id==='after-hours'&&liveEvent?{...e,name:liveEvent.name,titleLines:(liveEvent.name==='AFTER HOURS'?['AFTER','HOURS']:[liveEvent.name,'']) as [string,string],venue:liveEvent.place.replace(/^Алматы\s*·?\s*/,''),date:new Date(liveEvent.starts*1000).toISOString()}:e),[liveEvent]);
  const results=useMemo(()=>searchEvents(events,query),[events,query]);
  const featured=results.find(e=>e.id===selected)??results[0];
  const rest=results.filter(e=>e.id!==featured?.id);
  const searching=query.trim().length>0;
  const soldOut=featured?.admission==='devnet'&&!!liveEvent&&liveEvent.count>=liveEvent.supply;
  function selectEvent(e:CatalogEvent){setSelected(e.id);requestAnimationFrame(()=>{featureRef.current?.scrollIntoView({behavior:'smooth',block:'start'});featureRef.current?.focus({preventScroll:true});});}
  function updateQuery(value:string){setQuery(value);setSelected('');}
  function clear(){setQuery('');setSelected('after-hours');searchRef.current?.focus();}

  return <>
    <div className="discovery-bar">
      <div className="discovery-label"><span className="eyebrow">[ FIND YOUR NEXT NIGHT ]</span><span className="catalog-count">05 EVENTS / 03 CITIES</span></div>
      <form role="search" className="event-search" onSubmit={e=>{e.preventDefault();if(featured)selectEvent(featured);}}>
        <Search size={19} aria-hidden="true"/>
        <label htmlFor="event-search" className="sr-only">Search events</label>
        <input ref={searchRef} id="event-search" type="search" value={query} onChange={e=>updateQuery(e.target.value)} placeholder="Search events, cities, or sounds" autoComplete="off"/>
        {query&&<button type="button" aria-label="Clear search" onClick={clear}><X size={17}/></button>}
        <button type="submit" className="search-submit">Search</button>
      </form>
    </div>
    {searching&&<div className="search-summary" role="status" aria-live="polite"><span>{results.length} {results.length===1?'event':'events'} matching <strong>“{query.trim()}”</strong></span><button onClick={clear}>Show all events</button></div>}
    {featured?<section className="event-hero" ref={featureRef} tabIndex={-1} aria-label={`Featured event: ${featured.name}`} key={featured.id}>
      <div className="hero-index"><span className="eyebrow">[ {searching?'YOUR SEARCH':'IN THE SPOTLIGHT'} / {featured.edition} ]</span><div><span className="event-kicker">{featured.genre.toUpperCase()} · {featured.city.toUpperCase()}</span><h2>FEEL IT.<br/>LIVE IT.</h2><p>{featured.description}</p></div><div className="hero-foot"><ShieldCheck size={18}/><span>{featured.admission==='devnet'?<>Tickets from a verified<br/>organizer</>:<>A new night<br/>on the demo lineup</>}</span></div></div>
      <div className={`hero-image poster-${featured.id}`}><img src={featured.image} style={{objectPosition:featured.imagePosition}} alt={featured.imageAlt}/><span className="image-label">{featured.city.toUpperCase()} / {featured.genre.toUpperCase()}</span><span className="image-number">{featured.edition} / 005</span></div>
      <div className="event-details"><span className="eyebrow">{featured.admission==='devnet'?'FEATURED EVENT':'UP NEXT'}</span><div><h3>{featured.titleLines[0]}{featured.titleLines[1]&&<><br/>{featured.titleLines[1]}</>}</h3><p className="event-subtitle">{featured.subtitle}</p></div><dl><div><dt>WHEN</dt><dd>{eventDate(featured.date)}</dd></div><div><dt>WHERE</dt><dd>{featured.city} · {featured.venue}</dd></div><div><dt>SOUND</dt><dd>{featured.genre} / 18+</dd></div></dl><div className="purchase"><div><span>GENERAL ADMISSION</span>{featured.admission==='devnet'?<strong>0.1 <small>SOL</small></strong>:<span className="coming-soon">COMING SOON</span>}</div><button className="primary" onClick={onBuy} disabled={featured.admission==='preview'||soldOut}>{featured.admission==='preview'?'Tickets coming soon':soldOut?'Sold out':'Get your ticket'}{featured.admission==='devnet'&&<Plus size={18}/>}</button><span className="fine">{featured.admission==='devnet'?'Demo event · Solana Devnet':'Demo event · Ticket sales not open yet'}</span></div></div>
    </section>:<section className="search-empty"><Search size={36}/><span className="eyebrow">[ NO MATCHES THIS TIME ]</span><h2>NOT ON THE LINEUP.</h2><p>Try an event name, a city like Almaty, or a sound like jazz.</p><button className="secondary-button" onClick={clear}>Explore all 5 events</button></section>}
    {rest.length>0&&<section className="event-list" aria-label={searching?'More search results':'More events'}><div className="event-list-heading"><h2>{searching?'MORE MATCHES':'MORE NIGHTS. MORE SOUND.'}</h2><span className="eyebrow">[ {String(rest.length).padStart(2,'0')} EVENTS ]</span></div>{rest.map(item=><button key={item.id} className="event-row" onClick={()=>selectEvent(item)} aria-label={`View ${item.name}`}><span className="event-row-number">{item.edition}</span><div className={`mini-poster poster-${item.id}`}><img src={item.image} style={{objectPosition:item.imagePosition}} alt="" loading="lazy"/><span>{item.titleLines[0]}<br/>{item.titleLines[1]}</span></div><div className="event-row-title"><span>{item.genre.toUpperCase()}</span><h3>{item.name}</h3><p>{item.subtitle}</p></div><div className="event-row-date"><strong>{eventDate(item.date).split(',')[0]}</strong><span>{item.city}</span></div><span className="event-row-action">VIEW EVENT <Plus size={16}/></span></button>)}</section>}
  </>;
}
