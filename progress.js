(function () {
  const preconnect = document.createElement("link");
  preconnect.rel = "preconnect";
  preconnect.href = "https://deadbydaylight.wiki.gg";
  document.head.appendChild(preconnect);

  const container = document.getElementById("iconsContainer");
  const text = document.getElementById("progressText");
  const fill = document.getElementById("progressFill");
  const typeButtons = document.querySelector(".buttons");
  const progress = document.querySelector(".progress");
  const search = document.getElementById("search");
  if (!container || !text || !fill || !typeButtons) return;

  const bar = document.createElement("div");
  bar.className = "top-bar";
  typeButtons.parentNode.insertBefore(bar, typeButtons);

  const filterButtons = document.createElement("div");
  filterButtons.className = "filter-buttons";
  [
    ["all", "All"],
    ["owned", "Done"],
    ["missing", "Missing"],
  ].forEach(([key, label]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.filter = key;
    button.innerHTML = `${label} <span class="filter-count"></span>`;
    button.onclick = () => setFilter(key);
    filterButtons.appendChild(button);
  });

  bar.appendChild(typeButtons);
  bar.appendChild(filterButtons);
  if (search) bar.appendChild(search);
  if (progress) bar.appendChild(progress);

  const noResults = document.createElement("p");
  noResults.className = "no-results";
  noResults.textContent = "Nothing to show here.";
  noResults.hidden = true;
  container.insertAdjacentElement("afterend", noResults);

  let filter = localStorage.getItem("cardFilter") || "all";

  function setFilter(key) {
    filter = key;
    localStorage.setItem("cardFilter", key);
    update();
  }

  function update() {
    const icons = container.querySelectorAll(".icon");
    const total = icons.length;
    const done = container.querySelectorAll(".icon.checked").length;
    const type = localStorage.getItem("currentType") || "killers";
    const label = type === "killers" ? "Killer" : "Survivor";

    text.textContent = `${done} / ${total} ${label} Adepts`;
    fill.style.width = total ? (done / total) * 100 + "%" : "0%";

    typeButtons.querySelectorAll("button").forEach((button) => {
      button.classList.toggle(
        "active",
        button.textContent.trim().toLowerCase() === type,
      );
    });

    const counts = { all: total, owned: done, missing: total - done };
    filterButtons.querySelectorAll("button").forEach((button) => {
      const key = button.dataset.filter;
      button.classList.toggle("active", key === filter);
      button.querySelector(".filter-count").textContent = counts[key];
    });

    container.dataset.filter = filter;

    if (typeof filterIcons === "function") filterIcons();

    const visible = Array.from(icons).filter(
      (icon) => icon.offsetParent !== null,
    ).length;
    noResults.hidden = total === 0 || visible > 0;
  }

  new MutationObserver(update).observe(container, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class"],
  });

  if (search) search.addEventListener("input", update);

  update();
})();
