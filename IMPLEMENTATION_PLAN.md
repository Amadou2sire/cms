# 📝 Suivi d'implémentation — CANVAS CMS

## 🚀 Phase 1 : Initialisation & Socle (Terminée)
- [x] Création de l'arborescence `backend/` et `frontend/`
- [x] Configuration Docker Compose (PostgreSQL, Redis)
- [x] Initialisation FastAPI (Main, Config, Database)
- [x] Initialisation React + Vite + Tailwind

## 🏗️ Phase 2 : Backend — Cœur & Données (Terminée)
- [x] créer venv et installer les dépendances nécessaires
- [x] Modèles SQLAlchemy (User, Page, Media)
- [x] Authentification JWT & Sécurité
- [x] CRUD Pages (Statut draft/published)
- [x] Service de validation des blocs (JSON Schema)

## 🎨 Phase 3 : Frontend — Visual Builder (Terminée)
- [x] Store Zustand (builderStore, seoStore, geoStore)
- [x] Layout 3 zones (Block Panel, Canvas, Props Panel)
- [x] Moteur Drag & Drop (@dnd-kit/core)
- [x] Block Renderer (Rendu live React)

## 🌐 Phase 4 : SEO & GEO — Innovation (Terminée)
- [x] Panneau SEO (Meta, OpenGraph, Schema.org)
- [x] Panneau GEO (aiSummary, aiKeyFacts, llms.txt)
- [x] Génération dynamique des endpoints IA (/llms.txt)
- [x] Calcul du Score GEO en temps réel

## 🏁 Phase 5 : Finalisation
- [x] API Publique avec cache Redis
- [ ] Sitemap & Robots.txt
- [ ] Tests d'intégration & Documentation finale

## 🛠️ Phase 6 : Améliorations & Fiabilisation (Session Récente)
- [x] Migration de PostgreSQL vers SQLite (sans dépendance Docker)
- [x] Mock Redis en mémoire pour fonctionnement autonome
- [x] Création du script d'initialisation d'Administrateur (`create_admin.py`)
- [x] Sécurisation du routage Frontend (Redirection Login & Auth Guards)
- [x] Résolution des types TypeScript/Vite et correction de l'intégration Drag & Drop
- [x] Création de page dynamique depuis le Dashboard
- [x] Implémentation du système Undo / Redo avec historique complet (past/future)
