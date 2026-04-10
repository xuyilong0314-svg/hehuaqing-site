const input = document.querySelector("#site-search-input");
const status = document.querySelector("#search-status");
const emptyState = document.querySelector("#search-empty");
const resultsRoot = document.querySelector("#search-results");

let pagefindModulePromise;
let debounceTimer;
let requestToken = 0;

const stripHtml = (value = "") => value.replace(/<[^>]+>/g, "");

const resolvePathname = (url) => {
  if (!url) return "";
  return new URL(url, window.location.href).pathname;
};

const isAllowedResult = (url) => {
  const pathname = resolvePathname(url);
  return (
    /(?:^|\/)articles\.html$/.test(pathname) ||
    /(?:^|\/)articles\//.test(pathname) ||
    /(?:^|\/)poetry\.html$/.test(pathname) ||
    /(?:^|\/)poetry\//.test(pathname) ||
    /(?:^|\/)liuyi\.html$/.test(pathname)
  );
};

const inferType = (url) => {
  const pathname = resolvePathname(url);
  if (/(?:^|\/)articles\.html$/.test(pathname) || /(?:^|\/)articles\//.test(pathname)) {
    return "文章";
  }
  if (/(?:^|\/)poetry\.html$/.test(pathname) || /(?:^|\/)poetry\//.test(pathname)) {
    return "诗集";
  }
  if (/(?:^|\/)liuyi\.html$/.test(pathname)) {
    return "六艺";
  }
  return "页面";
};

const getPagefind = async () => {
  if (!pagefindModulePromise) {
    pagefindModulePromise = import("./pagefind/pagefind.js").then(async (pagefind) => {
      await pagefind.options({
        basePath: new URL("./pagefind/", window.location.href).toString(),
        noWorker: true,
      });
      return pagefind;
    });
  }
  return pagefindModulePromise;
};

const escapeHtml = (value = "") =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

const loadAllowedResults = async (search) => {
  const loadedResults = await Promise.all(search.results.map((result) => result.data()));
  return loadedResults
    .filter((result) => isAllowedResult(result.url))
    .map((result) => ({
      url: result.url,
      title: result.meta?.title || "未命名页面",
      excerpt: result.excerpt || escapeHtml(result.meta?.title || "进入阅读"),
    }));
};

const getFallbackTerms = (query) => {
  const chars = Array.from(query);
  const terms = new Set();

  for (let size = chars.length - 1; size >= 1; size -= 1) {
    for (let start = 0; start + size <= chars.length; start += 1) {
      terms.add(chars.slice(start, start + size).join(""));
    }
  }

  return [...terms].filter(Boolean);
};

const includesAllChars = (text, query) =>
  Array.from(query).every((char) => text.includes(char));

const rankFallbackResults = (results, query) => {
  const queryChars = Array.from(query);

  return results
    .map((result) => {
      const title = result.title;
      const excerptText = stripHtml(result.excerpt);
      let score = 0;

      if (title.includes(query)) score += 100;
      if (excerptText.includes(query)) score += 60;
      if (includesAllChars(title, query)) score += 30;
      if (includesAllChars(excerptText, query)) score += 15;

      queryChars.forEach((char) => {
        if (title.includes(char)) score += 4;
        else if (excerptText.includes(char)) score += 2;
      });

      return { ...result, score };
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, "zh-Hans-CN"));
};

const runFallbackSearch = async (pagefind, query) => {
  const variants = getFallbackTerms(query);
  if (!variants.length) return [];

  const merged = new Map();

  for (const term of variants) {
    const search = await pagefind.search(term);
    const results = await loadAllowedResults(search);
    results.forEach((result) => {
      if (!merged.has(result.url)) {
        merged.set(result.url, result);
      }
    });
  }

  return rankFallbackResults([...merged.values()], query);
};

const renderResults = (results) => {
  resultsRoot.innerHTML = "";

  const fragment = document.createDocumentFragment();

  results.forEach((item) => {
    const card = document.createElement("article");
    card.className = "article-card search-result-card";

    const meta = document.createElement("div");
    meta.className = "label-row";

    const metaType = document.createElement("span");
    metaType.className = "article-meta";
    metaType.textContent = inferType(item.url);
    meta.appendChild(metaType);

    const title = document.createElement("h3");
    const titleLink = document.createElement("a");
    titleLink.href = item.url;
    titleLink.textContent = item.title;
    title.appendChild(titleLink);

    const snippet = document.createElement("p");
    snippet.className = "search-result-snippet";
    snippet.innerHTML = item.excerpt;

    const link = document.createElement("a");
    link.className = "text-link";
    link.href = item.url;
    link.textContent = "进入阅读";

    card.append(meta, title, snippet, link);
    fragment.appendChild(card);
  });

  resultsRoot.appendChild(fragment);
};

const renderInitialState = () => {
  status.textContent = "输入一个词，搜索结果会出现在这里。";
  emptyState.hidden = true;
  resultsRoot.innerHTML = "";
};

const renderEmptyState = () => {
  status.textContent = "搜索结果";
  emptyState.hidden = false;
  resultsRoot.innerHTML = "";
};

const runSearch = async (query) => {
  const currentToken = ++requestToken;
  const trimmed = query.trim();

  if (!trimmed) {
    renderInitialState();
    return;
  }

  status.textContent = "正在寻找与你输入更接近的内容……";
  emptyState.hidden = true;

  const pagefind = await getPagefind();
  const search = await pagefind.search(trimmed);
  let filtered = await loadAllowedResults(search);

  if (!filtered.length && Array.from(trimmed).length > 1) {
    filtered = await runFallbackSearch(pagefind, trimmed);
  }

  if (currentToken !== requestToken) return;

  if (!filtered.length) {
    renderEmptyState();
    return;
  }

  status.textContent = `找到 ${filtered.length} 条与你输入更接近的内容。`;
  emptyState.hidden = true;
  renderResults(filtered);
};

input?.addEventListener("input", (event) => {
  clearTimeout(debounceTimer);
  const value = event.target.value;
  debounceTimer = window.setTimeout(() => {
    runSearch(value);
  }, 180);
});

renderInitialState();
