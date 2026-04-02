# ui-common

Shared ui primitives for the main [Web app](./../../../apps/web).

## Usage

- Import path: `ui-common`
- Scope: reusable building blocks only (button/input/card, primitives, shared tokens)

## UI baseline direction

- **Visual style:** clean, calm, map-product feel (Google Maps / Figma-like clarity)
- **Surface model:** neutral backgrounds + subtle borders, not heavy effects
- **Depth:** use spacing, contrast, and hierarchy before shadows
- **Motion:** quick and restrained (interaction feedback, not decoration)

## Library boundaries

- `libs/ui/common`: reusable cross-module UI primitives
- `libs/ui/modules/*`: domain/module UI composed from `ui-common`
