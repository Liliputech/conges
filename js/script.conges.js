/*
Planning Biblio, Plugin Congés Version 1.5.6
Licence GNU/GPL (version 2 et au dela)
Voir les fichiers README.md et LICENSE
Copyright (C) 2013-2015 - Jérôme Combes

Fichier : plugins/conges/js/script.conges.js
Création : 2 août 2013
Dernière modification : 3 décembre 2014
Auteurs : Jérôme Combes jerome@planningbilbio.fr, Etienne Cavalié etienne.cavalie@unice.fr

Description :
Fichier regroupant les fonctions JavaScript utiles à la gestion des congés
*/

function afficheRefus(me){
  if(me.value=="-1" || me.value=="-2"){
    document.getElementById("tr_refus").style.display="";
  }
  else{
    document.getElementById("tr_refus").style.display="none";
  }
}

function calculCredit(){
  debut=document.form.elements["debut"].value;
  fin=document.form.elements["fin"].value;
  hre_debut=document.form.elements["hre_debut"].value;
  hre_fin=document.form.elements["hre_fin"].value;
  perso_id=document.form.elements["perso_id"].value;
  if(!fin){
    fin=debut;
  }
  if(!debut){
    return;
  }
    
  hre_debut=hre_debut?hre_debut:"00:00:00";
  hre_fin=hre_fin?hre_fin:"23:59:59";
  
  $.ajax({
    url: "plugins/conges/ajax.calculCredit.php",
    data: "debut="+debut+"&fin="+fin+"&hre_debut="+hre_debut+"&hre_fin="+hre_fin+"&perso_id="+perso_id,
    type: "get",
    async: false,
    success: function(result){
      result=JSON.parse(result);
      var msg=result[0];
      if(msg=="error"){
	$("#erreurCalcul").val("true");
	document.form.elements["heures"].value=0;
	document.form.elements["minutes"].value=0;
	$("#nbHeures").text("0h00");
	$("#nbHeures").effect("highlight",null,3000);
	$("#nbJours").effect("highlight",null,3000);
	information("Aucun planning de présence enregistré pour cette période - calcul impossible.","error");
      }else{
	$("#JSInformation").remove();
	var tmp=result[1].split(".");
	var heures=tmp[0];
	var minutes=tmp[1];
	document.form.elements["heures"].value=heures;
	document.form.elements["minutes"].value=minutes;
	var array={"25":"15","50":"30","75":"45"};
	for(var val in array){
	  minutes=minutes.replace(val,array[val]);
	}
	$("#nbHeures").text(heures+"h"+minutes);
	$("#nbHeures").effect("highlight",null,3000);
	$("#nbJours").effect("highlight",null,3000);
	$("#erreurCalcul").val("false");
      }
    },
    error: function(){
      information("Impossible de calculer le nombre d'heures correspondant au congé demandé.","error");
    },
  });
  calculRestes();
}

function calculRestes(){
  heures=document.form.elements["heures"].value+"."+document.form.elements["minutes"].value;
  reliquat=document.form.elements["reliquat"].value;
  recuperation=document.form.elements["recuperation"].value;
  credit=document.form.elements["credit"].value;
  anticipation=document.form.elements["anticipation"].value;
  debit=document.form.elements["debit"].value
  jours=heures/7;
  $("#nbJours").text(jours.toFixed(2));

  // Calcul du reliquat après décompte
  reste=0;
  reliquat=reliquat-heures;
  if(reliquat<0){
    reste=-reliquat;
    reliquat=0;
  }

  reste2=0;
  // Calcul du crédit de récupération
  if(debit=="recuperation"){
    recuperation=recuperation-reste;
    if(recuperation<0){
      reste2=-recuperation;
      recuperation=0;
    }
  }
  
  // Calcul du crédit de congés
  else if(debit=="credit"){
    credit=credit-reste;
    if(credit<0){
      reste2=-credit;
      credit=0;
    }
  }
  
  // Si après tous les débits, il reste des heures, on débit le crédit restant
  reste3=0;
  if(reste2){
    if(debit=="recuperation"){
      credit=credit-reste2;
      if(credit<0){
	reste3=-credit;
	credit=0;
      }
    }
    else if(debit=="credit"){
      recuperation=recuperation-reste2;
      if(recuperation<0){
	reste3=-recuperation;
	recuperation=0;
      }
    }
  }
  
  if(reste3){
    anticipation=parseFloat(anticipation)+reste3;
  }
  
  // Affichage
  document.getElementById("reliquat4").innerHTML=heure4(reliquat);
  document.getElementById("recup4").innerHTML=heure4(recuperation);
  document.getElementById("credit4").innerHTML=heure4(credit);
  document.getElementById("anticipation4").innerHTML=heure4(anticipation);
}


function googleCalendarIcon(){
  var debut=$("#debut").val();
  var debut_hre=$("#hre_debut_select").val();
  var fin=$("#fin").val();
  var fin_hre=$("#hre_fin_select").val();
  var agent=$("#agent").val();
  var location="";

  $("#google-calendar-div").html("");

  if(!debut){
    return false;
  }

  if($("select#perso_id").length>0){
    agent=$("select#perso_id").find(":selected").text();
  }

  debut=debut.replace(/([0-9]*)\/([0-9]*)\/([0-9]*)/g,"$3$2$1");
  fin=fin?fin.replace(/([0-9]*)\/([0-9]*)\/([0-9]*)/g,"$3$2$1"):debut;
  
  debut_hre=debut_hre?debut_hre.replace(/:/g,""):"000000";
  fin_hre=fin_hre?fin_hre.replace(/:/g,""):"235959";

  debut=debut+"T"+debut_hre;
  fin=fin+"T"+fin_hre;

  var link="<a style='margin-left: 30px;' target='_blank' id='googleCalendarLink' title='Ajouter dans mon agenda Google' ";
  link+="href='https://www.google.com/calendar/event?action=TEMPLATE&hl=fr&text=Congés "+agent+"&dates="+debut+"/"+fin+"&location="+location+"&ctz=Europe%2FParis&amp;details='>";
  link+="<span class='pl-icon pl-icon-google-calendar'></span></a>";
  
  $("#google-calendar-div").append(link);
}


function supprimeConges(){
  conf=confirm("Etes-vous sûr(e) de vouloir supprimer ce congé ?");
  if(conf){
    $.ajax({
      url: "plugins/conges/ajax.supprime.php",
      type: "get",
      data: "id="+$("#id").val(),
      success: function(){
	location.href="index.php?page=plugins/conges/voir.php";
      },
      error: function(){
	information("Une erreur est survenue lors de la suppresion du congé.","error");
      }
    });
  }
}

function valideConges(){
  document.form.elements["valide"].value="1";
  document.form.submit();
}

function verifConges(){
  if($("#erreurCalcul").val()=="true"){
    information("Aucun planning de présence enregistré pour cette période - calcul impossible.","error");
    return false;
  }

  // Variable, convertion des dates au format YYYY-MM-DD
  var debut=dateFr($("#debut").val());
  var fin=$("#fin").val()?dateFr($("#fin").val()):debut;
  var hre_debut=$("#hre_debut_select").val();
  var hre_fin=$("#hre_fin_select").val();
  var perso_id=$("#perso_id").val();
  var id=$("#id").val();
  if(hre_fin==""){
    hre_fin="23:59:59";
  }
  // Vérifions si les dates sont correctement saisies
  if($("#debut").val()==""){
    information("Veuillez choisir la date de début","error");
    return false;
  }

  // Vérifions si les dates sont cohérentes
  if(debut+" "+hre_debut >= fin+" "+hre_fin){
    information("La date de fin doit être supérieure à la date de début","error");
    return false;
  }
  // Vérifions si un autre congé a été demandé ou validé
  var result=$.ajax({
    url: "plugins/conges/ajax.verifConges.php",
    type: "get",
    data: "perso_id="+perso_id+"&debut="+debut+"&fin="+fin+"&hre_debut="+hre_debut+"&hre_fin="+hre_fin+"&id="+id,
    success: function(){
      if(result.responseText != "Pas de congé"){
	information("Un congé a déjà été demandé "+result.responseText,"error");
      }else{
	$("#form").submit();
      }
    },
    error: function(){
      information("Une erreur est survenue lors de l'enregistrement du congé","error");
    },
  });
}

function verifRecup(o){
  var perso_id=$("#agent").val();
  var retour=false;
  $.ajax({
    url: "plugins/conges/ajax.verifRecup.php",
    data: "date="+o.val()+"&perso_id="+perso_id,
    type: "get",
    async: false,
    success: function(result){
      if(result=="Demande"){
	o.addClass( "ui-state-error" );
	updateTips( "Une demande a déjà été enregistrée pour le "+o.val()+"." );
      }else{
	retour=true;
      }
    },
    error: function(result){
      updateTips( "Une erreur s'est produite lors de la vérification des récupérations enregistrées");
    }
  });
  return retour;
}


// Dialog, récupérations

function checkLength( o, n, min, max ) {
  if ( o.val().length > max || o.val().length < min ) {
    o.addClass( "ui-state-error" );
    updateTips( "Veuillez sélectionner le nombre d'heures.");
  return false;
  } else {
    return true;
  }
}

function checkInt( o, n, min, max, tips ) {
  if ( o.val() > max || o.val() < min ) {
    o.addClass("ui-state-error");
    updateTips(tips);
  return false;
  } else {
    return true;
  }
}

function checkDateAge( o, limit, n, tip ) {
  // Calcul de la différence entre aujourd'hui et la date demandée
  if(tip==undefined){
    tip=true;
  }
  var today=new Date();
  var d=new Date();
  tmp=o.val().split("/");
  d.setDate(parseInt(tmp[0]));
  d.setMonth(parseInt(tmp[1])-1);
  d.setFullYear(parseInt(tmp[2]));
  diff=dateDiff(d,today);
  if(diff.day>limit){
    if(tip){
      o.addClass( "ui-state-error" );
      updateTips( n );
    }
    return false;
  } else {
    return true;
  }
}

function checkSamedi( o, n ) {
  var d=new Date();
  tmp=o.val().split("/");
  var date=tmp[0]==31?24:parseInt(tmp[0]);	// Ceci car getDay erroné à chaque fois que le samedi tombe un 31
  d.setDate(date);
  d.setMonth(parseInt(tmp[1])-1);
  d.setFullYear(parseInt(tmp[2]));
  if(d.getDay()!=6){
    o.addClass( "ui-state-error" );
    updateTips( n );
    return false;
  } else {
    return true;
  }
}

$(document).ready(function() {
  
  // Initialisation de la dataTable Conges (voir les conges, voir.php)
  if($("#tableConges").length){
    var tableCongesCols=$("#tableConges thead th").length-1;
    var tableCongesColumns= [{"bSortable":false},{"sType": "date-fr"},{"sType": "date-fr-fin"},{"bSortable":true},{"bSortable":true},
      {"sType": "date-fr"},{"bSortable":true},{"bSortable":true},{"bSortable":true},{"bSortable":true}];
       
    if(tableCongesCols==11){
      tableCongesColumns.push({"bSortable":true});
    }

    $("#tableConges").dataTable({
      "bJQueryUI": true,
      "sPaginationType": "full_numbers",
      "bStateSave": true,
      "aaSorting" : [[1,"asc"],[2,"asc"]],
      "aoColumns" : tableCongesColumns,
      "aLengthMenu" : [[25,50,75,100,-1],[25,50,75,100,"Tous"]],
      "iDisplayLength" : 25,
      "oLanguage" : {"sUrl" : "vendor/dataTables.french.lang"}
    });
  }
  

  // Initialisation de la dataTable Credits (credits.php)
  if($("#tableCredits").length){
    $("#tableCredits").dataTable({
      "bJQueryUI": true,
      "sPaginationType": "full_numbers",
      "bStateSave": true,
      "aaSorting" : [[0,"asc"]],
      "aoColumns" : [{"bSortable":true},
	{"sType": "heure-fr"},{"sType": "heure-fr"},{"sType": "heure-fr"},{"sType": "heure-fr"},
	{"sType": "heure-fr"},{"sType": "heure-fr"},{"sType": "heure-fr"},
	{"sType": "heure-fr"},{"sType": "heure-fr"},{"sType": "heure-fr"},
	{"sType": "heure-fr"},{"sType": "heure-fr"},{"sType": "heure-fr"}],
      "aLengthMenu" : [[30,60,90,120,-1],[30,60,90,120,"Tous"]],
      "iDisplayLength" : 30,
      "oLanguage" : {"sUrl" : "vendor/dataTables.french.lang"},
      "sDom": '<"H"lfr>t<"F"ip>T',
      "oTableTools": {
	"sSwfPath" : "vendor/DataTables-1.10.4/extensions/TableTools/swf/copy_csv_xls.swf",
	"aButtons": [
	  {
	    "sExtends": "xls",
	    "sButtonText": "Excel",
	  },
	  {
	    "sExtends": "csv",
	    "sButtonText": "CSV",
	  },
	  {
	    "sExtends": "pdf",
	    "sButtonText": "PDF",
	  },
	  {
	    "sExtends": "print",
	    "sButtonText": "Imprimer",
	  },
	]
      }
    });
  }

});

$(function(){
  if($(".googleCalendarTrigger").length){
    $(".googleCalendarTrigger").change(function(){
      googleCalendarIcon();
      calculCredit();
    });

    $(".googleCalendarForm").ready(function(){
      googleCalendarIcon();
      calculCredit();
    });
  }
});