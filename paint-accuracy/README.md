# Paint accuracy — engine render vs Chromium screenshot

Gate: ≤7% mismatched pixels (pixelmatch threshold 0.1, antialiasing-tolerant).
The residual is rasterizer antialiasing (resvg vs Skia) on glyph edges.

| case | viewport | size | diff % | result |
|---|---|---|---|---|
| tw-bangla-mixed-feed | 375 | 375×125 | 3.23 | PASS |
| tw-badges | 320 | 320×80 | 2.65 | PASS |
| tw-bangla-profile | 320 | 320×271 | 2.62 | PASS |
| tw-alert | 320 | 320×181 | 2.53 | PASS |
| tw-card | 320 | 320×339 | 1.9 | PASS |
| tw-notification-pref | 320 | 320×170 | 1.77 | PASS |
| tw-media-object | 375 | 375×116 | 1.59 | PASS |
| tw-file-rows | 375 | 375×108 | 1.59 | PASS |
| tw-inbox-row-overflowy | 320 | 320×134 | 1.44 | PASS |
| tw-timeline | 375 | 375×194 | 1.37 | PASS |
| tw-comment-thread | 375 | 375×176 | 1.35 | PASS |
| tw-banner-cta | 768 | 768×74 | 1.3 | PASS |
| tw-blog-list | 768 | 768×370 | 1.26 | PASS |
| tw-card-wide | 768 | 768×244 | 1.18 | PASS |
| tw-chat-bubbles | 375 | 375×224 | 1.18 | PASS |
| tw-toast | 375 | 375×96 | 1.06 | PASS |
| tw-progress-card | 375 | 375×150 | 1.04 | PASS |
| tw-tabs | 375 | 375×115 | 1.01 | PASS |
| demo-card | 375 | 375×110 | 1 | PASS |
| tw-product-card | 320 | 320×375 | 0.99 | PASS |
| tw-hero | 375 | 375×322 | 0.86 | PASS |
| tw-form | 375 | 375×268 | 0.85 | PASS |
| tw-cookie-banner | 320 | 320×384 | 0.68 | PASS |
| tw-navbar | 768 | 768×45 | 0.67 | PASS |
| tw-feature-grid-as-flex | 768 | 768×213 | 0.57 | PASS |
| tw-stats-responsive | 320 | 320×212 | 0.55 | PASS |
| tw-modal | 375 | 375×384 | 0.54 | PASS |
| tw-footer | 375 | 375×121 | 0.51 | PASS |
| tw-settings-row | 768 | 768×150 | 0.49 | PASS |
| tw-table-as-flex | 768 | 768×155 | 0.49 | PASS |
| tw-breadcrumbs | 768 | 768×44 | 0.48 | PASS |
| tw-avatar-stack-row | 375 | 375×58 | 0.48 | PASS |
| tw-pagination | 375 | 375×58 | 0.43 | PASS |
| tw-search-header | 768 | 768×61 | 0.43 | PASS |
| tw-stats-responsive-sm | 768 | 768×122 | 0.4 | PASS |
| tw-empty-state | 375 | 375×358 | 0.37 | PASS |
| tw-user-dropdown | 375 | 375×320 | 0.37 | PASS |
| tw-login-page | 375 | 375×436 | 0.36 | PASS |
| tw-kpi-cards | 1440 | 1440×170 | 0.35 | PASS |
| tw-stepper | 768 | 768×80 | 0.27 | PASS |
| tw-error-page | 375 | 375×2000 | 0.1 | PASS |
| tw-sidebar-layout | 1440 | 1440×2000 | 0.03 | PASS |
