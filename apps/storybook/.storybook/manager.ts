import { semanticValues, type as typeTokens, wonderWagonDefaults } from "@wonder-wagon/tokens";
import { addons } from "storybook/manager-api";
import { create } from "storybook/theming/create";

// The manager is the night workshop. Every value is a token read at build time, so the
// workshop and the specimens on the bench cannot drift apart.
const night = semanticValues("night");

addons.setConfig({
  theme: create({
    base: "dark",
    brandTitle: "Wonder Wagon UI · the bench",
    brandUrl: "?path=/docs/workshop-welcome--docs",
    brandImage: "brand/reference-case.svg",
    brandTarget: "_self",
    colorPrimary: wonderWagonDefaults.accent.night,
    colorSecondary: wonderWagonDefaults.signal.night,
    appBg: night.ground as string,
    appContentBg: night["ground-side"] as string,
    appPreviewBg: night.ground as string,
    appHoverBg: night["surface-2"] as string,
    appBorderColor: night.hairline as string,
    appBorderRadius: 6,
    fontBase: typeTokens["font-working"].value,
    fontCode: typeTokens["font-plate"].value,
    textColor: night.ink as string,
    textInverseColor: semanticValues("day").ink as string,
    textMutedColor: night["ink-muted"] as string,
    barTextColor: night["ink-muted"] as string,
    barSelectedColor: wonderWagonDefaults.signal.night,
    barHoverColor: night.ink as string,
    barBg: night.ground as string,
    buttonBg: night["surface-2"] as string,
    buttonBorder: night["hairline-strong"] as string,
    booleanBg: night["surface-2"] as string,
    booleanSelectedBg: wonderWagonDefaults.accent.night,
    inputBg: night["surface-2"] as string,
    inputBorder: night["hairline-strong"] as string,
    inputTextColor: night.ink as string,
    inputBorderRadius: 6,
  }),
  sidebar: { showRoots: true },
});
