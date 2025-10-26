<script>
  const loader = document.querySelector('.loading');
  const progress = document.getElementById('progress');
  const body = document.body;

  function startLoader(callback) {
    let width = 0;
    progress.style.width = "0%";
    loader.style.display = "flex";   // on s'assure que le loader est visible
    body.style.overflow = "hidden";  // empêche le scroll pendant le chargement

    const interval = setInterval(() => {
      width += 2;
      progress.style.width = width + "%";

      if (width >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          // disparition progressive du loader
          loader.style.transition = "opacity 0.8s ease";
          loader.style.opacity = "0";

          // après la transition, on masque la section
          setTimeout(() => {
            loader.style.display = "none";
            body.style.overflow = "auto"; // on réactive le scroll
            if (callback) callback();
          }, 800);
        }, 300);
      }
    }, 50);
  }

  // Lancement automatique du loader au chargement de la page
  window.addEventListener('load', () => startLoader());
</script>
