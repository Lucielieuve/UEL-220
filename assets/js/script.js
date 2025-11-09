$(document).ready(function () {

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
        setTimeout(function () {
          $(".loading").fadeOut(600, function () {
            $(sectionCible).css("display", "flex").hide().fadeIn(600);
          });
        }, 300);
      }
    }, 20);
  }

  //*** BARRE DE PROGRESSION FONCTIONNEMENT***//
  let progress = 0;
  const interval = setInterval(function () {
    progress += 1;
    $("#progress").css("width", progress + "%");

    if (progress >= 100) {
      clearInterval(interval);

      setTimeout(function () {
        $(".loading").fadeOut(600, function () {
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
  $(".btn-aleatoire").on("click", function () {
    afficherSection(".section-recette-ingredients");
  });

  //*** BOUTON ACCUEIL PAGE RECETTE ***//
  $(".btn-accueil").click(function () {
    location.reload();
  });

  // === GESTION DU SON ===
  $('.btn-song')
  .off('click.sound') // empêche les doublons
  .on('click.sound', function (e) {
    e.preventDefault();
    e.stopPropagation();

    if (!music) return console.warn('Audio introuvable');

    if (music.paused) {
      music.muted = false;
      music.volume = 0.5;
      music.play()
        .then(() => console.log('▶️ playing'))
        .catch(err => console.log('play error:', err));
    } else {
      music.pause();
      console.log('⏸️ paused');
    }
  });

// Appel de l'API
const API = "https://www.themealdb.com/api/json/v1/1";

// INGREDIENTS

let ALL_INGREDIENTS = [];  // liste des ingrédients
let LIST_ALREADY_LOADED = false; // pour éviter de recharger 2 fois

// Permet de charger une seule fois la liste des ingrédients
async function loadIngredientsOnce() {
  if (LIST_ALREADY_LOADED) {
    return;
  }
  try {
    const response = await fetch(API + "/list.php?i=list");
    if (!response.ok) {
      throw new Error("Erreur HTTP " + response.status);
    }
    const data = await response.json();

    const brut = data.meals || []; // "brut" correspond à la liste brute des ingrédients donnée par l'API

    // Permet de récupérer les noms et nettoyer la liste
    ALL_INGREDIENTS = brut
      .map(function (item) {
        return (item.strIngredient || "");
      })
      .sort(function (a, b) {
        return a.localeCompare(b);
      }); // Tri alphabétique

    LIST_ALREADY_LOADED = true;
    console.log("Ingrédients chargés :", ALL_INGREDIENTS.length);
  } catch (error) {
    console.error("Impossible de charger les ingrédients :", error);
  }
}

// ORIGINE
let ALL_ORIGINS = [];
let ORIGINS_ALREADY_LOADED = false;

async function loadOriginsOnce() {
  if (ORIGINS_ALREADY_LOADED) return;
  const response = await fetch(API + "/list.php?a=list");
  const data = await response.json();
  const rawOriginList = data.meals || [];
  ALL_ORIGINS = rawOriginList
    .map(function (item) { return (item.strArea || ""); })
    .sort(function (a, b) { return a.localeCompare(b); });
  ORIGINS_ALREADY_LOADED = true;
}

function createElement(tagName, className) {
  const el = document.createElement(tagName);
  if (className) {
    el.className = className;
  }
  return el;
}

// Ajoute une chip avec image + nom
function addChip(chipsBox, name, maxChips) {
  if (!chipsBox) return;

  // Limite au max (3)
  if (chipsBox.children.length >= maxChips) {
    return;
  }

  // Evite les doublons
  const key = name.toLowerCase();
  const already = chipsBox.querySelector('[data-key="' + key + '"]');
  if (already) {
    return;
  }

  // Créé la chip avec les éléments depuis l'API
  const chip = createElement("div", "ingredient-chip");
  chip.dataset.key = key;

  const img = createElement("img");
  img.alt = name;
  img.src = "https://www.themealdb.com/images/ingredients/" + encodeURIComponent(name) + ".png";

  const label = createElement("span");
  label.textContent = name;

  const btn = createElement("button", "remove-chip");
  btn.type = "button";
  btn.setAttribute("aria-label", "Retirer " + name);
  btn.textContent = "×";

  // Assemble l'img + nom + btn croix dans la chip
  chip.appendChild(img);
  chip.appendChild(label);
  chip.appendChild(btn);
  chipsBox.appendChild(chip);
}

function setupPicker(inputId, suggId, chipsId, maxChips) {

  const input = document.querySelector("#" + inputId);
  const suggBox = document.querySelector("#" + suggId);
  const chipsBox = document.querySelector("#" + chipsId);

  let currentSuggestions = []; // affiche la liste des suggestions
  let highlightedIndex = -1;

  // Afficher la liste de suggestions
  function renderSuggestions(list) {
    currentSuggestions = list.slice(0, 5); // Limite à 5 éléments

    // Par défaut, si on a au moins 1 suggestion, on surligne la première
    if (currentSuggestions.length > 0) {
      highlightedIndex = 0;
    } else {
      highlightedIndex = -1;
    }

    // Cache la box si pas de résultats
    if (currentSuggestions.length === 0) {
      suggBox.style.display = "none";
      suggBox.innerHTML = "";
      return;
    }

    suggBox.style.display = "block";
    suggBox.innerHTML = ""; // on vide la barre de recherche avant de remplir la chip

    for (let i = 0; i < currentSuggestions.length; i++) {
      const name = currentSuggestions[i];
      const item = createElement("div", "suggestion-item");
      item.textContent = name;

      // Clic sur une suggestion
      item.addEventListener("click", function () {
        choose(name);
      });

      suggBox.appendChild(item);
    }
  }

  // Mettre à jour le visuel du surlignage (quand on appuie sur ↑/↓)
  function updateHighlightVisual() {
    const items = suggBox.querySelectorAll(".suggestion-item");
    for (let i = 0; i < items.length; i++) {
      const isSelected = (i === highlightedIndex);
      items[i].setAttribute("aria-selected", isSelected ? "true" : "false");
    }
  }

  // Recalculer la liste selon ce que l’utilisateur tape
  function updateSuggestions() {
    const query = input.value.toLowerCase();

    // Garde les ingrédients qui contiennent le texte saisi
    const filtered = ALL_INGREDIENTS.filter(function (name) {
      return name.toLowerCase().includes(query);
    });

    renderSuggestions(filtered);
  }

  // Ajoute une chip quand on choisit une suggestion
  function choose(name) {
    addChip(chipsBox, name, maxChips);
    input.value = "";
    renderSuggestions([]);
    input.focus();
  }

  if (input) {
    // Au premier focus on charge la liste depuis l’API puis on propose des suggestions
    input.addEventListener("focus", function () {
      loadIngredientsOnce().then(function () {
        updateSuggestions();
      });
    });

    // Met à jour les suggestions quand on écrit
    input.addEventListener("input", function () {
      updateSuggestions();
    });

    // Navigation pour les suggestions : flèches, entrée
    input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        highlightedIndex = (highlightedIndex + 1) % currentSuggestions.length;
        updateHighlightVisual();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        highlightedIndex = (highlightedIndex - 1 + currentSuggestions.length) % currentSuggestions.length;
        updateHighlightVisual();
      } else if (e.key === "Enter") {
        e.preventDefault();
        // On choisit l'élément surligné
        const name = currentSuggestions[highlightedIndex];
        if (name) {
          choose(name);
        }
      }
    });
  }

  // Ferme la liste si on clique en dehors
  document.addEventListener("click", function (e) {
    const clickDansInput = (e.target === input);
    const clickDansSugg = suggBox.contains(e.target);
    if (!clickDansInput && !clickDansSugg) {
      renderSuggestions([]);
    }
  });

  // Supprimer une chip si on clique sur la croix
  if (chipsBox) {
    chipsBox.addEventListener("click", function (e) {
      const bouton = e.target;
      if (bouton.classList.contains("remove-chip")) {
        const chip = bouton.closest(".ingredient-chip");
        if (chip) {
          chip.remove();
        }
      }
    });
  }
}

setupPicker("want", "suggested-ingredients", "selected-ingredients", 3);
setupPicker("dont", "suggested-dont", "excluded-ingredients", 3);

// PARTIE ORIGINE
function setupOriginPicker() {
  const input = document.querySelector("#origin");
  const suggBox = document.querySelector("#suggested-origin");
  const chipBox = document.querySelector("#origin-selected");

  let currentSuggestions = [];
  let highlightedIndex = -1;

  function renderSuggestions(list) {
    currentSuggestions = list.slice(0, 8);
    highlightedIndex = currentSuggestions.length ? 0 : -1;

    if (!currentSuggestions.length) {
      suggBox.style.display = "none";
      suggBox.innerHTML = "";
      return;
    }

    suggBox.style.display = "block";
    suggBox.innerHTML = "";
    for (let i = 0; i < currentSuggestions.length; i++) {
      const name = currentSuggestions[i];
      const row = createElement("div", "suggestion-item");
      row.setAttribute("aria-selected", i === highlightedIndex ? "true" : "false");
      row.textContent = name;
      row.addEventListener("click", function () { choose(name); });
      suggBox.appendChild(row);
    }
  }

  function updateHighlightVisual() {
    const items = suggBox.querySelectorAll(".suggestion-item");
    for (let i = 0; i < items.length; i++) {
      items[i].setAttribute("aria-selected", i === highlightedIndex ? "true" : "false");
    }
    const cur = items[highlightedIndex];
    if (cur) cur.scrollIntoView({ block: "nearest" });
  }

  function updateSuggestions() {
    const q = input.value.toLowerCase().trim();
    if (!q) { renderSuggestions([]); return; }
    const list = ALL_ORIGINS.filter(function (n) { return n.toLowerCase().includes(q); });
    renderSuggestions(list);
  }

  function setOriginChip(name) {
    chipBox.innerHTML = "";
    const chip = createElement("div", "ingredient-chip origin-chip");
    const label = createElement("span");
    label.textContent = name;
    const btn = createElement("button", "remove-chip");
    btn.type = "button";
    btn.setAttribute("aria-label", "Retirer l'origine");
    btn.textContent = "×";
    chip.appendChild(label);
    chip.appendChild(btn);
    chipBox.appendChild(chip);
  }

  function choose(name) {
    setOriginChip(name);
    input.value = "";      // vide le champ
    renderSuggestions([]); // ferme la liste
    input.focus();
  }

  if (input) {
    input.addEventListener("focus", function () {
      loadOriginsOnce().then(updateSuggestions);
    });
    input.addEventListener("input", updateSuggestions);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { renderSuggestions([]); return; }
      if (!currentSuggestions.length) return;
      if (e.key === "ArrowDown") { e.preventDefault(); highlightedIndex = (highlightedIndex + 1) % currentSuggestions.length; updateHighlightVisual(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); highlightedIndex = (highlightedIndex - 1 + currentSuggestions.length) % currentSuggestions.length; updateHighlightVisual(); }
      else if (e.key === "Enter") { e.preventDefault(); choose(currentSuggestions[highlightedIndex]); }
    });
  }

  chipBox.addEventListener("click", function (e) {
    if (e.target.classList.contains("remove-chip")) {
      chipBox.innerHTML = "";
    }
  });

  document.addEventListener("click", function (e) {
    const inInput = (e.target === input);
    const inSugg = suggBox.contains(e.target);
    if (!inInput && !inSugg) renderSuggestions([]);
  });
}

setupOriginPicker();



// Fonctionnalité recette / ingrédients

// revenir à l'accueil au clic du bouton accueil
$(".btn-accueil").on('click', function () { 
  $(".accueil").fadeIn();
  $(this).toggleClass('active');
});

const $sectionRecette = $('.section-recette-ingredients').hide();

// Affiche la section + bouton actif
$('.recette-btns-item').on('click', function () {
  $sectionRecette.fadeIn();
});

// Map des zones -> codes drapeaux
function countryCode(area) {
  const map = {
    American: 'us', British: 'gb', Canadian: 'ca', Chinese: 'cn',
    Croatian: 'hr', Dutch: 'nl', Egyptian: 'eg', Filipino: 'ph',
    French: 'fr', Greek: 'gr', Indian: 'in', Irish: 'ie',
    Italian: 'it', Jamaican: 'jm', Japanese: 'jp', Kenyan: 'ke',
    Malaysian: 'my', Mexican: 'mx', Moroccan: 'ma', Polish: 'pl',
    Portuguese: 'pt', Russian: 'ru', Spanish: 'es', Thai: 'th',
    Tunisian: 'tn', Turkish: 'tr', Vietnamese: 'vn'
  };
  return map[area] || 'un'; // renvoie un drapeau de l'ONU si pas trouvé
};

// Boutons recette aléatoire

$('.btn-aleatoire').on('click', () => {
  remplirRecette('https://www.themealdb.com/api/json/v1/1/random.php');
});


async function remplirRecette(url) {
  // État de chargement + vider les champs
  $('.recette-titre').text('Chargement...');
  $('.ul-ingredients').empty();

  try {
    const res = await fetch('https://www.themealdb.com/api/json/v1/1/random.php');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const meal = data?.meals?.[0];
    if (!meal) throw new Error('Aucune recette trouvée');

    // Remplissage du contenu
    $('.img-recette').attr('src', meal.strMealThumb || '');
    $('.recette-titre').text(meal.strMeal || '');
    $('.recette-description').text(meal.strInstructions || '');

    // Drapeau du pays
    const area = meal.strArea || '';
    const flagUrl = `https://flagcdn.com/48x36/${countryCode(area)}.png`;
    $('.logo-pays').attr('src', flagUrl).attr('alt', area);

    // Ingrédients
    const $ul = $('.ul-ingredients').empty();
    for (let i = 1; i <= 20; i++) {
      const ingredient = (meal[`strIngredient${i}`] || '').trim();
      const measure = (meal[`strMeasure${i}`] || '').trim();
      if (!ingredient) break;

      const imgUrl = `https://www.themealdb.com/images/ingredients/${encodeURIComponent(ingredient)}.png`;

      const $li = $(`
        <li class="li-ingredients">
          <img class="img-ingredient" src="${imgUrl}" alt="${ingredient}">
          <p class="nom-ingredient">${ingredient}</p>
          <p class="quantite">${measure}</p>
        </li>
      `);

      $ul.append($li);
    }

  } catch (error) {
    console.error('Erreur :', error);
    $('.recette-titre').text('Erreur de chargement');
  }
}

});
