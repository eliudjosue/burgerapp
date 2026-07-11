import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { SiteSettingsService } from './site-settings.service';

const GTM_ID_RE = /^GTM-[A-Z0-9]+$/;

@Injectable({ providedIn: 'root' })
export class GtmService {
  private readonly document = inject(DOCUMENT);
  private readonly siteSettings = inject(SiteSettingsService);
  private loaded = false;

  async init(): Promise<void> {
    if (this.loaded) return;
    try {
      const settings = await this.siteSettings.getSettings();
      const id = settings.gtmContainerId?.trim() ?? '';
      if (!id || !GTM_ID_RE.test(id)) return;
      this.inject(id);
      this.loaded = true;
    } catch {
      // Non-fatal: GTM simply won't load if settings can't be fetched
    }
  }

  private inject(id: string): void {
    const doc = this.document;
    const win = doc.defaultView as Window & { dataLayer?: unknown[] };

    // Official GTM snippet — dataLayer init + async gtm.js loader
    win.dataLayer = win.dataLayer ?? [];
    win.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });

    const script = doc.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${id}`;
    doc.head.appendChild(script);

    // Official GTM noscript fallback iframe
    const noscript = doc.createElement('noscript');
    const iframe = doc.createElement('iframe');
    iframe.src = `https://www.googletagmanager.com/ns.html?id=${id}`;
    iframe.height = '0';
    iframe.width = '0';
    iframe.style.cssText = 'display:none;visibility:hidden';
    noscript.appendChild(iframe);
    doc.body.insertBefore(noscript, doc.body.firstChild);
  }
}
