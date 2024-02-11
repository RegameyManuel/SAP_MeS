<?php

session_start(); 

$img64Obj = "/assets/images/MiseEnSituation/ObjDefaut.jpg";
$img64Vue = "/assets/images/MiseEnSituation/VueDefaut.jpg";
$flip = "false";
$mode = "proportionnel";


if (!isset($_SESSION['premierChargement'])) { // à implémenter
    $_SESSION['premierChargement'] = true;
} else {
    $_SESSION['premierChargement'] = false;
}


// chargement du mode 
if (isset($_POST["mode"])) {
    $_SESSION["mode"] = $_POST["mode"];
}

if (isset($_SESSION["mode"])) {
    $mode = $_SESSION["mode"];
}

// chargement du retournement horizontal de l'objet 
if (isset($_POST["flip"])) {
    $_SESSION["flip"] = $_POST["flip"];
}

if (isset($_SESSION["flip"])) {
    $flip = $_SESSION["flip"];
}

// chargement de l'image de la Vue 
if (isset($_FILES["fichierVue"])) {
    $_SESSION["fichierVue"] = $_FILES["fichierVue"];
}

if (isset($_SESSION["fichierVue"])) {
    $pathV = $_SESSION["fichierVue"]['name'];
    $typeV = pathinfo($pathV, PATHINFO_EXTENSION);
    $pathV = $_SESSION["fichierVue"]['tmp_name'];
    if (file_exists($pathV)) {
        $dataV = file_get_contents($pathV);
        $img64Vue = 'data:image/' . $typeV . ';base64,' . base64_encode($dataV);
        $_SESSION["VueCourante"] = $img64Vue;
    } else {
        if (isset($_SESSION["VueCourante"])) {
            $img64Vue = $_SESSION["VueCourante"];
        }
    }
}

// bloc de chargement de l'image de l'Objet
if (isset($_SESSION["ObjetDevis"])) {
    $_SESSION["fichierObj"] = $_SESSION["ObjetDevis"];
} else {
    if (isset($_FILES["fichierObj"])) {
        $_SESSION["fichierObj"] = $_FILES["fichierObj"];
    }
}

if (isset($_SESSION["fichierObj"])) {
    $pathO = $_SESSION["fichierObj"]['name'];
    $typeO = pathinfo($pathO, PATHINFO_EXTENSION);
    $pathO = $_SESSION["fichierObj"]['tmp_name'];
    if (file_exists($pathO)) {
        $dataO = file_get_contents($pathO);
        $img64Obj = 'data:image/' . $typeO . ';base64,' . base64_encode($dataO);
        $_SESSION["ObjCourante"] = $img64Obj;
    } else {
        if (isset($_SESSION["ObjCourante"])) {
            $img64Obj = $_SESSION["ObjCourante"];
        }
    }
}

$data = [
    'img64Obj' => $img64Obj,
    'img64Vue' => $img64Vue,
    'mode' => $mode,
    'flip' => $flip
];

?>

<!DOCTYPE html>
<html lang="fr">

<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/css/bootstrap.min.css" integrity="sha384-xOolHFLEh07PJGoPkLv1IbcEPTNtaed2xpHsD9ESMhqIYd0nLMwNLD69Npy4HI+N" crossorigin="anonymous">

    <link href="/assets/css/MiseEnSituation/MiseEnSituation.css" rel="stylesheet">
    <link rel="icon" href="/assets/images/MiseEnSituation/lentille.png">

    <title>Mise en Situation</title>
</head>

<body>
    <input id="path_vue" name="path_vue" type="hidden" value="<?php echo $img64Vue ?>">
    <input id="path_objet" name="path_objet" type="hidden" value="<?php echo $img64Obj ?>">
    <input id="mode" name="mode" type="hidden" value="<?php echo $mode ?>">
    <input id="flip" name="flip" type="hidden" value="<?php echo $flip ?>">

    <div id="rectangle" class="rectangle"></div>
    <div id="pointA" class="point"></div>
    <div id="pointB" class="point"></div>
    <div id="pointC" class="point"></div>
    <div class="row ">
        <div class="col-12 col-xl-9">

            <div id="Situation_view" class="d-flex justify-content-center m-2">
                <!-- Mise en Situation -->

                <div id="divMention" hidden>Photo non contractuelle</div>

                <canvas id="canvas0">Votre navigateur ne prend pas en charge l'élément canvas</canvas>

                <canvas id="canvas1" hidden></canvas>

                <!-- Fin de Bloc  -->
            </div>

        </div>
        <div class="col-12 col-xl-3">

            <div class="container">
                <div class="row justify-content-end">

                    <span id="aide" class="badge badge-pill badge-primary" data-toggle="tooltip" data-placement="top" title="Active l'aide contextuelle">Aide</span>

                </div>
            </div>

            <div class="row">
                <div class="col-12 col-sm-6 col-xl-12 d-flex justify-content-center align-self-end">

                    <div class="col ">
                        <p id="pmenuiserie">Menuiserie</p>


                        <button id="btnupObj" class="btn btn-primary btn-sm mb-2" data-toggle="tooltip" data-placement="top" title="Permet de charger une image de la menuiserie à poser sur la vue bâtiment">Choisir la Menuiserie</button>


                        <!-- Vignette Objet -->
                        <div class="row ">

                            <div class="col-12 ">

                                <img id="img_obj" alt="Image Objet" src="<?php echo $img64Obj ?>">

                            </div>

                            <div class="col" data-toggle="tooltip" data-placement="top" title="Permet de définir la couleur de l'arrière plan pour la photo de la menuiserie.
                            Une couleur appropriée permettra de régler correctement le filtre de la transparence">
                                <button id="dotprimary" class="btn btn-sm btn-primary btn-dot" hidden></button>
                                <button id="dotlight" class="btn btn-sm btn-light btn-dot" hidden></button>
                                <button id="dotsecondary" class="btn btn-sm btn-secondary btn-dot" hidden></button>
                                <button id="dotdark" class="btn btn-sm btn-dark btn-dot" hidden></button>
                            </div>


                            <div id="check-flip" class="form-check" <?php if ($mode != "parpoint") {
                                                                        echo "hidden";
                                                                    } ?>>
                                <input id="btnFlip" class="form-check-input" type="checkbox" name="flip" value="horFlip" <?php if (($flip === true) && ($mode === "parpoint")) {
                                                                                                                                echo "checked";
                                                                                                                            } ?>>
                                <label class="form-check-label">Changer le Sens</label>
                            </div>

                            <div class="col-12">


                                <div>

                                    <button id="btnTransObj" class="btn btn-primary btn-sm mt-2 mb-2" data-toggle="tooltip" data-placement="top" title="Permet d'activer/désactiver le mode transparence pour la menuiserie. 
                                        La transparence permet de faire disparaître les zones claires de la photo de menuiserie en fonction du réglage du filtre.
                                        L'activation de la transparence permet d'acceder à des options supplémentaires.">Transparence</button>


                                    <div id="btnPlusMinor" class="btn-group" role="group" hidden data-toggle="tooltip" data-placement="top" title="Permet d'augmenter/diminuer la valeur du filtre de transparence. 
                                        Un filtre haut affecte les couleurs claires.
                                        Un filtre au minimum rend l'image totalement transparente.">
                                        <button id="btnMinor" type="button" class="btn btn-sm btn-primary">-</button>
                                        <button id="btnPlus" type="button" class="btn btn-sm btn-primary">+</button>
                                    </div>


                                </div>



                                <button id="btnDetourObj" class="btn btn-primary btn-sm mb-4" data-toggle="tooltip" data-placement="top" title="Permet de supprimer la zone de pixels inutiles tout autour d'une menuiserie.
                                    Surtout efficace en cas de photo menuiserie sur fond clair.">Détourage</button>



                            </div>
                        </div>
                        <!-- Fin de Bloc  -->

                    </div>
                </div>

                <div class="col-12 col-sm-6 col-xl-12 d-flex justify-content-center align-self-end">

                    <div class="col">
                        <p id="pbatiment">Bâtiment</p>

                        <!-- Vignette Vue -->
                        <div class="row">
                            <div class="col-12">
                                <button id="btnupVue" class="btn btn-primary btn-sm mb-2" data-toggle="tooltip" data-placement="top" title="Permet de charger une image de la vue du bâtiment.">Choisir la Façade</button>



                            </div>
                            <div class="col-12 mb-4">

                                <img id="img_vue" alt="Image Vue" src="<?php echo $img64Vue ?>">

                            </div>

                            <form id='changePicture' action="" method="post" enctype="multipart/form-data" hidden>
                                <input id="inpVueSet" class="input-file" type="file" name="fichierVue" accept="image/*">
                                <input id="inpObjSet" class="input-file" type="file" name="fichierObj" accept="image/*">
                            </form>


                        </div>
                        <!-- Fin de Bloc  -->

                    </div>
                </div>

            </div>

            <div class="row">

                <div class="col-12 col-sm-6 col-xl-12 d-flex justify-content-center">

                    <div class="col">

                        <button id="btnDelObj" class="btn btn-primary btn-sm" hidden>Réinitialiser</button>

                        <p id="pmode">Mode</p>

                        <!-- Bloc Mode -->
                        <div class="row ">
                            <div class="col-12">

                                <div class="btn-group-vertical mb-4" role="group" aria-label="Choix du Mode">
                                    <button type="button" id="btnProp" class="btn btn-sm btn-primary" data-toggle="tooltip" data-placement="top" title="Permet de dessiner une menuiserie en conservant strictement son ratio hauteur/largeur">Proportionnel</button>
                                    <button type="button" id="btnPerso" class="btn btn-sm btn-primary" data-toggle="tooltip" data-placement="top" title="Permet de dessiner une menuiserie sans respecter son ratio d'origine">Personnalisé</button>
                                    <button type="button" id="btnPoint" class="btn btn-sm btn-primary" data-toggle="tooltip" data-placement="top" title="Permet de dessiner une menuiserie en l'inscrivant dans un quadrilatère définit par l'utilisateur. 
                                    Les quatres points définissant le quadrilatère doivent être distinct. 
                                    Les diagonales du quadrilatère doivent se couper au sein de son aire.">Par Points</button>
                                </div>

                            </div>
                        </div>
                        <!-- Fin de Bloc  -->

                    </div>
                </div>

                <div class="col-12 col-sm-6 col-xl-12 d-flex justify-content-center align-self-end">

                    <div class="col">
                    <p id="pmention">Mention</p>

                        <!-- Bloc Mention -->
                        <div class="row ">
                            <div class="col-12">
                                <div>

                                    <div class="btn-group  mb-2">
                                        <div data-toggle="tooltip" data-placement="top" title="Permet de changer la couleur de la mention">
                                            <button id="dropMention" type="button" class="btn btn-primary btn-sm dropdown-toggle" data-toggle="dropdown" aria-expanded="false">
                                                Aucune
                                            </button>
                                            <div id="mentionCol" class="dropdown-menu">
                                                <button id="dropNone" class="dropdown-item" value="None">Aucune</button>
                                                <button id="dropWhite" class="dropdown-item" value="White">Blanche</button>
                                                <button id="dropBlack" class="dropdown-item" value="Black">Noire</button>
                                                <button id="dropRed" class="dropdown-item" value="Red">Rouge</button>
                                                <button id="dropYellow" class="dropdown-item" value="Yellow">Jaune</button>
                                                <button id="dropLime" class="dropdown-item" value="Lime">Vert</button>
                                                <button id="dropAqua" class="dropdown-item" value="Aqua">Cyan</button>
                                                <button id="dropBlue" class="dropdown-item" value="Blue">Bleue</button>
                                                <button id="dropMagenta" class="dropdown-item" value="Magenta">Magenta</button>
                                            </div>
                                        </div>
                                    </div>



                                    <div class="btn-group mb-2">
                                        <div data-toggle="tooltip" data-placement="top" title="Permet de changer la position de la mention">
                                            <button id="dropMentionPos" type="button" class="btn btn-primary btn-sm dropdown-toggle" data-toggle="dropdown" aria-expanded="false">
                                                Bas-Gauche
                                            </button>
                                            <div id="mentionPos" class="dropdown-menu">
                                                <button id="menPosBL" class="dropdown-item" value="bl">Bas-Gauche</button>
                                                <button id="menPosBR" class="dropdown-item" value="br">Bas-Droite</button>
                                                <button id="menPosTL" class="dropdown-item" value="tl">Haut-Gauche</button>
                                                <button id="menPosTR" class="dropdown-item" value="tr">Haut-Droite</button>
                                            </div>
                                        </div>
                                    </div>



                                </div>

                                <input class="mb-2" type="text" id="mention" name="mention" value="Photo non contractuelle" required minlength="1" maxlength="128" data-toggle="tooltip" data-placement="top" title="Permet de changer le texte de la mention">


                            </div>
                        </div>
                        <!-- Fin de Bloc  -->

                    </div>
                </div>
            </div>

            <div class="col-12 ">

                <button id="btnExportObj" class="btn btn-lg btn-block btn-success mb-2">Export Menuiserie</button>

            </div>

            <div class="col-12 ">

                <!-- Bloc de l'Export -->
                <button id="btnExport" type="button" class="btn btn-lg btn-block btn-primary mt-6" disabled data-toggle="tooltip" data-placement="top" title="Permet d'exporter le résultat de la Mise en Situation">Exporter</button>


                <!-- Fin de Bloc -->

                <p id="warnlab"></p>


            </div>

            <!-- Canvas pour gestion tranparence -->
            <canvas id="canvasT" hidden>Votre navigateur ne prend pas en charge l'élément canvas</canvas>

        </div>

        <!-- Script -->

        <script src="https://cdn.jsdelivr.net/npm/jquery@3.5.1/dist/jquery.slim.min.js" integrity="sha384-DfXdz2htPH0lsSSs5nCTpuj/zy4C+OGpamoFVy38MVBnE+IbbVYUew+OrCXaRkfj" crossorigin="anonymous"></script>
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-Fy6S3B9q64WdZWQUiU+q4/2Lc9npb8tCaSX9FK7E8HnRr0Jz8D6OP9dO5Vg3Q9ct" crossorigin="anonymous"></script>
        <script src="https://cdn.jsdelivr.net/npm/popper.js@1.16.1/dist/umd/popper.min.js" integrity="sha384-9/reFTGAW83EW2RDu2S0VKaIzap3H66lZH81PoYlFhbGU+6BZp6G7niu735Sk7lN" crossorigin="anonymous"></script>

        <script src="/assets/js/MiseEnSituation/MiseEnSituation.js"></script>

</body>

</html>
