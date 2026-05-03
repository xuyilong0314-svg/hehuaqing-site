(() => {
  const mobileQuery = window.matchMedia("(max-width: 700px)");
  const currentPath = window.location.pathname;
  const isNestedPage = /\/(?:articles|poetry)\//.test(currentPath);
  const poetryHref = `${isNestedPage ? "../" : "./"}poetry.html`;
  const searchHref = `${isNestedPage ? "../" : "./"}search.html`;
  const isPoetryPage = /\/poetry(?:\.html)?$/.test(currentPath) || /\/poetry\/[^/]+\.html$/.test(currentPath);
  const isSearchPage = /\/search(?:\.html)?$/.test(currentPath);

  document.documentElement.classList.add("js-nav-ready");

  const addArticleBackfills = () => {
    if (!/(?:^|\/)articles(?:\.html)?$/.test(currentPath)) return;

    document.querySelectorAll(".theme-card").forEach((card) => {
      if (card.querySelector("h3")?.textContent.trim() !== "社会关系") return;
      const count = card.querySelector(".theme-list span");
      if (count) count.textContent = "已上线 5 篇";
    });

    document.querySelectorAll(".section-intro").forEach((intro) => {
      intro.textContent = intro.textContent
        .replace("当前网站已上线 37 篇文章", "当前网站已上线 39 篇文章")
        .replace("当前网站已上线 38 篇文章", "当前网站已上线 39 篇文章");
    });

    const kernelList = Array.from(document.querySelectorAll(".grid-three .card")).find((card) =>
      card.querySelector(".meta-pill")?.textContent.trim() === "核",
    )?.querySelector(".theme-list");
    const afterCircleLink = kernelList?.querySelector('a[href="./articles/huan-quan-zi-gai-bu-liao-ming.html"]');

    if (kernelList && afterCircleLink && !kernelList.querySelector('a[href="./articles/jin-ye-wo-men-shen-qing-xiang-yi.html"]')) {
      const thoughtLink = document.createElement("a");
      thoughtLink.href = "./articles/jin-ye-wo-men-shen-qing-xiang-yi.html";
      thoughtLink.textContent = "今晚，我们深情相依：在关系里练习自他相换";
      afterCircleLink.insertAdjacentElement("afterend", thoughtLink);
    }

    const afterTonightLink =
      kernelList?.querySelector('a[href="./articles/jin-ye-wo-men-shen-qing-xiang-yi.html"]') || afterCircleLink;
    if (kernelList && afterTonightLink && !kernelList.querySelector('a[href="./articles/wei-le-gao-bie-de-ju-hui.html"]')) {
      const goodbyeLink = document.createElement("a");
      goodbyeLink.href = "./articles/wei-le-gao-bie-de-ju-hui.html";
      goodbyeLink.textContent = "为了告别的聚会：让相遇完整，也让结束完整";
      afterTonightLink.insertAdjacentElement("afterend", goodbyeLink);
    }

    const socialGrid = document.querySelector("#liuyi-social .article-grid");
    const afterCircleCard = socialGrid?.querySelector('a[href="./articles/huan-quan-zi-gai-bu-liao-ming.html"]')?.closest("article");
    if (!socialGrid || !afterCircleCard) return;

    if (!socialGrid.querySelector('a[href="./articles/jin-ye-wo-men-shen-qing-xiang-yi.html"]')) {
      const card = document.createElement("article");
      card.className = "article-card column-article-card";
      card.innerHTML = `
                <div class="label-row">
                  <span class="article-meta">一周一会</span>
                  <span class="card-axis">六艺 · 社会关系</span>
                  <span class="card-axis">元核形 · 核</span>
                </div>
                <h3><a href="./articles/jin-ye-wo-men-shen-qing-xiang-yi.html">今晚，我们深情相依：在关系里练习自他相换</a></h3>
                <p class="article-intro">导语：真正的深情，是在关系里练习理解他人，也把自己从旧情绪里解放出来。</p>
                <p>自他相换不是一个技巧，而是一种愿意看见彼此、也愿意回到当下的生命姿态。</p>
                <a class="text-link" href="./articles/jin-ye-wo-men-shen-qing-xiang-yi.html">阅读全文</a>
              `;
      afterCircleCard.insertAdjacentElement("afterend", card);
    }

    const afterTonightCard =
      socialGrid.querySelector('a[href="./articles/jin-ye-wo-men-shen-qing-xiang-yi.html"]')?.closest("article") ||
      afterCircleCard;
    if (afterTonightCard && !socialGrid.querySelector('a[href="./articles/wei-le-gao-bie-de-ju-hui.html"]')) {
      const card = document.createElement("article");
      card.className = "article-card column-article-card";
      card.innerHTML = `
                <div class="label-row">
                  <span class="article-meta">诗文整理</span>
                  <span class="card-axis">六艺 · 社会关系</span>
                  <span class="card-axis">元核形 · 核</span>
                </div>
                <h3><a href="./articles/wei-le-gao-bie-de-ju-hui.html">为了告别的聚会：让相遇完整，也让结束完整</a></h3>
                <p class="article-intro">导语：我们一直在告别，真正成熟的关系，是勇于让它发生，也坦然让它结束。</p>
                <p>相遇会结束，但它唤醒的光，可以继续留在生命里。</p>
                <a class="text-link" href="./articles/wei-le-gao-bie-de-ju-hui.html">阅读全文</a>
              `;
      afterTonightCard.insertAdjacentElement("afterend", card);
    }
  };

  addArticleBackfills();

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

    let searchLink = navLinks.find((link) => /(?:^|\/)search\.html$/.test(link.getAttribute("href") || ""));

    if (!searchLink) {
      searchLink = document.createElement("a");
      searchLink.href = searchHref;
      searchLink.textContent = "搜索";

      const projectsLink = Array.from(nav.querySelectorAll("a")).find((link) =>
        /(?:^|\/)projects\.html$/.test(link.getAttribute("href") || ""),
      );

      if (projectsLink) {
        nav.insertBefore(searchLink, projectsLink);
      } else {
        nav.appendChild(searchLink);
      }
    }

    if (isSearchPage) {
      searchLink.classList.add("is-active");
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
