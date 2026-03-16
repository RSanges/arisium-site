# Arisium — Site vitrine

> Landing page marketing + portail web de l'application Arisium

Site statique (HTML/CSS/JS vanilla) déployé sur Vercel. Sert de page d'acquisition, de présentation des plans tarifaires et de portail de connexion/inscription pour les utilisateurs web.

---

## Stack

| Couche | Tech |
|--------|------|
| Rendu | HTML5 + CSS3 vanilla (pas de framework) |
| Auth | Fetch natif → Supabase REST API (`/auth/v1/`) |
| Polices | Cinzel (titres) · DM Sans (corps) via Google Fonts |
| Déploiement | Vercel |

---

## Fonctionnalités

### Auth web (sans SDK)
- **Connexion / Inscription** : appels `fetch()` directs sur l'API REST Supabase (`/auth/v1/token?grant_type=password`, `/auth/v1/signup`)
- **Session persistante** : stockage dans `localStorage` au format Supabase v2 (`sb-{project}-auth-token`)
- **Déconnexion** : appel `/auth/v1/logout` + nettoyage localStorage
- **Profil utilisateur** : lecture du `first_name` via `/rest/v1/user_profiles`

> ⚠️ Le SDK `@supabase/supabase-js` a été intentionnellement retiré du site. La version CDN récente provoque un deadlock `navigator.locks` qui bloque indéfiniment la promesse `signInWithPassword`. Toutes les opérations auth utilisent désormais `fetch()` natif.

### Hero interactif
- **Mockup téléphone animé** : simule l'interface de l'app avec les vraies données de l'utilisateur connecté
- **Personnalisation** : affiche le prénom de l'utilisateur connecté (fallback : prénom générique "Thomas")
- **Avatar** : initiale du prénom dans le header du mockup

### Sections
- Hero avec CTA vers l'app
- Fonctionnalités clés (nutrition IA, workout, progression)
- Plans tarifaires (Starter · Pro · Elite)
- FAQ
- Footer

---

## Structure

```
arisium_site/
├── index.html       # Page unique (SPA-like avec sections)
├── style.css        # Styles globaux (dark theme, palette or/noir)
├── auth.js          # Logique auth (fetch natif, session, mockup update)
└── README.md
```

---

## Variables d'environnement

Les clés Supabase sont actuellement **hardcodées** dans `auth.js` (URL publique + anon key). Ce sont des clés publiques, RLS Supabase protège les données. Pour une meilleure pratique, elles pourraient être injectées via Vercel Environment Variables.

---

## Design

- **Palette** : noir `#000` · or `#C9A96E` · blanc `#fff` · surfaces `#0a0a0a` / `#111`
- **Typographie** : Cinzel (400/600/700) pour les titres, DM Sans pour le corps
- **Thème** : dark mode exclusif

---

## Déploiement

Connecté à GitHub → déploiement automatique Vercel sur push `main`.

```bash
# Dev local (pas de serveur requis, ouvrir directement)
open index.html

# Ou avec un serveur local
npx serve .
```

---

## Fixes notables

| Problème | Cause | Solution |
|----------|-------|----------|
| Login bloqué à l'infini | `navigator.locks` deadlock dans supabase-js CDN | Suppression du SDK, fetch natif |
| Police 300 absente | Cinzel minimum weight = 400 | Toutes les occurrences `font-weight: 300` → `400` |
| Déconnexion silencieuse | SDK absent, handler non branché | Handler fetch natif sur bouton logout |
