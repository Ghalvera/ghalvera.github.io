const root = document.documentElement;
const header = document.querySelector("[data-header]");
const menu = document.querySelector("[data-menu]");
const navigation = document.querySelector("[data-nav]");
const themeToggle = document.querySelector("[data-theme-toggle]");
const themeLabel = document.querySelector("[data-theme-label]");
const systemTheme = window.matchMedia("(prefers-color-scheme: light)");

const storedTheme = (() => {
  try { return localStorage.getItem("ghalvera-theme"); }
  catch { return null; }
})();

function activeTheme() {
  return root.dataset.theme || (systemTheme.matches ? "light" : "dark");
}

function updateThemeControl() {
  if (!themeToggle || !themeLabel) return;
  const nextTheme = activeTheme() === "dark" ? "light" : "dark";
  themeToggle.setAttribute("aria-label", `Switch to ${nextTheme} theme`);
}

if (storedTheme === "light" || storedTheme === "dark") root.dataset.theme = storedTheme;
updateThemeControl();

themeToggle?.addEventListener("click", () => {
  const nextTheme = activeTheme() === "dark" ? "light" : "dark";
  root.dataset.theme = nextTheme;
  try { localStorage.setItem("ghalvera-theme", nextTheme); } catch {}
  updateThemeControl();
});

systemTheme.addEventListener?.("change", () => {
  if (!root.dataset.theme) updateThemeControl();
});

if (header && menu && navigation) {
  header.classList.add("js-ready");
  menu.addEventListener("click", () => {
    const open = header.classList.toggle("is-open");
    menu.setAttribute("aria-expanded", String(open));
  });
  navigation.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      header.classList.remove("is-open");
      menu.setAttribute("aria-expanded", "false");
    }
  });
}
