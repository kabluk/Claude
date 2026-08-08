---
{
  "slug": "rgaa-guide",
  "locale": "fr",
  "title": "RGAA : définition, critères et fonctionnement du référentiel français",
  "description": "Qu'est-ce que le RGAA : origine, 106 critères et 13 thématiques, différence avec les WCAG et l'EN 301 549, qui est concerné et comment vérifier son site.",
  "standard": "rgaa",
  "countryCode": "FR",
  "updated": "2026-08-08",
  "faq": [
    {
      "q": "Qu'est-ce que le RGAA ?",
      "a": "Le Référentiel général d'amélioration de l'accessibilité (RGAA) est le référentiel officiel français d'accessibilité numérique, publié par la direction interministérielle du numérique (DINUM). La version en vigueur est le RGAA 4.1.2. Il comprend deux volets : les obligations légales (qui est concerné, quels documents publier) et une méthode technique de 106 critères de contrôle qui permet de vérifier, page par page, si un site ou une application respecte les règles d'accessibilité."
    },
    {
      "q": "Combien de critères comporte le RGAA et comment sont-ils organisés ?",
      "a": "Le RGAA compte 106 critères de contrôle, répartis en 13 thématiques (images, cadres, couleurs, multimédia, tableaux, liens, scripts, éléments obligatoires, structuration de l'information, présentation de l'information, formulaires, navigation, consultation). Chaque critère est décliné en un ou plusieurs tests unitaires, ce qui rend le référentiel vérifiable de façon objective plutôt que par une simple appréciation qualitative."
    },
    {
      "q": "Quelle est la différence entre le RGAA, les WCAG et l'EN 301 549 ?",
      "a": "Les WCAG sont les règles internationales du W3C. Le RGAA est la méthode technique française qui permet de vérifier la conformité aux 50 critères de succès des niveaux A et AA des WCAG 2.1 : réussir les 106 critères du RGAA revient à démontrer le respect de ces 50 critères WCAG. Ces mêmes critères ont par ailleurs été retenus dans la norme européenne EN 301 549, qui sert de référence légale pour l'accessibilité numérique en Europe. Le RGAA 4.1 ne couvre en revanche que les pages web : pour les applications mobiles, les progiciels et les bornes numériques, la conformité s'apprécie directement au regard de l'EN 301 549."
    },
    {
      "q": "Le RGAA est-il obligatoire pour mon site ?",
      "a": "L'obligation légale découle de l'article 47 de la loi du 11 février 2005, pas du RGAA lui-même, qui n'est que la méthode de vérification. Elle s'applique aux personnes morales de droit public, à certains organismes privés délégataires d'une mission de service public, et aux entreprises réalisant plus de 250 millions d'euros de chiffre d'affaires en France. Depuis le 28 juin 2025, la transposition française de l'Acte européen sur l'accessibilité étend par ailleurs des exigences d'accessibilité à de nombreux services privés destinés aux consommateurs, indépendamment de ce seuil. Voir notre guide sur l'audit RGAA pour le détail des obligations et des livrables à publier."
    }
  ],
  "cta": { "label": "Vérifier votre site RGAA (scan gratuit)", "path": "/scan/?country=FR" },
  "relatedAgencies": ["access42", "urbilog", "boscop"]
}
---
RGAA : trois lettres que l'on croise dès qu'on s'intéresse à l'accessibilité numérique en France, sur un cahier des charges, dans une déclaration d'accessibilité en bas de page, ou dans un appel d'offres public. Ce guide répond à la question de fond — qu'est-ce que le RGAA, d'où vient-il, comment est-il structuré et en quoi diffère-t-il des WCAG — avant de renvoyer, pour le déroulement concret d'un contrôle de conformité, vers notre [guide sur l'audit RGAA](/guides/audit-rgaa-guide/).

## Le RGAA en une phrase

Le [Référentiel général d'amélioration de l'accessibilité (RGAA)](https://accessibilite.numerique.gouv.fr/) est le référentiel officiel français d'accessibilité numérique, publié et maintenu par la direction interministérielle du numérique (DINUM). Sa version en vigueur est le **RGAA 4.1.2** (dernière mise à jour du texte : avril 2023). Ce n'est ni une loi ni une norme technique isolée : c'est un document en deux parties — des obligations légales (qui est concerné, quels documents publier) et une méthode technique de contrôle, organisée en critères et tests vérifiables plutôt qu'en principes généraux à interpréter.

## Les 106 critères et les 13 thématiques

Le cœur du RGAA est sa méthode technique : **106 critères de contrôle**, répartis en **13 thématiques** — images, cadres, couleurs, multimédia, tableaux, liens, scripts, éléments obligatoires, structuration de l'information, présentation de l'information, formulaires, navigation et consultation. Chaque critère se décline à son tour en un ou plusieurs **tests unitaires**, qui précisent exactement ce qu'un contrôleur doit vérifier (par exemple, pour un critère sur les images : présence d'une alternative textuelle, pertinence de cette alternative, décoration correctement ignorée par les technologies d'assistance, etc.).

Cette granularité est ce qui distingue le RGAA d'un simple guide de bonnes pratiques : chaque critère produit un résultat binaire (conforme / non conforme / non applicable), ce qui permet de calculer un taux de conformité objectif et reproductible d'un auditeur à l'autre — un point détaillé dans notre [guide sur l'audit RGAA](/guides/audit-rgaa-guide/).

## RGAA, WCAG, EN 301 549 : comment s'articulent ces textes

Les trois textes ne sont pas concurrents, ils s'emboîtent :

- Les [WCAG](https://www.w3.org/WAI/standards-guidelines/wcag/) (Web Content Accessibility Guidelines) sont les règles internationales du W3C, exprimées sous forme de critères de succès classés en trois niveaux (A, AA, AAA).
- Le RGAA est la **méthode technique française** qui permet de vérifier la conformité aux **50 critères de succès des niveaux A et AA des WCAG 2.1** : réussir les 106 critères du RGAA revient à démontrer le respect de ces 50 critères WCAG, avec des tests français directement exploitables par un contrôleur.
- Ces mêmes 50 critères ont été retenus dans la norme européenne **EN 301 549**, qui sert de socle légal à l'accessibilité numérique dans l'Union européenne (et donc, indirectement, à l'Acte européen sur l'accessibilité).

Un point souvent ignoré : **le RGAA 4.1 ne couvre que les pages web**. Pour les applications mobiles, les progiciels utilisés via un navigateur ou les bornes numériques interactives, la conformité doit s'apprécier directement au regard de l'EN 301 549, faute d'une déclinaison RGAA équivalente pour ces canaux.

## Qui est concerné par le RGAA

Le RGAA lui-même n'impose rien : c'est l'[article 47 de la loi n° 2005-102 du 11 février 2005](https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000000809647) qui rend son application obligatoire pour :

1. les personnes morales de droit public (État, collectivités territoriales, établissements publics…) ;
2. les organismes privés délégataires d'une mission de service public ou créés pour satisfaire des besoins d'intérêt général ;
3. les entreprises dont le chiffre d'affaires en France dépasse 250 millions d'euros, en moyenne sur les trois derniers exercices.

**Depuis le 28 juin 2025**, la transposition française de l'Acte européen sur l'accessibilité étend par ailleurs des exigences d'accessibilité à de nombreux services privés destinés aux consommateurs (e-commerce, banque de détail, transport, télécommunications), indépendamment du seuil de chiffre d'affaires — voir notre [guide sur l'Acte européen sur l'accessibilité](/guides/european-accessibility-act-guide/) pour le détail de cette extension. Pour la liste complète des exemptions et le champ d'application précis, notre [guide sur l'audit RGAA](/guides/audit-rgaa-guide/) entre dans le détail.

## Les documents que le RGAA rend nécessaires

Une organisation soumise au RGAA doit publier deux documents principaux, dont le contenu résulte d'une évaluation effective de conformité :

- une **déclaration d'accessibilité**, qui affiche l'état de conformité (totale, partielle ou non-conformité) et la manière de signaler un défaut d'accessibilité ;
- un **schéma pluriannuel de mise en accessibilité**, décliné en plans d'actions annuels.

C'est l'audit RGAA — la vérification effective des 106 critères sur un échantillon de pages — qui alimente ces deux documents et calcule le taux de conformité à afficher. Notre [guide sur l'audit RGAA](/guides/audit-rgaa-guide/) détaille le déroulement de cet audit, la constitution de l'échantillon et le contenu exact de la déclaration.

## Le RGAA 5 est en préparation

La DINUM annonce sur son site officiel que la **version 5 du RGAA est en cours de rédaction**, avec une publication prévue **fin 2026**. Elle précise explicitement que cette échéance ne justifie ni report ni suspension des travaux de mise en accessibilité en cours sur la base du RGAA 4.1.2. Les organisations ayant déjà publié une déclaration d'accessibilité devront la mettre à jour dans les 18 mois suivant la publication effective du nouveau référentiel.

## Comment savoir si votre site respecte le RGAA

Un scan automatique ne peut vérifier qu'une minorité des 106 critères : les tests portant sur la navigation au clavier, la restitution par lecteur d'écran ou la pertinence des alternatives textuelles exigent un contrôle manuel. C'est néanmoins un point de départ utile pour situer votre site avant d'engager une démarche complète. Vous pouvez lancer un scan gratuit pour repérer les premiers points bloquants, puis vous appuyer sur notre [guide sur l'audit RGAA](/guides/audit-rgaa-guide/) pour comprendre comment se déroule un audit conforme à la méthode officielle et choisir un auditeur.
