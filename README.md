# Suivi commercial (iPhone)

Application web installable (PWA) pour suivre son activité commerciale depuis l'iPhone : objectifs, offres, ventes, relances manuelles, rendez-vous et réseau de distributeurs. Construite d'après le cahier des charges v1.0 du 23/10/2026.

- HTML, CSS et JavaScript natif, **aucune dépendance**, aucun build.
- Tout tient dans `index.html` (plus le manifest, le service worker et les icônes).
- Les données restent **sur l'iPhone** (IndexedDB). Aucune requête vers un serveur tiers.
- Fonctionne **hors ligne** une fois ouverte une première fois avec du réseau.
