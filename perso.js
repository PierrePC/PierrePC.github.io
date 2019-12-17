var ur1 = "univ-rennes1.fr"
var nd = "nd.edu"

function emailfromdata(nom,adresse,domaine){
  return nom + " <" + adresse + "@" + domaine + ">";
  }

function changerInfo(texte){
  $("#info").fadeOut(100,function(){
    $("#info").html(texte);
    $("#info").fadeIn(100);});
  }

$(document).ready(function(){
  var besoinDeCliquer = true;
  
  $(window).on("load hashchange",function(){
    if(window.location.hash) {
      var cible = window.location.hash.substring(1);
    } else{
      var cible = $("#barre li:first-child a").attr("href").substr(1);
    }
    if(besoinDeCliquer){$("a[href='#"+cible+"']").click();}
    besoinDeCliquer = true;
    });
  
  $(".adresse").mouseenter(function(){
    changerInfo("Pierre Perruchaud<br>\
                 255 Hurley Building<br>\
                 Notre Dame, IN 46556-4618");
    });
  $(".adresse").click(function(){
    alert("Pierre Perruchaud\n255 Hurley Building\nNotre Dame, IN 46556-4618");
    });
  
  $(".mail").mouseenter(function(){
    changerInfo("p"+"perruch"+"@"+nd);
    });
  $(".mail").click(function(){
    window.location.href = "mailto:" + emailfromdata("Pierre Perruchaud","pperruch",nd);
    });

  $(".telephone").mouseenter(function(){
    changerInfo("+1 (574) 634-6438");
    });
  $(".telephone").click(function(){
    alert("+1 (574) 634-6438");
    });
  
  $(".glyphicon-rond").mouseleave(function(){
    changerInfo("");
    });
  
  $(".onglet").click(function(){
    var cible = $(this).attr("href").substr(1);
    $("#page").load(cible + ".html",function(){
      $(".mini-onglet").click(function(e){
        e.preventDefault();
        $(".mini-contenu.active").slideUp(150);
        $(".mini-contenu.active").removeClass("active");
        $(".mini-onglet.active").removeClass("active");
        var cible = $(this).attr("href");
        $(cible).slideDown(150);
        $(cible).addClass("active")
        $(this).addClass("active")
        });
     $(".mini-onglet:first").click();
     $(".deroulable .accroche").click(function(){
        $(this).children("i").toggleClass("glyphicon-menu-right");
        $(this).children("i").toggleClass("glyphicon-menu-down");
        $(this).next().slideToggle(150);
        });
      $("a.email").attr("href",function(){
        return "mailto:" + emailfromdata($(this).attr("data-nom"),
                                         $(this).attr("data-adresse"),
                                         $(this).attr("data-domaine"));
        });
      MathJax.Hub.Queue(["Typeset",MathJax.Hub,"contenu"]);
      });
    besoinDeCliquer = false;
    document.location.hash = cible;
   });
 });
