# Fondinor CMS Premium

Une solution CMS modulaire de pointe, conçue spécifiquement pour le secteur industriel. Alliant une esthétique premium à une flexibilité totale, ce CMS permet de construire des pages web à fort impact via un éditeur visuel "No-Code".

---

## Points Forts

- **Performance Industrielle** : Stack moderne avec FastAPI (Backend) et React + Vite (Frontend).
- **Builder Visuel Premium** : Bibliothèque de blocs "Industriels" (Hero, About, Innovation, Qualité, Laboratoire).
- **No-Code Ready** : Édition en temps réel, gestion des listes avec upload d'images, et configuration globale de la navigation.
- **Optimisation SEO & GEO** : Panneau dédié pour le référencement et l'analyse contextuelle.
- **Gestion de l'Accueil** : Définissez n'importe quelle page comme page d'accueil en un clic droit.
- **Sécurisé** : Authentification JWT et gestion des rôles.

---

## Stack Technique

- **Frontend** : React 18, TypeScript, Tailwind CSS, Lucide Icons, Framer Motion.
- **Backend** : FastAPI, SQLAlchemy (Async), SQLite, Pydantic v2.
- **Infrastructure** : Docker Ready, Redis (Caching optionnel).

---

## Installation & Mise en Place

### 1. Pré-requis
- Node.js (v18+)
- Python (v3.10+)
- Git

### 2. Clonage et Configuration
```bash
git clone <votre-depot>
cd p_000_cms
```

### 3. Backend (FastAPI)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Sur Windows: venv\Scripts\activate
pip install -r requirements.txt
# Créer un fichier .env basé sur le guide
# Lancer le serveur
uvicorn app.main:app --reload
```

### 4. Frontend (React)
```bash
cd frontend
npm install
# Lancer en mode dev
npm run dev
```

---

## Guide d'Utilisation Rapide

1. **Dashboard** : Accédez à la liste de vos pages. Créez-en une nouvelle ou dupliquez une existante.
2. **Builder** :
   - Cliquez sur le bouton **"+"** pour insérer des blocs.
   - Sélectionnez un bloc pour modifier ses propriétés (images, textes, couleurs) à droite.
   - Pour les blocs complexes (Innovation, Qualité), utilisez l'éditeur de liste pour gérer vos items.
3. **Publication** : Cliquez sur "Publier" pour rendre la page accessible via son slug (ex: `/presentation`).
4. **Accueil** : Dans le Dashboard, faites un clic droit sur une page et choisissez **"Home Page"** pour qu'elle devienne la racine (`/`) de votre site.

---

## Déploiement Docker (Optionnel)

Le projet est livré avec une configuration Docker Compose complète :
```bash
docker-compose up --build
```
Cela lancera le frontend, le backend et une instance Redis automatiquement.

---

## Licence
Propriété exclusive de **Fondinor**. Tous droits réservés.

---
*Développé pour l'excellence industrielle.*
