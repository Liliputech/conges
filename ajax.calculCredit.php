<?php
/*
Planning Biblio, Plugin Congés Version 1.6.5
Licence GNU/GPL (version 2 et au dela)
Voir les fichiers README.md et LICENSE
Copyright (C) 2013-2015 - Jérôme Combes

Fichier : plugins/conges/ajax.calculCredit.php
Création : 2 août 2013
Dernière modification : 22 avril 2015
Auteur : Jérôme Combes, jerome@planningbiblio.fr

Description :
Calcul le nombre d'heures correspondant à un congé
Appelé en arrière plan par la fonction JS calculCredit() (fichier plugins/conges/js/script.conges.js) 
  lors du clic sur le bouton calculer du formulaire de saisie de congés (fichier plugins/conges/enregistrer.php)
*/

require_once "../../include/config.php";
require_once "class.conges.php";

// Initilisation des variables
$debut=dateSQL(filter_input(INPUT_GET,"debut",FILTER_CALLBACK,array("options"=>"sanitize_dateFr")));
$fin=dateSQL(filter_input(INPUT_GET,"fin",FILTER_CALLBACK,array("options"=>"sanitize_dateFr")));
$hre_debut=filter_input(INPUT_GET,"hre_debut",FILTER_CALLBACK,array("options"=>"sanitize_time"));
$hre_fin=filter_input(INPUT_GET,"hre_fin",FILTER_CALLBACK,array("options"=>"sanitize_time"));
$perso_id=filter_input(INPUT_GET,"perso_id",FILTER_SANITIZE_NUMBER_INT);

$c=new conges();
$c->calculCredit($debut,$hre_debut,$fin,$hre_fin,$perso_id);
$result=$c->error?array("error"):array("OK");
$result[]=$c->heures;
echo json_encode($result);
?>