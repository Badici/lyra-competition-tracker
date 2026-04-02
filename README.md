# lyra-competition-tracker

Aplicație **mobile-first** Next.js (App Router) pentru urmărirea concursurilor la crap. Interfața este **în română**; codul sursă este **în engleză**.

## Rulare locală

```bash
npm install
cp .env.example .env.local
# Editează .env.local dacă API-ul Django diferă (URL, prefix, resurse).
npm run dev
```

Deschide [http://localhost:3000](http://localhost:3000). Pagina principală redirecționează către `/dashboard` (listă concursuri, acces public). Zona `/admin/*` necesită autentificare (cookie HttpOnly după login).

```bash
npm run build
npm start
```

```bash
npm run test   # motor de scor (Vitest)
```

## Arhitectură

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS v4.
- **Date**: TanStack React Query (cache + reîncărcare la ~7s pentru clasamente), Axios prin proxy same-origin.
- **Auth**: `POST /api/auth/login` încearcă mai multe căi JWT configurabile (`DJANGO_TOKEN_PATHS`); token-ul este stocat în cookie **HttpOnly** (`lyra_access_token`). `GET /api/auth/me` normalizează utilizatorul pentru RBAC.
- **Proxy**: `GET|POST|PATCH|PUT|DELETE /api/django/*` → `DJANGO_API_BASE` + `DJANGO_API_URL_PREFIX` + calea cerută, cu antet `Authorization: Bearer …` din cookie.

## Presupuneri despre API-ul Django (fără modificări backend)

Backend-ul remote poate fi indisponibil sau diferit; aplicația este gândită să fie **configurabilă**:

1. **Listă / detaliu**: răspunsuri DRF tip `{ count, results }` sau tablou simplu — normalizate în `unwrapList`.
2. **Resurse REST** (implicit): `competitions/`, `teams/`, `sectors/`, `weigh_ins/`, `prizes/` — suprascrie cu `DJANGO_RESOURCE_*` dacă numele ruterului diferă.
3. **Câmpuri**: acceptă atât `snake_case` cât și `camelCase` la citire (`normalize.ts`). Payload-urile de scriere folosesc `snake_case` acolo unde e uzual în DRF.
4. **JWT**: compatibil cu SimpleJWT (`access` / `refresh` în JSON). Dacă backend-ul folosește alt contract, ajustează `src/app/api/auth/login/route.ts` (fără a atinge logica Django pe server).
5. **Profil utilizator**: `users/me/` (sau `DJANGO_ME_PATH`) returnează `username`, opțional `is_staff`, `role` sau `groups` — din ele se deduce dacă utilizatorul poate accesa adminul.

## Roluri (RBAC)

- **Admin / organizator**: `is_staff`, `role` ∈ `{ admin, organizer }`, sau grupuri cu nume care conțin „admin”/„organizer” (vezi `normalizeUser`).
- **Participant / vizualizator**: poate folosi dashboard-ul și paginile de concurs **fără** login; înregistrarea cântăririlor și adminul necesită drepturi.

## Motor de scor (client)

Modulul `src/lib/scoring/engine.ts` agregă cântăririle, aplică tipul concursului (cantitate / calitate / combinat) și produce clasament global, pe sectoare și intrări **Braila** (max pe zi). Formula **combinată**:

`combinedScore = w1 * totalKg + w2 * fishCount + w3 * sum(top N greutăți pește)`

— ponderile vin din `competition.combinedWeights` (implicit 1, 0.5, 1).

Dacă lipsesc greutăți individuale, calitatea folosește `biggestFishKg` sau distribuție uniformă pe peștii din sesiune (documentat în cod).

## Timp real

- Implicit: **polling** prin `refetchInterval` în `useCompetitionBundle`.
- Opțional: `NEXT_PUBLIC_WS_URL`; la mesaje pe WebSocket se invalidează query-urile relevante (dacă serverul expune un canal compatibil).

## Structură rute

| Rută | Rol |
|------|-----|
| `/login` | Autentificare |
| `/dashboard` | Concursuri (public) |
| `/competition/[id]/*` | Clasament, sectoare, echipe, cântăriri, Braila |
| `/admin/*` | Concursuri, echipe/sectoare, documentație setări |

Componente reutilizabile: `LeaderboardTable`, `SectorCard`, `TeamCard`, `WeighInForm`, `StatsCard`, `BrailaWidget` (sub `src/components/`).
