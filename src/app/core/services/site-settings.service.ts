import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from '../supabase.client';

export interface SiteSettingsData {
  businessHours: string | null;
  whatsappNumber: string | null;
  logoUrl: string | null;
  bannerImageUrl: string | null;
  bannerTitle: string | null;
  bannerSubtitle: string | null;
  bannerButtonText: string | null;
  bannerButtonLink: string | null;
  bankTransferAlias: string | null;
  bankTransferCbu: string | null;
}

interface DbSiteSettings {
  business_hours: string | null;
  whatsapp_number: string | null;
  logo_url: string | null;
  banner_image_url: string | null;
  banner_title: string | null;
  banner_subtitle: string | null;
  banner_button_text: string | null;
  banner_button_link: string | null;
  bank_transfer_alias: string | null;
  bank_transfer_cbu: string | null;
}

@Injectable({ providedIn: 'root' })
export class SiteSettingsService {
  private readonly supabase = inject(SupabaseClientService);

  async getSettings(): Promise<SiteSettingsData> {
    const { data, error } = await this.supabase.client
      .from('site_settings')
      .select(
        'business_hours, whatsapp_number, logo_url, banner_image_url, ' +
        'banner_title, banner_subtitle, banner_button_text, banner_button_link, ' +
        'bank_transfer_alias, bank_transfer_cbu'
      )
      .single();

    if (error) throw error;

    const row = data as unknown as DbSiteSettings;
    return {
      businessHours: row.business_hours,
      whatsappNumber: row.whatsapp_number,
      logoUrl: row.logo_url,
      bannerImageUrl: row.banner_image_url,
      bannerTitle: row.banner_title,
      bannerSubtitle: row.banner_subtitle,
      bannerButtonText: row.banner_button_text,
      bannerButtonLink: row.banner_button_link,
      bankTransferAlias: row.bank_transfer_alias,
      bankTransferCbu: row.bank_transfer_cbu,
    };
  }
}
