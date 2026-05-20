# Deen's Grill — Agent Context

> Document de contexte pour reprise/maintenance par un agent IA (Claude, GPT, etc.).
> Concu pour eviter les erreurs courantes et preserver l'integrite du projet.
> Langue : francais (le site est entierement en francais).

---

## 1. Project Overview

**Type** : Site web restaurant single-page (SPA) pour **Deen's Grill**, restaurant de grillades a Ouaga 2000, Ouagadougou, Burkina Faso.
**Stack** : Next.js 16 (App Router, Turbopack), React 19, TypeScript 5, Tailwind CSS 4, Prisma ORM + SQLite, shadcn/ui, Framer Motion.
**Langue** : Toutes les chaines UI sont en francais. Ne jamais traduire en anglais.
**Dev server** : `bun run dev` sur port 3000. **Ne jamais utiliser `bun run build`.**

---

## 2. Architecture Critique

### 2.1 Structure des fichiers

```
src/
  app/
    page.tsx              ← UNIQUE page du site (2678 lignes, 'use client')
    layout.tsx            ← Layout racine (meta, fonts, PWA)
    globals.css           ← Tailwind theme + custom CSS animations
    api/
      menu/route.ts       ← GET /api/menu (public, filtre par category/search/featured)
      categories/route.ts ← GET /api/categories (public)
      daily-special/route.ts ← GET /api/daily-special (public, retourne le plat du jour)
      admin/route.ts      ← GET/POST /api/admin (auth PIN requise, CRUD menu + specials)
      reservations/route.ts ← GET/POST/PATCH (POST public, GET/PATCH admin)
      contact/route.ts    ← GET/POST/PATCH (POST public, GET/PATCH admin)
      seed-specials/route.ts ← POST /api/seed-specials (admin, initialisation unique)
  components/ui/          ← shadcn/ui (NE PAS MODIFIER)
  lib/
    db.ts                 ← Prisma Client singleton
    utils.ts              ← cn() helper
prisma/
  schema.prisma           ← Schema de la BDD
public/                   ← Images, manifest.json, logo.png, robots.txt
db/
  dev.db                  ← SQLite database file
```

### 2.2 Point critique : page.tsx est MONOLITHIQUE

**TOUT le frontend est dans `src/app/page.tsx`** (2678 lignes). Ce fichier contient :
- Tous les interfaces TypeScript (Category, MenuItem, Reservation, ContactInquiry, DailySpecial)
- Tous les states React (30+ useState)
- Tous les handlers (fetch, CRUD admin, panier, WhatsApp, favoris)
- Toutes les sections JSX (navbar, hero, specialites, plat du jour, menu, galerie, reservation, contact, footer, admin panel, floating buttons, cart dialog)
- Toutes les animations et composants internes (CountUp, AnimatedSection)

**Risque majeur** : Une modification hasardeuse dans ce fichier peut casser n'importe quelle partie du site. Toujours verifier avec `bun run lint` apres toute modification.

---

## 3. Database Schema (Prisma + SQLite)

```prisma
model Category {
  id        String     @id @default(cuid())
  name      String
  slug      String     @unique
  order     Int        @default(0)
  items     MenuItem[]
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
}

model MenuItem {
  id          String   @id @default(cuid())
  name        String
  description String?
  price       Int      // Prix en FCFA (ex: 3500 = 3 500 F)
  categoryId  String
  category    Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  featured    Boolean  @default(false)
  available   Boolean  @default(true)
  order       Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model DailySpecial {
  id              String   @id @default(cuid())
  name            String
  description     String?
  image           String?
  dayOfWeek       Int      // 0=Dimanche, 1=Lundi, ..., 6=Samedi
  originalPrice   Int
  discountType    String   @default("percentage") // "percentage" | "fixed_price"
  specialPrice    Int?     // Utilise si discountType = "fixed_price"
  discountPercent Int?     // Utilise si discountType = "percentage"
  active          Boolean  @default(true)
  order           Int      @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model Reservation {
  id        String   @id @default(cuid())
  name      String
  phone     String
  email     String?  // Present dans schema mais NON utilise dans l'UI
  date      String
  time      String
  guests    Int
  message   String?
  status    String   @default("pending") // pending | confirmed | cancelled
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model ContactInquiry {
  id        String   @id @default(cuid())
  name      String
  email     String?
  phone     String?
  subject   String?
  message   String
  status    String   @default("new") // new | read | replied
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Donnees actuelles** : 11 categories, 75 items, 7 daily specials (un par jour), 0 reservations, 0 inquiries.

**IMPORTANT** : Les IDs sont des CUIDs (String, pas Int). Le `price` est un Int en FCFA.

---

## 4. API Routes

### 4.1 Routes publiques (sans authentification)

| Methode | Route | Description |
|---------|-------|-------------|
| GET | `/api/menu` | Retourne tous les MenuItem (available=true). Query params: `?featured=true`, `?category=slug`, `?search=query`. Inclut la relation `category`. |
| GET | `/api/categories` | Retourne toutes les categories avec `_count.items` (available=true). |
| GET | `/api/daily-special` | Retourne le plat du jour actif (match dayOfWeek = aujourd'hui). Ajoute `displayPrice` et `discountLabel` calcules. |
| POST | `/api/reservations` | Cree une reservation (champs: name, phone, date, time, guests, message). |
| POST | `/api/contact` | Cree une demande de contact (champs: name, message, phone, subject). |

### 4.2 Routes admin (header `x-admin-pin: 1234` requis)

| Methode | Route | Description |
|---------|-------|-------------|
| GET | `/api/admin` | Retourne {categories (avec items), dailySpecials, stats}. |
| POST | `/api/admin` | Action-based CRUD. Body: `{action, data}`. Actions: createCategory, updateCategory, deleteCategory, createItem, updateItem, deleteItem, createDailySpecial, updateDailySpecial, deleteDailySpecial. |
| GET | `/api/reservations` | Liste toutes les reservations. |
| PATCH | `/api/reservations` | Change le statut (body: {id, status}). |
| GET | `/api/contact` | Liste toutes les demandes de contact. |
| PATCH | `/api/contact` | Change le statut (body: {id, status}). |
| POST | `/api/seed-specials` | Initialise les 7 daily specials (idempotent, ne reinjecte pas si existants). |

---

## 5. Logique Metier Critique

### 5.1 WhatsApp — SEUL canal de communication

**CRITICAL** : Le restaurant n'a PAS de telephone classique. WhatsApp est le SEUL moyen de contact/commande/reservation.
- Numero WhatsApp : **226 54 02 55 55** (international: +22654025555)
- Deep link : `https://wa.me/22654025555?text=...`
- Toutes les commandes/reservations redirigent vers WhatsApp avec un message pre-rempli
- **Ne jamais ajouter de liens `tel:`** — ils ont ete intentionnellement supprimes

### 5.2 Reservation — Via WhatsApp uniquement

Le formulaire de reservation ne POST pas a l'API. Il construit un message WhatsApp et ouvre `wa.me/...`. Les reservations sont enregistrees cote client uniquement via le lien WhatsApp (le restaurant les gere manuellement).

**Note** : L'API POST `/api/reservations` existe toujours mais n'est plus appelee par le frontend. L'admin peut les creer manuellement si besoin.

### 5.3 Plat du Jour — Daily Special

- Un plat different chaque jour de la semaine (7 jours)
- Sticky bar sous la navbar (sticky top-16 md:top-20 z-30)
- Supporte 2 types de reduction : pourcentage (%) ou prix fixe
- L'admin peut choisir le type et la valeur via le panneau admin (onglet "Plats du Jour")
- L'API `/api/daily-special` calcule automatiquement `displayPrice` et `discountLabel`

### 5.4 Panier (Cart) — Client-side uniquement

- Le panier est un state React pur (`cart` dans page.tsx)
- Il ne persiste PAS entre les rechargements de page
- "Envoyer via WhatsApp" envoie la commande complete (items + quantites + total)
- Bouton "Vider le panier" pour reinitialiser

### 5.5 Panneau Admin

- Acces via l'icone bouclier (ShieldCheck) dans la navbar
- PIN : `1234` (hardcode dans page.tsx et dans les routes API)
- 4 onglets : Menu, Plats du Jour, Reservations, Messages
- CRUD complet sur categories, items, et daily specials
- Le PIN est verifie cote client ET cote serveur (header `x-admin-pin`)

### 5.6 Photos et images

- Logo : `/logo.png` (utilise partout — navbar, hero, footer, loading screen, favicon)
- Hero background : `/hero-interior.jpeg` (interieur du restaurant)
- Photos plats : `/food-*.jpeg` (9 photos de plats reels)
- Photos galerie : `/gallery-*.jpeg` (7 photos supplementaires)
- Total galerie : 16 photos dans le array `galleryImages` de page.tsx
- **Fonction `getDishImage()` n'existe PAS** — le mapping photo est fait inline via des conditions `if/else if` sur `name.toLowerCase()` dans la section "Nos Specialites"

---

## 6. Design System

### 6.1 Couleurs (Tailwind custom)

| Prefix | Usage |
|--------|-------|
| `grill-*` | Couleur principale (orange/ambre). Primary actions, accents. |
| `wood-*` | Couleur secondaire (brun/bois). Backgrounds, textes. |
| `ember-*` | Couleur d'erreur/alerte (rouge). Discounts, erreurs. |
| `gold-*` | Couleur premium (jaune/dore). Prix, badges, highlights. |

**NE JAMAIS utiliser de bleu ou indigo** sauf si explicitement demande.

### 6.2 Fonts

- Serif : Playfair Display (`font-serif`, titres h1-h4)
- Sans : Inter (`font-sans`, body text, boutons)

### 6.3 CSS custom utilities (dans globals.css)

- `.text-gradient` — Texte degrade or-orange
- `.section-divider` — Ligne degradee sous les titres de section
- `.grill-pattern` — Motif lignes verticales subtiles
- `.hero-overlay` — Gradient sombre sur le hero
- `.card-shine` — Effet de brillance au hover sur les cartes
- `.pattern-dots` — Motif de points subtils
- `.shadow-grill-warm` / `.shadow-grill-warm-sm` — Ombres chaudes
- `.scrollbar-hide` — Cache la scrollbar
- `.animate-pulse-glow`, `.animate-whatsapp-pulse`, `.animate-marquee`, `.animate-shimmer` — Animations custom

---

## 7. Sections du Site (ordre dans page.tsx)

1. **Scroll progress bar** (fixed top-0 z-[60])
2. **Loading overlay** (z-[100], fade out apres 1.5s)
3. **JSON-LD** (Restaurant schema pour SEO)
4. **Navbar** (fixed top-0 z-50, transparent → solid au scroll)
5. **Hero** (full viewport, photo interieur, CTA WhatsApp + Location)
6. **Promotional strip** (marquee, liens WhatsApp + heures)
7. **Nos Specialites** (3 cartes featured, photos reelles, smart photo mapping)
8. **Plat du Jour** (sticky bar, affiche le plat du jour avec reduction)
9. **Notre Menu** (categories filter, search, grouped/single view, 75 items)
10. **Galerie** (16 photos, lightbox modal)
11. **Reservation** (formulaire → WhatsApp)
12. **Contact** (4 cards: WhatsApp, adresse, horaires, Facebook + carte Maps)
13. **Footer** (3 colonnes: brand, contact, social)
14. **Floating buttons** (scroll-to-top, WhatsApp, cart)
15. **Cart dialog** (panier avec quantites, total, envoi WhatsApp)
16. **Admin panel** (dialog modal avec PIN lock, 4 onglets, 3 sous-dialogs CRUD)

---

## 8. Regles Absolues (NE PAS VIOLER)

1. **NE PAS modifier les fichiers dans `src/components/ui/`** — Ce sont des composants shadcn/ui generes automatiquement.
2. **NE PAS ajouter de nouvelles routes** — Le site est single-page. Toute nouvelle section doit etre dans `page.tsx`.
3. **NE PAS utiliser `bun run build`** — Environnement dev only.
4. **NE PAS ajouter de liens `tel:` ou d'appels telephoniques** — WhatsApp only.
5. **NE PAS traduire le contenu en anglais** — Tout le site est en francais.
6. **NE PAS supprimer ou renommer les images dans `/public`** sans mettre a jour toutes les references dans `page.tsx`.
7. **NE PAS modifier le schema Prisma sans reflechir aux impacts** — Toute modification de schema necessite `bun run db:push` et un restart du dev server.
8. **NE PAS utiliser de bleu/indigo dans le design** — La palette est grill/wood/ember/gold.
9. **Le footer DOIT etre sticky en bas** (mt-auto + min-h-screen flex flex-col sur le wrapper).
10. **Toujours verifier avec `bun run lint`** apres chaque modification.
11. **TOUJOURS utiliser des API routes (`/api/...`)** pour les operations de donnees, PAS de server actions.
12. **TOUJOURS redemarrer le dev server apres une modification du schema Prisma** (`prisma db push` puis restart).

---

## 9. Commandes Utiles

```bash
bun run dev              # Demarre le serveur de dev (port 3000)
bun run lint             # ESLint check
bun run db:push          # Pousse le schema Prisma vers SQLite
bun run db:generate      # Regenere le Prisma Client
```

---

## 10. Points d'Attention pour un Agent IA

### Risques courants :

- **page.tsx est trop gros (2678 lignes)**. Si tu dois le modifier, fais des recherches precises (grep) pour trouver la section exacte. NE PAS reecrire le fichier entier.
- **Le dev server peut crasher** apres des modifications lourdes. Si ca arrive : `pkill -f "next dev" && rm -rf .next && bun run dev`.
- **Les prices sont en FCFA (entiers)**. Ne jamais ajouter de decimales.
- **Le panier est client-side only**. Si tu ajoutes de la persistence, utilise Prisma/SQLite, PAS localStorage seul.
- **L'admin PIN est hardcode (`1234`)** dans page.tsx (2 endroits) et dans chaque route API. Pour le changer, il faut modifier TOUS ces endroits + la variable d'environnement.
- **La fonction `formatPrice()`** est definie dans page.tsx et utilise un formatage specifique (espace comme separateur de milliers). Ne pas la remplacer par `toLocaleString` sans tester.

### Fonctionnement du menu :

1. `useEffect` fetch `/api/categories` → set `categories`
2. `useEffect` fetch `/api/menu` → set `menuItems`
3. `filteredItems` = menuItems filtres par category + search
4. `groupedItems` = filteredItems groupes par category
5. Si `activeCategory === 'all'` → vue groupee (expandable par category)
6. Sinon → vue flat (grid de cards)

### Photo mapping (Nos Specialites) :

Les photos sont assignees par mots-cles dans le nom du plat (`name.toLowerCase()`). Ordre de matching :
mix/gourmand → food-mixgrill, pizza → food-pizza, mouton/agneau → food-mouton, poulet/choucouya → food-poulet, saucisse/merguez → food-saucisse, mechoui → food-mechouis, shawarma → gallery-boeuf-fondant, burger → gallery-poulet-grille, aloc/alloco → food-aloco, salade → food-salade, dinde → food-dinde. Default: hero-interior.

---

## 11. Horaires et Localisation

- **Adresse** : Ouaga 2000, Ouagadougou, Burkina Faso
- **Google Maps** : `https://maps.google.com/maps/place/geen's+grill+ouaga+200/data=!4m2!3m1!1s0xe2ebd202b123eab:0xbbc20219d135848b`
- **Horaires** : Lun-Jeu 13h-22h30, Ven-Dim 13h-23h
- **Fuseau horaire** : UTC (Ouagadougou est en UTC+0)
- **Statut ouvert/ferme** : Calcule en JS cote client (`new Date().getHours()`)

---

## 12. Historique des Modifications (detaillé dans worklog.md)

13 iterations de developpement documentees dans `/home/z/my-project/worklog.md`. Les plus significatives :

1. Build initial du site (menu, categories, reservation, contact, admin CRUD)
2. QA + stylisme (testimonials, floating buttons, scroll spy)
3. Photos reelles (remplacement images AI, galerie)
4. Simplification WhatsApp-only (suppression telephone, contact form, testimonials)
5. Reservation via WhatsApp + Maps dans la navbar
6. Plat du Jour avec pourcentages de reduction
7. PWA manifest, loading animation, admin PIN lock
8. Panier WhatsApp, scroll progress bar, card shine effects

---

## 13. Ameliorations Possibles (non implementees)

- Admin PIN via variable d'environnement
- Upload d'images dans le panel admin
- Conversion WebP pour les photos
- Mode sombre
- Multi-langue (FR/EN)
- Analytics / compteur de visites
- Payment mobile (Wave, Orange Money)
- Zone de livraison avec calcul de frais
