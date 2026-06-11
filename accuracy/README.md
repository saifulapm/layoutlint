# Accuracy scoreboard

Engine (Yoga + fontkit) vs headless Chromium golden files. **47/50** cases within threshold (positions ≤1px, sizes ≤1px, text sizes ≤2px).

| case | vw | nodes | max Δpos | max Δsize | worst node | result |
| --- | --- | --- | --- | --- | --- | --- |
| row-fixed-gap | 320 | 4 | 0.00 | 0.00 | — | PASS |
| column-padding-margin | 375 | 6 | 0.00 | 0.00 | — | PASS |
| nested-flex-grow | 768 | 7 | 0.00 | 0.00 | — | PASS |
| wrapping-text | 320 | 3 | 0.00 | 0.00 | — | PASS |
| fixed-vs-auto-row | 375 | 6 | 0.00 | 0.00 | — | PASS |
| min-max-constraints | 768 | 4 | 139.33 | 139.33 | clamped-min (Δw 139.33, Δh 0) | FAIL |
| long-unbroken-string | 320 | 2 | 0.00 | 0.00 | — | PASS |
| emoji-text | 375 | 2 | 0.00 | 0.00 | — | PASS |
| bangla-text | 320 | 2 | 0.00 | 0.00 | — | PASS |
| space-between-wrap | 375 | 6 | 0.00 | 0.00 | — | PASS |
| row-reverse-fixed | 375 | 4 | 0.00 | 0.00 | — | PASS |
| justify-center-row | 375 | 3 | 0.00 | 0.00 | — | PASS |
| justify-space-around | 768 | 4 | 0.02 | 0.00 | box-b (Δw 0, Δh 0) | PASS |
| justify-space-evenly | 768 | 4 | 0.00 | 0.00 | — | PASS |
| align-items-flex-end | 375 | 4 | 0.00 | 0.00 | — | PASS |
| align-self-mixed | 375 | 5 | 0.00 | 0.00 | — | PASS |
| column-justify-center | 375 | 3 | 0.00 | 0.00 | — | PASS |
| column-reverse | 320 | 4 | 0.00 | 0.00 | — | PASS |
| wrap-align-content-stretch | 375 | 5 | 0.00 | 0.00 | — | PASS |
| wrap-reverse-chips | 320 | 5 | 0.00 | 0.00 | — | PASS |
| wrap-mixed-gaps | 375 | 6 | 0.00 | 0.00 | — | PASS |
| wrap-single-overflowing-line | 320 | 3 | 0.00 | 0.00 | — | PASS |
| percent-width-children | 375 | 4 | 0.00 | 0.00 | — | PASS |
| percent-width-with-parent-padding | 375 | 2 | 0.00 | 0.00 | — | PASS |
| flex-basis-fixed | 768 | 4 | 0.00 | 0.00 | — | PASS |
| flex-basis-percent | 768 | 3 | 0.00 | 0.00 | — | PASS |
| shrink-proportional | 320 | 3 | 0.00 | 0.00 | — | PASS |
| shrink-uneven | 320 | 3 | 0.00 | 0.00 | — | PASS |
| min-width-freeze-redistribute | 768 | 3 | 160.00 | 160.00 | wants-400 (Δw 160, Δh 0) | FAIL |
| max-width-cap-single | 768 | 2 | 0.00 | 0.00 | — | PASS |
| max-height-shrink-children | 375 | 3 | 0.00 | 0.00 | — | PASS |
| asymmetric-padding | 320 | 2 | 0.00 | 0.00 | — | PASS |
| margin-auto-push | 375 | 3 | 0.00 | 0.00 | — | PASS |
| margin-auto-center | 768 | 2 | 0.00 | 0.00 | — | PASS |
| negative-margin-overlap | 375 | 3 | 0.00 | 0.00 | — | PASS |
| nested-padding-stack | 320 | 4 | 0.00 | 0.00 | — | PASS |
| absolute-top-left | 375 | 3 | 0.00 | 0.00 | — | PASS |
| absolute-right-bottom | 375 | 3 | 0.00 | 0.00 | — | PASS |
| absolute-inset-overlay | 375 | 3 | 0.00 | 0.00 | — | PASS |
| relative-offset | 320 | 4 | 0.00 | 0.00 | — | PASS |
| text-in-row-shrink | 375 | 3 | 25.70 | 25.71 | label (Δw 25.71, Δh 0) | FAIL |
| text-min-content-floor | 320 | 3 | 0.00 | 0.00 | — | PASS |
| text-center-natural-width | 375 | 2 | 0.00 | 0.01 | short-label (Δw 0.01, Δh 0) | PASS |
| text-letter-spacing | 375 | 2 | 0.00 | 0.00 | — | PASS |
| text-small-caption | 320 | 2 | 0.00 | 0.00 | — | PASS |
| wide-single-line-1440 | 1440 | 2 | 0.00 | 0.00 | — | PASS |
| mixed-bangla-latin | 320 | 2 | 0.00 | 0.00 | — | PASS |
| emoji-only-row | 375 | 2 | 0.00 | 0.00 | — | PASS |
| text-with-padding | 320 | 2 | 0.00 | 0.00 | — | PASS |
| card-kitchen-sink | 320 | 12 | 0.01 | 0.01 | primary-btn (Δw 0.01, Δh 0) | PASS |
