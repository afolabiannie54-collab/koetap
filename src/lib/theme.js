// Colours for a store's own pages. The main app is black and white. Inside a store, the store's accent colour
// takes over the roles that black plays: primary buttons, the active tab and nav item, and table headers.
// It is used at full strength, never as a pale wash: the page and panels stay white.
// The result is a stylesheet for the wrapper with class "store-scope" (see the store layout).
export function storeThemeCss(accent, readable) {
  return [
    `.store-scope{--brand:${accent};--brand-fg:${readable};--primary:${accent};--primary-foreground:${readable};`,
    `--head-bg:${accent};--head-fg:${readable};}`,
  ].join("");
}
