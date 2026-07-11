import { Injectable, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { SiteSettingsService } from './site-settings.service';

export interface SeoData {
  /** Page-specific part of the title. Appends "| siteName" unless rawTitle is true. */
  title: string;
  /** When true, use title as-is without appending the site name. Use for the home page. */
  rawTitle?: boolean;
  description?: string;
  image?: string | null;
  type?: 'website' | 'article';
}

const MAX_DESC = 155;

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly titleService = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);
  private readonly siteSettings = inject(SiteSettingsService);

  private siteName = '';
  private brandImage = '';
  private brandDescription = '';
  private defaultsLoaded = false;

  async loadDefaults(): Promise<void> {
    if (this.defaultsLoaded) return;
    this.defaultsLoaded = true;
    try {
      const s = await this.siteSettings.getSettings();
      this.siteName = s.bannerTitle ?? '';
      this.brandImage = s.bannerImageUrl ?? s.logoUrl ?? '';
      this.brandDescription = s.bannerSubtitle ?? '';
    } catch {
      // Silent — service keeps empty defaults so callers never throw
    }
  }

  update(data: SeoData): void {
    const pageTitle =
      data.rawTitle || !this.siteName
        ? data.title
        : `${data.title} | ${this.siteName}`;
    const description = this.truncate(data.description ?? this.brandDescription);
    const image = data.image ?? this.brandImage;
    const url = this.cleanUrl(this.document.location.href);

    this.titleService.setTitle(pageTitle);
    this.applyTags(pageTitle, description, image, url, data.type ?? 'website');
    this.setCanonical(url);
  }

  reset(): void {
    const url = this.document.location.origin;
    this.titleService.setTitle(this.siteName);
    this.applyTags(this.siteName, this.brandDescription, this.brandImage, url, 'website');
    this.setCanonical(url);
  }

  private applyTags(
    title: string,
    description: string,
    image: string,
    url: string,
    type: string,
  ): void {
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({ property: 'og:type', content: type });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:site_name', content: this.siteName });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: title });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.meta.updateTag({ name: 'twitter:image', content: image });
  }

  private setCanonical(url: string): void {
    const doc = this.document;
    let link = doc.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      doc.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  private cleanUrl(href: string): string {
    try {
      const u = new URL(href);
      u.search = '';
      u.hash = '';
      return u.toString();
    } catch {
      return href;
    }
  }

  private truncate(text: string): string {
    const clean = text.replace(/<[^>]+>/g, '').trim();
    if (clean.length <= MAX_DESC) return clean;
    const cut = clean.substring(0, MAX_DESC);
    const lastSpace = cut.lastIndexOf(' ');
    return (lastSpace > 0 ? cut.substring(0, lastSpace) : cut) + '…';
  }
}
