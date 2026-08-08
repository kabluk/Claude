---
{
  "slug": "audit-rgaa-guide",
  "locale": "fr",
  "title": "Audit RGAA : obligations, déroulement et déclaration d'accessibilité",
  "description": "Qui est soumis au RGAA, comment se déroule un audit (échantillon, 106 critères, taux de conformité), déclaration d'accessibilité, schéma pluriannuel, sanctions.",
  "standard": "rgaa",
  "countryCode": "FR",
  "updated": "2026-08-04",
  "faq": [
    {
      "q": "Qui est concerné par l'obligation d'audit RGAA ?",
      "a": "Les personnes morales de droit public, les organismes privés délégataires d'une mission de service public ou créés pour satisfaire des besoins d'intérêt général, ainsi que les entreprises réalisant plus de 250 millions d'euros de chiffre d'affaires annuel moyen en France sur les trois derniers exercices. Depuis le 28 juin 2025, la transposition française de la directive européenne sur l'accessibilité étend par ailleurs des exigences d'accessibilité à de nombreux services privés (e-commerce, banque, transport, télécommunications)."
    },
    {
      "q": "Quelle est la différence entre le RGAA et les WCAG ?",
      "a": "Les WCAG sont les règles internationales du W3C ; le RGAA est la méthode technique française qui les traduit en 106 critères et en tests unitaires vérifiables. Un audit RGAA permet donc de démontrer la conformité aux WCAG 2.1 niveau AA tout en produisant les livrables exigés par la réglementation française, notamment le taux de conformité et la déclaration d'accessibilité."
    },
    {
      "q": "Quelles sanctions en cas de non-conformité au RGAA ?",
      "a": "Depuis l'ordonnance du 6 septembre 2023, l'Arcom peut constater le manquement, mettre en demeure l'organisme concerné puis, si celui-ci persiste, prononcer une sanction pécuniaire — la loi distingue le non-respect des exigences d'accessibilité du simple défaut d'affichage (déclaration, schéma pluriannuel). Nous ne citons pas de montant précis ici : le plafond légal dépend de la nature, de la gravité et de la durée du manquement, et une entreprise concernée au seul titre de son chiffre d'affaires n'est contrôlée par l'Arcom que sur ses obligations d'affichage — un chiffre isolé donnerait une image inexacte du risque réel."
    },
    {
      "q": "À quelle fréquence faut-il refaire un audit RGAA ?",
      "a": "La déclaration d'accessibilité issue de l'audit est valable au maximum 3 ans. Elle doit être mise à jour plus tôt en cas de refonte ou de modification substantielle du site, et dans les 18 mois suivant la publication d'une nouvelle version du référentiel. La version 5 du RGAA étant annoncée pour fin 2026, il est prudent d'anticiper ce cycle dans votre schéma pluriannuel."
    }
  ],
  "cta": { "label": "Trouver un prestataire d'audit RGAA", "path": "/france/accessibility-audit/" },
  "relatedAgencies": ["access42", "urbilog", "boscop"]
}
---
L'audit RGAA est le passage obligé de toute démarche de conformité en accessibilité numérique en France : c'est lui qui produit le taux de conformité affiché dans votre déclaration d'accessibilité, et c'est sur ses résultats que s'appuient l'Arcom et le Défenseur des droits en cas de contrôle ou de plainte. Ce guide fait le point sur le cadre légal en vigueur en 2026, le déroulement concret d'un audit, les livrables obligatoires et les critères de choix d'un auditeur. Pour les bases du référentiel lui-même — origine, 106 critères, 13 thématiques, différence avec les WCAG — voir notre [guide « qu'est-ce que le RGAA »](/guides/rgaa-guide/).

## Qu'est-ce que le RGAA ?

Le [Référentiel général d'amélioration de l'accessibilité (RGAA)](https://accessibilite.numerique.gouv.fr/) est publié par la direction interministérielle du numérique (DINUM). La version en vigueur est le **RGAA 4.1.2** (dernière mise à jour du référentiel : avril 2023). Il comporte deux volets :

- **les obligations légales** : qui est concerné, quels livrables publier (déclaration d'accessibilité, schéma pluriannuel, mentions obligatoires) ;
- **la méthode technique** : [106 critères de contrôle](https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/) répartis en 13 thématiques (images, cadres, couleurs, multimédia, tableaux, liens, scripts, éléments obligatoires, structuration, présentation, formulaires, navigation, consultation), chacun décliné en tests unitaires.

Le RGAA constitue la déclinaison opérationnelle française des règles internationales [WCAG](https://www.w3.org/WAI/standards-guidelines/wcag/) : réussir les 106 critères permet de démontrer la conformité aux WCAG 2.1 de niveau AA, norme de référence citée par la réglementation européenne.

À noter : la DINUM annonce sur le site officiel que **la version 5 du RGAA est en cours de rédaction, avec une publication prévue fin 2026**. Elle précise également que cette échéance ne justifie ni report ni suspension des travaux de mise en accessibilité en cours.

## Qui est légalement tenu de se conformer au RGAA ?

L'obligation d'accessibilité des « services de communication au public en ligne » découle de l'[article 47 de la loi n° 2005-102 du 11 février 2005](https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000000809647), précisé par le [décret n° 2019-768 du 24 juillet 2019](https://www.legifrance.gouv.fr/eli/decret/2019/7/24/2019-768/jo/texte). Sont concernés, selon le [champ d'application rappelé par la DINUM](https://accessibilite.numerique.gouv.fr/obligations/champ-application/) :

1. **les personnes morales de droit public** (État, collectivités territoriales, établissements publics…) ;
2. **les organismes privés délégataires d'une mission de service public** ou créés pour satisfaire des besoins d'intérêt général, lorsqu'ils sont majoritairement financés ou contrôlés par des personnes publiques ;
3. **les entreprises privées dont le chiffre d'affaires réalisé en France dépasse 250 millions d'euros**, calculé sur la moyenne des trois derniers exercices clos.

L'obligation couvre les sites internet, intranets et extranets, les applications mobiles, les progiciels utilisés via un navigateur, ainsi que le mobilier urbain numérique pour sa partie interactive. Certains contenus sont exemptés (fichiers bureautiques publiés avant le 23 septembre 2018, vidéos en direct, cartes en ligne sous conditions, contenus de tiers non contrôlés, archives…).

### L'extension au secteur privé depuis juin 2025 (directive européenne)

La [directive (UE) 2019/882](https://eur-lex.europa.eu/eli/dir/2019/882/oj), dite « Acte européen sur l'accessibilité » (European Accessibility Act), a été transposée en France par la [loi n° 2023-171 du 9 mars 2023](https://www.legifrance.gouv.fr/eli/loi/2023/3/9/2023-171/jo/texte) et le [décret n° 2023-931 du 9 octobre 2023](https://www.legifrance.gouv.fr/eli/decret/2023/10/9/2023-931/jo/texte). **Depuis le 28 juin 2025**, des exigences d'accessibilité s'appliquent — indépendamment du seuil de 250 millions d'euros — aux services numériques destinés aux consommateurs : commerce électronique, services bancaires de détail, transport de passagers, communications électroniques, livres numériques, accès aux médias audiovisuels. Les microentreprises de services (moins de 10 salariés et moins de 2 millions d'euros de chiffre d'affaires ou de total de bilan) bénéficient d'une exemption prévue par la directive. Pour ces services, la conformité s'apprécie au regard de la norme européenne EN 301 549, dont la partie web repose sur les mêmes exigences WCAG que le RGAA — un audit RGAA reste donc l'outil de vérification le plus adapté au contexte français.

## Les livrables obligatoires

### La déclaration d'accessibilité

Chaque site ou application concerné doit publier une [déclaration d'accessibilité](https://accessibilite.numerique.gouv.fr/obligations/declaration-accessibilite/) résultant d'une **évaluation effective** de conformité. Elle comprend :

- **un état de conformité** : *conformité totale* (100 % des critères applicables respectés), *conformité partielle* (au moins 50 %) ou *non-conformité* (moins de 50 %, ou absence d'audit valide) ;
- **le signalement des contenus non accessibles**, en distinguant non-conformités, contenus exemptés et dérogations pour charge disproportionnée (qui doivent être motivées) ;
- **un mécanisme de contact accessible** (adresse électronique ou formulaire) permettant de signaler un défaut d'accessibilité, avec réponse attendue sous une semaine ;
- **la mention de la possibilité de saisir le Défenseur des droits** en l'absence de réponse ou de solution.

La déclaration est valable **3 ans** au maximum ; elle doit être mise à jour en cas de modification substantielle ou de refonte, et **18 mois après la publication d'une nouvelle version du référentiel**. Elle doit être accessible depuis chaque page du site (lien « Accessibilité : totalement / partiellement / non conforme »).

### Le schéma pluriannuel et le plan d'actions

Le [schéma pluriannuel de mise en accessibilité](https://accessibilite.numerique.gouv.fr/obligations/schema-pluriannuel/), d'une durée maximale de **3 ans**, présente la politique d'accessibilité numérique de l'entité : référent accessibilité, ressources humaines et financières, formation, prise en compte de l'accessibilité dans les marchés et les recettes, traitement des demandes des usagers. Il est décliné en **plans d'actions annuels** et publié en ligne ; la déclaration d'accessibilité doit pointer vers ces documents.

## Sanctions : ce que risque un organisme non conforme

Depuis l'ordonnance du 6 septembre 2023, qui a créé l'article 47-1 de la loi de 2005, [l'Arcom est chargée de contrôler le respect de ces obligations](https://www.arcom.fr/nous-connaitre/nos-missions/garantir-le-pluralisme-et-la-cohesion-sociale/les-droits-des-personnes-handicapees/accessibilite-des-sites-et-des-services-numeriques). Selon l'Arcom elle-même, la procédure est graduée : constat par des agents assermentés, mise en demeure, puis sanction pécuniaire si le manquement persiste, avec une sanction distincte selon qu'il s'agit d'un non-respect des exigences d'accessibilité (critères RGAA) ou d'une absence de déclaration d'accessibilité, de schéma pluriannuel ou d'affichage de l'état de conformité.

Nous ne citons volontairement aucun montant ici : le plafond légal se module selon la nature, la gravité et la durée du manquement, et une nouvelle sanction peut être prononcée si celui-ci persiste au-delà de six mois — un chiffre isolé, sorti de ce contexte, surestimerait ou sous-estimerait le risque réel selon les cas. Précision importante donnée par l'Arcom : pour les entreprises concernées au seul titre de leur chiffre d'affaires, elle ne contrôle que les obligations d'affichage — mais le risque réputationnel et contentieux (Défenseur des droits, associations) demeure. Pour les services couverts par l'Acte européen sur l'accessibilité, des autorités sectorielles de contrôle disposent de pouvoirs propres depuis le 28 juin 2025.

## Comment se déroule un audit RGAA

Le déroulement est cadré par la [méthode d'évaluation officielle](https://accessibilite.numerique.gouv.fr/obligations/evaluation-conformite/) :

### 1. Constitution de l'échantillon

L'audit porte sur un **échantillon représentatif** de pages comprenant obligatoirement, lorsqu'elles existent : page d'accueil, contact, mentions légales, accessibilité, plan du site, aide, authentification ; au moins une page pertinente par type de service rendu ; les pages composant les processus complets (formulaires multi-étapes, tunnels de commande) ; des documents téléchargeables représentatifs ; et **au moins 10 % de pages choisies au hasard**. Pour un site classique, l'échantillon compte le plus souvent une quinzaine à une trentaine de pages.

### 2. Tests des 106 critères dans l'environnement de référence

L'auditeur vérifie chaque page de l'échantillon au regard des critères applicables, à l'aide des tests du RGAA et du [kit d'audit de la DINUM](https://accessibilite.numerique.gouv.fr/ressources/kit-audit/). Certains critères (scripts, composants interactifs) exigent des **tests de restitution avec des technologies d'assistance** (lecteurs d'écran associés à des navigateurs définis dans la base de référence). C'est ce travail manuel qui distingue un audit RGAA d'un simple scan automatique, lequel ne peut vérifier qu'une minorité de critères.

### 3. Calcul du taux de conformité et restitution

Le **taux de conformité** est le pourcentage de critères respectés sur l'ensemble des critères applicables à l'échantillon. Le rapport d'audit liste les non-conformités par page et par critère, en les priorisant selon leur impact utilisateur, et alimente directement la déclaration d'accessibilité. Une restitution orale permet aux équipes de comprendre les corrections attendues.

### 4. Corrections et contre-audit

Après correction des non-conformités, un **contre-audit** (ou audit de contrôle) actualise le taux et permet, le cas échéant, de passer d'une non-conformité à une conformité partielle ou totale — et de mettre à jour la déclaration.

## Bien choisir son auditeur RGAA

- **Compétence RGAA démontrée** : demandez des exemples de rapports anonymisés et des déclarations d'accessibilité publiées ; les déclarations de sites publics citent souvent l'auditeur, ce qui constitue une référence vérifiable.
- **Tests manuels avec technologies d'assistance** : exigez que la méthodologie couvre l'environnement de référence du RGAA (lecteurs d'écran), pas seulement des outils automatiques.
- **Livrables conformes** : grille d'audit critère par critère, taux de conformité, projet de déclaration d'accessibilité prêt à publier, et idéalement appui à la rédaction du schéma pluriannuel.
- **Accompagnement post-audit** : disponibilité pour répondre aux questions des développeurs, ateliers de correction, contre-audit inclus ou chiffré dès le devis.
- **Indépendance** : si l'agence qui a développé votre site réalise aussi l'audit, la fiabilité de la déclaration — dont vous restez responsable — peut être questionnée.

## Après l'audit : inscrire la conformité dans la durée

Un audit est une photographie : chaque mise en production peut introduire de nouvelles non-conformités. Pour rester conforme, intégrez l'accessibilité dans les recettes de chaque évolution, formez développeurs et contributeurs, planifiez les audits dans le schéma pluriannuel et suivez la publication du RGAA 5 annoncée pour fin 2026, qui déclenchera le délai de 18 mois de mise à jour des déclarations. Un prestataire capable de vous accompagner sur ce cycle complet — audit, correction, contre-audit, veille réglementaire — vous fera gagner un temps précieux.
