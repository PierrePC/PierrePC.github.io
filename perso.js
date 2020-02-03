const ur1 = "univ-rennes1.fr"
const nd = "nd.edu"

var logo = ""

function emailfromdata(nom,adresse,domaine){
  return nom + " <" + adresse + "@" + domaine + ">";
  }

function changerInfo(texte){
  $("#logo").fadeOut(100,function(){
    logo = (logo === "") ? $("#logo").html() : logo;
    $("#logo").html(texte);
    $("#logo").fadeIn(100);});
  }

$(document).ready(function(){
  $(".adresse").mouseenter(function(){
    changerInfo("Pierre Perruchaud<br>\
                 Office: Hayes-Healy 202<br>\
                 Mail: 255 Hurley Building<br>\
                 Notre Dame, IN 46556-4618");
    });
  $(".adresse").click(function(){
    alert("Pierre Perruchaud\nOffice: Hayes-Healy 202\nMail: 255 Hurley Building\nNotre Dame, IN 46556-4618");
    });
  
  $(".mail").mouseenter(function(){
    changerInfo("p"+"perruch"+"@"+nd);
    });
  $(".mail").click(function(){
    window.location.href = "mailto:" + emailfromdata("Pierre Perruchaud","pperruch",nd);
    });

  $(".telephone").mouseenter(function(){
    changerInfo("+1 (574) 631-6438");
    });
  $(".telephone").click(function(){
    alert("+1 (574) 631-6438");
    });
  
  $(".glyphicon-rond").mouseleave(function(){
    changerInfo(logo);
    });
  
  MathJax.Hub.Queue(["Typeset",MathJax.Hub,"contenu"]);
 });
