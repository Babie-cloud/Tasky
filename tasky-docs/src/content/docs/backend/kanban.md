---
title: Boards, listes & tâches
description: Endpoints Kanban et paramètre board.
---

## Boards

<div class="api-endpoint-row"><span class="method-badge method-get">GET</span> /api/boards/mine</div>
<div class="api-endpoint-row"><span class="method-badge method-post">POST</span> /api/boards</div>
<div class="api-endpoint-row"><span class="method-badge method-get">GET</span> /api/boards/{boardId}</div>

Création d’un board : trois listes par défaut (**À faire**, **En cours**, **Terminé**).

## Listes (statut)

Toutes les routes exigent `board` (query ou body) :

<div class="api-endpoint-row"><span class="method-badge method-get">GET</span> /api/lists?board=</div>
<div class="api-endpoint-row"><span class="method-badge method-post">POST</span> /api/lists</div>
<div class="api-endpoint-row"><span class="method-badge method-put">PUT</span> /api/lists/reorder</div>

## Tâches

<div class="api-endpoint-row"><span class="method-badge method-get">GET</span> /api/tasks?board=</div>
<div class="api-endpoint-row"><span class="method-badge method-post">POST</span> /api/tasks</div>
<div class="api-endpoint-row"><span class="method-badge method-put">PUT</span> /api/tasks/{id}/move</div>
<div class="api-endpoint-row"><span class="method-badge method-delete">DELETE</span> /api/tasks/{id}</div>

Le déplacement Kanban utilise `PUT .../move` avec `{ list, order }`.

## Catégories

<div class="api-endpoint-row"><span class="method-badge method-get">GET</span> /api/categories?board=</div>
<div class="api-endpoint-row"><span class="method-badge method-post">POST</span> /api/categories</div>
