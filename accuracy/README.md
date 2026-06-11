# Accuracy scoreboard

Engine (Yoga + fontkit) vs headless Chromium golden files. **97/97** cases within threshold (positions ≤1px, sizes ≤1px, text sizes ≤2px).

| case | vw | nodes | max Δpos | max Δsize | worst node | result |
| --- | --- | --- | --- | --- | --- | --- |
| row-fixed-gap | 320 | 4 | 0.00 | 0.00 | — | PASS |
| column-padding-margin | 375 | 6 | 0.00 | 0.00 | — | PASS |
| nested-flex-grow | 768 | 7 | 0.00 | 0.00 | — | PASS |
| wrapping-text | 320 | 3 | 0.00 | 0.00 | — | PASS |
| fixed-vs-auto-row | 375 | 6 | 0.00 | 0.00 | — | PASS |
| min-max-constraints | 768 | 4 | 0.00 | 0.00 | — | PASS |
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
| min-width-freeze-redistribute | 768 | 3 | 0.00 | 0.00 | — | PASS |
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
| shrink-with-min-floor | 320 | 3 | 0.00 | 0.00 | — | PASS |
| grow-max-redistribute-pair | 768 | 4 | 0.00 | 0.00 | — | PASS |
| truncate-text-next-to-fixed | 320 | 3 | 0.00 | 0.00 | — | PASS |
| two-texts-share-row | 375 | 3 | 0.00 | 0.00 | — | PASS |
| nested-corrected-rows | 375 | 5 | 0.00 | 0.00 | — | PASS |
| percent-basis-with-min | 768 | 3 | 0.00 | 0.00 | — | PASS |
| text-in-row-shrink | 375 | 3 | 0.01 | 0.01 | icon (Δw 0.01, Δh 0) | PASS |
| text-min-content-floor | 320 | 3 | 0.00 | 0.00 | — | PASS |
| text-center-natural-width | 375 | 2 | 0.00 | 0.01 | short-label (Δw 0.01, Δh 0) | PASS |
| text-letter-spacing | 375 | 2 | 0.00 | 0.00 | — | PASS |
| text-small-caption | 320 | 2 | 0.00 | 0.00 | — | PASS |
| wide-single-line-1440 | 1440 | 2 | 0.00 | 0.00 | — | PASS |
| mixed-bangla-latin | 320 | 2 | 0.00 | 0.00 | — | PASS |
| emoji-only-row | 375 | 2 | 0.00 | 0.00 | — | PASS |
| text-with-padding | 320 | 2 | 0.00 | 0.00 | — | PASS |
| card-kitchen-sink | 320 | 12 | 0.01 | 0.01 | primary-btn (Δw 0.01, Δh 0) | PASS |
| tw-card | 320 | 12 | 0.01 | 0.01 | r.0.3.0 (Δw 0.01, Δh 0) | PASS |
| tw-card-wide | 768 | 12 | 0.01 | 0.01 | r.0.3.0 (Δw 0.01, Δh 0) | PASS |
| tw-navbar | 768 | 6 | 0.03 | 0.03 | r.1 (Δw 0.03, Δh 0) | PASS |
| tw-hero | 375 | 6 | 0.01 | 0.00 | r.2 (Δw 0, Δh 0) | PASS |
| tw-stats-responsive | 320 | 17 | 0.00 | 0.00 | — | PASS |
| tw-stats-responsive-sm | 768 | 17 | 0.00 | 0.00 | — | PASS |
| tw-form | 375 | 9 | 0.00 | 0.00 | — | PASS |
| tw-badges | 320 | 6 | 0.02 | 0.01 | r.2 (Δw 0.01, Δh 0) | PASS |
| tw-sidebar-layout | 1440 | 9 | 0.00 | 0.00 | — | PASS |
| tw-media-object | 375 | 6 | 0.00 | 0.00 | — | PASS |
| tw-alert | 320 | 6 | 0.00 | 0.00 | — | PASS |
| tw-modal | 375 | 8 | 0.02 | 0.01 | r.1.2.0 (Δw 0.01, Δh 0) | PASS |
| tw-breadcrumbs | 768 | 6 | 0.01 | 0.01 | r.1 (Δw 0.01, Δh 0) | PASS |
| tw-footer | 375 | 6 | 0.02 | 0.01 | r.1.2 (Δw 0.01, Δh 0) | PASS |
| tw-bangla-profile | 320 | 4 | 0.01 | 0.01 | r.1 (Δw 0.01, Δh 0) | PASS |
| tw-settings-row | 768 | 11 | 0.00 | 0.00 | — | PASS |
| tw-chat-bubbles | 375 | 10 | 0.01 | 0.04 | r.2.0 (Δw 0.04, Δh 0) | PASS |
| tw-pagination | 375 | 10 | 0.02 | 0.01 | r.1.1.0 (Δw 0.01, Δh 0) | PASS |
| tw-tabs | 375 | 7 | 0.02 | 0.01 | r.0.2 (Δw 0.01, Δh 0) | PASS |
| tw-toast | 375 | 5 | 0.01 | 0.01 | r.0.1 (Δw 0.01, Δh 0) | PASS |
| tw-stepper | 768 | 15 | 0.02 | 0.02 | r.1 (Δw 0.02, Δh 0) | PASS |
| tw-file-rows | 375 | 13 | 0.01 | 0.01 | r.0.1 (Δw 0.01, Δh 0) | PASS |
| tw-comment-thread | 375 | 15 | 0.01 | 0.01 | r.0.1.0.1 (Δw 0.01, Δh 0) | PASS |
| tw-login-page | 375 | 10 | 0.01 | 0.01 | r.1.0 (Δw 0.01, Δh 0) | PASS |
| tw-table-as-flex | 768 | 16 | 0.01 | 0.01 | r.0.1 (Δw 0.01, Δh 0) | PASS |
| tw-product-card | 320 | 9 | 0.00 | 0.00 | — | PASS |
| tw-empty-state | 375 | 5 | 0.01 | 0.01 | r.3 (Δw 0.01, Δh 0) | PASS |
| tw-banner-cta | 768 | 5 | 0.00 | 0.01 | r.0 (Δw 0.01, Δh 0) | PASS |
| tw-kpi-cards | 1440 | 17 | 0.00 | 0.00 | — | PASS |
| tw-timeline | 375 | 20 | 0.00 | 0.02 | r.1.1 (Δw 0.02, Δh 0) | PASS |
| tw-search-header | 768 | 6 | 0.01 | 0.01 | r.0.0 (Δw 0.01, Δh 0) | PASS |
| tw-notification-pref | 320 | 11 | 0.00 | 0.00 | — | PASS |
| tw-avatar-stack-row | 375 | 7 | 0.01 | 0.01 | r.0 (Δw 0.01, Δh 0) | PASS |
| tw-blog-list | 768 | 13 | 0.02 | 0.02 | r.0.3.1 (Δw 0.02, Δh 0) | PASS |
| tw-error-page | 375 | 5 | 0.01 | 0.02 | r.1 (Δw 0.02, Δh 0) | PASS |
| tw-inbox-row-overflowy | 320 | 15 | 0.01 | 0.01 | r.0.1.0.0 (Δw 0.01, Δh 0) | PASS |
| tw-feature-grid-as-flex | 768 | 16 | 0.00 | 0.00 | — | PASS |
| tw-cookie-banner | 320 | 6 | 0.00 | 0.00 | — | PASS |
| tw-user-dropdown | 375 | 8 | 0.00 | 0.00 | — | PASS |
| tw-progress-card | 375 | 8 | 0.00 | 0.00 | — | PASS |
| tw-bangla-mixed-feed | 375 | 6 | 0.00 | 0.00 | — | PASS |
