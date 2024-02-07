/********************************************************************************************************************/
/*                                     Declaration de variables globales                                            */
/********************************************************************************************************************/


/*  Variables de coordonnees de dessin */
var xMousePos;                              // Valeur x de la position du curseur
var yMousePos;                              // Valeur y de la position du curseur
var xStart;                                 // Valeur x du point de depart du rectangle de selection
var yStart;                                 // Valeur y du point de depart du rectangle de selection
var xEnd;                                   // Valeur x du point de fin de la diagonale du rectangle de selection
var yEnd;                                   // Valeur y du point de fin de la diagonale du rectangle de selection
var xInit;                                  // Valeur x de la position du curseur par rapport au x0 du Canva0 (zone de dessin)
var yInit = 0;                              // Valeur y de la position du curseur par rapport au y0 du Canva0 (zone de dessin)

var dataURL;                                // conteneur de sauvegarde temporaire du dessin

var objRatio = 0;                           // valeur du ratio hauteur/largeur de l'objet/menuiserie
var vueRatio = 0;                           // valeur du ratio hauteur/largeur de la vue/bâtiment

var isProportionel;                         // booleen de Mode : le dessin de l'objet doit-il conserver son ratio de proportionnalite
var isParPoint;                             // booleen de Mode : le dessin est-il genere par le positionnement libre de quatre points par l'utilisateur
var transparent;                    // booleen de Mode : le dessin de l'objet doit-il être transparent
var isFlip;                                 // booleen de Mode : l'image de l'objet est-elle retournee sur son axe vertical (mirroir) // non implemente

var selection;                              // booleeen d'etat : L'application est-elle en cours de selection d'une zone
var tactile = isTouchDevice();              // booleeen d'etat : Determine si le terminal est tactile

var drawned;                                // indique si une image de l'objet est dejà dessine sur le Canva0(zone de dessin)

var transValue = 230;                       // valeur du seuil de transparence sur les pixels R G B pour la manipulation du Image Data

var monQuad = [];                  // monQuad est le conteneur pour les coordonees du quadrilataire dessine par point
var mesObjets = [];                // mesObjets est le conteneur des objets dessines sur le canvas (non implemente pour le moment)

var couleurFond;

/* Raccourcis vers les boutons */
var btnFlip = document.getElementById("btnFlip");
var btnProp = document.getElementById("btnProp");
var btnPerso = document.getElementById("btnPerso");
var btnPoint = document.getElementById("btnPoint");

var btnDelObj = document.getElementById("btnDelObj");
var btnExport = document.getElementById("btnExport");

var btnupVue = document.getElementById("btnupVue");
var btnupObj = document.getElementById("btnupObj");


/* Raccourcis vers les inputs */
var inpVueSet = document.getElementById("inpVueSet");
var inpObjSet = document.getElementById("inpObjSet");


/* Raccourcis vers les Canvas */
var canvas0 = document.getElementById("canvas0");         // Canvas de dessin principal
var ctx0 = canvas0.getContext("2d");                      // son context

var canvas1 = document.getElementById("canvas1");         // Canvas calque pour la mention et l'enregistrement
var ctx1 = canvas1.getContext("2d");                      // son context

var canvasT = document.getElementById("canvasT");         // Canvas calque pour la gestion de la transparence
var ctxT = canvasT.getContext("2d");                      // son context


/* Raccourcis elements div */
var divMention = document.getElementById("divMention");

var rectangle = document.getElementById("rectangle");


/*Element image pour l'objet/menuiserie*/
var img_obj = document.getElementById("img_obj");


/*Images de vue/batiment et objet/menuiserie*/
var imageVue = new Image();
imageVue.src = document.getElementById("path_vue").value;

var imageObj = new Image();
imageObj.src = document.getElementById("path_objet").value;


/* Detection de la version du navigateur sur le poste client */
var browserName = (function (agent) {
  switch (true) {
    case agent.indexOf("edge") > -1:
      return "MS Edge";
    case agent.indexOf("edg/") > -1:
      return "Edge (chromium based)";
    case agent.indexOf("opr") > -1 && !!window.opr:
      return "Opera";
    case agent.indexOf("chrome") > -1 && !!window.chrome:
      return "Chrome";
    case agent.indexOf("trident") > -1:
      return "MS IE";
    case agent.indexOf("firefox") > -1:
      return "Mozilla Firefox";
    case agent.indexOf("safari") > -1:
      return "Safari";
    default:
      return "other";
  }
})(window.navigator.userAgent.toLowerCase());



/********************************************************************************************************************/
/*                                           Demarrage EventListener                                                */
/********************************************************************************************************************/


/**************************    DOMContentLoaded    **************************/

document.addEventListener("DOMContentLoaded", startup);


/**************************    Event window.resize    **************************/

window.addEventListener('resize', function () { 
  window.location.href = window.location.href;
});


/**************************    Event window.load    **************************/

window.addEventListener("load", () => {
  objRatio = imageObj.naturalWidth / imageObj.naturalHeight;    // definition du ratio de l'img Objet
  vueRatio = imageVue.naturalWidth / imageVue.naturalHeight;    // definition du ratio de l'img Vue
  let sitHeight = window.innerHeight - 35;                  // definition de la hauteur allouable au Canvas0

  canvas0.width = document.getElementById("Situation_view").offsetWidth;

  // Ici on defini la zone d'affichage du Canvas0 pour que l'image de la vue soit toujours affichee au bon ratio (sans deformation)
  if (
    (imageVue.naturalHeight / imageVue.naturalWidth) * canvas0.width >
    sitHeight
  ) {
    canvas0.height = sitHeight;
    canvas0.width = sitHeight * (imageVue.naturalWidth / imageVue.naturalHeight);
  } else {
    canvas0.height = canvas0.width / vueRatio;
  }

  isProportionel = true; // mode par defaut ce chargement surcharge l'affectation par le biais de PHP
  //(pour eviter un disfonctionnement lorsque que l'on ne recharge pas la page)
  isParPoint = false;
  isFlip = btnFlip.checked;

  // Ici on affiche la miniature de l'img Objet en mirroir ou sens original en fonction de l'etat de la checkbox btnFlip
  // la checkbox elle-même est affecte par le chargement des donnees en PHP !!! Fonction desactive et donc inaccessible pour le moment
  if (isFlip) {
    img_obj.style.transform = "scaleX(-1)";
  } else {
    img_obj.style.transform = "scaleX(1)";
  }

  initVue(); // Chargement Canva0 et mention
  activemention(false);
  btnExport.disabled = true; // impossible d'exporter la mise en situation tant qu'aucun objet n'a ete pose dessus
  couleurFond = "#343a40";
});




/********************************************************************************************************************/
/*                                             Gestion des inputs                                                   */
/********************************************************************************************************************/


/**************************    Gestion du changement des inputs de la vue et de l'objet    **************************/

inpVueSet.addEventListener("change", (event) => {
  inpVueSet.form.submit();
});

inpObjSet.addEventListener("change", (event) => {
  inpObjSet.form.submit();
});



/********************************************************************************************************************/
/*                              Gestion de la Mention "Photo non contractuelle"                                     */
/********************************************************************************************************************/

/**************************    Activation mention    **************************/

function activemention(mavalue) {
  document.getElementById("mention").disabled = !mavalue;
  document.getElementById("dropMentionPos").disabled = !mavalue;
}


/**************************    Gestion du texte    **************************/

document.getElementById("mention").addEventListener("change", (event) => {
  document.getElementById("divMention").innerHTML =
    document.getElementById("mention").value;
});


/**************************    Gestion de la position    **************************/

document.getElementById("menPosTL").addEventListener("click", function () {
  divMention.style.top = canvas0.offsetTop + "px";
  divMention.style.left = canvas0.offsetLeft + 10 + "px";
  document.getElementById("dropMentionPos").innerHTML = this.innerHTML;
});

document.getElementById("menPosTR").addEventListener("click", function () {
  divMention.style.top = canvas0.offsetTop + "px";
  divMention.style.left =
    canvas0.offsetWidth +
    canvas0.offsetLeft -
    divMention.offsetWidth -
    10 +
    "px";
  document.getElementById("dropMentionPos").innerHTML = this.innerHTML;
});

document.getElementById("menPosBR").addEventListener("click", function () {
  divMention.style.top = canvas0.offsetHeight + canvas0.offsetTop - 38 + "px";
  divMention.style.left =
    canvas0.offsetWidth +
    canvas0.offsetLeft -
    divMention.offsetWidth -
    10 +
    "px";
  document.getElementById("dropMentionPos").innerHTML = this.innerHTML;
});

document.getElementById("menPosBL").addEventListener("click", function () {
  divMention.style.top = canvas0.offsetHeight + canvas0.offsetTop - 38 + "px";
  divMention.style.left = canvas0.offsetLeft + 10 + "px";
  document.getElementById("dropMentionPos").innerHTML = this.innerHTML;
});


/**************************    Gestion de la couleur    **************************/

document.getElementById("dropNone").addEventListener("click", function () {
  document.getElementById("dropMention").innerHTML = this.innerHTML;
  divMention.hidden = true;
  activemention(false);
});

document.getElementById("dropWhite").addEventListener("click", function () {
  activemention(true);
  document.getElementById("dropMention").innerHTML = this.innerHTML;
  divMention.hidden = false;
  divMention.style.color = this.value;
});

document.getElementById("dropBlack").addEventListener("click", function () {
  activemention(true);
  document.getElementById("dropMention").innerHTML = this.innerHTML;
  divMention.hidden = false;
  divMention.style.color = this.value;
});

document.getElementById("dropRed").addEventListener("click", function () {
  activemention(true);
  document.getElementById("dropMention").innerHTML = this.innerHTML;
  divMention.hidden = false;
  divMention.style.color = this.value;
});

document.getElementById("dropYellow").addEventListener("click", function () {
  activemention(true);
  document.getElementById("dropMention").innerHTML = this.innerHTML;
  divMention.hidden = false;
  divMention.style.color = this.value;
});

document.getElementById("dropLime").addEventListener("click", function () {
  activemention(true);
  document.getElementById("dropMention").innerHTML = this.innerHTML;
  divMention.hidden = false;
  divMention.style.color = this.value;
});

document.getElementById("dropAqua").addEventListener("click", function () {
  activemention(true);
  document.getElementById("dropMention").innerHTML = this.innerHTML;
  divMention.hidden = false;
  divMention.style.color = this.value;
});

document.getElementById("dropBlue").addEventListener("click", function () {
  activemention(true);
  document.getElementById("dropMention").innerHTML = this.innerHTML;
  divMention.hidden = false;
  divMention.style.color = this.value;
});

document.getElementById("dropMagenta").addEventListener("click", function () {
  activemention(true);
  document.getElementById("dropMention").innerHTML = this.innerHTML;
  divMention.hidden = false;
  divMention.style.color = this.value;
});


/********************************************************************************************************************/
/*                                            Gestion des boutons                                                   */
/********************************************************************************************************************/


/**************************    Bouton Flip    **************************/

btnFlip.addEventListener("click", function () {
  setimageObjFlip();
});


/**************************    Boutons + et - niveau de transparence    **************************/

document.getElementById("btnMinor").addEventListener("click", function () {
  if (transValue > 4) {
    transValue -= 5;
    transparence(imageObj);
    //transparent = true;
    img_obj.src = document
      .getElementById("canvasT")
      .toDataURL();
  }
});


document.getElementById("btnPlus").addEventListener("click", function () {
  if (transValue < 251) {
    transValue += 5;
    transparence(imageObj);
    //transparent = true;
    img_obj.src = document
      .getElementById("canvasT")
      .toDataURL();
  }
});


/**************************    Bouton transparence    **************************/

document.getElementById("btnTransObj").addEventListener("click", function () {
  if (!transparent) {
    canvasT.width = imageObj.naturalWidth;
    canvasT.height = imageObj.naturalHeight;
    transparence(imageObj);
    transparent = true;
    img_obj.src = document
      .getElementById("canvasT")
      .toDataURL();
    img_obj.style.backgroundColor = couleurFond;
  } else {
    img_obj.src = imageObj.src;
    transparent = false;
  }

  if (!transparent) {img_obj.style.backgroundColor = "white";}

  document.getElementById("btnPlusMinor").hidden = !transparent;
  document.getElementById("dotprimary").hidden = !transparent;
  document.getElementById("dotlight").hidden = !transparent;
  document.getElementById("dotsecondary").hidden = !transparent;
  document.getElementById("dotdark").hidden = !transparent;

});


/**************************    Bouton couleur de fond    **************************/

document.getElementById("dotprimary").addEventListener("click", function () {
  couleurFond = "#0056b3";
  img_obj.style.backgroundColor = couleurFond;
});

document.getElementById("dotlight").addEventListener("click", function () {
  couleurFond = "#f8f9fa";
  img_obj.style.backgroundColor = couleurFond;
});

document.getElementById("dotsecondary").addEventListener("click", function () {
  couleurFond = "#6c757d";
  img_obj.style.backgroundColor = couleurFond;
});

document.getElementById("dotdark").addEventListener("click", function () {
  couleurFond = "#343a40";
  img_obj.style.backgroundColor = couleurFond;
});

/**************************    Bouton detourage    **************************/

document.getElementById("btnDetourObj").addEventListener("click", function () {
  imageObj = detourage(imageObj);
    if (transparent) {
      canvasT.width = imageObj.naturalWidth;
      canvasT.height = imageObj.naturalHeight;
      transparence(imageObj);

      img_obj.style.backgroundColor = couleurFond;
    }
    img_obj.src = document
    .getElementById("canvasT")
    .toDataURL();
  }
);


/**************************    Bouttons proportionnel, personnalise ou par point    **************************/

btnProp.addEventListener("click", function () {
  isProportionel = true;
  isParPoint = false;
  setimageObjFlip(false);
  document.getElementById("check-flip").hidden = true;
});


btnPerso.addEventListener("click", function () {
  isProportionel = false;
  isParPoint = false;
  setimageObjFlip(false);
  document.getElementById("check-flip").hidden = true;
});


btnPoint.addEventListener("click", function () {
  isProportionel = false;
  isParPoint = true;
  setimageObjFlip();
  document.getElementById("check-flip").hidden = true;
});


/**************************    Boutons permettant de piloter les inputFiles    **************************/

btnupVue.addEventListener("click", function () {
  inpVueSet.click();
});

btnupObj.addEventListener("click", function () {
  inpObjSet.click();
});


/**************************    Bouton d'export    **************************/

btnExport.addEventListener("click", function () {
  setcanvas1();
  if (!divMention.hidden) {
    chargeMention(divMention.style.color);
  }
  let maintenant = new Date();

  let canvaFinal = canvas1
    .toDataURL("image/jpeg", 1)
    .replace("imageVue/jpeg", "image/octet-stream");

  var link = document.createElement("a");
  link.setAttribute("id", "windowVue");
  link.setAttribute("href", canvaFinal);
  link.setAttribute(
    "download",
    "Mise En Situation" +
      maintenant.toLocaleDateString("fr") +
      "-" +
      maintenant.getHours() +
      "h" +
      maintenant.getMinutes() +
      "m"
  );
  link.click();
});


/**************************    Bouton de suppression de l'objet    **************************/

btnDelObj.addEventListener("click", function () {
  initVue();
  btnExport.disabled = true;
});


/********************************************************************************************************************/
/*                                                Event tactiles                                                    */
/********************************************************************************************************************/


/**************************    startup    **************************/

function startup() {
  canvas0.addEventListener("touchstart", handleStart);
  canvas0.addEventListener("touchend", handleEnd);
  canvas0.addEventListener("touchmove", handleMove);
}


/**************************    handleStart    **************************/

function handleStart(evt) {
  document.getElementById("warnlab").style.visibility = "hidden";

  xStart = evt.touches[0].clientX;
  yStart = evt.touches[0].clientY;
  xInit = xStart - getOffset(canvas0).left;
  yInit = yStart - getOffset(canvas0).top;

  if (!isParPoint) {
    /* debut de la selection */

    selection = true;
    if (window.scrollY === 0) {
      initRectangle(xStart, yStart);
    }
  } else {
    evt.preventDefault(); // pour eviter la generation de points multiples
    setcanvas1();
    chargeRefresh();
    document.getElementById("canvas1").style.visibility = "visible";

    if (monQuad.length < 8) {
      btnExport.disabled = true;

      monQuad.push(xInit);
      monQuad.push(yInit);
      setPoint(xStart, yStart);
      if (monQuad.length >= 8) {
        document.getElementById("canvas1").style.visibility = "hidden";

        if (setQuadPerspective()) {
          drawImageInPerspective(
            imageObj, //srcImg,
            canvas0, //targetCanvas,

            monQuad[0], //topLeftX,
            monQuad[1], //topLeftY,
            monQuad[6], //bottomLeftX,
            monQuad[7], //bottomLeftY,
            monQuad[2], //topRightX,
            monQuad[3], //topRightY,
            monQuad[4], //bottomRightX,
            monQuad[5], //bottomRightY,
            btnFlip.checked,
            false,
            transparent
          );

          drawned = true;
          btnExport.disabled = false;
        } else {
          document.getElementById("warnlab").style.color = "red";
          document.getElementById("warnlab").innerText =
            "Attention vos points ne forment pas un quadrilatère valide";
          document.getElementById("warnlab").style.visibility = "visible";
        }
        unsetPoint();
        monQuad = [];
      }
    }
  }
}


/**************************    handleEnd    **************************/

function handleEnd(evt) {
  /* fin de la selection */
  if (!isParPoint) {
    delRectangle();
    selection = false;

    if (drawned) {
      chargeVide(imageVue.src);
      drawned = false;
    }

    if (window.scrollY === 0) {
      xEnd = evt.changedTouches[0].clientX - getOffset(canvas0).left;
      yEnd = evt.changedTouches[0].clientY - getOffset(canvas0).top;

      charge(
        img_obj.src,
        xInit,
        yInit,
        xEnd,
        yEnd
      );
    }
  }
}


/**************************    handleMove    **************************/

function handleMove(evt) {
  evt.preventDefault(); // pour desactiver le defilement lors du touch du canvas0
  if (!isParPoint) {
    xMousePos = evt.changedTouches[0].clientX - getOffset(canvas0).left;
    yMousePos = evt.changedTouches[0].clientY - getOffset(canvas0).top;
    /* selection en cours */
    if (window.scrollY === 0) {
      if (selection === true) {
        setRectangle(
          xStart,
          yStart,
          evt.touches[0].clientX,
          evt.touches[0].clientY,
          objRatio
        );
      }
    }
  }
}


/********************************************************************************************************************/
/*                                                   Event souris                                                   */
/********************************************************************************************************************/


/**************************    Event window.onmouseup    **************************/

/*Fin de la selection alors que le curseur est sorti de la zone Canva0 : on annule la selection */
window.onmouseup = function () {
  if (!isParPoint) {
    delRectangle();
    selection = false;
  }
};


/**************************    Event canvas0.onmousedown    **************************/

canvas0.onmousedown = function (e) {
  document.getElementById("warnlab").style.visibility = "hidden";
  if (!isParPoint) {
    xInit = e.clientX;
    yInit = e.clientY;
    xStart = xMousePos;
    yStart = yMousePos;

    /* debut de la selection */

    selection = true;
    if (window.scrollY === 0) {
      initRectangle(xInit, yInit);
    }
  } else {
    setcanvas1();
    chargeRefresh();
    document.getElementById("canvas1").style.visibility = "visible";

    if (monQuad.length < 8) {
      btnExport.disabled = true;
      monQuad.push(e.clientX - getOffset(canvas0).left);
      monQuad.push(e.clientY - getOffset(canvas0).top);
      setPoint(e.clientX, e.clientY);
      if (monQuad.length >= 8) {
        document.getElementById("canvas1").style.visibility = "hidden";

        if (setQuadPerspective()) {
          drawImageInPerspective(
            imageObj, //srcImg,
            canvas0, //targetCanvas,

            monQuad[0], //topLeftX,
            monQuad[1], //topLeftY,
            monQuad[6], //bottomLeftX,
            monQuad[7], //bottomLeftY,
            monQuad[2], //topRightX,
            monQuad[3], //topRightY,
            monQuad[4], //bottomRightX,
            monQuad[5], //bottomRightY,
            btnFlip.checked,
            false,
            transparent
          );

          drawned = true;
          btnExport.disabled = false;
        } else {
          document.getElementById("warnlab").style.color = "red";
          document.getElementById("warnlab").innerHTML =
            "Attention vos points ne forment pas un quadrilatère valide";
          document.getElementById("warnlab").style.visibility = "visible";
        }
        unsetPoint();
        monQuad = [];
      }
    }
  }
};


/**************************    Event canvas0.onmouseup    **************************/

/*Le onmouseup sur le canvas0 provoque la fin de la selection et le dessin de l'objet si le scroll est à 0 */
canvas0.onmouseup = function () {
  if (!isParPoint) {
    delRectangle();
    selection = false;

    if (drawned) {
      chargeVide(imageVue.src);
      drawned = false;
    }

    if (window.scrollY === 0) {
      xEnd = xMousePos;
      yEnd = yMousePos;

      charge(
        img_obj.src,
        xStart,
        yStart,
        xEnd,
        yEnd
      );
    }
  }
};


/**************************    Event canvas0.onmousemove    **************************/

canvas0.onmousemove = function (e) {
  if (!isParPoint) {
    xMousePos = e.clientX - getOffset(canvas0).left;
    yMousePos = e.clientY - getOffset(canvas0).top;

    /* selection en cours */
    if (window.scrollY === 0) {
      if (selection === true) {
        setRectangle(xInit, yInit, e.clientX, e.clientY, objRatio);
      }
    }
  }
};


/**************************    Event rectangle.onmousemove    **************************/

rectangle.onmousemove = function (e) {
  if (!isParPoint) {
    if (selection === true) {
      setRectangle(xInit, yInit, e.clientX, e.clientY, objRatio);
    }
  }
};


/**************************    Event rectangle.onmouseup    **************************/

rectangle.onmouseup = function (e) {
  if (!isParPoint) {
    canvas0.onmouseup();
  }
};


/********************************************************************************************************************/
/*                                         Fonctions de dessin et geometrie                                         */
/********************************************************************************************************************/


/**************************    Fonctions setPoint    **************************/

/*Mise en place d'un point pour le mode par point en fonction des points dejà affectes sur le Canvas*/
function setPoint(x, y) {
  if (monQuad.length > 0) {
    var point = document.getElementById("pointA");
    if (monQuad.length > 2) {
      point = document.getElementById("pointB");
      if (monQuad.length > 4) {
        point = document.getElementById("pointC");
      }
    }
    point.style.visibility = "visible";
    point.style.left = x + "px";
    point.style.top = y + "px";
  }
}


/**************************    Fonctions unsetPoint    **************************/

/*Deaffectation des points sur le Canvas pour le mode par point*/
function unsetPoint() {
  document.getElementById("pointA").style.visibility = "hidden";
  document.getElementById("pointB").style.visibility = "hidden";
  document.getElementById("pointC").style.visibility = "hidden";
}


/**************************    Fonctions initRectangle    **************************/

/*Initialisation du rectangle de selection au demarrage*/
function initRectangle(x, y) {
  document.body.style.cursor = "crosshair";

  rectangle.style.visibility = "visible";
  rectangle.style.width = 0 + "px";
  rectangle.style.height = 0 + "px";
  rectangle.style.left = x + "px";
  rectangle.style.top = y + "px";
}


/**************************    Fonction setRectangle    **************************/

/*La fonction setRectangle utilise les valeurs xStart et yStart pour definir le point de depart de la selection et
utilise les valeurs xCourant et yCourant pour definir la position actuelle du curseur. Le ratio est utilise pour 
maintenir la proportion des dimensions en cas d'utilisation du mode de proportionnalite.

La fonction utilise des conditions if pour verifier si le curseur est actuellement 
en haut à gauche, 
en bas à gauche, 
en haut à droite, 
ou en bas à droite par rapport au point de depart de la selection. 

Selon la position du curseur, la hauteur et la largeur du rectangle sont redimensionnees en consequence, 
ainsi que sa position (top et left). Il utilise egalement la variable isProportionel pour verifier si la 
proportionnalite est activee ou pas. Si la proportionnalite est activee, les dimensions du rectangle sont 
ajustees en fonction du ratio.

Il est important de noter que cette fonction est destinee à être utilisee avec un element HTML <div> 
defini avec l'ID rectangle et qui est utilise pour afficher le rectangle de selection. */


function setRectangle(xStart, yStart, xCourant, yCourant, ratio) {
  // Fonction permettant de redimensionner le rectangle en fonction du deplacement de curseur
  if (yStart > yCourant && xStart > xCourant) {
    //dessin en haut et à gauche du point de depart
    rectangle.style.height = yStart - yCourant + "px";
    rectangle.style.top = yCourant + "px";

    if (isProportionel === true) {
      rectangle.style.width = (yStart - yCourant) * ratio + "px";
      rectangle.style.left = xStart - (yStart - yCourant) * ratio + "px";
    } else {
      rectangle.style.width = xStart - xCourant + "px";
      rectangle.style.left = xCourant + "px";
    }
  }

  if (yStart < yCourant && xStart > xCourant) {
    //dessin en bas et à gauche du point de depart
    rectangle.style.height = yCourant - yStart + "px";
    rectangle.style.top = yStart + "px";

    if (isProportionel === true) {
      rectangle.style.width = (yCourant - yStart) * ratio + "px";
      rectangle.style.left = xStart - (yCourant - yStart) * ratio + "px";
    } else {
      rectangle.style.width = xStart - xCourant + "px";
      rectangle.style.left = xCourant + "px";
    }
  }

  if (yStart > yCourant && xStart < xCourant) {
    //dessin en haut et à droite du point de depart
    rectangle.style.height = yStart - yCourant + "px";
    rectangle.style.top = yCourant + "px";

    if (isProportionel === true) {
      rectangle.style.width = (yStart - yCourant) * ratio + "px";
      rectangle.style.left = xStart + "px";
    } else {
      rectangle.style.width = xCourant - xStart + "px";
      rectangle.style.left = xStart + "px";
    }
  }

  if (yStart < yCourant && xStart < xCourant) {
    //dessin en bas et à droite du point de depart
    rectangle.style.height = yCourant - yStart + "px";
    rectangle.style.top = yStart + "px";

    if (isProportionel === true) {
      rectangle.style.width = (yCourant - yStart) * ratio + "px";
      rectangle.style.left = xStart + "px";
    } else {
      rectangle.style.width = xCourant - xStart + "px";
      rectangle.style.left = xStart + "px";
    }
  }
}

function delRectangle(e) {
  // masquage du rectangle
  if (selection === true) {
    rectangle.style.height = 0 + "px";
    rectangle.style.width = 0 + "px";
    rectangle.style.visibility = "hidden";
    document.body.style.cursor = "auto";
  }
}


/**************************    Fonction setQuadPerspective    **************************/

/*La fonction "setQuadPerspective" verifie si un quadrilatère est convexe en utilisant une methode par force brute : 
en calculant les produits croises des vecteurs formes par ses côtes pour chaque combinaison de quatre points d'un tableau "monQuad". 
Elle verifie egalement que les quatre points du quadrilatère sont distincts et 
que le point en haut à gauche a une valeur y plus elevee que le point en bas à gauche, 
que le point en haut à droite a une valeur y plus elevee que le point en bas à droite, 
que le point en haut à gauche a une valeur x plus basse que le point en haut à droite et 
que le point en bas à gauche a une valeur x plus basse que le point en bas à droite.
Elle cree plusieurs boucles et verifie un grand nombre de combinaisons.*/

function setQuadPerspective() {
  let i, j, k, l;

  let topLeftX = -1,
    topLeftY = -1,
    bottomLeftX = -1,
    bottomLeftY = -1,
    topRightX = -1,
    topRightY = -1,
    bottomRightX = -1,
    bottomRightY = -1;

  compoint = 0;

  /*On verifie que chaque point est bien distinct 
  
  Pour verifier que les diagonales d'un quadrilatère ABCD se coupent en son sein ( === quadrilatère convexe)

  [(xC-xA)(yB-yA)-(yC-yA)(xB-xA)]*[(xD-xA)(yB-yA)-(yD-yA)(xB-xA)]
  [(xA-xC)(yD-yC)-(yA-yC)(xD-xC)]*[(xB-xC)(yD-yC)-(yB-yC)(xD-xC)]
  */

  for (i = 0; i < 7; i = i + 2) {
    for (j = 0; j < 7; j = j + 2) {
      if (j != i) {
        for (k = 0; k < 7; k = k + 2) {
          if (k != j && k != i) {
            for (l = 0; l < 7; l = l + 2) {
              if (l != i && l != j) {
                if (l != k) {
                  var cond1 =
                    ((monQuad[j] - monQuad[i]) *
                      (monQuad[k + 1] - monQuad[i + 1]) -
                      (monQuad[j + 1] - monQuad[i + 1]) *
                        (monQuad[k] - monQuad[i])) *
                    ((monQuad[l] - monQuad[i]) *
                      (monQuad[k + 1] - monQuad[i + 1]) -
                      (monQuad[l + 1] - monQuad[i + 1]) *
                        (monQuad[k] - monQuad[i]));
                  var cond2 =
                    ((monQuad[i] - monQuad[j]) *
                      (monQuad[l + 1] - monQuad[j + 1]) -
                      (monQuad[i + 1] - monQuad[j + 1]) *
                        (monQuad[l] - monQuad[j])) *
                    ((monQuad[k] - monQuad[j]) *
                      (monQuad[l + 1] - monQuad[j + 1]) -
                      (monQuad[k + 1] - monQuad[j + 1]) *
                        (monQuad[l] - monQuad[j]));

                  if (cond1 < 0 && cond2 < 0) {

                    /*En prenant TL(TopLeft), TR(TopRight), BL(BottomLeft) et BR(BottomRight)

                    Voici les conditions à remplir pour dessiner un quadrilatère sur le Canvas
                    -le point TL doit être plus haut que le point BL
                    -le point TR doit être plus haut que le point BR
                    -le point TL doit être à gauche du point TR
                    -le point BL doit être  à gauche du point BR*/
                    
                    if (
                      monQuad[i + 1] < monQuad[l + 1] && //le point TL doit être plus haut que le point BL
                      monQuad[j + 1] < monQuad[k + 1] //le point TR doit être plus haut que le point BR
                    ) {
                      if (
                        monQuad[i] < monQuad[j] && //le point TL doit être à gauche du point TR
                        monQuad[l] < monQuad[k] //le point BL doit être  à gauche du point BR
                      ) {
                        if (
                          monQuad[i + 1] < monQuad[k + 1] && //le point TL doit être à gauche du point TR
                          monQuad[j + 1] < monQuad[l + 1] //le point BL doit être  à gauche du point BR
                        ) {
                          /**************************** Assignation des valeurs triees*/
                          bottomRightX = monQuad[k];
                          bottomRightY = monQuad[k + 1];

                          topRightX = monQuad[j];
                          topRightY = monQuad[j + 1];

                          bottomLeftX = monQuad[l];
                          bottomLeftY = monQuad[l + 1];

                          topLeftX = monQuad[i];
                          topLeftY = monQuad[i + 1];

                          /******************* */
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  //Purge et reaffectation du conteneur monQuad

  monQuad = [];
  monQuad.push(topLeftX);
  monQuad.push(topLeftY);
  monQuad.push(topRightX);
  monQuad.push(topRightY);
  monQuad.push(bottomRightX);
  monQuad.push(bottomRightY);
  monQuad.push(bottomLeftX);
  monQuad.push(bottomLeftY);

  for (var xy in monQuad) {
    if (monQuad[xy] === -1) {
      return false;
    }
  }
  return true;
}


/**************************    Fonction crossProduct    **************************/

function crossProduct(v0, v1) {
  return v0.y * v1.x - v0.x * v1.y;
}


/**************************    Fonction inSector    **************************/

/*Cette fonction permet de determiner si un point M est dans le secteur defini par les points O (centre) et A, B (extremites du secteur). 
Pour cela, elle utilise le produit vectoriel (appele "crossProduct" dans le code) entre les vecteurs OA, OB, OM et AM, BM. 
Si le produit vectoriel entre OA et OB est positif, elle verifie si les produits vectoriels entre OA et OM, et entre OB et 
OM sont respectivement positif et negatif. Si c'est le cas, elle renvoie true, sinon false. Si le produit vectoriel entre OA et OB 
est negatif, elle verifie si les produits vectoriels entre OA et OM, et entre OB et OM sont respectivement negatif et positif. Si c'est le cas, 
elle renvoie true, sinon false. */

function inSector(M, O, A, B) {
  var cpAB, cpAM, cpBM;
  cpAB = crossProduct(
    { x: A.x - O.x, y: A.y - O.y },
    { x: B.x - O.x, y: B.y - O.y }
  );
  cpAM = crossProduct(
    { x: A.x - O.x, y: A.y - O.y },
    { x: M.x - O.x, y: M.y - O.y }
  );
  cpBM = crossProduct(
    { x: B.x - O.x, y: B.y - O.y },
    { x: M.x - O.x, y: M.y - O.y }
  );
  if (cpAB > 0) {
    if (cpAM > 0 && cpBM < 0) return true;
    else return false;
  } else {
    if (!(cpAM < 0 && cpBM > 0)) return true;
    else return false;
  }
}


/**************************    Fonction pointDansQuad    **************************/

/*Cette fonction permet de determiner si un point (dont les coordonnees sont donnees par les arguments unPointX et unPointY) 
appartient à un quadrilatère defini par les coordonnees des quatres sommets : topLeftX, topLeftY, bottomLeftX, bottomLeftY, 
topRightX, topRightY, bottomRightX, bottomRightY.

Pour cela, elle utilise la fonction "inSector" en lui donnant les coordonnees des quatres sommets du quadrilatère ainsi que 
les coordonnees du point à tester. Elle verifie si ce point est dans les secteurs definis par les sommets D-A-B, A-B-C, B-C-D et C-D-A. 
Si c'est le case pour tous les quatres secteurs, elle renvoie true, sinon false. */

function pointDansQuad(
  topLeftX,
  topLeftY,
  bottomLeftX,
  bottomLeftY,
  topRightX,
  topRightY,
  bottomRightX,
  bottomRightY,
  unPointX,
  unPointY
) {
  var appartient = false;
  var A = { x: topLeftX, y: topLeftY };
  var B = { x: topRightX, y: topRightY };
  var C = { x: bottomRightX, y: bottomRightY };
  var D = { x: bottomLeftX, y: bottomLeftY };
  var M = { x: unPointX, y: unPointY };

  if (inSector(M, D, A, B) && inSector(M, A, B, C)) {
    if (inSector(M, B, C, D) && inSector(M, C, D, A)) {
      appartient = true;
    }
  }

  return appartient;
}



/**************************    Fonction drawImageInPerspective    **************************/

/* Cette fonction permet de dessiner une image (donnee par l'argument srcImg) sur un canvas (donne par l'argument targetCanvas) 
en utilisant une transformation de perspective pour adapter l'image aux coordonnees des quatres coins (topLeftX, topLeftY, bottomLeftX, 
bottomLeftY, topRightX, topRightY, bottomRightX, bottomRightY) du quadrilatère souhaite sur le canvas.

Elle commence par definir la taille de l'image d'origine en utilisant les proprietes naturalWidth et naturalHeight de l'image. 
Puis elle calcule les marges et les tailles du quadrilatère cible en utilisant les coordonnees des quatres coins.

Par la suite, elle cree un nouveau canvas temporaire, et utilise un contexte 2D pour y dessiner l'image d'origine en utilisant 
les transformations de translation, de miroir (si flipHorizontally ou flipVertically est vrai) et de mise à l'echelle pour 
adapter l'image aux dimensions du quadrilatère cible.

Enfin, elle utilise la methode getImageData pour obtenir un tableau unidimensionnel contenant les donnees des pixels de l'image 
temporaire, et parcoure ce tableau pour mettre à jour les pixels correspondants sur le canvas cible. */

function drawImageInPerspective(
  srcImg,
  targetCanvas,
  //Definir où sur le canva l'image doit être dessinee :
  //coordonnees des 4 coins du quadrilatère sur lesquels l'image rectangulaire d'origine sera transformee :

  topLeftX,
  topLeftY,
  bottomLeftX,
  bottomLeftY,
  topRightX,
  topRightY,
  bottomRightX,
  bottomRightY,

  //Facultativement retourner l'image d'origine horizontalement ou verticalement *avant* de transformer l'image rectangulaire d'origine en quadrilatère convexe :
  flipHorizontally,
  flipVertically,
  transparence = false
) {
  var srcWidth = srcImg.naturalWidth;
  var srcHeight = srcImg.naturalHeight;

  var targetMarginX = Math.min(topLeftX, bottomLeftX, topRightX, bottomRightX);
  var targetMarginY = Math.min(topLeftY, bottomLeftY, topRightY, bottomRightY);

  var targetTopWidth = topRightX - topLeftX;
  var targetTopOffset = topLeftX - targetMarginX;
  var targetBottomWidth = bottomRightX - bottomLeftX;
  var targetBottomOffset = bottomLeftX - targetMarginX;

  var targetLeftHeight = bottomLeftY - topLeftY;
  var targetLeftOffset = topLeftY - targetMarginY;
  var targetRightHeight = bottomRightY - topRightY;
  var targetRightOffset = topRightY - targetMarginY;

  var tmpWidth = Math.max(
    targetTopWidth + targetTopOffset,
    targetBottomWidth + targetBottomOffset
  );

  var tmpHeight = Math.max(
    targetLeftHeight + targetLeftOffset,
    targetRightHeight + targetRightOffset
  );

  var tmpCanvas = document.createElement("canvas");
  tmpCanvas.width = tmpWidth;
  tmpCanvas.height = tmpHeight;
  var tmpContext = tmpCanvas.getContext("2d");

  tmpContext.translate(
    flipHorizontally ? tmpWidth : 0,
    flipVertically ? tmpHeight : 0
  );

  tmpContext.scale(
    (flipHorizontally ? -1 : 1) * (tmpWidth / srcWidth),
    (flipVertically ? -1 : 1) * (tmpHeight / srcHeight)
  );
  tmpContext.drawImage(srcImg, 0, 0);

  var tmpMap = tmpContext.getImageData(0, 0, tmpWidth, tmpHeight);
  var tmpImgData = tmpMap.data;

  var targetContext = targetCanvas.getContext("2d");
  var targetMap = targetContext.getImageData(
    targetMarginX,
    targetMarginY,
    tmpWidth,
    tmpHeight
  );
  var targetImgData = targetMap.data;
  var targetX, targetY, tmpPoint, targetPoint, tmpY, tmpX;

  // Passer le rectangle contenant notre image en perspective en negatif, utilisation pour test 
  /*
  for (var i = 0; i < targetImgData.length; i += 4) {
    targetImgData[i] = 255 - targetImgData[i];
    targetImgData[i + 1] = 255 - targetImgData[i + 1];
    targetImgData[i + 2] = 255 - targetImgData[i + 2];
  }
*/

  for (var tmpY = 0; tmpY < tmpHeight; tmpY++) {
    for (var tmpX = 0; tmpX < tmpWidth; tmpX++) {
      tmpPoint = (tmpY * tmpWidth + tmpX) * 4;

      //Index dans le tableau context.getImageData(...).data.

      //Ce tableau est un tableau unidimensionnel qui reserve 4 valeurs pour chaque pixel (rouge, vert, bleu, alpha)
      //et stocke tous les points dans une seule dimension, pixel après pixel, ligne après ligne :

      //calculer les coordonnees du point sur l'image en perspective.

      //Prenez la coordonnee X du point d'origine et traduisez-la en coordonnee cible (oblique): le trapèze de transformation part de 0).

      //Calculez la taille d'un % de srcWidth (x non asymetrique) tmpX, puis obtenez la moyenne de ce % de targetTopWidth et targetBottomWidth (inclines),
      //en ponderant les deux à l'aide de la coordonnee Y du point et en tenant compte du decalage asymetrique (à quelle distance topLeft et
      //bottomLeft du trapèze de transformation partent de 0).
      targetX =
        (targetTopOffset + (targetTopWidth * tmpX) / tmpWidth) *
          (1 - tmpY / tmpHeight) +
        (targetBottomOffset + (targetBottomWidth * tmpX) / tmpWidth) *
          (tmpY / tmpHeight);

      targetX = Math.round(targetX);

      //Ici la coordonnee Y du point d'origine est transposee en coordonnee cible (simulacre de perspective):
      targetY =
        (targetLeftOffset + (targetLeftHeight * tmpY) / tmpHeight) *
          (1 - tmpX / tmpWidth) +
        (targetRightOffset + (targetRightHeight * tmpY) / tmpHeight) *
          (tmpX / tmpWidth);

      targetY = Math.round(targetY);

      targetPoint = (targetY * tmpWidth + targetX) * 4;

      // Decalage de pixel pour couvrir les pixels morts

      if (!transparence) {
        if (targetPoint >= 4 && targetPoint < targetImgData.length - 5) {
          if (targetX != 0) {
            targetImgData[targetPoint - 4] = tmpImgData[tmpPoint]; //rouge
            targetImgData[targetPoint + 1 - 4] = tmpImgData[tmpPoint + 1]; //vert
            targetImgData[targetPoint + 2 - 4] = tmpImgData[tmpPoint + 2]; //bleu
            targetImgData[targetPoint + 3 - 4] = tmpImgData[tmpPoint + 3]; //alpha
          }
        }

        // Pixels cibles
        targetImgData[targetPoint] = tmpImgData[tmpPoint]; //rouge
        targetImgData[targetPoint + 1] = tmpImgData[tmpPoint + 1]; //vert
        targetImgData[targetPoint + 2] = tmpImgData[tmpPoint + 2]; //bleu
        targetImgData[targetPoint + 3] = tmpImgData[tmpPoint + 3]; //alpha

      } else {

        if (tmpImgData[tmpPoint] < transValue) {
          if (tmpImgData[tmpPoint + 1] < transValue) {
            if (tmpImgData[tmpPoint + 2] < transValue) {

              if (targetPoint >= 4 && targetPoint < targetImgData.length - 5) {
                if (targetX != 0) {
                  targetImgData[targetPoint - 4] = tmpImgData[tmpPoint]; //rouge
                  targetImgData[targetPoint + 1 - 4] = tmpImgData[tmpPoint + 1]; //vert
                  targetImgData[targetPoint + 2 - 4] = tmpImgData[tmpPoint + 2]; //bleu
                  targetImgData[targetPoint + 3 - 4] = tmpImgData[tmpPoint + 3]; //alpha
                }
              }

              // Pixels cibles
              targetImgData[targetPoint] = tmpImgData[tmpPoint]; //rouge
              targetImgData[targetPoint + 1] = tmpImgData[tmpPoint + 1]; //vert
              targetImgData[targetPoint + 2] = tmpImgData[tmpPoint + 2]; //bleu
              targetImgData[targetPoint + 3] = tmpImgData[tmpPoint + 3]; //alpha

            }
          }
        }
      }
    }
  }
  targetContext.putImageData(targetMap, targetMarginX, targetMarginY);
  ctx1.drawImage(canvas0, 0, 0);
}



/**************************    Fonction initVue    **************************/

// Chargement par defaut du canva0 avec la Vue et positionnement par defaut de la mention en bas à gauche de la Vue
function initVue() {
  chargeVide(imageVue.src);
  divMention.style.top = canvas0.offsetHeight + canvas0.offsetTop - 38 + "px";
  divMention.style.left = canvas0.offsetLeft + 10 + "px";
}



/**************************    Fonction charge    **************************/

/*Chargement du canvas0 avec la vue/bâtiment et l'objet/menuiserie selon la position du rectangle de selection*/
function charge(
  monObj,
  monStartX,
  monStartY,
  monEndX,
  monEndY
) {
  let obj = new Image();

  if (!drawned) {
    obj.src = monObj;
    obj.onload = function () {
      if (monStartY > monEndY && monStartX > monEndX) {
        //dessin en haut et à gauche du point de depart
        if (isProportionel === true) {
          ctx0.drawImage(
            this,
            monStartX - (monStartY - monEndY) * objRatio,
            monEndY,
            (monStartY - monEndY) * objRatio,
            monStartY - monEndY
          );
        } else {
          rectangle.style.width = monStartX - monEndX + "px";
          rectangle.style.left = monEndX + "px";
          ctx0.drawImage(
            this,
            monEndX,
            monEndY,
            monStartX - monEndX,
            monStartY - monEndY
          );
        }
      }

      if (monStartY < monEndY && monStartX > monEndX) {
        //dessin en bas et à gauche du point de depart
        if (isProportionel === true) {
          ctx0.drawImage(
            this,
            monStartX - (monEndY - monStartY) * objRatio,
            monStartY,
            (monEndY - monStartY) * objRatio,
            monEndY - monStartY
          );
        } else {
          ctx0.drawImage(
            this,
            monEndX,
            monStartY,
            monStartX - monEndX,
            monEndY - monStartY
          );
        }
      }

      if (monStartY > monEndY && monStartX < monEndX) {
        //dessin en haut et à droite du point de depart
        if (isProportionel === true) {
          ctx0.drawImage(
            this,
            monStartX,
            monEndY,
            (monStartY - monEndY) * objRatio,
            monStartY - monEndY
          );
        } else {
          ctx0.drawImage(
            this,
            monStartX,
            monEndY,
            monEndX - monStartX,
            monStartY - monEndY
          );
        }
      }

      if (monStartY < monEndY && monStartX < monEndX) {
        //dessin en bas et à droite du point de depart
        if (isProportionel === true) {
          ctx0.drawImage(
            this,
            monStartX,
            monStartY,
            (monEndY - monStartY) * objRatio,
            monEndY - monStartY
          );
        } else {
          ctx0.drawImage(
            this,
            monStartX,
            monStartY,
            monEndX - monStartX,
            monEndY - monStartY
          );
        }
      }
    };
    ctx1.drawImage(canvas0, 0, 0);
    btnExport.disabled = false;
    drawned = true;
  }
}


/**************************    Fonction chargeVide    **************************/

function chargeVide(maVue) {
  let vue = new Image();
  vue.src = maVue;
  vue.onload = function () {
    ctx0.drawImage(this, 0, 0, canvas0.width, canvas0.height);
    ctx1.drawImage(canvas0, 0, 0);
  };
  drawned = false;
}


/**************************    Fonction chargeRefresh    **************************/

function chargeRefresh() {
  if (monQuad.length == 0 && drawned) {
    chargeVide(imageVue.src); //lorsque que le quadrilatère monQuad ne contient plus de point on reinitialise le canvas0 avec la vue vierge
  }
}


/**************************    Fonction chargeMention    **************************/

function chargeMention(maCoul) {
  //TODO à eclaircir le margebass selon navigateur

  let margebasse = 10;
  let x, y;
  ctx1.fillStyle = maCoul;
  ctx1.font = "25px arial";

  var browserName = function (agent) {
    if (agent.indexOf("firefox") > -1) {
      margebasse = 10;
    }
  };
  x = 100;
  y = 100;

  let maval = document.getElementById("dropMentionPos").innerText;
  console.log(maval);
  switch (maval) {
    case "Haut-Gauche":
      x = 10;
      y = divMention.offsetHeight - 10;
      break;

    case "Haut-Droite":
      x = canvas0.offsetWidth - divMention.offsetWidth - 10;
      y = divMention.offsetHeight - 10;
      break;

    case "Bas-Droite":
      x = canvas0.offsetWidth - divMention.offsetWidth - 10;
      y = canvas0.offsetHeight - margebasse;
      break;

    case "Bas-Gauche":
      x = 10;
      y = canvas0.offsetHeight - margebasse;
      break;

    default:
  }

  ctx1.fillText(document.getElementById("divMention").innerHTML, x, y);
}


/**************************    Fonction chargeMention    **************************/

/*Fonction de sauvegarde du calque objet*/
function sauveVue() {
  dataURL = canvas0.toDataURL();
}

/**************************    Fonction restoreVue    **************************/

/*Fonction de suppression du calque objet*/
function restoreVue() {
  let image = new Image();
  image.src = dataURL;

  image.onload = function () {
    chargeVide(image.src);
    ctx1.drawImage(canvas0, 0, 0);
  };
}


/**************************    Fonction setcanvas1    **************************/

/*Fonction d'initialisation du canvas1*/
function setcanvas1() {
  canvas1.width = canvas0.width;
  canvas1.height = canvas0.height;
  canvas1.top = canvas0.top;
  canvas1.left = canvas0.left;
  ctx1.drawImage(canvas0, 0, 0);
}



/********************************************************************************************************************/
/*                                      Fonctions de manipulation de l'image                                        */
/********************************************************************************************************************/


/**************************    Fonction detourage    **************************/

function detourage(monImage) {
  /* le but est de recuperer la partie utile de l'image dans un rectangle */

  var tmpCanvas = document.createElement("canvas"); //creation d'un canvas
  tmpCanvas.width = monImage.naturalWidth; //definition de la largeur
  tmpCanvas.height = monImage.naturalHeight; //definition de la hauteur
  var tmpContext = tmpCanvas.getContext("2d"); //recuperation du contexte
  tmpContext.drawImage(monImage, 0, 0); //dessin de l'image

  var tmpMap = tmpContext.getImageData(0, 0, tmpCanvas.width, tmpCanvas.height); //recuperation du Image Data
  var tmpImgData = tmpMap.data; //creation d'un raccourci vers les datas

  var whiteLine;
  var whiteCol = true;
  var nbLigne = 0;
  var nbColonne = 0;
  var i,j,k;
  var meslignes = [];
  var mescolonnes = [];
  var mespixels = [];


  for ( i = 0; i < tmpImgData.length; i += monImage.naturalWidth * 4) { // cette boucle permet de parcourir chaque ligne de pixels de l'image
    nbLigne++;
    whiteLine = true;

    
    for (j = 0; j < (monImage.naturalWidth * 4); j += 4) {
      k = i + j;
      if (tmpImgData[k] <= transValue) { whiteLine =false;}
      if (tmpImgData[k + 1] <= transValue) {whiteLine =false;}
      if (tmpImgData[k + 2] <= transValue) {whiteLine =false;}
    }
    
    if (!whiteLine) {meslignes.push(nbLigne);}
    
  }

  for (i = 0; i < monImage.naturalWidth * 4; i += 4) { // cette boucle permet de parcourir chaque colonne de pixels de l'image
    nbColonne++
    whiteCol = true;

    
    for (j = 0; j < tmpImgData.length; j += monImage.naturalWidth * 4) {
      k = i+j;
      if (tmpImgData[k] <= transValue) { whiteCol =false;}
      if (tmpImgData[k + 1] <= transValue) {whiteCol =false;}
      if (tmpImgData[k + 2] <= transValue) {whiteCol =false;}
    }
    
    if (!whiteCol) {mescolonnes.push(nbColonne);}
    }

  canvasT.width = mescolonnes.length ;
  canvasT.height = meslignes.length ;
  tmpMap = tmpContext.getImageData(mescolonnes[0] -1, meslignes[0] -1, mescolonnes.length + 20, meslignes.length + 20);
  ctxT.putImageData(tmpMap, 0, 0);

  var image = new Image();
  image.src = canvasT.toDataURL();
  return image;


}


/**************************    Fonction transparence    **************************/

function transparence(monImage) {
  /* le but est de transformer la couleur de fond en fond transparent */

  var tmpCanvas = document.createElement("canvas"); //creation d'un canvas
  tmpCanvas.width = monImage.naturalWidth; //definition de la largeur
  tmpCanvas.height = monImage.naturalHeight; //definition de la hauteur
  var tmpContext = tmpCanvas.getContext("2d"); //recuperation du contexte
  tmpContext.drawImage(monImage, 0, 0); //dessin de l'image

  var tmpMap = tmpContext.getImageData(0, 0, tmpCanvas.width, tmpCanvas.height); //recuperation du Image Data
  var tmpImgData = tmpMap.data; //creation d'un raccourci vers les datas

  for (var i = 0; i < tmpImgData.length; i += 4) {
    if (tmpImgData[i] > transValue) {
      if (tmpImgData[i + 1] > transValue) {
        if (tmpImgData[i + 2] > transValue) {
          tmpImgData[i] = 0;
          tmpImgData[i + 1] = 0;
          tmpImgData[i + 2] = 0;
          tmpImgData[i + 3] = 0;
        }
      }
    }
  }

  ctxT.putImageData(tmpMap, 0, 0);
}


/**************************    Fonction setimageObjFlip    **************************/

/*Fonction pour afficher la miniature de l'objet selon le flip
!!! affichage uniquement, aucun traitement de l'image!!! */
function setimageObjFlip(monBool = true) {    
  if (document.getElementById("btnFlip").checked && monBool) {
    img_obj.style.transform = "scaleX(-1)";
  } else {
    img_obj.style.transform = "scaleX(1)";
  }
}



/********************************************************************************************************************/
/*                                        Fonctions utilitaires diverses                                            */
/********************************************************************************************************************/


/**************************    Fonction testObjet    **************************/

/*Tester le contenu d'un objet*/
function testObjet(monObj) {
  //  testeur

  let out = "";
  for (let i in monObj) {
    if (monObj[i] != "") {
      out += i + ": " + monObj[i] + "|| \n";
    }
  }
  //document.getElementById("out").innerHTML = out;
  alert(out);
  //console.log(out);
}


/**************************    Fonction isTouchDevice    **************************/

/*Renvoie true si le terminal est tactile*/
function isTouchDevice() {
  try {
    document.createEvent("TouchEvent");
    return true;
  } catch (e) {
    return false;
  }
}


/**************************    Fonction getOffset    **************************/

/*Renvoie le top et le left d'un element en prenant en compte le scroll*/
function getOffset(el) {
  const rect = el.getBoundingClientRect();
  return {
    left: rect.left + window.scrollX,
    top: rect.top + window.scrollY,
  };
}


/**************************    Fonction elementPosition    **************************/

/*renvoie la position reelle d'un element*/
function elementPosition(el) {
  var b = el.getBoundingClientRect();
  return {
    clientX: el.offsetLeft,
    clientY: el.offsetTop,
    viewportX: b.x || b.left,
    viewportY: b.y || b.top,
  };
}


/**************************    Fonction changeCursor    **************************/

/*Fonction pour changer le curseur de la souris*/
function changeCursor(monCurseur) {
  canvas0.style.cursor = monCurseur;
}


