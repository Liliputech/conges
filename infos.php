<?php
/**
Planning Biblio, Plugin Congés Version 2.5.4
Licence GNU/GPL (version 2 et au dela)
Voir les fichiers README.md et LICENSE
@copyright 2013-2017 Jérôme Combes

Fichier : plugins/conges/infos.php
Création : 24 juillet 2013
Dernière modification : 10 février 2017
@author Jérôme Combes <jerome@planningbiblio.fr>

Description :
Page permettant d'ajouter des informations relatives aux congés.
Accessible aux agents ayant le droit de gérer les congés.
Accessible par le menu congés/infos ou par la page plugins/conges/index.php
Appelée par le fichier index.php
*/

require_once "class.conges.php";

echo "<h3>Informations sur les congés</h3>\n";

// Initialisation des variables
$CSRFToken=filter_input(INPUT_GET,"CSRFToken",FILTER_SANITIZE_STRING);
$id=filter_input(INPUT_GET,"id",FILTER_SANITIZE_NUMBER_INT);
$debut=filter_input(INPUT_GET,"debut",FILTER_CALLBACK,array("options"=>"sanitize_dateFr"));
$fin=filter_input(INPUT_GET,"fin",FILTER_CALLBACK,array("options"=>"sanitize_dateFr"));
$texte=filter_input(INPUT_GET,"texte",FILTER_SANITIZE_STRING);
$suppression=filter_input(INPUT_GET,"suppression",FILTER_CALLBACK,array("options"=>"sanitize_on"));
$validation=filter_input(INPUT_GET,"validation",FILTER_CALLBACK,array("options"=>"sanitize_on"));

// Suppression
if($suppression and $validation){
  $db=new db();
  $db->delete("conges_infos","id='$id'");
  echo "<b>L'information a été supprimée</b>";
  echo "<br/><br/><a href='index.php?page=plugins/conges/index.php'>Retour</a>\n";
}
elseif($suppression){
  echo "<h4>Etes vous sûr de vouloir supprimer cette information ?</h4>\n";
  echo "<form method='get' action='#' name='form'>\n";
  echo "<input type='hidden' name='page' value='plugins/conges/infos.php'/>\n";
  echo "<input type='hidden' name='suppression' value='1'/>\n";
  echo "<input type='hidden' name='validation' value='1'/>\n";
  echo "<input type='hidden' name='id' value='$id'/>\n";
  echo "<input type='button' value='Non' onclick='history.back();' class='ui-button'/>\n";
  echo "&nbsp;&nbsp;&nbsp;";
  echo "<input type='submit' value='Oui' class='ui-button'/>\n";
  echo "</form>\n";
}

// Validation du formulaire
elseif($validation){
  echo "<b>Votre demande a été enregistrée</b>\n";
  echo "<br/><br/><a href='index.php?page=plugins/conges/index.php'>Retour</a>\n";
  $db=new db();
  $db->CSRFToken = $CSRFToken;
  if($id){
    $db->update2("conges_infos",array("debut"=>dateSQL($debut),"fin"=>dateSQL($fin),"texte"=>$texte),array("id"=>$id));
  }
  else{
    $db->insert2("conges_infos",array("debut"=>dateSQL($debut),"fin"=>dateSQL($fin),"texte"=>$texte));
  }
}
// Vérification
elseif($debut){
  $texte=htmlentities($texte,ENT_QUOTES|ENT_IGNORE,"UTF-8");
  $fin=$fin?$fin:$debut;
  echo "<h4>Confirmation</h4>";
  echo "Du $debut au $fin<br/>";
  echo str_replace("\n","<br/>",$texte);
  echo "<br/><br/>";
  echo "<form method='get' action='index.php' name='form'>";
  echo "<input type='hidden' name='page' value='plugins/conges/infos.php'/>\n";
  echo "<input type='hidden' name='CSRFToken' value='$CSRFToken'/>\n";
  echo "<input type='hidden' name='debut' value='$debut'/>\n";
  echo "<input type='hidden' name='fin' value='$fin'/>\n";
  echo "<input type='hidden' name='texte' value='$texte'/>\n";
  echo "<input type='hidden' name='id' value='$id'/>\n";
  echo "<input type='hidden' name='validation' value='1'/>\n";
  echo "<input type='button' value='Annuler' onclick='history.back();' class='ui-button'/>";
  echo "&nbsp;&nbsp;&nbsp;\n";
  echo "<input type='submit' value='Valider' class='ui-button'/>\n";
  echo "</form>";
}
// FIN Validation du formulaire
else{
  if($id){
    $db=new db();
    $db->select("conges_infos","*","id='$id'");
    $debut=dateFr($db->result[0]['debut']);
    $fin=dateFr($db->result[0]['fin']);
    $texte=$db->result[0]['texte'];
    echo "<h4>Modifications des informations sur les congés</h4>\n";
  }
  else{
    echo "<h4>Ajout d'une information</h4>\n";
  }

  echo <<<EOD
  <form method='get' action='index.php' name='form' onsubmit='return verif_form("debut=date1;fin=date2;texte");'>\n
  <input type='hidden' name='page' value='plugins/conges/infos.php'/>\n
  <input type='hidden' name='CSRFToken' value='$CSRFSession'/>\n
  <input type='hidden' name='id' value='$id'/>\n
  <table class='tableauFiches'>
  <tr><td>
  Date de début :
  </td><td>
  <input type='text' name='debut' value='$debut' class='datepicker'/>
  </td></tr><tr><td>
  Date de fin :
  </td><td>
  <input type='text' name='fin' value='$fin' class='datepicker'/>
  </td></tr><tr><td>
  Texte : 
  </td><td>
  <textarea name='texte' rows='3' cols='25' class='ui-widget-content ui-corner-all' >$texte</textarea>
  </td></tr><tr><td>&nbsp;
  </td></tr>
  <tr><td colspan='2'>
EOD;
  if($id){
    echo "<input type='button' value='Supprimer' onclick='document.location.href=\"index.php?page=plugins/conges/infos.php&amp;id=$id&amp;suppression=1\";'  class='ui-button'/>\n";
    echo "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\n";
  }
  echo <<<EOD
  <input type='button' value='Annuler' onclick='document.location.href=index.php?page=plugins/conges/index.php;' class='ui-button'/>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  <input type='submit' value='Valider' class='ui-button'/>
  </td></tr></table>
  </form>
EOD;
}
?>