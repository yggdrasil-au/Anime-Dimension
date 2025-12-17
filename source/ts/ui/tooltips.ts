// /source/ts/ui/tooltips.ts

// Decode HTML entities (e.g., &lt;h5&gt; → <h5>) from backend payloads
const decodeEntities = (s: string): string => {
    const ta = document.createElement('textarea');
    ta.innerHTML = s;
    return ta.value;
};

// Attempt to read tooltip HTML from common locations on/inside a trigger element.
// Supports:
//  - data-tooltip-html attribute on the trigger
//  - data-bs-title attribute on the trigger (entity-encoded)
//  - a descendant carrying data-tooltip-html (e.g., when attribute set on a child)
//  - a descendant <script type="text/html|text/plain" data-tooltip-html> with inline HTML
//  - a descendant element with class .anim-tooltip-template or .tooltip-html containing HTML
const extractTooltipHtml = (trigger: HTMLElement): string => {
    const fromAttr = trigger.getAttribute('data-tooltip-html') || trigger.getAttribute('data-bs-title');
    if (fromAttr && fromAttr.trim() !== '') return decodeEntities(fromAttr);

    // Look for a descendant that carries the payload as an attribute
    const childAttr = trigger.querySelector<HTMLElement>('[data-tooltip-html]');
    const childAttrVal = childAttr?.getAttribute('data-tooltip-html');
    if (childAttrVal && childAttrVal.trim() !== '') return decodeEntities(childAttrVal);

    // Look for inline script/template payloads
    const script = trigger.querySelector<HTMLScriptElement>('script[data-tooltip-html][type="text/html"],script[data-tooltip-html][type="text/plain"]');
    if (script && script.textContent) return script.textContent.trim();

    const template = trigger.querySelector<HTMLTemplateElement>('template[data-tooltip-html]');
    if (template) return template.innerHTML.trim();

    const div = trigger.querySelector<HTMLElement>('.anim-tooltip-template, .tooltip-html');
    if (div) return div.innerHTML.trim();

    return '';
};

/**
 * Enable Bootstrap tooltips on elements within the provided root.
 * - Accepts both BS4 and BS5 allow list APIs
 * - Renders HTML safely with Bootstrap's built-in sanitizer
 * - Keeps tooltip open while hovering the tip and closes on outside click
 */
export const enableTooltips = (root: HTMLElement): void => {
    interface TooltipInstance { hide(): void; show(): void; dispose(): void; tip?: HTMLElement; getTipElement?: () => HTMLElement }
    interface TooltipCtor {
        Default?: { allowList?: Record<string, unknown>; whiteList?: Record<string, unknown> };
        new(el: Element, opts: Record<string, unknown>): TooltipInstance;
        getInstance?(el: Element): TooltipInstance | null;
    }
    interface BootstrapNS { Tooltip?: TooltipCtor }
    const BS = (window as unknown as { bootstrap?: BootstrapNS }).bootstrap;
    if (!BS?.Tooltip) return;

    const els = root.querySelectorAll<HTMLElement>('[data-bs-toggle="tooltip"]');

    // Support both BS4 and BS5 allowlist keys
    const isV4 = !!BS.Tooltip.Default?.whiteList;
    const baseAllow: Record<string, unknown> = isV4 ? (BS.Tooltip.Default?.whiteList as Record<string, unknown>) : (BS.Tooltip.Default?.allowList ?? {});
    const allowList: Record<string, unknown> = {
        ...baseAllow,
        '*': ['class', 'role', /^aria-[\w-]*$/],
        h1: ['class'], h2: ['class'], h3: ['class'], h4: ['class'], h5: ['class'], h6: ['class'],
        p: ['class'], span: ['class'], small: ['class'], strong: ['class'], em: ['class'],
        b: ['class'], i: ['class'], u: ['class'], code: ['class'], pre: ['class'],
        div: ['class', 'role', /^aria-[\w-]*$/],
        ul: ['class'], ol: ['class'], li: ['class'],
        a: ['href', 'title', 'target', 'rel', 'class'],
        img: ['src', 'alt', 'title', 'width', 'height', 'loading', 'decoding', 'class'],
        br: [], hr: ['class'], blockquote: ['class'],
    };

    const HIDE_DELAY = 140; // ms

    let initialized = 0;
    let skippedNoHtml = 0;
    let skippedAlready = 0;

    els.forEach((el) => {
        // Avoid duplicate listeners/instances on repeated scans
        if ((el as any).__adTooltipInit) { skippedAlready++; return; }

        // Dispose existing instance
        BS.Tooltip?.getInstance?.(el)?.dispose();

        // Read HTML from attribute or embedded descendants
        const html = extractTooltipHtml(el);
        if (!html) { skippedNoHtml++; return; } // nothing to render

        const opts: Record<string, unknown> = {
            trigger: 'manual',
            container: 'body',
            html: true,
            sanitize: true,
            fallbackPlacements: ['auto'],
            title: () => html,
            offset: [0, 8],
        };
        if (isV4) { (opts as Record<string, unknown>).whiteList = allowList; } else { (opts as Record<string, unknown>).allowList = allowList; }

        const instance = new BS.Tooltip!(el, opts);

        let hideTimer: number | null = null;
        const scheduleHide = () => {
            if (hideTimer) return;
            hideTimer = window.setTimeout(() => {
                instance.hide();
                hideTimer = null;
            }, HIDE_DELAY);
        };
        const cancelHide = () => {
            if (hideTimer) {
                clearTimeout(hideTimer);
                hideTimer = null;
            }
        };
        const showTip = () => { cancelHide(); instance.show(); };
        const hideTip = () => { cancelHide(); instance.hide(); };

        // Show on hover/focus of the trigger (card)
        el.addEventListener('pointerenter', showTip);
        el.addEventListener('focusin', showTip);
        // Delay hide when leaving the trigger
        el.addEventListener('pointerleave', scheduleHide);
        el.addEventListener('focusout', scheduleHide);

        let tipEl: HTMLElement | null = null;
        const getTipEl = () => (instance.getTipElement ? instance.getTipElement() : (instance.tip ?? null));

        // When shown, keep it open while hovered and close on outside click
        el.addEventListener('shown.bs.tooltip', () => {
            tipEl = getTipEl();
            if (!tipEl) return;

            tipEl.addEventListener('pointerenter', cancelHide, { passive: true });
            tipEl.addEventListener('pointerleave', scheduleHide, { passive: true });

            const onDocPointerDown = (ev: Event) => {
                const t = ev.target as Node;
                if (!el.contains(t) && !tipEl?.contains(t)) hideTip();
            };
            document.addEventListener('pointerdown', onDocPointerDown, { capture: true });

            const onHidden = () => {
                document.removeEventListener('pointerdown', onDocPointerDown, { capture: true });
                el.removeEventListener('hidden.bs.tooltip', onHidden);
            };
            el.addEventListener('hidden.bs.tooltip', onHidden);
        });

        // Mark as initialized and increment count
        (el as any).__adTooltipInit = true;
        initialized++;
    });
    // Summary log for this scan
    try {
        const rootDesc = (root === document.body ? 'document' : (root.id ? `#${root.id}` : root.tagName.toLowerCase()));

        console.debug(`[AD/tooltips] Scan @ ${rootDesc}: total=${els.length}, inited=${initialized}, skipped(noHTML)=${skippedNoHtml}, skipped(already)=${skippedAlready}`);
    } catch {}
};

export default enableTooltips;

// --- Auto-initializer -------------------------------------------------------
export const initAuto = (): void => {
    const w = window as unknown as { bootstrap?: { Tooltip?: unknown } };

    const ensureBootstrap = (cb: () => void): void => {
        if (w.bootstrap && (w.bootstrap as any).Tooltip) {

            console.debug('[AD/tooltips] Bootstrap detected. Initializing tooltips.');
            cb();
            return;
        }

        console.debug('[AD/tooltips] Waiting for Bootstrap.Tooltip...');
        const onReady = () => {
            if (w.bootstrap && (w.bootstrap as any).Tooltip) {
                window.removeEventListener('DOMContentLoaded', onReady);
                window.removeEventListener('load', onReady);

                console.debug('[AD/tooltips] Bootstrap ready after event.');
                cb();
            }
        };
        window.addEventListener('DOMContentLoaded', onReady, { once: true });
        window.addEventListener('load', onReady, { once: true });
        let tries = 0;
        const id = window.setInterval(() => {
            if ((w.bootstrap && (w.bootstrap as any).Tooltip) || tries++ > 40) {
                clearInterval(id);
                if (w.bootstrap && (w.bootstrap as any).Tooltip) {

                    console.debug('[AD/tooltips] Bootstrap ready after polling.');
                    cb();
                } else {

                    console.warn('[AD/tooltips] Bootstrap.Tooltip not detected; skipping tooltip init.');
                }
            }
        }, 50);
    };

    const run = () => {
        // Initial scan
        enableTooltips(document.body);

        // Observe future DOM changes and rescan in a batched way
        let scheduled = false;
        const scheduleScan = () => {
            if (scheduled) return;
            scheduled = true;
            queueMicrotask(() => {
                scheduled = false;
                enableTooltips(document.body);
            });
        };

        try {
            const mo = new MutationObserver((mutList) => {
                for (const m of mutList) {
                    if (m.type === 'childList' && (m.addedNodes?.length || 0) > 0) {
                        scheduleScan();
                        break;
                    }
                    if (m.type === 'attributes' && m.attributeName === 'data-bs-toggle') {
                        scheduleScan();
                        break;
                    }
                }
            });
            mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-bs-toggle'] });

            console.debug('[AD/tooltips] MutationObserver attached for auto-detection.');
        } catch {

            console.warn('[AD/tooltips] MutationObserver unavailable; auto-detect disabled.');
        }
    };

    ensureBootstrap(run);
};

// Auto-run on script load in browsers
try {
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {

        console.debug('[AD/tooltips] Loaded. Auto-init enabled.');
        initAuto();
    }
} catch {
    console.error('[AD/tooltips] Error during auto-init.');
}
