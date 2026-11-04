(() => {
  "use strict";
  const menu = document.getElementById("site-menu");
  const summary = menu?.querySelector("summary");
  if (!menu || !summary) return;
  const close = (returnFocus = false) => {
    menu.open = false;
    if (returnFocus) summary.focus();
  };
  menu.addEventListener("toggle", () => {
    summary.setAttribute("aria-label", menu.open ? "收起网站菜单" : "展开网站菜单");
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && menu.open) close(true);
  });
  document.addEventListener("click", event => {
    if (menu.open && !menu.contains(event.target)) close();
  });
  menu.querySelectorAll("a").forEach(link => link.addEventListener("click", () => close()));
})();
