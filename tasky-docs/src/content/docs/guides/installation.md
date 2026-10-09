---
title: Installation
description: Configurer Tasky en local — MongoDB, backend Express, frontend Angular et site de documentation.
---

## Prérequis

- **Node.js** 20+ (22 recommandé)
- **MongoDB** (local ou [MongoDB Atlas](https://www.mongodb.com/atlas))
- **Git**

## 1. Cloner le dépôt

```bash
git clone https://github.com/Babie-cloud/Tasky.git
cd Tasky
```

## 2. Backend (`xp-tasky`)

```bash
cd xp-tasky
cp .env.example .env
# Renseigner MONGO_URI, JWT_SECRET, etc.
npm ci
npm start
```

L’API écoute sur **http://localhost:3000**.  
Documentation Swagger : **http://localhost:3000/api-docs**

## 3. Frontend (`ng-tasky`)

```bash
cd ../ng-tasky
npm ci
npm start
```

Application : **http://localhost:4200** (proxy API via `environment.development.ts`).

## 4. Documentation (`tasky-docs`)

```bash
cd ../tasky-docs
npm ci
npm run dev
```

Site Starlight : **http://localhost:4321**

La spec OpenAPI est régénérée automatiquement avant `dev` / `build` (`openapi.json` dans `public/`).

## Vérification rapide

| Service   | URL                         |
| --------- | --------------------------- |
| Angular   | http://localhost:4200       |
| API       | http://localhost:3000       |
| Swagger   | http://localhost:3000/api-docs |
| Docs Astro | http://localhost:4321    |
