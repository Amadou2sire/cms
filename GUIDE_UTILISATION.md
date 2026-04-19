# 🚀 Guide d'Utilisation et d'Hébergement du CMS

Ce guide vous explique comment fonctionne votre nouveau CMS modulaire et comment le déployer pour qu'il soit accessible en ligne.

---

## 🛠 Fonctionnement du CMS

Votre CMS est divisé en deux parties principales :
1.  **Backend (FastAPI)** : Gère la base de données (`canvas_cms.db`), le stockage des images et l'API.
2.  **Frontend (React + Vite)** : L'interface visuelle (Dashboard et Builder) pour créer vos pages.

### Structure d'une Page
Chaque page est stockée sous forme de **JSON** dans la base de données. Ce JSON contient :
-   Le **Schéma** (la liste des blocs, leurs positions et leurs styles).
-   Les **Meta-données** (Titre SEO, slug, description).
-   Le **Statut** (`draft` ou `published`).

---

## 🌍 Comment l'héberger ?

Pour mettre votre CMS en ligne, vous avez plusieurs options. La plus simple et professionnelle est d'utiliser un **VPS** (Serveur Virtuel Privé).

### 1. Pré-requis sur le serveur
Installez Docker et Docker-Compose sur votre serveur (Ubuntu recommandé).

### 2. Déploiement avec Docker (Recommandé)
Votre projet contient déjà un fichier `docker-compose.yml`.

1.  **Copiez vos fichiers** sur le serveur.
2.  **Configurez les variables d'environnement** dans un fichier `.env` sur le serveur :
    ```env
    DATABASE_URL=sqlite+aiosqlite:///./canvas_cms.db
    SECRET_KEY=votre_cle_secrete_tres_longue
    ```
3.  **Lancez les services** :
    ```bash
    docker-compose up -d --build
    ```

### 3. Accès via un Nom de Domaine
Pour que votre site soit accessible via `mon-site.com` :
-   Utilisez **Nginx** comme "Reverse Proxy".
-   Installez un certificat SSL gratuit avec **Certbot** (Let's Encrypt).

---

## 💡 Astuces d'Utilisation

-   **Dashboard** : Utilisez-le pour gérer vos réglages globaux (Header/Footer). Toute modification ici s'appliquera automatiquement à toutes vos nouvelles pages.
-   **Builder** : Glissez-déposez les blocs. N'oubliez pas de **Sauvegarder** avant de **Publier**.
-   **Mobile** : Le CMS est conçu pour être "Mobile-First". Testez toujours vos designs en réduisant la fenêtre de votre navigateur.

---

## 📦 Sauvegarde
N'oubliez pas de sauvegarder régulièrement le fichier `backend/canvas_cms.db`. C'est là que réside toute l'intelligence et le contenu de votre site.
