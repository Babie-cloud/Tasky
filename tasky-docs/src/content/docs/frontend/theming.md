---
title: Thème clair / sombre
description: ThemeService, Bootstrap 5.3 et variables CSS Tasky.
---

Tasky s’appuie sur **Bootstrap 5.3** (`data-bs-theme`) et des **variables CSS** `--tasky-*` définies dans `public/styles/_colors.scss` et `_dark-mode.scss`.

## ThemeService

Service singleton (`providedIn: 'root'`) :

- Lit la préférence dans `localStorage` (`tasky-theme`).
- Applique `document.documentElement.setAttribute('data-bs-theme', 'light' | 'dark')`.
- Fallback : `prefers-color-scheme`.

**Important :** injecter `ThemeService` avec `inject(ThemeService)` — ne pas instancier `new ThemeService()` dans les composants (sinon le toggle ne synchronise pas tout le site).

## Bonnes pratiques CSS

Préférer les variables :

```scss
background: var(--tasky-surface);
color: var(--tasky-text);
border-color: var(--tasky-border);
```

Éviter les couleurs de fond fixes (`#fff`, `#242526`) dans les composants partagés.

## Toggle UI

Le bouton lune/soleil appelle `themeService.toggle()` sur la homepage, le dashboard et le profil.
