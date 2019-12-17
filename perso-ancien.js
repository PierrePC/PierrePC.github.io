var domaine = "univ-rennes1.fr"

function adresse(doc,nom,adresse,reste,visible)
    {
    doc.write( "<a href='" + "mail" + "to:" + nom + " <" + adresse +"@" + reste + ">'>" + visible + "</a>");
    };

function siTropPetit()
    {
    var flag = $('.device-xs').is(':visible');
    var dphoto = $('.div-photo');
    var nom = $('.nom');
    if(flag)
      {dphoto.css('float','none');nom.css('text-align','center');}
    else
      {dphoto.css('float','left');nom.css('text-align','left');}
    };

    window.onload=function(){siTropPetit();};
    window.onresize=function(){siTropPetit();};
