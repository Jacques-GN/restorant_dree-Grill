# 🍖 Deen's Grill — Site Web du Restaurant

## 📋 Installation

### 1. Prérequis
- [Node.js](https://nodejs.org/) (version 18 ou plus)
- npm (inclus avec Node.js)

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configurer la base de données
```bash
npx prisma db push
```

### 4. Lancer le site
```bash
npm run dev
```
Le site sera accessible sur `http://localhost:3000`

---

## 🚀 Déploiement sur Vercel

### Méthode avec GitHub
1. Créez un repository sur GitHub
2. Uploadez tous les fichiers du projet (sauf `node_modules/`, `.next/`, `db/`)
3. Connectez le repository à [Vercel](https://vercel.com)
4. Ajoutez la variable d'environnement : `DATABASE_URL` (utilisez un service comme PlanetScale ou supabase pour PostgreSQL en production)
5. Cliquez sur "Deploy"

> ⚠️ Pour Vercel, utilisez PostgreSQL au lieu de SQLite. Changez `prisma/schema.prisma` :
> ```
> datasource db {
>   provider = "postgresql"
>   url      = env("DATABASE_URL")
> }
> ```

---

## 🔧 Configuration

### Numéro WhatsApp
Le numéro est configuré à `+22654000000` (+226 54 00 00 00).
Pour le changer, utilisez Ctrl+H dans VS Code :
- Rechercher : `+22654000000`
- Remplacer par votre nouveau numéro (sans +)

### Code PIN Admin
Le code PIN par défaut est `1234`. Pour le changer :
1. Modifiez `.env` : `ADMIN_PIN=votre_code`
2. Modifiez dans `src/app/page.tsx` : chercher `ADMIN_PIN = '1234'`

---

## 📂 Structure importante

```
src/app/page.tsx       ← Page principale (90% des modifications)
public/                ← Photos (logo, plats, galerie)
prisma/schema.prisma   ← Base de données
.env                   ← Configuration (ne pas partager)
```

### Modifier le Plat du Jour
Dans `page.tsx`, cherchez `platsDuJour` (vers la ligne ~530).
Il y a 7 plats (un par jour de la semaine) :
- Index 0 = Dimanche
- Index 1 = Lundi
- ...
- Index 6 = Samedi

### Modifier la galerie
Cherchez `galleryImages` dans `page.tsx`.
Ajoutez vos photos dans `public/` et ajoutez une ligne.

### Modifier la bande promotionnelle
Cherchez `PROMOTIONAL STRIP` dans `page.tsx`.

---

## 📸 Photos

Toutes les images doivent être placées dans le dossier `public/`.
Noms recommandés : `food-nomduplat.jpeg` ou `gallery-nomduplat.jpeg`

---

## 📱 Fonctionnalités

- ✅ Site responsive (mobile-first)
- ✅ Menu dynamique depuis la base de données
- ✅ Panier + Commande via WhatsApp
- ✅ Réservation via WhatsApp (message pré-rempli)
- ✅ Plat du Jour (rotation automatique)
- ✅ Galerie photos avec lightbox
- ✅ Panneau d'administration (code PIN)
- ✅ PWA (installable sur téléphone)
- ✅ SEO optimisé

---

## 🔒 Sécurité

- ✅ API protégées par code PIN
- ✅ Validation des entrées côté serveur
- ✅ Nettoyage des données (limites de longueur)
- ✅ PIN configurable via variable d'environnement
