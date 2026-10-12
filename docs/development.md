# Ticketsol

Hackathon ticketing MVP on **Solana Devnet**. Editorial monochrome interface, Phantom wallet connection, primary purchases, capped resale, signed QR verification, organizer admission.

## Status

- Program compiled with Solang 0.3.3 into a native Solana SBF binary.
- 17 local-validator integration checks passed; see `program/test-results.json`.
- Frontend TypeScript check and production build passed.
- Devnet deployment requires test SOL. The app checks the real deployment/account state and disables purchases until ready. There are no simulated purchases or fake transaction confirmations.

## Run

```powershell
npm install
npm run dev -- --hostname 0.0.0.0 --port 5188
```

On this Windows machine, if npm resolves incorrectly, use:

```powershell
& 'C:/Program Files/nodejs/node.exe' 'C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js' install --cache .sites-runtime/npm-cache
node node_modules/next/dist/bin/next dev --hostname 0.0.0.0 --port 5188
```

Build: `npm run build:vercel`. Type check: `npm run typecheck`.

## Solana program

- Program: `F8B453fWqji2qE6MfLjsQMmmzp9PJDNmLdudrQsoXCuP`
- Trusted organizer/checker: `6hVPgsmGGMd4jqSJ2J4kd1XCzWoBbAKT9YHK231tgh81`
- Platform fee recipient: `DeQkMFfTKFiHf5DE4R1XrFPWeaHSSEqfUFbq5aM3WuL`
- Event: canonical PDA using seed `ticketsol-event`.
- One event, up to 64 tickets, face value 100,000,000 lamports (0.1 SOL).
- Tickets are custom program-owned digital assets, not SPL NFTs. Ownership changes only through the program's paid resale instruction.
- Resale is atomic: 93% seller, 5% organizer, 2% platform (integer rounding remainder to seller).
- A seller can cancel a listing by setting its price to zero.
- The program rejects wrong signers/fee recipients, prices above face value, stale listings, stale admission generations, used tickets and capacity overflow.

Program source: [`program/Ticketsol.sol`](../program/Ticketsol.sol). Generated client IDL: [`lib/ticketsol-idl.json`](../lib/ticketsol-idl.json).

```powershell
solang compile --target solana -o program/build program/Ticketsol.sol
Copy-Item program/build/Ticketsol.json lib/ticketsol-idl.json
node program/deploy.mjs
```

`deploy.mjs` is hardcoded to Devnet and verifies deployment, then creates the demo event if absent. It uses dedicated generated **test-only** keys in ignored `.local-keys/`. Never publish that folder or use those keys for real funds. The program upgrade key and organizer key remain local. To run the organizer UI, import the dedicated organizer test key into a separate Phantom test account, or change the trusted public key in source and rebuild before deployment. Private keys are never bundled in the site.

Official references: [Solana deployment](https://solana.com/docs/programs/deploying), [Solang 0.3.3 Solana target](https://solang.readthedocs.io/en/v0.3.3/targets/solana.html).

## QR and admission

1. Ticket owner signs a domain-separated message binding Devnet, program, event PDA, ticket number, ownership generation, and owner public key.
2. QR opens `/verify?t=…&g=…&o=…#s=…`. Signature is in the URL fragment, so it is not sent in the HTTP request.
3. The page validates the Ed25519 signature and reads authoritative state from Solana. Public viewers need no wallet.
4. Resale changes owner and generation, invalidating the old signed QR.
5. Only the organizer's signing wallet can redeem the current generation. Repeat redemption is rejected on chain.

Anyone holding a copy of a current QR can present it first; identity checks and rotating QR are out of this MVP's scope. The program trusts the authorized organizer to validate the displayed proof before redeeming. A public site URL is needed for arbitrary phones; localhost URLs work only on the developer machine. Phantom mobile users should use its in-app browser to sign transactions; ordinary phone cameras can open the public verification page without Phantom.

## Local integration test

Use a fresh ledger each run (tests create the canonical event and consume tickets). On Windows, `--log` avoids a log symlink permission failure. The old Windows validator may stop at its first snapshot due to symlink privileges; the test suite completes before that snapshot. Do not change system security settings to work around it.

```powershell
solana-test-validator --ledger program/test-ledger-fresh --rpc-port 8899 --bind-address 127.0.0.1 --mint 6hVPgsmGGMd4jqSJ2J4kd1XCzWoBbAKT9YHK231tgh81 --bpf-program F8B453fWqji2qE6MfLjsQMmmzp9PJDNmLdudrQsoXCuP program/build/Ticketsol.so --log
# Separate terminal, immediately after validator starts:
node program/test.mjs
```

## Demo sequence

1. Deploy and initialize; fund two separate buyer wallets with Devnet SOL.
2. Wallet A buys a ticket, signs and saves its QR URL.
3. A lists at 0.1 SOL (the on-chain test also proves 0.100000001 is rejected).
4. Wallet B buys the resale; inspect fee transfers in Solana Explorer.
5. Open A's saved QR: it is invalidated by transfer.
6. B signs a fresh QR; open it using an ordinary phone camera.
7. Organizer connects its wallet and confirms admission; the page shows used.
8. Refresh: repeat admission is unavailable and rejected by the program.

## Limits

Devnet only; no security audit, payment cards, seat maps, refunds, external tickets, identity verification or offline admission. Public Solana RPC may rate-limit clients. No personal attendee details are stored. Event owner cannot change its metadata after creation. The long-term history is available through Solana transactions; the MVP displays current ticket state.

## Event discovery
The English catalog contains five demo events across Almaty, Astana, and Shymkent. Search matches event titles, cities, venues, and genres. The first match becomes the large featured poster; other matches remain compact rows. Selecting a row promotes that event. Only After Hours maps to the existing Solana event account; the four additional listings are explicitly marked Coming soon and cannot sell tickets.


## GitHub and Vercel build

This repository is a standalone Next.js distribution of the Ticketsol UI. It does not require the original Sites/Cloudflare runtime. Vercel uses the root `vercel.json`, Node.js 22, `npm ci`, and `npm run build:vercel`. No signing keys belong in Vercel environment variables.

The repository includes only public program addresses. The maintainer retains the original test-only keys locally. To deploy your own instance, create dedicated test keypairs, update the program ID and organizer/platform constants in `program/Ticketsol.sol` and `lib/chain.ts`, and update the platform constant in `program/test.mjs`. Recompile with Solang, copy the generated IDL to `lib/ticketsol-idl.json`, and use the matching local keys with `program/deploy.mjs`. Never commit keypair files. The deploy script targets Devnet only.

The local integration results document the original program configuration. A fork with changed addresses must rerun the suite. Use a fresh validator ledger, preload the matching binary at the updated program address, and fund the organizer through the local validator's mint option.

The original project overview and pitch deck describe the status at their creation time. This README and deployment records take precedence for hosting updates.

## Production deployment

Frontend: https://ticketsol.vercel.app. Vercel production build and unauthenticated HTTP check succeeded. Git integration requires write access to yalubluroblox/ticketsol for the connected GitHub account. Frontend publication does not deploy the Solana program.

## Dependency review

The Vercel migration updates Next.js to 16.3.8, the compatible patch identified by npm audit for the ImageResponse advisory. The legacy Anchor 0.28 / Solana web3.js dependency tree still reports transitive advisories, including TOML parsing and UUID/stream handling. Do not treat the demo as security-audited. Replacing the legacy client requires compatibility checks against the Solang IDL before real-money use.

