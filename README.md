# presentation-html

Self-contained HTML travel and hike presentations. Each hike is a single folder with a data file (`index.html`) and images — no build step required.

## Live site

**[stotrifork.github.io/presentation-html/hikes/](https://stotrifork.github.io/presentation-html/hikes/)**

## Hikes

| Tur | Region | Link |
|-----|--------|------|
| Malerweg · Etape 1–3 (option 2) | Sächsische Schweiz | [åbn](https://stotrifork.github.io/presentation-html/hikes/malerweg-option2/) |
| Malerweg · Etape 1–3 | Sächsische Schweiz | [åbn](https://stotrifork.github.io/presentation-html/hikes/malerweg-1-2-3/) |
| Sächsische Schweiz | Sachsen, Tyskland | [åbn](https://stotrifork.github.io/presentation-html/hikes/sachsische-schweiz/) |
| Zugspitze Circuit | Bayern, Tyskland | [åbn](https://stotrifork.github.io/presentation-html/hikes/zugspitze/) |

## Structure

```
hikes/
├── index.html               ← overview card grid
├── _shared/
│   ├── theme.css            ← shared styles
│   └── renderer.js          ← builds page from window.TRIP data
└── <hike-name>/
    ├── index.html           ← data only: window.TRIP = { … }
    ├── images/
    │   ├── web/             ← downloaded images
    │   └── own/             ← personal photos
    └── routes/              ← GPX route files
```

## Adding a new hike

1. Copy an existing hike folder and rename it
2. Edit only the `window.TRIP = { … }` block in `index.html`
3. Add the hike to the `HIKES` array in `hikes/index.html`
