const domainIDs = { ur1: "univ-rennes1.fr", nd: "nd.edu", unilu: "uni.lu" }
const emailPPC = {
  nom: "Pierre Perruchaud",
  id: "pierre.per"+"ruchaud",
  domaineID: "unilu"
  }

var logo = ""

function emailfromdata(data,complete=true){
  const href = data.id + "@" + ("domaineID" in data ? domainIDs[data["domaineID"]] : data["domain"])
  return ("nom" in data) && complete ? data.nom + " <" + href + ">" : href;
  }

function changerInfo(texte){
  $("#logo").fadeOut(100,function(){
    logo = (logo === "") ? $("#logo").html() : logo;
    $("#logo").html(texte);
    $("#logo").fadeIn(100);});
  }

$(document).ready(function(){
  $("a.email").each(function(i,e){
    const data = JSON.parse(e.getAttribute("data"));
    e.removeAttribute("data");
    e.setAttribute("href","mailto:"+emailfromdata(data));
    address = emailfromdata(data,complete=false);
    const label = data.label.replace(/\$a/g,address).replace(/\$n/g,data.nom).replace(/\$i/g,data.id);
    e.innerHTML = label;
    });
  
  $(".adresse").mouseenter(function(){
    changerInfo("Office: MNO, E05 0525-030<br>\
                 Mail: Université du Luxembourg<br>\
                 Maison du Nombre<br>\
                 6, Avenue de la Fonte<br>\
                 L-4364 Esch-sur-Alzette");
    });
  $(".adresse").click(function(){
    alert("Pierre Perruchaud\nOffice: MNO, E05 0525-030\nMail: Université du Luxembourg\nMaison du Nombre\n6, Avenue de la Fonte\nL-4364 Esch-sur-Alzette\nLuxembourg");
    });
  
  $(".mail").mouseenter(function(){
    changerInfo(emailfromdata(emailPPC,false));
    });
  $(".mail").click(function(){
    window.location.href = "mailto:" + emailfromdata(emailPPC);
    });

  $(".telephone").mouseenter(function(){
    changerInfo("(+352) 46 66 44 5412");
    });
  $(".telephone").click(function(){
    alert("(+352) 46 66 44 5412");
    });
  
  $(".glyphicon-rond").mouseleave(function(){
    changerInfo(logo);
    });
  
  MathJax.Hub.Queue(["Typeset",MathJax.Hub,"contenu"]);
 });
