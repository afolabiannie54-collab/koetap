// Colours for a store's own pages. The main app is black and white. Inside a store (the store environment and its
// POS), the store's accent colour takes over the roles that black plays: primary buttons, table headers, the active
// section marker, the Open POS button and the logo tile. It is used at full strength, never as a pale wash: the
// page and panels stay white. A store with no accent colour stays black and white.
//
// The result is a stylesheet for the wrapper element that has the given class (default "store-scope", used by the POS).
export function storeThemeCss(accent, readable, scope = ".store-scope") {
  return [
    `${scope}{--brand:${accent};--brand-fg:${readable};--primary:${accent};--primary-foreground:${readable};`,
    `--head-bg:${accent};--head-fg:${readable};}`,
    `.dark ${scope}{--head-bg:color-mix(in srgb, ${accent} 80%, #000000);--head-fg:#ffffff;}`,
  ].join("");
}

// The store environment (the store's own space with its sidebar) reads these two variables for the Open POS button,
// the current-section marker and the logo tile, on top of the colours above.
export function storeAccentCss(accent, readable) {
  return `.store-env{--store-accent:${accent};--store-accent-fg:${readable};}`;
}
