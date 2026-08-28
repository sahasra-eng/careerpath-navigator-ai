import { renderCareers } from "./views/careers.js";
import { renderHome } from "./views/home.js";
import { renderLearn } from "./views/learn.js";
import { renderNavigator } from "./views/navigator.js";

const ROUTES = {
  "/": { key: "home", render: (root) => renderHome(root) },
  "/navigator": { key: "navigator", render: (root, url) => renderNavigator(root, { openQuiz: url.searchParams.get("quiz") === "1" }) },
  "/careers": { key: "careers", render: (root) => renderCareers(root) },
  "/learn": { key: "learn", render: (root) => renderLearn(root) },
};

function markActive(key) {
  document.querySelectorAll(".nav-links a[data-nav]").forEach((a) => {
    if (a.dataset.nav === key) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
}

export function render() {
  const root = document.querySelector("#main");
  if (!root) return;
  const url = new URL(window.location.href);
  const route = ROUTES[url.pathname] || ROUTES["/"];
  markActive(route.key);
  document.querySelector(".mobile-menu")?.setAttribute("hidden", "");
  document.querySelector(".nav-toggle")?.setAttribute("aria-expanded", "false");
  root.innerHTML = "";
  Promise.resolve(route.render(root, url)).catch(() => {
    root.innerHTML = `<section><div class="empty" data-testid="route-error"><h3>Something went wrong loading this page</h3><p class="muted">Please refresh and try again.</p></div></section>`;
  });
}

export function navigate(path) {
  if (path !== window.location.pathname + window.location.search) {
    window.history.pushState({}, "", path);
  }
  render();
  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
}

export function startRouter() {
  document.addEventListener("click", (e) => {
    const link = e.target.closest("a[data-link]");
    if (!link) return;
    const href = link.getAttribute("href");
    if (!href || href.startsWith("http")) return;
    e.preventDefault();
    navigate(href);
  });
  window.addEventListener("popstate", render);
  render();
}
