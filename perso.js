const domainIDs = { ur1: "univ-rennes1.fr", nd: "nd.edu", unilu: "uni.lu", Monash: "monash.edu" }
const emailPPC = {
  nom: "Pierre Perruchaud",
  id: "pierre.per"+"ruchaud",
  domainID: "Monash"
  }

var logo = ""

function emailfromdata(data,complete=true){
  const href = data.id + "@" + ("domainID" in data ? domainIDs[data["domainID"]] : data["domain"])
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
    changerInfo("Office: Room 452, level 4, School of Mathematics<br>\
                 Mail: Monash University<br>\
                 Room 452<br>\
                 9 Rainforest Walk<br>\
                 Clayton Campus, VIC 3800");
    });
  $(".adresse").click(function(){
    alert("Pierre Perruchaud\nOffice: Room 452, level 4, School of Mathematics\nMail: Monash University\nRoom 452\n9 Rainforest Walk\nClayton Campus, VIC 3800");
    });
  
  $(".mail").mouseenter(function(){
    changerInfo("<p class='text-center'>" + emailfromdata(emailPPC,false) + "</p>");
    });
  $(".mail").click(function(){
    window.location.href = "mailto:" + emailfromdata(emailPPC);
    });

  /*
  $(".telephone").mouseenter(function(){
    changerInfo("(+352) 46 66 44 5412");
    });
  $(".telephone").click(function(){
    alert("(+352) 46 66 44 5412");
    });
  */
  
  $(".glyphicon-rond").mouseleave(function(){
    changerInfo(logo);
    });
  
  $(".abstractButton").each(function(){
    $(this).attr("data-toggle","collapse");
    $(this).addClass("collapsed");
    });
  
  MathJax.Hub.Queue(["Typeset",MathJax.Hub,"contenu"]);
 });
