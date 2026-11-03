(function () {
  const container = document.getElementById("iconsContainer");
  const text = document.getElementById("progressText");
  const fill = document.getElementById("progressFill");
  if (!container || !text || !fill) return;

  function update() {
    const total = container.querySelectorAll(".icon").length;
    const done = container.querySelectorAll(".icon.checked").length;
    const type = localStorage.getItem("currentType") || "killers";
    const label = type === "killers" ? "Killer" : "Survivor";
    text.textContent = `${done} / ${total} ${label} Adepts`;
    fill.style.width = total ? (done / total) * 100 + "%" : "0%";

    document.querySelectorAll(".buttons button").forEach((button) => {
      button.classList.toggle(
        "active",
        button.textContent.trim().toLowerCase() === type,
      );
    });
  }

  new MutationObserver(update).observe(container, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class"],
  });

  update();
})();
