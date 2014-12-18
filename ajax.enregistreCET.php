<?php
/*
Planning Biblio, Plugin Congés Version 1.5.7
Licence GNU/GPL (version 2 et au dela)
Voir les fichiers README.md et LICENSE
Copyright (C) 2013-2014 - Jérôme Combes

Fichier : plugins/conges/ajax.enregistreCet.php
Création : 7 mars 2014
Dernière modification : 16 décembre 2014
Auteur : Jérôme Combes, jerome@planningbilbio.fr

Description :
Enregistre la demande de récupération
*/

session_start();
ini_set('display_errors',0);
include "../../include/config.php";
include "class.conges.php";

$id=$_GET['id'];
$perso_id=$_GET['perso_id'];
$validation=$_GET['validation'];
$isValidate=false;
$annee=date("Y")+1;

$data=array("perso_id"=>$perso_id,"jours"=>$_GET['jours'],"commentaires"=>$_GET['commentaires']);

// Si pas d'id, il s'git d'une demande, on ajoute l'annee pour laquelle le CET est demandé
if(!$id){
  $data["annee"]=$annee;
}

switch($validation){
  case -2 : $data['valideN2']=-$_SESSION['login_id']; $data['validationN2']=date("Y-m-d H:i:s"); break;
  case -1 : $data['valideN1']=-$_SESSION['login_id']; $data['validationN1']=date("Y-m-d H:i:s"); break;
  case 1  : $data['valideN1']= $_SESSION['login_id']; $data['validationN1']=date("Y-m-d H:i:s"); break;
  case 2  : $data['valideN2']= $_SESSION['login_id']; $data['validationN2']=date("Y-m-d H:i:s"); $isValidate=true; break;
}

if(is_numeric($id)){
  // Si la demande a déjà été validée, on interdit la modification
  $c=new conges();
  $c->id=$id;
  $c->getCET();
  if($c->elements[0]['valideN2']==0){
    // Modifie la demande d'alimentation du CET
    $data["modif"]=$_SESSION['login_id'];
    $data["modification"]=date("Y-m-d H:i:s");

    $db=new db();
    $db->update2("conges_CET",$data,array("id"=>$id));
    if($isValidate){
      // Mise à jour du compteur personnel/reliquat
      $heures=$data['jours']*7;
      $db=new dbh();
      $db->prepare("UPDATE `{$dbprefix}personnel` SET `congesReliquat`=(`congesReliquat`-:heures) WHERE `id`=:id;");
      $db->execute(array(":heures"=>$heures,":id"=>$id));

      // Mise à jour du compteur conges_CET / solde_prec
      $db=new dbh();
      $db->prepare("SELECT `solde_actuel` FROM `{$dbprefix}conges_CET` WHERE `annee`=:annee AND `valideN2`>0 
	  AND `validationN2`=MAX(`validationN2`) AND `perso_id`=:perso_id;");
      $db->execute(array(":annee"=>$annee,":perso_id"=>$id));
      $solde_prec=$db->result[0]['solde_actuel'];

      $c=new conges();
      $c->data=$data;
      $c->updateCETCredits();


      // Mise à jour des compteurs conges_CET / solde_actuel et solde_prec
    // A CONTINUER init :solde_actuel, solde_prec
      $db=new dbh();
      $db->prepare("UPDATE `{$dbprefix}conges_CET` SET `solde_actuel`=:solde_actuel, `solde_prec`=:solde_prec
	WHERE `annee`=:annee AND `valideN2`>0 AND `validationN2`=MAX(`validationN2`) AND `perso_id`=:perso_id);");
      $db->execute(array(":annee"=>$annee,":perso_id"=>$id));
      // A FAIRE : Mettre à jour les compteurs conges_CET/solde_prec et solde_actuel

    }
  }
}
else{
  // Enregistrement de la demande d'alimentation du CET
  $data["saisie"]=date("Y-m-d H:i:s");
  $data["saisie_par"]=$_SESSION['login_id'];

  $db=new db();
  $db->insert2("conges_CET",$data);
  if($isValidate){
    // A FAIRE : Mettre à jour les compteurs
    $c=new conges();
    $c->data=$data;
    $c->updateCETCredits();
  }
}

if($db->error){
  echo "###Demande-Erreur###";
}
else{
  echo "###Demande-OK###";

  // Envoi d'un e-mail à l'agent et aux responsables
  $p=new personnel();
  $p->fetchById($perso_id);
  $nom=$p->elements[0]['nom'];
  $prenom=$p->elements[0]['prenom'];
  $mail=$p->elements[0]['mail'];
  $mailsResponsables=$p->elements[0]['mailsResponsables'];

  $c=new conges();
  $c->getResponsables(null,null,$perso_id);
  $responsables=$c->responsables;

  // Choix des destinataires en fonction de la configuration
  $a=new absences();
  $a->getRecipients(1,$responsables,$mail,$mailsResponsables);
  $destinataires=$a->recipients;

  if(!empty($destinataires)){
    $sujet="Nouvelle demande de CET";
    $message="Une nouvelle demande de CET a été enregistrée pour $prenom $nom<br/><br/>";
    if($_GET['commentaires']){
      $message.="Commentaires : ".str_replace("\n","<br/>",$_GET['commentaires']);
    }
    sendmail($sujet,$message,$destinataires);
  }
}
?>