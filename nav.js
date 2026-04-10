(() => {
  const mobileQuery = window.matchMedia("(max-width: 700px)");
  const currentPath = window.location.pathname;
  const isNestedPage = /\/(?:articles|poetry)\//.test(currentPath);
  const poetryHref = `${isNestedPage ? "../" : "./"}poetry.html`;
  const isPoetryPage = /\/poetry(?:\.html)?$/.test(currentPath) || /\/poetry\/[^/]+\.html$/.test(currentPath);

  document.documentElement.classList.add("js-nav-ready");

  const headers = Array.from(document.querySelectorAll(".site-header")).filter((header) =>
    header.querySelector(".site-nav"),
  );

  headers.forEach((header, index) => {
    const nav = header.querySelector(".site-nav");
    if (!nav) return;

    const navLinks = Array.from(nav.querySelectorAll("a"));
    let poetryLink = navLinks.find((link) => /(?:^|\/)poetry\.html$/.test(link.getAttribute("href") || ""));

    if (!poetryLink) {
      poetryLink = document.createElement("a");
      poetryLink.href = poetryHref;
      poetryLink.textContent = "诗集";

      const articlesLink = navLinks.find((link) => /(?:^|\/)articles\.html$/.test(link.getAttribute("href") || ""));
      const insertBeforeTarget =
        articlesLink?.nextElementSibling && articlesLink.nextElementSibling.tagName === "A"
          ? articlesLink.nextElementSibling
          : null;

      if (insertBeforeTarget) {
        nav.insertBefore(poetryLink, insertBeforeTarget);
      } else {
        nav.appendChild(poetryLink);
      }
    }

    if (isPoetryPage) {
      poetryLink.classList.add("is-active");
    }

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
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-label", "打开菜单");
    button.setAttribute("aria-haspopup", "true");

    header.insertBefore(button, nav);

    let isOpen = false;

    const applyState = () => {
      const isMobile = mobileQuery.matches;

      if (!isMobile) {
        nav.hidden = false;
        nav.style.display = "";
        header.classList.remove("nav-open");
        button.setAttribute("aria-expanded", "false");
        button.setAttribute("aria-label", "打开菜单");
        label.textContent = "菜单";
        return;
      }

      nav.hidden = !isOpen;
      nav.style.display = isOpen ? "grid" : "none";
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

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      closeMenu();
    });

    const handleViewportChange = () => {
      if (!mobileQuery.matches) {
        isOpen = false;
      }
      applyState();
    };

    if (typeof mobileQuery.addEventListener === "function") {
      mobileQuery.addEventListener("change", handleViewportChange);
    } else {
      mobileQuery.addListener(handleViewportChange);
    }

    applyState();
  });
})();
