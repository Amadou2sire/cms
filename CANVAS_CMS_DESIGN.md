# CANVAS CMS — Design Document
> Open-source Headless CMS avec Visual Builder Drag & Drop  
> Stack : React + Vite + TypeScript · FastAPI · PostgreSQL · Redis  
> Version : MVP Vertical v1.1 — SEO & GEO (Generative Engine Optimization)  
> Date : 2026-04-18

---

## 1. Vision Produit

**CANVAS** (*Content Architecture Node for Visual & API-driven Sites*) est un CMS headless open-source doté d'un builder visuel drag & drop.

**Philosophie du noyau :**  
Le builder produit un **Page Schema** (arbre JSON normalisé). L'API REST le sert. Le frontend consommateur en fait ce qu'il veut. Le CMS ne sait pas comment tu vas rendre — c'est sa force.

**Ce que CANVAS n'est PAS :**
- Il ne génère pas de HTML/CSS statique
- Il ne rend pas les pages lui-même
- Il n'impose pas de framework au consommateur

---

## 2. Architecture Macro

```
┌─────────────────────────────────────────────────────┐
│                   CANVAS CMS                        │
│                                                     │
│  ┌──────────────┐    ┌──────────────────────────┐  │
│  │  Builder UI  │    │      Admin Dashboard     │  │
│  │  (React DnD) │    │  (Pages, Types, Media)   │  │
│  └──────┬───────┘    └────────────┬─────────────┘  │
│         │                        │                  │
│         └──────────┬─────────────┘                  │
│                    ▼                                 │
│         ┌──────────────────┐                        │
│         │   FastAPI Core   │                        │
│         │  REST + WebSocket│                        │
│         └────────┬─────────┘                        │
│                  │                                   │
│         ┌────────▼─────────┐                        │
│         │   PostgreSQL     │                        │
│         │  + Redis Cache   │                        │
│         └──────────────────┘                        │
└─────────────────────────────────────────────────────┘
          │
          ▼  API publique
┌─────────────────────┐
│  Frontend Consumer  │
│  (Next.js, Nuxt,    │
│   mobile, etc.)     │
└─────────────────────┘
```

---

## 3. Le Page Schema — Noyau du Projet

C'est la pièce centrale. Tout le builder construit et manipule ce JSON.  
C'est aussi ce que l'API publique retourne au frontend consommateur.

```json
{
  "id": "page_abc123",
  "slug": "home",

  "meta": {
    "title": "Accueil",
    "lang": "fr",
    "description": "Page d'accueil du site"
  },

  "seo": {
    "metaTitle": "Accueil — Mon Site",
    "metaDescription": "Découvrez notre offre complète sur mon-site.com",
    "metaKeywords": ["cms", "headless", "builder"],
    "canonical": "https://mon-site.com/",
    "noIndex": false,
    "noFollow": false,
    "ogTitle": "Accueil — Mon Site",
    "ogDescription": "Découvrez notre offre complète",
    "ogImage": "media://og_home",
    "ogType": "website",
    "twitterCard": "summary_large_image",
    "twitterSite": "@monsite",
    "structuredData": {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Accueil",
      "url": "https://mon-site.com/"
    }
  },

  "geo": {
    "_comment": "GEO = Generative Engine Optimization — visibilité dans les moteurs IA (ChatGPT, Perplexity, Gemini, Claude)",
    "enabled": true,

    "aiSummary": "CANVAS est un CMS headless open-source avec builder visuel drag & drop. Il produit un Page Schema JSON consommé par n'importe quel frontend. Idéal pour les équipes qui veulent découpler contenu et présentation.",
    "aiContext": "Outil de création de contenu web. Catégorie : CMS headless. Public cible : développeurs et équipes produit. Alternative open-source à Contentful, Sanity, Strapi avec builder visuel intégré.",
    "aiKeyFacts": [
      "CMS headless — le contenu est livré en JSON pur",
      "Builder drag & drop inspiré d'Elementor",
      "Stack React + FastAPI + PostgreSQL",
      "Open-source, self-hostable",
      "API publique RESTful sans authentification"
    ],
    "aiTone": "factuel",
    "aiAudience": ["développeurs web", "équipes produit", "agences digitales"],

    "llmsTxt": {
      "enabled": true,
      "path": "/llms.txt",
      "content": "# CANVAS CMS\n\nCANVAS est un CMS headless open-source avec builder visuel.\n\n## Fonctionnement\n- Le builder produit un Page Schema JSON\n- L'API REST sert ce schema sans transformation\n- Le frontend consumer rend selon sa propre logique\n\n## API\n- GET /api/pages/:slug — retourne le schema complet d'une page\n- GET /sitemap.xml — liste toutes les pages publiées\n\n## Stack\n- Backend : FastAPI (Python)\n- Frontend : React + TypeScript\n- DB : PostgreSQL avec colonnes JSONB"
    },

    "citationSignals": {
      "authorName": "CANVAS CMS Team",
      "authorUrl": "https://mon-site.com/about",
      "publishDate": "2026-04-18",
      "updateDate": "2026-04-18",
      "contentType": "documentation",
      "expertiseLevel": "technical",
      "sources": []
    },

    "entityDefinition": {
      "name": "CANVAS CMS",
      "type": "SoftwareApplication",
      "category": "Headless CMS",
      "description": "CMS headless open-source avec builder visuel drag & drop produisant un Page Schema JSON",
      "sameAs": [],
      "features": [
        "Visual drag & drop builder",
        "Page Schema JSON normalisé",
        "API REST publique",
        "Block Registry extensible",
        "SEO & GEO intégrés"
      ]
    },

    "contentClarity": {
      "readabilityScore": null,
      "avgSentenceLength": null,
      "jargonLevel": "medium",
      "definitionsProvided": true,
      "faqEnabled": false,
      "faqItems": []
    }
  },

  "root": {
    "id": "block_001",
    "type": "section",
    "props": {
      "bg": "#ffffff",
      "padding": "64px",
      "maxWidth": "1200px"
    },
    "children": [
      {
        "id": "block_002",
        "type": "heading",
        "props": {
          "text": "Bienvenue sur CANVAS",
          "level": 1,
          "color": "#111111",
          "align": "left"
        },
        "children": []
      },
      {
        "id": "block_003",
        "type": "image",
        "props": {
          "src": "media://img_xyz",
          "alt": "Image hero",
          "width": "100%"
        },
        "children": []
      }
    ]
  }
}
```

**Règles fondamentales du schema :**
- Chaque bloc a un `type`, des `props` typées, et un tableau `children`
- L'arbre est infini — un bloc peut contenir n'importe quel autre bloc
- Les `props` de chaque type sont validées côté API via JSON Schema
- Le consumer reçoit ce JSON et rend selon sa propre logique
- Le bloc `seo` est indépendant du contenu — le consumer l'injecte dans `<head>`
- Le bloc `geo` (GEO = Generative Engine Optimization) expose les signaux nécessaires pour que les moteurs IA (ChatGPT, Perplexity, Gemini, Claude) comprennent, citent et recommandent le contenu correctement
- Le fichier `/llms.txt` est généré automatiquement depuis `geo.llmsTxt` — il est la carte d'identité du site pour les LLMs

---

## 4. Scope MVP Vertical

Le MVP couvre **un slice complet de bout en bout** :  
créer une page → la builder visuellement → la publier → la consommer via API.

### 4.1 Modules MVP (tous P0)

| Module | Responsabilité |
|---|---|
| **Auth** | Login JWT, rôles `admin` / `editor` |
| **Page Manager** | CRUD pages, slugs, statuts `draft` / `published` |
| **Block Registry** | Catalogue de 6 blocs typés avec props validées |
| **Visual Builder** | Canvas drag & drop → produit le Page Schema JSON |
| **SEO Manager** | Panneau SEO dans le builder : meta, OG, structured data, canonical |
| **GEO Manager** | Panneau GEO dans le builder : aiSummary, aiKeyFacts, entityDefinition, llms.txt, citationSignals |
| **Public API** | `GET /api/pages/:slug` → retourne le Page Schema complet (seo + geo inclus) |
| **Endpoints IA** | `GET /llms.txt`, `GET /llms-full.txt`, `GET /sitemap.xml`, `GET /robots.txt` |

### 4.2 Block Registry MVP — Les 6 blocs de base

| Type | Props disponibles |
|---|---|
| `heading` | `text`, `level` (h1–h6), `color`, `align` |
| `text` | `content` (rich text), `color`, `fontSize`, `align` |
| `image` | `src`, `alt`, `width`, `borderRadius` |
| `button` | `label`, `href`, `variant` (primary/secondary), `color`, `bg` |
| `section` | `bg`, `padding`, `maxWidth`, `direction` (column/row) |
| `columns` | `count` (2/3/4), `gap`, `children[]` par colonne |

### 4.3 Hors MVP — V2+

- Content types custom (champs dynamiques)
- Media library avancée
- Multilingue (i18n des schemas)
- Webhooks & events
- Plugin / block system externe
- Versioning de pages
- Preview URL pour frontend consumer

---

## 5. Structure du Projet

```
canvas-cms/
│
├── backend/                          # FastAPI
│   ├── app/
│   │   ├── main.py                   # Entry point, CORS, routers
│   │   ├── api/
│   │   │   ├── auth.py               # POST /auth/login, /auth/refresh
│   │   │   ├── pages.py              # CRUD /pages + /pages/:slug/publish
│   │   │   ├── blocks.py             # GET /blocks (registry)
│   │   │   ├── seo.py                # PATCH /pages/:id/seo
│   │   │   ├── geo.py                # PATCH /pages/:id/geo + GET /llms.txt + GET /llms-full.txt
│   │   │   └── public.py             # GET /api/pages/:slug, /sitemap.xml, /robots.txt
│   │   ├── core/
│   │   │   ├── config.py             # Settings (env vars)
│   │   │   ├── database.py           # SQLAlchemy async engine
│   │   │   ├── security.py           # JWT, bcrypt
│   │   │   └── redis.py              # Redis client
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── page.py               # schema: JSONB column
│   │   │   └── media.py
│   │   ├── schemas/                  # Pydantic v2
│   │   │   ├── user.py
│   │   │   ├── page.py
│   │   │   ├── seo.py                # SeoSchema, OgSchema, StructuredDataSchema
│   │   │   ├── geo.py                # GeoSchema, LlmsTxtSchema, CitationSignalsSchema, EntityDefinitionSchema
│   │   │   └── block.py              # PageSchema, BlockNode typés
│   │   └── services/
│   │       ├── page_service.py       # Business logic pages
│   │       ├── seo_service.py        # Génération sitemap, robots.txt, validation canonical
│   │       ├── geo_service.py        # Génération llms.txt, llms-full.txt, signaux GEO par page
│   │       └── block_validator.py    # Validation JSON Schema des props
│   ├── alembic/                      # Migrations DB
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/                         # React + Vite + TypeScript
│   ├── src/
│   │   ├── builder/                  # ← Cœur du projet
│   │   │   ├── Canvas.tsx            # Zone de drop principale
│   │   │   ├── BlockRenderer.tsx     # Rendu live React des blocs
│   │   │   ├── BlockPanel.tsx        # Panneau gauche — catalogue de blocs
│   │   │   ├── PropsPanel.tsx        # Panneau droit — édition des props
│   │   │   ├── SeoPanel.tsx          # Onglet SEO : meta, OG, structured data, canonical
│   │   │   ├── GeoPanel.tsx          # Onglet GEO : aiSummary, aiKeyFacts, llms.txt, citationSignals
│   │   │   ├── DragLayer.tsx         # Ghost visuel pendant le drag
│   │   │   ├── BlockRegistry.ts      # Définitions des 6 types de blocs
│   │   │   └── store/
│   │   │       ├── builderStore.ts   # Zustand — état complet du builder (arbre de blocs)
│   │   │       ├── seoStore.ts       # Zustand — état SEO de la page courante
│   │   │       └── geoStore.ts       # Zustand — état GEO (aiSummary, llmsTxt, entityDefinition…)
│   │   ├── pages/                    # Vues React Router
│   │   │   ├── LoginPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── PagesListPage.tsx
│   │   │   └── BuilderPage.tsx       # Intègre le builder complet
│   │   ├── api/
│   │   │   └── client.ts             # Axios instance + interceptors JWT
│   │   ├── components/               # UI partagés (Button, Modal, etc.)
│   │   └── main.tsx
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── package.json
│
├── docker-compose.yml                # PostgreSQL + Redis + backend + frontend
├── .env.example
└── README.md
```

---

## 6. Décisions Techniques

| Décision | Choix | Raison |
|---|---|---|
| **DnD engine** | `@dnd-kit/core` | Supporte les arbres imbriqués, plus moderne que react-beautiful-dnd |
| **State builder** | Zustand | Simple, sans boilerplate, parfait pour un arbre mutable profond |
| **ORM** | SQLAlchemy 2.0 async | Natif FastAPI, migrations Alembic, support JSONB PostgreSQL |
| **Auth** | JWT + bcrypt | Stateless, pas de dépendance externe, simple à implémenter |
| **DB principale** | PostgreSQL | Colonne JSONB native — le Page Schema est reqüêtable et indexable |
| **Cache API publique** | Redis | Cache des pages publiées, TTL configurable |
| **Validation blocs** | JSON Schema (`jsonschema` Python) | Chaque type de bloc a un schéma de props strict |
| **Preview builder** | Rendu live React | Les blocs sont rendus visuellement dans le canvas, pas en wireframe |
| **SEO storage** | JSONB dans `pages.schema['seo']` | Co-localisé avec le schema, pas de table séparée |
| **GEO storage** | JSONB dans `pages.schema['geo']` | Même logique — le payload GEO voyage avec la page dans le schema |
| **llms.txt global** | Généré dynamiquement FastAPI | Agrège `geo.llmsTxt` de toutes les pages publiées en un fichier unique |
| **llms-full.txt** | Version enrichie avec `aiSummary` + `aiKeyFacts` par page | Pour les crawlers IA qui ont besoin du contexte complet |
| **Sitemap** | Généré dynamiquement FastAPI | `GET /sitemap.xml` inclut toutes les pages publiées |
| **Structured Data** | JSON-LD dans `seo.structuredData` | Le consumer injecte `<script type="application/ld+json">` dans `<head>` |

---

## 7. Architecture du Builder

### 7.1 Layout des 3 zones

```
┌─────────────┬──────────────────────────────┬─────────────────┐
│  BLOCK      │         CANVAS               │   PROPS         │
│  PANEL      │      (zone de drop)          │   PANEL         │
│  (240px)    │       (flex 1)               │   (280px)       │
│             │                              │                 │
│ ┌─────────┐ │  ┌──────────────────────┐   │  Selected:      │
│ │ Heading │ │  │  Section             │   │  Heading        │
│ └─────────┘ │  │  ┌────────────────┐  │   │  ─────────────  │
│ ┌─────────┐ │  │  │  Heading ←sel  │  │   │  Text:          │
│ │  Text   │ │  │  └────────────────┘  │   │  [Bienvenue___] │
│ └─────────┘ │  │  ┌────────────────┐  │   │                 │
│ ┌─────────┐ │  │  │  Image         │  │   │  Level: [H1 ▼]  │
│ │  Image  │ │  │  └────────────────┘  │   │                 │
│ └─────────┘ │  └──────────────────────┘   │  Color: [■ ---] │
│ ┌─────────┐ │                              │                 │
│ │ Section │ │  [+ Drop a block here]       │  Align: [← ▼]  │
│ └─────────┘ │                              │                 │
└─────────────┴──────────────────────────────┴─────────────────┘
```

### 7.2 Zustand Store — Interface TypeScript

```typescript
// builderStore.ts

interface BlockNode {
  id: string
  type: 'heading' | 'text' | 'image' | 'button' | 'section' | 'columns'
  props: Record<string, unknown>
  children: BlockNode[]
}

interface PageSchema {
  id: string
  slug: string
  meta: { title: string; lang: string; description: string }
  root: BlockNode
}

interface BuilderStore {
  // State
  schema: PageSchema
  selectedId: string | null
  history: PageSchema[]         // pour undo/redo
  historyIndex: number
  isDirty: boolean              // changements non sauvegardés

  // Sélection
  selectBlock: (id: string | null) => void
  getSelectedBlock: () => BlockNode | null

  // Mutations de l'arbre
  addBlock: (parentId: string, blockType: string, position: number) => void
  moveBlock: (blockId: string, targetParentId: string, position: number) => void
  updateProps: (blockId: string, props: Record<string, unknown>) => void
  deleteBlock: (blockId: string) => void
  duplicateBlock: (blockId: string) => void

  // Historique
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean

  // Persistance
  loadSchema: (schema: PageSchema) => void
  getSchema: () => PageSchema
  markSaved: () => void
}
```

### 7.3 Block Registry — Définition TypeScript

```typescript
// BlockRegistry.ts

interface PropDefinition {
  type: 'string' | 'number' | 'color' | 'select' | 'richtext' | 'media'
  label: string
  default: unknown
  options?: string[]           // pour type 'select'
}

interface BlockDefinition {
  type: string
  label: string
  icon: string                 // nom icône Lucide
  defaultProps: Record<string, unknown>
  propSchema: Record<string, PropDefinition>
  canHaveChildren: boolean
}

export const BLOCK_REGISTRY: Record<string, BlockDefinition> = {
  heading: {
    type: 'heading',
    label: 'Titre',
    icon: 'Heading',
    canHaveChildren: false,
    defaultProps: { text: 'Nouveau titre', level: 1, color: '#111111', align: 'left' },
    propSchema: {
      text:  { type: 'string', label: 'Texte', default: 'Nouveau titre' },
      level: { type: 'select', label: 'Niveau', default: 1, options: ['1','2','3','4','5','6'] },
      color: { type: 'color',  label: 'Couleur', default: '#111111' },
      align: { type: 'select', label: 'Alignement', default: 'left', options: ['left','center','right'] },
    }
  },
  text: {
    type: 'text',
    label: 'Texte',
    icon: 'AlignLeft',
    canHaveChildren: false,
    defaultProps: { content: 'Votre texte ici...', color: '#333333', fontSize: '16px', align: 'left' },
    propSchema: {
      content:  { type: 'richtext', label: 'Contenu', default: '' },
      color:    { type: 'color',    label: 'Couleur', default: '#333333' },
      fontSize: { type: 'select',   label: 'Taille', default: '16px', options: ['14px','16px','18px','20px','24px'] },
      align:    { type: 'select',   label: 'Alignement', default: 'left', options: ['left','center','right','justify'] },
    }
  },
  image: {
    type: 'image',
    label: 'Image',
    icon: 'Image',
    canHaveChildren: false,
    defaultProps: { src: '', alt: '', width: '100%', borderRadius: '0px' },
    propSchema: {
      src:          { type: 'media',  label: 'Source', default: '' },
      alt:          { type: 'string', label: 'Alt text', default: '' },
      width:        { type: 'select', label: 'Largeur', default: '100%', options: ['25%','50%','75%','100%'] },
      borderRadius: { type: 'select', label: 'Arrondi', default: '0px', options: ['0px','4px','8px','16px','50%'] },
    }
  },
  button: {
    type: 'button',
    label: 'Bouton',
    icon: 'MousePointerClick',
    canHaveChildren: false,
    defaultProps: { label: 'Cliquer ici', href: '#', variant: 'primary', color: '#ffffff', bg: '#0070f3' },
    propSchema: {
      label:   { type: 'string', label: 'Texte', default: 'Cliquer ici' },
      href:    { type: 'string', label: 'Lien', default: '#' },
      variant: { type: 'select', label: 'Style', default: 'primary', options: ['primary','secondary','ghost'] },
      color:   { type: 'color',  label: 'Couleur texte', default: '#ffffff' },
      bg:      { type: 'color',  label: 'Fond', default: '#0070f3' },
    }
  },
  section: {
    type: 'section',
    label: 'Section',
    icon: 'Square',
    canHaveChildren: true,
    defaultProps: { bg: '#ffffff', padding: '48px', maxWidth: '1200px', direction: 'column' },
    propSchema: {
      bg:        { type: 'color',  label: 'Fond', default: '#ffffff' },
      padding:   { type: 'select', label: 'Padding', default: '48px', options: ['0px','16px','32px','48px','64px','96px'] },
      maxWidth:  { type: 'select', label: 'Largeur max', default: '1200px', options: ['640px','768px','1024px','1200px','1440px','100%'] },
      direction: { type: 'select', label: 'Direction', default: 'column', options: ['column','row'] },
    }
  },
  columns: {
    type: 'columns',
    label: 'Colonnes',
    icon: 'Columns',
    canHaveChildren: true,
    defaultProps: { count: 2, gap: '24px' },
    propSchema: {
      count: { type: 'select', label: 'Nombre de colonnes', default: 2, options: ['2','3','4'] },
      gap:   { type: 'select', label: 'Espacement', default: '24px', options: ['8px','16px','24px','32px','48px'] },
    }
  }
}
```

---

## 8. GEO — Generative Engine Optimization

> **GEO ≠ SEO.** Le SEO optimise pour les moteurs de recherche (Google, Bing). Le GEO optimise pour les moteurs IA — ChatGPT, Perplexity, Gemini, Claude — qui synthétisent et citent du contenu directement dans leurs réponses.

### 8.1 Philosophie GEO dans CANVAS

Les LLMs crawlent le web et construisent des représentations sémantiques du contenu. Pour qu'un site soit **cité, recommandé ou résumé** par un moteur IA, il doit exposer :
- Un résumé lisible par machine (`aiSummary`)
- Des faits clés structurés (`aiKeyFacts`)
- Une identité d'entité claire (`entityDefinition`)
- Un fichier `/llms.txt` — convention émergente (standard proposé par Anthropic/community)
- Des signaux de crédibilité et de fraîcheur (`citationSignals`)

### 8.2 Structure du bloc `geo` dans le Page Schema

```typescript
interface GeoSchema {
  enabled: boolean

  // Résumé court destiné aux LLMs qui lisent la page
  aiSummary: string                  // Max 300 chars, formulé comme une réponse directe

  // Contexte sémantique de la page
  aiContext: string                  // Catégorie, positionnement, cas d'usage

  // Faits clés structurés — idéaux pour les réponses bullet-point des LLMs
  aiKeyFacts: string[]               // Max 8 items, formulations courtes et affirmatives

  // Ton souhaité pour les citations IA
  aiTone: 'factuel' | 'promotionnel' | 'éducatif' | 'technique'

  // Public cible — aide les LLMs à contextualiser les recommandations
  aiAudience: string[]

  // Fichier llms.txt de la page (texte brut Markdown)
  llmsTxt: {
    enabled: boolean
    path: string                     // ex: /llms.txt ou /pages/about/llms.txt
    content: string                  // Markdown brut — lu directement par les crawlers IA
  }

  // Signaux de crédibilité pour les LLMs qui évaluent la fiabilité
  citationSignals: {
    authorName: string
    authorUrl: string
    publishDate: string              // ISO 8601
    updateDate: string
    contentType: 'documentation' | 'article' | 'product' | 'landing' | 'faq'
    expertiseLevel: 'beginner' | 'intermediate' | 'technical' | 'expert'
    sources: { title: string; url: string }[]
  }

  // Définition de l'entité principale de la page — pour le Knowledge Graph IA
  entityDefinition: {
    name: string
    type: string                     // ex: "SoftwareApplication", "Organization", "Article"
    category: string
    description: string
    sameAs: string[]                 // URLs Wikipedia, Wikidata, etc.
    features: string[]
  }

  // FAQ structurée — les LLMs aiment les paires Q/R pour extraire des réponses directes
  contentClarity: {
    faqEnabled: boolean
    faqItems: { question: string; answer: string }[]
  }
}
```

### 8.3 Endpoints GEO

```
# Fichiers consommés par les crawlers IA (non authentifiés)
GET  /llms.txt              → Résumé global du site en Markdown (agrège toutes les pages)
GET  /llms-full.txt         → Version enrichie : aiSummary + aiKeyFacts par page publiée

# Gestion GEO par page (authentifié)
PATCH /pages/:id/geo        → Met à jour le bloc geo d'une page
GET   /pages/:id/geo        → Retourne uniquement le bloc geo d'une page
```

### 8.4 Format `/llms.txt` généré automatiquement

```markdown
# Mon Site — CANVAS CMS

> CMS headless open-source avec builder visuel drag & drop.
> Catégorie : Outil de développement web. Public : développeurs, agences.

## Pages disponibles

### Accueil
CANVAS est un CMS headless open-source avec builder visuel.
- CMS headless — le contenu est livré en JSON pur
- Builder drag & drop inspiré d'Elementor
- Stack React + FastAPI + PostgreSQL
- Open-source, self-hostable

### À propos
[...]

## API
- GET /api/pages/:slug — retourne le schema JSON complet d'une page publiée
- GET /sitemap.xml — liste de toutes les pages publiées

## Contact & Sources
- Site : https://mon-site.com
- Auteur : CANVAS CMS Team
- Mis à jour : 2026-04-18
```

### 8.5 Panneau GEO dans le Builder (`GeoPanel.tsx`)

```
┌─────────────────────────────────────────────────────────┐
│  ONGLET GEO — Generative Engine Optimization            │
├─────────────────────────────────────────────────────────┤
│  ✅ GEO activé pour cette page                          │
│                                                         │
│  Résumé IA (aiSummary)                                  │
│  ┌───────────────────────────────────────────────────┐  │
│  │ CANVAS est un CMS headless open-source avec...    │  │
│  └───────────────────────────────────────────────────┘  │
│  [243 / 300 caractères]                                 │
│                                                         │
│  Faits clés (aiKeyFacts)                                │
│  ● CMS headless — contenu livré en JSON pur      [×]   │
│  ● Builder drag & drop inspiré d'Elementor       [×]   │
│  ● Open-source, self-hostable                    [×]   │
│  [+ Ajouter un fait]                                    │
│                                                         │
│  Ton IA : [factuel ▼]    Audience : [dev, agences]     │
│                                                         │
│  Type de contenu : [documentation ▼]                    │
│  Niveau d'expertise : [technique ▼]                     │
│  Auteur : [CANVAS CMS Team_____]                        │
│                                                         │
│  Entité principale                                      │
│  Nom : [CANVAS CMS]   Type : [SoftwareApplication ▼]   │
│                                                         │
│  FAQ IA                                                 │
│  ☐ Activer les FAQ pour cette page                     │
│                                                         │
│  /llms.txt — Prévisualisation                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │ # Mon Site                                        │  │
│  │ > CMS headless open-source...                     │  │
│  └───────────────────────────────────────────────────┘  │
│  [Copier] [Voir /llms.txt]                              │
└─────────────────────────────────────────────────────────┘
```

### 8.6 Score GEO — Indicateur de qualité

Le builder calcule un score GEO en temps réel (0–100) pour guider l'éditeur :

| Signal | Points | Condition |
|---|---|---|
| `aiSummary` renseigné | +20 | Non vide, ≥ 50 chars |
| `aiKeyFacts` ≥ 3 items | +15 | Au moins 3 faits |
| `entityDefinition` complète | +15 | name + type + description |
| `citationSignals.authorName` | +10 | Non vide |
| `citationSignals.publishDate` | +10 | Date ISO valide |
| `llmsTxt.enabled` | +15 | Activé |
| `contentClarity.faqEnabled` + ≥ 1 item | +10 | FAQ présente |
| `aiAudience` ≥ 1 item | +5 | Audience définie |

**Score ≥ 80** → badge vert "IA-Ready"  
**Score 50–79** → badge orange "À améliorer"  
**Score < 50** → badge rouge "Non optimisé"

---

### Auth
```
POST   /auth/login              → { access_token, refresh_token }
POST   /auth/refresh            → { access_token }
```

### Pages (authentifié)
```
GET    /pages                   → Liste des pages (id, slug, title, status, updated_at)
POST   /pages                   → Créer une page vide
GET    /pages/:id               → Page complète avec schema (seo + geo + root)
PUT    /pages/:id               → Sauvegarder le schema complet
PATCH  /pages/:id/publish       → Publier (status: draft → published)
PATCH  /pages/:id/unpublish     → Dépublier
DELETE /pages/:id               → Supprimer
PATCH  /pages/:id/seo           → Mettre à jour le bloc SEO seul
PATCH  /pages/:id/geo           → Mettre à jour le bloc GEO seul
```

### Blocks Registry (authentifié)
```
GET    /blocks                  → Retourne BLOCK_REGISTRY
```

### API Publique — Contenu (non authentifiée, cachée Redis)
```
GET    /api/pages/:slug         → Page Schema complet (seo + geo + root)
GET    /api/pages               → Liste des slugs publiés
GET    /sitemap.xml             → Sitemap généré dynamiquement
GET    /robots.txt              → Robots.txt configurable via admin
```

### API Publique — GEO / Crawlers IA (non authentifiée)
```
GET    /llms.txt                → Résumé Markdown global du site (toutes pages publiées)
GET    /llms-full.txt           → Version enrichie : aiSummary + aiKeyFacts par page
```

### Réponse type `GET /api/pages/:slug`
```json
{
  "id": "page_abc123",
  "slug": "home",
  "meta":  { "title": "Accueil", "lang": "fr", "description": "..." },
  "seo":   { "metaTitle": "...", "ogImage": "...", "structuredData": { ... } },
  "geo":   { "aiSummary": "...", "aiKeyFacts": [...], "llmsTxt": { ... } },
  "root":  { ...BlockTree... },
  "updatedAt": "2026-04-18T10:30:00Z"
}
```

---

## 10. Schéma Base de Données

```sql
-- Users
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(50) NOT NULL DEFAULT 'editor',  -- 'admin' | 'editor'
  created_at    TIMESTAMP DEFAULT NOW()
);

-- Pages — schema JSONB contient root + seo + geo
CREATE TABLE pages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        VARCHAR(255) UNIQUE NOT NULL,
  title       VARCHAR(255) NOT NULL,
  status      VARCHAR(50) NOT NULL DEFAULT 'draft',   -- 'draft' | 'published'
  schema      JSONB NOT NULL DEFAULT '{}',            -- { meta, seo, geo, root }
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

-- Index standard
CREATE INDEX idx_pages_slug   ON pages(slug);
CREATE INDEX idx_pages_status ON pages(status);

-- Index GIN sur le schema JSONB entier (requêtes sur seo, geo, root)
CREATE INDEX idx_pages_schema ON pages USING gin(schema);

-- Index spécifique GEO — requêtes rapides sur geo.enabled
CREATE INDEX idx_pages_geo_enabled ON pages ((schema->'geo'->>'enabled'));

-- Media
CREATE TABLE media (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename    VARCHAR(255) NOT NULL,
  url         VARCHAR(500) NOT NULL,
  mime_type   VARCHAR(100),
  size        INTEGER,
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMP DEFAULT NOW()
);
```

---

## 11. Docker Compose

```yaml
# docker-compose.yml
version: '3.9'

services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: canvas_cms
      POSTGRES_USER: canvas
      POSTGRES_PASSWORD: canvas_secret
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql+asyncpg://canvas:canvas_secret@db:5432/canvas_cms
      REDIS_URL: redis://redis:6379
      SECRET_KEY: your_secret_key_here
      ALGORITHM: HS256
      ACCESS_TOKEN_EXPIRE_MINUTES: 60
    ports:
      - "8000:8000"
    depends_on:
      - db
      - redis

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    environment:
      VITE_API_URL: http://localhost:8000
    depends_on:
      - backend

volumes:
  postgres_data:
```

---

## 12. Ordre d'Implémentation — MVP Vertical

### Phase 1 — Backend Foundation (Jour 1–2)
- [ ] Setup FastAPI + SQLAlchemy async + Alembic
- [ ] Modèles `User`, `Page`, `Media`
- [ ] Auth JWT : `POST /auth/login`, middleware bearer
- [ ] CRUD Pages : `GET /pages`, `POST /pages`, `GET /pages/:id`, `PUT /pages/:id`
- [ ] Endpoint publish/unpublish
- [ ] `GET /api/pages/:slug` (public, cache Redis TTL 60s)
- [ ] `GET /blocks` (retourne le registry Python)
- [ ] `PATCH /pages/:id/seo` et `PATCH /pages/:id/geo`
- [ ] `GET /llms.txt` et `GET /llms-full.txt` (générés depuis `geo.llmsTxt` de chaque page)
- [ ] `GET /sitemap.xml` et `GET /robots.txt`

### Phase 2 — Builder Store (Jour 3)
- [ ] Setup React + Vite + TypeScript + Tailwind
- [ ] Zustand `builderStore.ts` — arbre de blocs complet
- [ ] Zustand `seoStore.ts` — état SEO de la page courante
- [ ] Zustand `geoStore.ts` — état GEO (aiSummary, aiKeyFacts, llmsTxt, citationSignals)
- [ ] Fonctions `addBlock`, `moveBlock`, `updateProps`, `deleteBlock`
- [ ] Historique undo/redo (stack de 50 états)
- [ ] `BlockRegistry.ts` complet avec les 6 types

### Phase 3 — Builder UI (Jour 4–5)
- [ ] Layout 3 colonnes (BlockPanel | Canvas | PropsPanel+SEO+GEO)
- [ ] `BlockRenderer.tsx` — rendu live React de chaque type de bloc
- [ ] `BlockPanel.tsx` — liste draggable des blocs disponibles
- [ ] `Canvas.tsx` — zone de drop avec `@dnd-kit/core`
- [ ] `DragLayer.tsx` — ghost visuel pendant le drag
- [ ] `PropsPanel.tsx` — formulaire dynamique selon `propSchema`
- [ ] `SeoPanel.tsx` — onglet SEO : metaTitle, metaDescription, OG, canonical, structured data
- [ ] `GeoPanel.tsx` — onglet GEO : aiSummary, aiKeyFacts, tone, audience, citationSignals, FAQ, score GEO live, prévisualisation llms.txt
- [ ] Score GEO calculé en temps réel (0–100, badge IA-Ready)
- [ ] Indicateurs visuels de drop (over/active)
- [ ] Sélection de bloc au clic

### Phase 4 — Intégration & Polish (Jour 6)
- [ ] `BuilderPage.tsx` — intègre builderStore + seoStore + geoStore + API (load/save)
- [ ] Auto-save toutes les 30s si `isDirty`
- [ ] Bouton Publier → `PATCH /pages/:id/publish`
- [ ] Dashboard pages (liste, créer, supprimer, badge SEO/GEO score)
- [ ] Login page + stockage token
- [ ] Docker Compose fonctionnel end-to-end

---

## 13. Variables d'Environnement

```bash
# backend/.env.example
DATABASE_URL=postgresql+asyncpg://canvas:canvas_secret@localhost:5432/canvas_cms
REDIS_URL=redis://localhost:6379
SECRET_KEY=changeme_in_production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
CORS_ORIGINS=http://localhost:5173

# frontend/.env.example
VITE_API_URL=http://localhost:8000
```

---

## 14. Dépendances

### Backend (`requirements.txt`)
```
fastapi==0.115.0
uvicorn[standard]==0.30.0
sqlalchemy[asyncio]==2.0.30
asyncpg==0.29.0
alembic==1.13.0
pydantic[email]==2.7.0
pydantic-settings==2.3.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
redis==5.0.4
jsonschema==4.22.0
python-multipart==0.0.9
```

### Frontend (`package.json` — dependencies clés)
```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.23.0",
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "zustand": "^4.5.0",
    "axios": "^1.7.0",
    "lucide-react": "^0.383.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.4.0"
  }
}
```

---

*Document généré pour l'IDE Antigravity — CANVAS CMS MVP v1.1 (SEO + GEO)*
