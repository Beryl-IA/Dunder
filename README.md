# Suivi commercial (iPhone)

Application web installable (PWA) pour suivre son activité commerciale depuis l'iPhone : objectifs, offres, ventes, relances manuelles, rendez-vous et réseau de distributeurs. Construite d'après le cahier des charges v1.0 du 23/10/2026.

- HTML, CSS et JavaScript natif, **aucune dépendance**, aucun build.
- Tout tient dans `index.html` (plus le manifest, le service worker et les icônes).
- Les données restent **sur l'iPhone** (IndexedDB). Aucune requête vers un serveur tiers.
- Fonctionne **hors ligne** une fois ouverte une première fois avec du réseau.

## Historique des versions

### v1.1.0 (schéma de données v2)
- **Montants au centime** : saisie et affichage avec 2 décimales (`12 500,50 €`). Au-delà de 2 décimales, la saisie est refusée.
- **Catalogue** : les tarières et carottiers détaillés sont remplacés par deux produits, « Tarière » et « Carottier ». Un ancien modèle déjà utilisé dans une offre, une vente ou un RDV est masqué (historique intact), sinon supprimé.
- **Ordre alphabétique** des produits partout (catalogue, sélecteur, recherche), avec tri numérique (« Kit 55FF » avant « Kit 130FF »).
- **Un CA total par offre ou vente** : les lignes ne portent plus que produit et quantité. Si une offre mêle Machine et Négoce, un champ « Dont Négoce » apparaît, et le reste est compté en Machine. Le tableau de bord affiche le CA par groupe et les quantités par famille et par produit.
- **Mode jour** : Plus › Apparence → Automatique (suit l'iPhone), Jour ou Nuit.
- **Migration automatique** des données v1.0.0 sans perte : le CA des lignes est additionné, et la part Négoce des offres mixtes est conservée. Les anciennes sauvegardes restent restaurables.
