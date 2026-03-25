import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/db/client';
import { getAuthenticatedAgency } from '@/lib/security/authGuard';
import { sanitizeText } from '@/lib/security/sanitizer';
import { LAYOUT_MAP, REVERSE_LAYOUT_MAP, type DbLayout, type FrontendLayout } from '@/lib/constants/branding';

export async function GET(request: NextRequest) {
  try {
    const { agencyId } = await getAuthenticatedAgency(request);
    const supabase = createSupabaseServiceClient();

    // Fetch existing or seed default
    const { data, error } = await supabase
      .from('agency_branding')
      .select('*')
      .eq('agency_id', agencyId)
      .maybeSingle();

    if (error) throw error;

    if (data) {
      // Map database enums back to frontend IDs using central config
      const dbLayout = (data.report_layout as DbLayout) || 'modern';
      data.report_layout = REVERSE_LAYOUT_MAP[dbLayout] || 'compact';
    }

    return NextResponse.json(data || {});
  } catch (err: any) {
    console.error('[Branding GET] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to get branding' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { agencyId, role } = await getAuthenticatedAgency(request);
    
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Admin role required' }, { status: 403 });
    }

    const supabase = createSupabaseServiceClient();

    const body = await request.json();
    
    // Sanitize user-provided text inputs for XSS protection
    const sanitizedBody = {
      ...body,
      primary_color:      body.primary_color ? sanitizeText(body.primary_color, 20) : null,
      secondary_color:    body.secondary_color ? sanitizeText(body.secondary_color, 20) : null,
      accent_color:       body.accent_color ? sanitizeText(body.accent_color, 20) : null,
      report_font:        body.report_font ? sanitizeText(body.report_font, 100) : null,
      report_layout:      body.report_layout ? sanitizeText(body.report_layout, 50) : null,
      logo_url:           body.logo_url ? sanitizeText(body.logo_url, 1000) : null,
      logo_position:      body.logo_position ? sanitizeText(body.logo_position, 50) : null,
      watermark_text:     body.watermark_text ? sanitizeText(body.watermark_text, 100) : null,
      report_font_size:   body.report_font_size ? sanitizeText(body.report_font_size, 20) : null,
      metric_density:     body.metric_density ? sanitizeText(body.metric_density, 20) : null,
    };

    // Map frontend IDs to database enums using central config
    const rawLayout = (sanitizedBody.report_layout as FrontendLayout) || 'compact';
    const dbLayout = LAYOUT_MAP[rawLayout] || 'modern';

    const { data: updated, error } = await supabase
      .from('agency_branding')
      .upsert({
        agency_id:          agencyId,
        primary_color:      sanitizedBody.primary_color,
        secondary_color:    sanitizedBody.secondary_color,
        accent_color:       sanitizedBody.accent_color,
        report_font:        sanitizedBody.report_font,
        report_layout:      dbLayout,
        show_powered_by:    body.show_powered_by, // boolean - safe
        logo_url:           sanitizedBody.logo_url,
        logo_position:      sanitizedBody.logo_position,
        watermark_text:     sanitizedBody.watermark_text,
        watermark_enabled:  body.watermark_enabled, // boolean - safe
        email_html:         body.email_html, // This remains as-is for now, but usually needs a separate HTML-safe sanitizer
        email_css:          body.email_css,
        pdf_sections:       body.pdf_sections,
        report_font_size:   sanitizedBody.report_font_size,
        metric_density:     sanitizedBody.metric_density,
        updated_at:         new Date().toISOString(),
      }, {
        onConflict: 'agency_id',
      })
      .select()
      .single();

    if (error) throw error;
    
    if (updated) {
      // Map back for frontend consistency using central config
      const finalDbLayout = (updated.report_layout as DbLayout) || 'modern';
      updated.report_layout = REVERSE_LAYOUT_MAP[finalDbLayout] || 'compact';
    }
    
    return NextResponse.json(updated);
  } catch (err: any) {
    console.error('[Branding PATCH] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to update branding' }, { status: 500 });
  }
}
