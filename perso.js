const domainIDs = { ur1: "univ-rennes1.fr", nd: "nd.edu" }
const emailPPC = {
  nom: "Pierre Perruchaud",
  id: "pper"+"ruch",
  domaineID: "nd"
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
    changerInfo("Pierre Perruchaud<br>\
                 Office: Hayes-Healy 202<br>\
                 Mail: 255 Hurley Building<br>\
                 Notre Dame, IN 46556-4618");
    });
  $(".adresse").click(function(){
    alert("Pierre Perruchaud\nOffice: Hayes-Healy 202\nMail: 255 Hurley Building\nNotre Dame, IN 46556-4618");
    });
  
  $(".mail").mouseenter(function(){
    changerInfo(emailfromdata(emailPPC,false));
    });
  $(".mail").click(function(){
    window.location.href = "mailto:" + emailfromdata(emailPPC);
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
