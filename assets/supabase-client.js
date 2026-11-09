// TransferDirecto - Cliente Oficial Supabase Cloud
// Conecta el frontend directamente con la base de datos PostgreSQL de Supabase

const SUPABASE_CONFIG = {
  url: 'https://nqinogzaaxdrpzfxlpcg.supabase.co',
  anonKey: 'sb_publishable_zleC_ISxkOkGDSvTv5ySyw_y2W5vJHK',
  defaultDomain: 'https://transferdirecto.cl'
};

const SupabaseAPI = {
  async getBusinessBySlug(slug) {
    // 1. Si está en localhost con dev-server activo, prueba primero local
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      try {
        const res = await fetch(`/api/negocios/${encodeURIComponent(slug)}`);
        if (res.ok) return await res.json();
      } catch (e) {
        // Si falla local, pasa directo a Supabase
      }
    }

    // 2. Consulta directa a Supabase Cloud (PostgREST REST API)
    const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/businesses?slug=eq.${encodeURIComponent(slug)}&select=*`, {
      headers: {
        'apikey': SUPABASE_CONFIG.anonKey,
        'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
      }
    });

    if (!res.ok) throw new Error('Error al conectar con la base de datos');
    const items = await res.json();
    if (!items || items.length === 0) throw new Error('Negocio no encontrado');
    return items[0];
  },

  async getAllBusinesses() {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      try {
        const res = await fetch('/api/negocios');
        if (res.ok) return await res.json();
      } catch (e) {}
    }

    const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/businesses?select=*&order=created_at.desc`, {
      headers: {
        'apikey': SUPABASE_CONFIG.anonKey,
        'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
      }
    });

    if (!res.ok) throw new Error('Error cargando lista de negocios');
    return await res.json();
  },

  async saveBusiness(payload) {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      try {
        const res = await fetch('/api/negocios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) return await res.json();
      } catch (e) {}
    }

    const cleanPayload = {
      slug: payload.slug,
      name: payload.name,
      category: payload.category || '',
      theme: payload.theme || 'volcan-villarrica',
      description: payload.description || '',
      logo: payload.logo || '',
      instagram: payload.instagram || '',
      whatsapp: payload.whatsapp || '',
      maps: payload.maps || '',
      website: payload.website || '',
      plan: payload.plan || 'PRO Anual ($10.000)',
      access_code: payload.access_code || null,
      accounts: payload.accounts || [],
      updated_at: new Date().toISOString()
    };

    const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/businesses`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_CONFIG.anonKey,
        'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=representation'
      },
      body: JSON.stringify(cleanPayload)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || 'Error guardando en Supabase');
    }
    return await res.json();
  },

  async deleteBusiness(slug) {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      try {
        const res = await fetch(`/api/negocios/${encodeURIComponent(slug)}`, { method: 'DELETE' });
        if (res.ok) return;
      } catch (e) {}
    }

    const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/businesses?slug=eq.${encodeURIComponent(slug)}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_CONFIG.anonKey,
        'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
      }
    });

    if (!res.ok) throw new Error('Error al eliminar en Supabase');
  },

  getBusinessUrl(slug) {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return `${window.location.origin}/negocio.html?slug=${encodeURIComponent(slug)}`;
    }
    return `https://transferdirecto.cl/p/${encodeURIComponent(slug)}`;
  },

  getShareMessage(name, slug) {
    const url = this.getBusinessUrl(slug);
    return `¡Hola! 👋 Acá están mis datos para que me transfieras rápido y directo:\n🔗 ${url}\n\n⚡ Solo tocas un botón para copiar los datos sin anotar nada a mano.\n🛡️ 100% seguro: transfieres desde la app de tu propio banco; este link jamás te pedirá claves ni datos confidenciales.`;
  }
};
