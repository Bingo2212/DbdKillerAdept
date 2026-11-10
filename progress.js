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

    const perksOn = document.body.classList.contains("perks-mode");
    typeButtons.querySelectorAll("button").forEach((button) => {
      const name = button.textContent.trim().toLowerCase();
      button.classList.toggle(
        "active",
        perksOn ? name === "perks" : name === type,
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

  if (search) {
    search.addEventListener("input", () => {
      update();
      if (document.body.classList.contains("perks-mode")) filterPerks();
    });
  }

  const perksButton = document.createElement("button");
  perksButton.type = "button";
  perksButton.textContent = "Perks";
  perksButton.onclick = () => setPerksMode(true);
  typeButtons.appendChild(perksButton);

  typeButtons.querySelectorAll("button").forEach((button) => {
    if (button !== perksButton) {
      button.addEventListener("click", () => setPerksMode(false));
    }
  });

  const defaultPlaceholder = search ? search.placeholder : "";
  const perksWrap = document.createElement("div");
  perksWrap.className = "perks-wrap";
  const perksCount = document.createElement("p");
  perksCount.className = "perks-count";
  const perksList = document.createElement("div");
  perksList.className = "perks-list";
  const perksEmpty = document.createElement("p");
  perksEmpty.className = "perks-empty";
  perksEmpty.textContent = "No perks match your search.";
  perksEmpty.hidden = true;
  perksWrap.append(perksCount, perksList, perksEmpty);
  noResults.insertAdjacentElement("afterend", perksWrap);

  let perkNodes = null;
  let perkTotal = 0;

  function plain(value) {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function aliasText(name) {
    return typeof searchAliases !== "undefined" && searchAliases[name]
      ? searchAliases[name].join(" ")
      : "";
  }

  window.filterIcons = function () {
    const terms = plain(search ? search.value : "")
      .split(/\s+/)
      .filter(Boolean);
    document.querySelectorAll(".icon").forEach((icon) => {
      const name = icon.dataset.name || "";
      const haystack = plain(`${name} ${aliasText(name)}`);
      icon.style.display = terms.every((term) => haystack.includes(term))
        ? "block"
        : "none";
    });
  };

  function collectPerks() {
    const list = [];
    const add = (icons, role) => {
      icons.forEach((icon) => {
        (icon.hoverImages || []).forEach((src, i) => {
          const name = getPerkName(icon.name, i + 1);
          if (name === "Perk Name") return;
          const quote = getPerkQuote(icon.name, i + 1);
          list.push({
            name,
            owner: icon.name,
            role,
            src,
            description: getPerkDescription(icon.name, i + 1),
            quote:
              quote && quote.trim() !== '""' && !quote.includes("goes here")
                ? quote
                : "",
          });
        });
      });
    };
    add(killerIcons, "Killer");
    add(survivorIcons, "Survivor");
    if (typeof genericPerks !== "undefined") {
      genericPerks.forEach((perk) => {
        list.push({
          name: perk.name,
          owner: perk.owner || "Generic",
          role: perk.role || "",
          src: perk.src,
          description: perk.description || "Perk description goes here.",
          quote: perk.quote && perk.quote.trim() !== '""' ? perk.quote : "",
        });
      });
    }
    list.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    );
    return list;
  }

  function buildPerks() {
    if (perkNodes || typeof killerIcons === "undefined") return;
    perkNodes = [];
    const perks = collectPerks();
    perkTotal = perks.length;
    const measure = document.createElement("div");
    let currentLetter = "";

    perks.forEach((perk) => {
      const first = plain(perk.name).charAt(0).toUpperCase();
      const letter = /[A-Z]/.test(first) ? first : "#";
      if (letter !== currentLetter) {
        currentLetter = letter;
        const heading = document.createElement("h2");
        heading.className = "perk-letter";
        heading.textContent = letter;
        perksList.appendChild(heading);
        perkNodes.push({ kind: "letter", el: heading });
      }

      const card = document.createElement("article");
      card.className = "perk-card";

      const wrapper = document.createElement("div");
      wrapper.className = "img-wrapper perk-bg";
      const img = document.createElement("img");
      img.loading = "lazy";
      img.decoding = "async";
      img.src = perk.src;
      img.alt = perk.name;
      wrapper.appendChild(img);

      const body = document.createElement("div");
      body.className = "perk-card-body";

      const name = document.createElement("h3");
      name.className = "perk-card-name";
      name.textContent = perk.name;

      const owner = document.createElement("div");
      owner.className = "perk-card-owner";
      owner.textContent = perk.role
        ? `${perk.owner} · ${perk.role}`
        : perk.owner;

      const description = document.createElement("div");
      description.className = "perk-card-desc";
      description.innerHTML = perk.description;

      body.append(name, owner, description);

      if (perk.quote) {
        const quote = document.createElement("div");
        quote.className = "perk-card-quote";
        quote.textContent = perk.quote;
        body.appendChild(quote);
      }

      card.append(wrapper, body);
      perksList.appendChild(card);

      measure.innerHTML = perk.description;
      perkNodes.push({
        kind: "perk",
        el: card,
        text: plain(
          `${perk.name} ${aliasText(perk.name)} ${perk.owner} ${aliasText(perk.owner)} ${measure.textContent}`,
        ),
      });
    });
  }

  function filterPerks() {
    if (!perkNodes) return;
    const terms = plain(search ? search.value : "")
      .split(/\s+/)
      .filter(Boolean);
    let shown = 0;
    let heading = null;
    let headingHasVisible = false;

    const closeHeading = () => {
      if (heading) heading.hidden = !headingHasVisible;
    };

    perkNodes.forEach((node) => {
      if (node.kind === "letter") {
        closeHeading();
        heading = node.el;
        headingHasVisible = false;
        return;
      }
      const match = terms.every((term) => node.text.includes(term));
      node.el.hidden = !match;
      if (match) {
        shown += 1;
        headingHasVisible = true;
      }
    });
    closeHeading();

    perksCount.textContent = terms.length
      ? `${shown} of ${perkTotal} perks`
      : `${perkTotal} perks`;
    perksEmpty.hidden = shown > 0;
  }

  function setPerksMode(on) {
    document.body.classList.toggle("perks-mode", on);
    if (search)
      search.placeholder = on
        ? "Search perks and descriptions..."
        : defaultPlaceholder;
    if (on) {
      buildPerks();
      filterPerks();
      window.scrollTo(0, 0);
    }
    update();
  }

  update();
})();
