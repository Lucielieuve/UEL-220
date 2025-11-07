$(document).ready(function() {

  let musicStarted = false;
  const music = $("#background-music")[0];


  //****FONCTION DE CHARGEMENT DES SECTIONS****//
  function afficherSection(sectionCible) {
    //Réinitialisation de la barre de progression
    $("#progress").css("width", "0%");
    let barreProgress = 0;

    //Affichage de la page de chargement
    $(".loading").css("display", "flex").hide().fadeIn(200);

    //Masquer les sections visibles
    $("section").not(".loading").fadeOut(200);

    //Avancement de la barre de progression
    const BarreInterval = setInterval(function () {
      barreProgress += 1;
      $("#progress").css("width", barreProgress + "%");

      //Condition lorsqu'elle arrive à 100%
      if (barreProgress >= 100) {
        clearInterval(BarreInterval);

        // Transition vers page cible
        setTimeout(function() {
          $(".loading").fadeOut(600, function() {
            $(sectionCible).css("display", "flex").hide().fadeIn(600);
          });
        }, 300);
      }
    }, 20);
  }

  //*** BARRE DE PROGRESSION FONCTIONNEMENT***//
  let progress = 0;
  const interval = setInterval(function() {
    progress += 1;
    $("#progress").css("width", progress + "%");

    if (progress >= 100) {
      clearInterval(interval);

      setTimeout(function() {
        $(".loading").fadeOut(600, function() {
          $(".accueil").css("display", "flex").hide().fadeIn(600);

          // 🎵 Lancer la musique seulement au premier chargement
          if (!musicStarted) {
            music.volume = 0.5;
            music.play().catch(err => console.log("Lecture auto bloquée :", err));
            musicStarted = true;
          }
        });
      }, 300);
    }
  }, 20);

  //*** BOUTON PREPARER MA RECETTE ***//
  $("#prep-recette").on("click", function () {
    afficherSection(".form-recette");
  });

  //*** BOUTONS CHOISIR POUR MOI***//
  $(".btn-aleatoire").on("click", function() {
    afficherSection(".section-recette-ingredients");
  });

  //*** BOUTON ACCUEIL PAGE RECETTE ***//
  $(".btn-accueil").click(function() {
    location.reload();
  });

  // === GESTION DU SON ===
$(".btn-song").click(function() {
  const icon = $(this).find(".song-img");

  if (music.paused) {
    music.play();
  } else {
    music.pause();
  }
});

// ✅ Débloquer la musique au premier clic utilisateur
$(document).one("click", function() {
  if (!musicStarted) {
    music.volume = 0.5;
    music.play().catch(err => console.log(err));
    musicStarted = true;
  }
});


});