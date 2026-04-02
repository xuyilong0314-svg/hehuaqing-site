(() => {
  const mobileQuery = window.matchMedia("(max-width: 700px)");

  document.documentElement.classList.add("js-nav-ready");

  const headers = Array.from(document.querySelectorAll(".site-header")).filter((header) =>
    header.querySelector(".site-nav"),
  );

  headers.forEach((header, index) => {
    const nav = header.querySelector(".site-nav");
    if (!nav) return;

    header.classList.add("nav-mobile-ready");

    const button = document.createElement("button");
    button.type = "button";
    button.className = "nav-toggle";

    const label = document.createElement("span");
    label.className = "nav-toggle-label";
    label.textContent = "菜单";
    button.appendChild(label);

    const navId = nav.id || `site-nav-${index + 1}`;
    nav.id = navId;
    button.setAttribute("aria-controls", navId);

    header.insertBefore(button, nav);

    let isOpen = false;

    const applyState = () => {
      const isMobile = mobileQuery.matches;

      if (!isMobile) {
        nav.hidden = false;
        header.classList.remove("nav-open");
        button.setAttribute("aria-expanded", "false");
        button.setAttribute("aria-label", "打开菜单");
        label.textContent = "菜单";
        return;
      }

      nav.hidden = !isOpen;
      header.classList.toggle("nav-open", isOpen);
      button.setAttribute("aria-expanded", isOpen ? "true" : "false");
      button.setAttribute("aria-label", isOpen ? "收起菜单" : "打开菜单");
      label.textContent = isOpen ? "收起" : "菜单";
    };

    const closeMenu = () => {
      if (!mobileQuery.matches) return;
      isOpen = false;
      applyState();
    };

    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (!mobileQuery.matches) return;
      isOpen = !isOpen;
      applyState();
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        closeMenu();
      });
    });

    document.addEventListener("click", (event) => {
      if (!mobileQuery.matches || !isOpen) return;
      if (header.contains(event.target)) return;
      closeMenu();
    });

    window.addEventListener("resize", () => {
      if (!mobileQuery.matches) {
        isOpen = false;
      }
      applyState();
    });

    applyState();
  });
})();
