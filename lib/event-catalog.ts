export type CatalogEvent = {
  id: string;
  name: string;
  titleLines: [string, string];
  city: string;
  venue: string;
  date: string;
  genre: string;
  subtitle: string;
  description: string;
  image: string;
  imagePosition: string;
  imageAlt: string;
  edition: string;
  admission: 'devnet' | 'preview';
};

// Fictional hackathon events. Only AFTER HOURS is wired to the existing
// single-event Solana program; catalog previews must never buy that ticket.
export const eventCatalog: CatalogEvent[] = [
  {id:'after-hours',name:'AFTER HOURS',titleLines:['AFTER','HOURS'],city:'Almaty',venue:'Demo Space',date:'2026-10-24T20:00:00+05:00',genre:'Live music',subtitle:'A night of independent music',description:'One night. An independent stage. Just you, the crowd, and the music.',image:'/concert.png',imagePosition:'55% center',imageAlt:'Singer silhouetted against stage lights and a crowd of raised hands',edition:'001',admission:'devnet'},
  {id:'electric-steppe',name:'ELECTRIC STEPPE',titleLines:['ELECTRIC','STEPPE'],city:'Astana',venue:'Warehouse 02 · Demo venue',date:'2026-10-31T22:00:00+05:00',genre:'Electronic / techno',subtitle:'From the first beat to the last light',description:'A warehouse. A late-night sound system. Lose yourself in the rhythm of the capital.',image:'/electronic.png',imagePosition:'50% center',imageAlt:'DJ at the decks under high-contrast warehouse strobe lights',edition:'002',admission:'preview'},
  {id:'jazz-after-dark',name:'JAZZ AFTER DARK',titleLines:['JAZZ AFTER','DARK'],city:'Almaty',venue:'The Listening Room · Demo venue',date:'2026-11-06T20:30:00+05:00',genre:'Jazz / soul',subtitle:'Close to the stage. Closer to the sound.',description:'Saxophone, soul, and a room that listens. An intimate session with no two nights alike.',image:'/jazz.png',imagePosition:'50% center',imageAlt:'Saxophone player performing in an intimate smoky jazz club',edition:'003',admission:'preview'},
  {id:'south-side-live',name:'SOUTH SIDE LIVE',titleLines:['SOUTH SIDE','LIVE'],city:'Shymkent',venue:'South Stage · Demo venue',date:'2026-11-14T19:00:00+05:00',genre:'Indie / alternative',subtitle:'New voices. Southern energy.',description:'Turn it up for the next wave of independent bands. A whole evening of live, unfiltered sound.',image:'/concert.png',imagePosition:'28% center',imageAlt:'A packed independent music show with a singer and raised hands',edition:'004',admission:'preview'},
  {id:'midnight-frequency',name:'MIDNIGHT FREQUENCY',titleLines:['MIDNIGHT','FREQUENCY'],city:'Astana',venue:'Room 808 · Demo venue',date:'2026-11-21T23:00:00+05:00',genre:'House / electronic',subtitle:'Find your frequency after midnight',description:'Deep grooves and a shared dance floor. Stay for the track you have not heard yet.',image:'/electronic.png',imagePosition:'75% center',imageAlt:'Late-night DJ set with bright light cutting across the dance floor',edition:'005',admission:'preview'},
];

export function searchEvents(events: CatalogEvent[], query: string): CatalogEvent[] {
  const normalize = (value: string) => value.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('en').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  return events.filter(event => {
    const text = normalize([event.name,event.city,event.venue,event.genre,event.subtitle].join(' '));
    return terms.every(term=>text.includes(term));
  });
}

export function eventDate(date: string) {
  return new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Almaty'}).format(new Date(date));
}
