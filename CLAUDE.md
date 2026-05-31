# CANVAS CMS

Headless CMS open-source avec builder visuel drag & drop, produisant un Page Schema JSON consommé via API REST.

**Stack:** React 19 + Vite + TypeScript + Tailwind + Zustand (Frontend) / FastAPI + SQLAlchemy 2.0 + Pydantic (Backend) / PostgreSQL + Redis

## Structure du Projet

```
p_000_cms/
├── backend/                # FastAPI async
│   ├── app/
│   │   ├── main.py         # Entry point, CORS, routers
│   │   ├── api/            # Routers FastAPI (auth, pages, public, articles, projects, components...)
│   │   ├── core/           # Config, database, security, redis
│   │   ├── models/         # SQLAlchemy models (models.py unique)
│   │   ├── schemas/        # Pydantic v2 schemas
│   │   └── services/       # Business logic (block_validator.py)
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/               # React + Vite + TypeScript
│   ├── src/
│   │   ├── App.tsx         # Router (react-router-dom v7)
│   │   ├── main.tsx        # Entry point
│   │   ├── api/client.ts   # Axios + interceptors JWT & X-Project-ID
│   │   ├── contexts/       # ProjectContext (multi-project)
│   │   ├── builder/        # Builder UI + Store
│   │   └── pages/          # Dashboard, Login, Articles, etc.
│   ├── vite.config.ts
│   └── package.json
├── docker-compose.yml      # PostgreSQL + Redis + Backend + Frontend
└── CANVAS_CMS_DESIGN.md    # Document de conception complet (référence)
```

## Démarrage Rapide

**Pré-requis:** Docker & Docker Compose

```bash
# 1. Lancer tous les services
docker-compose up -d

# Le backend est sur http://localhost:8000
# Le frontend est sur http://localhost:5173
```

**Backend (dev local sans Docker):**
```
cd backend
python -m venv venv
source venv/bin/activate  # ou .\venv\Scripts\activate (Windows)
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```
cd frontend
npm install
npm run dev
```

## Architecture Multi-Projet

L'architecture est **multi-tenant par projet.** Chaque requête authentifiée doit inclure un header `X-Project-ID`. Le `ProjectContext` (frontend) et le middleware FastAPI (backend) gèrent ce flux.

- Le backend filtre toutes les données (Pages, Articles, Médias, etc.) par `project_id`.
- Les membres d'un projet sont gérés via le modèle `ProjectMember`.
- Les rôles possibles sont: `owner`, `admin`, `editor`.

## Le Page Schema

Le coeur du système. Un arbre JSON représentant la structure d'une page, stocké dans la colonne `schema` (JSON) de la table `pages`.

**Structure JSON:**
```json
{
  "meta": { "title": "", "lang": "fr", "description": "" },
  "seo": { "metaTitle": "", "metaDescription": "", "ogImage": "", ... },
  "geo": { "aiSummary": "", "aiKeyFacts": [], ... },
  "root": {
    "id": "...",
    "type": "section",
    "props": { ... },
    "children": [ ... ]
  }
}
```

## Block Registry

Les blocs de base sont définis dans `frontend/src/builder/BlockRegistry.ts` et validés côté backend via `block_validator.py`.

Les types de blocs disponibles: `heading`, `text`, `image`, `button`, `section`, `columns`, `header`, `footer`.

## API Backend (endpoints clés)

- `POST /auth/login` - Authentification, retourne JWT token
- `GET/POST /pages` - CRUD pages (requiert `X-Project-ID`)
- `GET /api/pages/:slug` - API publique (non authentifiée, cachée Redis)
- `GET/POST /articles` - CRUD articles
- `GET/POST /projects` - Gestion multi-projets
- `GET /llms.txt` - Contenu GEO pour crawlers IA
- `GET /sitemap.xml` - Sitemap généré dynamiquement

## Frontend Conventions

- **State Management:** Zustand (mono-store dans `builderStore.ts` pour le builder)
- **Routing:** React Router v7 (BrowserRouter)
- **HTTP Client:** Axios avec intercepteurs pour JWT et Header `X-Project-ID`
- **Styling:** Tailwind CSS
- **Icons:** `lucide-react`
- **Drag & Drop:** `@dnd-kit/core`
- **Interdiction:** React Stateful MobX/Redux — le state global est exclusivement Zustand.
- **Lang:** L'interface et le contenu par défaut sont en Français. Les données du CMS (meta, etc.) sont en Français.

## Database & Migrations

- **Engine:** PostgreSQL en production/Docker. Le backend local peut utiliser SQLite (config via `.env`).
- **ORM:** SQLAlchemy 2.0 (async)
- **Migrations:** Actuellement, le backend utilise `Base.metadata.create_all` au startup. Le document de design original mentionnait Alembic mais il n'est pas explicitement utilisé dans `main.py`.

## Models Clés (backend/app/models/models.py)

Tous dans le fichier `models.py`:

- `User` - Utilisateurs (email, password_hash, role)
- `Project` - Projets (name, slug, domain, languages...)
- `Page` - Pages (slug, title, status, is_home, schema JSON)
- `Article` - Articles de blog/news (title, slug, content, status)
- `Media` - Fichiers uploadés (filename, url, mime_type)
- `Component` - Composants globaux réutilisables
- `Collection` / `CollectionItem` - Types de contenu dynamique
- `Form` / `FormSubmission` - Gestion de formulaires
- `Webhook` / `WebhookDelivery` - Intégrations externes
- `PageRevision` / `ComponentRevision` - Historique de versions
- `PreviewLink` - Liens de prévisualisation sécurisés
- `ProjectInvitation` - Invitations collaborateurs

## Instructions pour Claude

- **Multi-projet obligatoire:** Toute nouvelle fonctionnalité backend ou frontend doit respecter l'architecture multi-projet. Penser à filtrer par `project_id` et à inclure/exiger le header `X-Project-ID`.
- **Validation:** Le backend est permissif sur les props des blocs à l'heure actuelle. Le JSON Schema est "soft". Tout changement dans le format du Page Schema doit être compatible avec les anciennes données.
- **Langue:** Les interfaces utilisateur sont en Français. Les commentaires techniques peuvent être en Français ou Anglais.
- **API:** La séparation est strictement API REST JSON. Le backend ne rend pas de HTML. Le frontend ne fait pas de SSR natif de React (hors cas spécifiques).

## Design Doc

Le document de conception complet est le fichier `CANVAS_CMS_DESIGN.md` à la racine du projet. Il définit la vision, le Page Schema, le Scope MVP, les détails techniques et la roadmap.
