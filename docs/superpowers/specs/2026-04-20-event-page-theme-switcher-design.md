# Event Page Theme Switcher — Design

## Context

The event page (`src/pages/EventPage.tsx`) renders with whatever theme was saved on the event record (`data.event.theme`). There is currently no way for a viewer to change the visual theme of the page. The home page (`src/pages/HomePage.tsx`) already has a `ThemePicker` grid that lets the creator choose a theme at event-creation time.

This change adds a small, inline theme switcher to the event page header so any viewer can change the visual theme locally for their own session.

## Goals

- Let viewers switch the visual theme of an event page without affecting anyone else.
- Match the existing visual language of the page (round pill buttons, `bg-white/90`/backdrop, brand accent for active state).
- Keep the change small and cosmetic: no API changes, no persistence, no data model changes.

## Non-Goals

- Persisting the viewer's theme choice to the server or across sessions.
- Replacing or modifying the existing `ThemePicker` used on the home page.
- Per-viewer theme preference storage (localStorage, cookies, etc.).
- Changing the event's stored theme.

## User Experience

### Placement

In the existing event-page header row:

```
[Title + date/people line]   …   [🍕][🥾][🛍][🎮] [+ New event]
```

The theme switcher sits immediately to the left of the "New event" link, in the same flex row. On narrow viewports the parent `flex-wrap` already wraps the right-side group below the title, so no extra breakpoint work is required.

### Behavior

- The active theme button on the switcher defaults to the event's saved theme (`data.event.theme`).
- Clicking a different theme button immediately updates the visual theme of the page (palette, drifting emojis, confetti emoji).
- Refreshing the page resets the view to the event's saved theme.
- No persistence, no API call.

## Implementation

### State in `EventPage`

Add one new piece of state:

```ts
const [themeOverride, setThemeOverride] = useState<ThemeId | null>(null);
```

Derive the theme that should drive rendering:

```ts
const activeTheme = themeOverride ?? data.event.theme;
```

Replace the two current uses of `data.event.theme` in the success branch:

- `<Layout theme={data.event.theme}>` → `<Layout theme={activeTheme}>`
- `const t = getTheme(data.event.theme)` → `const t = getTheme(activeTheme)` (powers `ConfettiBurst`'s `emoji={t.confettiEmoji}`)

The `Layout` for the loading and error branches can keep their hardcoded `'eating'` fallback — no behavior change there.

Using `null` as the initial override (rather than `data.event.theme`) keeps the intent explicit: "the viewer has not overridden anything." It also means if `data` is ever refetched with a different theme, the default naturally tracks the new saved theme.

### New component: `ThemeSwitcher`

Create `src/components/ThemeSwitcher.tsx`. Separate from `ThemePicker` because the visual treatment is different enough (inline row of small emoji-only buttons vs. large grid cells with label) that sharing a component would require adding a variant prop that obscures rather than clarifies.

Props:

```ts
interface Props {
  value: ThemeId;
  onChange: (id: ThemeId) => void;
  className?: string;
}
```

Structure:

- Root: `<div role="radiogroup" aria-label="Switch theme" className={cn('inline-flex items-center gap-1', className)}>`
- For each `THEME_IDS` entry, render a `<button type="button" role="radio" aria-checked={active} aria-label={t.label}>` containing just the theme emoji.
- Button sizing: ~32–36px square so the row height matches the `New event` pill.
- Styling:
  - Inactive: transparent background, subtle hover (`hover:bg-white/70`), rounded-full.
  - Active: `bg-white/90 ring-1 ring-black/5 shadow-sm` (or similar subtle-but-clear treatment — exact classes chosen during implementation to match the `New event` pill's elevation without competing with it).
  - Emoji sized `text-lg` or `text-xl`.

### Layout change in `EventPage`

Wrap the right-side of the header row in a sub-flex row so the switcher and the "New event" link live together:

```tsx
<div className="flex items-center gap-2 shrink-0">
  <ThemeSwitcher value={activeTheme} onChange={setThemeOverride} />
  <Link to="/" className="...existing classes...">
    <span aria-hidden>＋</span>
    <span>New event</span>
  </Link>
</div>
```

The outer header `<div className="mb-6 flex items-start justify-between gap-4 flex-wrap">` stays as-is.

`setThemeOverride` is passed directly as `onChange`. Because its parameter type is `ThemeId` (not `ThemeId | null`), the override can never be cleared back to "no override" via the UI — which is fine. The switcher always shows *some* active theme, defaulting to the event's saved theme.

## Accessibility

- `radiogroup`/`radio` roles with `aria-checked` on each button.
- Each button has an `aria-label` of the theme's human label (e.g., "Eating", "Hiking") since the emoji is the only visible content (`aria-hidden` on the emoji span).
- Buttons are keyboard-focusable by default. Arrow-key navigation within the radiogroup is not implemented (the existing `ThemePicker` on HomePage doesn't do this either — consistency over completeness for this change).

## Testing

No new tests for this change. The behavior is purely presentational local state with no branches or edge cases worth covering. The existing `ThemePicker.test.tsx` can serve as a reference pattern if we later decide to add one.

## Files Touched

- `src/components/ThemeSwitcher.tsx` — new
- `src/pages/EventPage.tsx` — add state, swap two `data.event.theme` references, wrap header right-side in flex row, render `<ThemeSwitcher />`
