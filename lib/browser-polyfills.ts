import {Buffer} from 'buffer';
// Anchor 0.28 includes browser code paths that reference the global Buffer.
if(typeof globalThis.Buffer==='undefined')globalThis.Buffer=Buffer;
