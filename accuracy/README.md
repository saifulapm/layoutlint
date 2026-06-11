# Accuracy scoreboard

Engine (Yoga + fontkit) vs headless Chromium golden files. **9/10** cases within threshold (positions ≤1px, sizes ≤1px, text sizes ≤2px).

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
