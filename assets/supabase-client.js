// TransferDirecto - Cliente Oficial Supabase Cloud
// Conecta el frontend directamente con la base de datos PostgreSQL de Supabase con seguridad RLS estricta

const SUPABASE_CONFIG = {
  url: 'https://nqinogzaaxdrpzfxlpcg.supabase.co',
  anonKey: 'sb_publishable_zleC_ISxkOkGDSvTv5ySyw_y2W5vJHK',
  defaultDomain: 'https://transferdirecto.cl'
};

const SupabaseAPI = {
  async getBusinessBySlug(slug) {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      try {
        const res = await fetch(`/api/negocios/${encodeURIComponent(slug)}`);
        if (res.ok) return await res.json();
      } catch (e) {}
    }

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

  async verifyPin(pin) {
    if (!pin) return false;
    try {
      const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/rpc/admin_verify_pin`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_CONFIG.anonKey,
          'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ admin_pin: pin })
      });
      if (!res.ok) return false;
      return await res.json();
    } catch(e) {
      return false;
    }
  },

  async getAiConfig(pin) {
    if (!pin) return null;
    try {
      const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/rpc/admin_get_ai_config`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_CONFIG.anonKey,
          'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ admin_pin: pin })
      });
      if (!res.ok) return null;
      return await res.json();
    } catch(e) {
      return null;
    }
  },

  async saveBusiness(payload, adminPin) {
    const pin = adminPin || sessionStorage.getItem('td_admin_pin') || '';

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
      accounts: payload.accounts || []
    };

    // Llamada segura a función RPC en Supabase con PIN de verificación
    const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/rpc/admin_save_business`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_CONFIG.anonKey,
        'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        admin_pin: pin,
        payload: cleanPayload
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Error guardando en Supabase: verifique el PIN de Administrador');
    }
    return await res.json();
  },

  async deleteBusiness(slug, adminPin) {
    const pin = adminPin || sessionStorage.getItem('td_admin_pin') || '';

    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      try {
        const res = await fetch(`/api/negocios/${encodeURIComponent(slug)}`, { method: 'DELETE' });
        if (res.ok) return;
      } catch (e) {}
    }

    const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/rpc/admin_delete_business`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_CONFIG.anonKey,
        'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        admin_pin: pin,
        p_slug: slug
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Error al eliminar en Supabase');
    }
    return await res.json();
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
