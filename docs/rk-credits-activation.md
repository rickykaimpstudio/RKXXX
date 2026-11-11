# After Dark — crédits RK et paiement sécurisé

11 novembre 2026. Préparation technique seulement : AUCUN encaissement, aucun outil IA payant activé. Le dépôt Ricky Kaimp Studio demeure inchangé.

## Principe du Studio RK réutilisé
- Packs de crédits payés par le client avant utilisation.
- Attribution par webhook de paiement vérifié côté serveur, jamais à partir d'un clic client ou d'une URL de retour.
- Débit atomique de crédits avant appel à une API facturable.
- Calcul du prix à partir des coûts réels du fournisseur, change, frais de traitement, réserves, remboursements, taxes, hébergement et marge ciblée de 35 % minimum. Pas de tarif public si les coûts sont inconnus.
- Refus par défaut et plafonds par compte pour empêcher les factures API incontrôlées.

## Paiements pour contenu adulte
- CCBill : https://ccbill.com/industries/adult-business ; https://ccbill.com/doc/
- Segpay : https://gethelp.segpay.com/docs/Content/DeveloperDocs/ProcessingAPI/Home-ProcessingAPI.htm
- Verotel FlexPay (crédits prépayés) : https://www.verotel.com/en/integration.html
- Stripe proscrit le contenu pornographique et le contenu IA explicite : https://stripe.com/fr-ca/legal/restricted-businesses

Aucun de ces prestataires n'est approuvé ni connecté au compte After Dark. Pour un marchand au Canada, frais de marque de cartes à risque, frais fixes, réserves, remboursements et approbation du modèle d'affaires doivent être confirmés par écrit. Le paiement par un client ne garantit pas absence totale d'avance ou de risque de chargeback.

## Exigences techniques avant activation
1. Obtenir autorisation du PSP adulte, contrat et prix vérifiés, compte marchand et versements conformes.
2. Configurer une authentification utilisateur réelle et une vérification d'âge répondant aux lois applicables.
3. Sauvegarder les crédits dans une base de données transactionnelle (unique provider + transaction ID), jamais localStorage.
4. Vérifier la signature et l'état final du paiement à partir des informations officielles du prestataire; réconcilier devise, montant, référence et produit.
5. Attribuer les crédits une seule fois; gérer annulation, remboursement, chargeback et débit idempotent.
6. Autoriser la génération seulement après réserve atomique des crédits et vérification des droits et du consentement, avec plafonds de coûts par compte.
7. Configurer uniquement des API IA dont les conditions autorisent les contenus souhaités. Aucun vrai visage ou nudification non consentie.
8. Tester paiement, remboursement, accès, concurrence des requêtes et panne API avant toute vente réelle.

## Etat concret du code
- premium-tools.mjs : catalogue de six outils, tous verrouillés.
- netlify/functions/premium-status.mjs : état de préparation, aucun faux solde affiché.
- netlify/functions/premium-execute.mjs : HTTP 423, refus de tout appel à un fournisseur payant.
- tools/adult-pricing.mjs : calculateur interne de prix et marge, exclu des fichiers publics.
- tests/premium-credits.test.mjs : tests de blocage, de statut et de calcul de marge.
- index.html, styles.css et app.mjs : boutique visuelle et navigation, sans prélèvement bancaire.

La publication est indépendante : seuls les déploiements confirmés de Netlify prouvent que les changements GitHub sont visibles sur le site.
