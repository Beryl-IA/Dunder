# Suivi commercial (iPhone)

Application web installable (PWA) pour suivre son activité commerciale depuis l'iPhone : objectifs, offres, ventes, relances manuelles, rendez-vous et réseau de distributeurs. Construite d'après le cahier des charges v1.0 du 23/10/2026.

- HTML, CSS et JavaScript natif, **aucune dépendance**, aucun build.
- Tout tient dans `index.html` (plus le manifest, le service worker et les icônes).
- Les données restent **sur l'iPhone** (IndexedDB). Aucune requête vers un serveur tiers.
- Fonctionne **hors ligne** une fois ouverte une première fois avec du réseau.

## Contenu du dépôt

| Fichier | Rôle |
|---|---|
| `index.html` | L'appli complète : HTML, CSS, JS. Le catalogue produits est la constante `CATALOGUE` en tête du script. |
| `sw.js` | Service worker : réseau d'abord pour la page, repli sur le cache hors ligne. |
| `manifest.webmanifest` | Manifest PWA (`display: standalone`). |
| `icons/apple-touch-icon.png` | Icône iOS 180×180. |
| `icons/icon-192.png`, `icons/icon-512.png` | Icônes du manifest. |

## Déploiement sur Netlify

1. **GitHub** : crée un dépôt **privé** (ex. `suivi-commercial`) et pousse ces fichiers à la racine, sur la branche `main`.
   Depuis le site GitHub : *Add file › Upload files*, glisse tout le contenu du dossier (avec le dossier `icons`), puis *Commit changes*.
2. **Netlify** : *Add new site › Import an existing project › GitHub*, choisis le dépôt.
   - Branch to deploy : `main`
   - Build command : **laisser vide**
   - Publish directory : **laisser vide** (ou `.`) : la racine du dépôt
   - *Deploy site*.
3. Chaque push sur `main` redéploie automatiquement.

### Installation sur l'iPhone

1. Ouvre l'URL Netlify dans **Safari**.
2. Bouton Partager › **Sur l'écran d'accueil** › Ajouter.
3. Lance l'appli depuis l'icône « Suivi commercial ». Vérifie dans **Plus › À propos** : « Stockage persistant : Oui » et « Mode : Écran d'accueil ».

> Les données de l'appli ouverte depuis l'écran d'accueil et celles de Safari sont **séparées** sur iOS. Utilise toujours l'icône de l'écran d'accueil.

### Publier une mise à jour

1. Change la version **aux deux endroits**, avec la même valeur :
   - `index.html` : `const APP_VERSION = 'v1.0.1';`
   - `sw.js` : `const VERSION = 'v1.0.1';`
2. Pousse sur `main`. Netlify redéploie.
3. Sur l'iPhone, la nouvelle version est chargée au prochain lancement avec du réseau (la page est servie « réseau d'abord »). Si l'appli était déjà ouverte en arrière-plan, un message « Nouvelle version disponible › Recharger » apparaît au retour dans l'appli.
4. Contrôle le numéro dans **Plus › À propos**. Les données ne sont jamais touchées par une mise à jour.

Si la structure des données change un jour : incrémente `SCHEMA_VERSION` et ajoute une étape dans `MIGRATIONS` (voir le commentaire au-dessus de `migrer()`).

## Sauvegarde (indispensable)

Les données n'existent que sur l'iPhone. Un bandeau rappelle de sauvegarder si aucune sauvegarde n'a été faite depuis 14 jours.

- **Exporter** : *Plus › Sauvegarde › Exporter la sauvegarde*. La feuille de partage iOS s'ouvre : choisis **Enregistrer dans Fichiers › iCloud Drive**. Le fichier s'appelle `suivi-commercial-AAAA-MM-JJ.json`.
- **Copier** (repli) : copie le même JSON dans le presse-papiers, à coller dans Notes par exemple.
- **Restaurer** : *Choisir un fichier de sauvegarde* (ou coller le texte). L'appli vérifie la structure, affiche un résumé (offres, ventes, RDV, date de la sauvegarde) et demande confirmation, car la restauration **remplace** les données actuelles.
- **Tout effacer** : double confirmation. Le catalogue d'origine et les objectifs par défaut sont rechargés.

Conseil : exporte après chaque grosse séance de saisie, et au moins toutes les deux semaines.

## Ajout des RDV à l'agenda Apple

Le bouton *Ajouter à l'agenda* (fiche RDV ou icône calendrier sur la carte) ouvre un récapitulatif (date, horaire, fuseau Europe/Paris, lieu, rappel 1 h avant) et trois boutons :

1. **Ouvrir dans Calendrier** : méthode principale, lien vers un `Blob` `text/calendar`.
2. **Méthode de secours** : `data:text/calendar` ouvert dans la page.
3. **Partager le fichier .ics** : feuille de partage iOS (Enregistrer dans Fichiers, puis ouvrir le fichier).

Si aucune n'affiche « Ajouter à Calendrier » en mode écran d'accueil, ouvre l'appli dans Safari et réessaie (un bouton copie l'adresse). **À tester sur un iPhone réel** : le comportement d'iOS en mode écran d'accueil ne peut pas être vérifié hors appareil. Note quelle méthode fonctionne chez toi dans *Plus › Idées*.

Le fichier contient un seul `VEVENT` avec `UID` stable (`rdv-<id>@suivi-commercial`), `DTSTART`/`DTEND` en heure locale `TZID=Europe/Paris` avec le bloc `VTIMEZONE`, `SUMMARY` « RDV <client> – <famille> », `LOCATION`, `DESCRIPTION` (ID client, produit d'intérêt) et un `VALARM` 1 h avant. Si un RDV déjà envoyé est modifié, l'appli affiche « Modifié depuis l'ajout à l'agenda : renvoie-le et supprime l'ancien dans Calendrier ».

## Ajouter un produit au catalogue d'origine

Dans `index.html`, constante `CATALOGUE` : ajoute une ligne `CODE|Désignation` sous la bonne famille (`#treuil`, `#rec`, `#foreuse`, `#fusees`, `#hydraulique`, `#forage`, `#sav`). Au lancement suivant, seuls les produits jamais importés sont ajoutés. Les produits créés, modifiés, masqués ou supprimés par l'utilisateur ne sont jamais touchés.

Le plus simple reste d'ajouter un produit depuis l'appli : *Plus › Catalogue › + Produit*.

## Structure des données

Tout l'état est enregistré dans IndexedDB (base `suivi-commercial`, magasin `donnees`, clé `etat`). C'est aussi le contenu du fichier de sauvegarde, dans `donnees` :

```jsonc
{
  "application": "suivi-commercial",
  "schema": 1,                     // version de la structure
  "version": "v1.0.0",             // version de l'appli qui a exporté
  "exporteLe": "2026-10-23T08:00:00.000Z",
  "donnees": {
    "produits": [{
      "id": "cat-ART-004531",      // "cat-…" pour le catalogue d'origine, UUID sinon
      "code": "ART-004531",        // facultatif, unique s'il est renseigné
      "designation": "Tariere 14\" (350) dents rondes…",
      "famille": "forage",         // treuil | rec | foreuse | fusees | hydraulique | forage | sav
      "actif": true,               // false = masqué à la saisie
      "catalogueCle": "ART-004531",// présent pour les produits du catalogue d'origine
      "creeLe": "…", "modifieLe": "…"
    }],
    "offres": [{
      "id": "…", "idClient": "C123", "client": "…",
      "affaire": "Commerce",       // Commerce | SAV
      "dateEmission": "2026-10-23",
      "chance": 50,                // 5 à 100
      "relanceManuelle": true, "dateRelance": "2026-10-30", // null si relance auto (ERP)
      "statut": "en_cours",        // en_cours | gagnee | perdue
      "dateCloture": null,
      "lignes": [{ "id": "…", "produitId": "cat-ART-012385", "quantite": 1, "ca": 45000 }],
      "creeLe": "…", "modifieLe": "…"
    }],
    "ventes": [{
      "id": "…", "date": "2026-10-23", "idClient": "", "client": "…",
      "affaire": "Commerce",
      "canal": "direct",           // "direct" ou l'id d'un distributeur
      "lignes": [{ "id": "…", "produitId": "…", "quantite": 1, "ca": 1200.5 }],
      "creeLe": "…", "modifieLe": "…"
    }],
    "distributeurs": [{ "id": "…", "nom": "…", "dateSignature": "2026-10-12", "creeLe": "…", "modifieLe": "…" }],
    "rdvs": [{
      "id": "…", "date": "2026-11-05", "heure": "14:30",
      "duree": 90,                 // minutes (30, 60, 90, 120, 240, 480)
      "idClient": "", "client": "…",
      "famille": "treuil", "produitId": null, "lieu": "", "fait": false,
      "agendaAjouteLe": null,      // date du dernier ajout à l'agenda
      "agendaSignature": null,     // sert à détecter une modification après l'ajout
      "creeLe": "…", "modifieLe": "…"
    }],
    "reglages": {
      "debut": "2026-10-01", "fin": "2027-12-31",
      "cibles": { "negoce": 300000, "treuil": 6, "rec": 5, "distrib": 5 },
      "idees": "",
      "derniereSauvegarde": null
    },
    "catalogueConnu": ["ART-012384", "…"] // produits du catalogue déjà importés une fois
  }
}
```

La famille et le groupe d'une ligne ne sont jamais stockés : ils découlent toujours du produit.

## Règles de calcul (rappel)

- **Ligne SAV** : affaire « SAV » ou produit du groupe SAV. Elle n'entre dans aucun objectif ni KPI commercial, seulement dans le bloc SAV.
- **Négoce** = CA des lignes commerciales du groupe Négoce (locations comprises). **Treuil / REC** = quantités. **Contrats** = distributeurs signés dans la période.
- **% de temps écoulé** = jours écoulés (jour en cours compris) / jours de la période, borné entre 0 et 100 %.
- **Écart au rythme** = taux de réussite − % de temps écoulé, en points. Vert si atteint ou en avance, orange si retard < 10 points, rouge au-delà.
- **Prévision** = réalisé sur la période d'objectif + pondéré des offres en cours (CA × % pour le Négoce, quantité × % pour Treuil et REC).
- **Transformation** = gagnées / (gagnées + perdues), sur les offres clôturées dans la période, en nombre et en CA.
- **Panier moyen** = CA commercial / nombre de ventes ayant au moins une ligne commerciale.

## Choix faits sur les points non couverts par le cahier des charges

1. **Temps écoulé** : le jour en cours est compté (le 01/10/2026 = 1 jour écoulé), pour atteindre 100 % le dernier jour.
2. **Messages de rythme** : « Objectif atteint » au-delà de 100 % ; « Dans le rythme » quand l'écart arrondi vaut 0 point.
3. **Vues Mois et Trimestre** : le réalisé et la cible lissée portent sur la partie du mois ou du trimestre comprise dans la période d'objectif. Les cartes y sont affichées en couleur neutre (pas de rythme), car la cible lissée est indicative. Un mois hors période affiche « Hors période d'objectif ».
4. **Navigation des périodes** : limitée à la période d'objectif, élargie à aujourd'hui et aux ventes saisies hors période (ex. septembre 2026), pour que chaque vente reste retrouvable dans l'onglet Ventes.
5. **Prévision** : toujours calculée sur la période d'objectif complète, quelle que soit la vue choisie.
6. **Bloc Distributeurs et KPI** : ils suivent la période choisie. Le CA via distributeurs est le CA commercial (hors SAV). En vue Mois/Trimestre, la cible de contrats est lissée.
7. **Offre gagnée** : l'offre garde ses lignes d'origine (le taux de transformation en CA compare donc des montants proposés) ; la vente reçoit les lignes ajustées dans l'écran garde-fou, avec la même affaire que l'offre. Date de clôture = jour du passage en Gagnée ou Perdue. Une offre gagnée ne se rouvre pas (la vente est indépendante) ; une offre perdue, si.
8. **Passage en Gagnée ou Perdue depuis la fiche** : les modifications en cours dans la fiche sont d'abord validées et enregistrées.
9. **Relances** : les offres SAV en relance manuelle comptent aussi dans « À relancer » et dans la pastille (c'est une tâche à faire, pas un KPI). La date par défaut (création et bouton « Relancé ») est aujourd'hui + 7 jours.
10. **Listes d'offres et de ventes** : le total affiché en haut est hors SAV ; le montant SAV éventuel est indiqué à part.
11. **Ventes par groupe et famille** : hors SAV (le SAV a son bloc dédié). Foreuse apparaît dans Machine, sans objectif.
12. **Produits** : suppression interdite aussi si le produit est cité dans un RDV. Modifier la famille d'un produit s'applique à tout l'historique (la famille découle du produit). Les produits masqués restent visibles dans le catalogue avec la mention « Masqué ».
13. **Catalogue** : la clé d'un produit d'origine est son code, ou `sans-code-<désignation>` (Foreuse-grue, SAV). Un produit d'origine supprimé par l'utilisateur n'est jamais réimporté.
14. **Durées de RDV** : demi-journée = 4 h, journée = 8 h. **RDV « À venir »** = non fait et date du jour ou future ; **« Passés / faits »** = fait ou date passée.
15. **Alerte agenda** : seule une modification des champs repris dans l'agenda (date, heure, durée, client, ID, famille, produit, lieu) la déclenche. Cocher « fait » ne la déclenche pas.
16. **Rappel de sauvegarde** : s'il existe des données et qu'aucune sauvegarde n'a jamais été faite, le bandeau s'affiche tout de suite. « Copier » compte comme une sauvegarde.
17. **Restauration** : la date de dernière sauvegarde devient celle du fichier restauré. Un fichier créé par une version plus récente de l'appli est refusé.
18. **Sécurité des données** : si la lecture du stockage échoue au démarrage, l'appli n'écrit plus rien (pour ne pas écraser les données) et affiche un bandeau.
19. **Hors ligne** : si le réseau ne répond pas en 4 secondes, la version en cache s'affiche ; la réponse réseau, si elle arrive ensuite, met le cache à jour pour le lancement suivant.
20. **Format compact** : à partir de 100 000 €, arrondi au k€ (`128 k€`) ; entre 1 000 et 99 999 €, une décimale (`26,5 k€`).
21. **Un seul toast à la fois**, retiré à l'ouverture d'un formulaire.
22. **Accès de débogage** : `SuiviCommercial.etat` dans la console de Safari (iPhone branché au Mac, menu Développement).

## Tests réalisés

Les 14 critères d'acceptation ont été rejoués automatiquement dans Chromium (viewport iPhone, fuseau Europe/Paris) : 58 vérifications sur 58 réussies, dont la recherche `tariere 14 plates`, le scénario Gagnée avec retrait du Kit 75FF (Treuil 1/6, Négoce inchangé), la règle SAV, les distributeurs 2/5, la relance en retard et son report, le contenu du `.ics`, l'export / effacement / restauration à l'identique, la mise à jour de version sans perte, l'ouverture et la saisie hors ligne, et l'absence de toute requête tierce.

**Restent à valider sur un iPhone réel**, en mode écran d'accueil : l'ouverture de « Ajouter à Calendrier » (critère 10), la feuille de partage pour l'export, et le mode avion (critère 13) après une première ouverture avec réseau.

## Inspiration

Principes repris du template [Gentelella](https://github.com/ColorlibHQ/gentelella) (licence MIT) : variables CSS centralisées avec clair et sombre au même endroit, cartes de statistiques, barres de progression, pastilles de statut, toasts à liseré coloré, logique « une seule source » pour la navigation et le catalogue. Aucun code n'a été copié : tout a été réécrit pour une seule colonne mobile avec barre d'onglets en bas.
