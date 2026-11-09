const http = require('http');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const PORT = 3000;
const PUBLIC_DIR = __dirname;
const DATA_FILE = path.join(PUBLIC_DIR, 'data', 'businesses.json');

// Supabase Cloud Client
const SUPABASE_URL = 'https://nqinogzaaxdrpzfxlpcg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_zleC_ISxkOkGDSvTv5ySyw_y2W5vJHK';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.apk': 'application/vnd.android.package-archive',
  '.aab': 'application/octet-stream'
};

// Leer desde Supabase en la nube con respaldo local
async function getBusinesses() {
  try {
    const { data, error } = await supabase.from('businesses').select('*').order('created_at', { ascending: false });
    if (!error && data && data.length > 0) {
      // Guardar caché local
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
      return data;
    }
  } catch (err) {
    console.error('Error consultando Supabase, usando respaldo local:', err.message);
  }
  // Fallback local
  try {
    if (fs.existsSync(DATA_FILE)) return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch (e) {}
  return [];
}

async function getBusinessBySlug(slug) {
  try {
    const { data, error } = await supabase.from('businesses').select('*').eq('slug', slug).single();
    if (!error && data) return data;
  } catch (err) {
    console.error('Error buscando en Supabase:', err.message);
  }
  // Fallback local
  const all = await getBusinesses();
  return all.find(b => b.slug.toLowerCase() === slug.toLowerCase()) || null;
}

async function upsertBusiness(biz) {
  try {
    const { data, error } = await supabase.from('businesses').upsert(biz, { onConflict: 'slug' }).select().single();
    if (!error && data) {
      console.log(`[Supabase Cloud] Negocio guardado: ${data.name}`);
      // Actualizar archivo local
      const all = await getBusinesses();
      fs.writeFileSync(DATA_FILE, JSON.stringify(all, null, 2), 'utf-8');
      return data;
    }
  } catch (err) {
    console.error('Error guardando en Supabase:', err.message);
  }
  return null;
}

async function deleteBusinessBySlug(slug) {
  try {
    const { error } = await supabase.from('businesses').delete().eq('slug', slug);
    if (!error) {
      console.log(`[Supabase Cloud] Negocio eliminado: ${slug}`);
      const all = await getBusinesses();
      fs.writeFileSync(DATA_FILE, JSON.stringify(all, null, 2), 'utf-8');
      return true;
    }
  } catch (err) {
    console.error('Error eliminando en Supabase:', err.message);
  }
  return false;
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = decodeURI(parsedUrl.pathname);

  // ==========================================
  // API REST: /api/negocios (SUPABASE CLOUD)
  // ==========================================
  if (pathname.startsWith('/api/negocios')) {
    const slug = pathname.replace('/api/negocios', '').replace(/^\//, '');

    // GET /api/negocios o /api/negocios/:slug
    if (req.method === 'GET') {
      if (slug) {
        const item = await getBusinessBySlug(slug);
        if (!item) {
          res.writeHead(404, { 'Content-Type': 'application/json; charset=UTF-8' });
          res.end(JSON.stringify({ error: 'Negocio no encontrado' }));
          return;
        }
        res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
        res.end(JSON.stringify(item));
        return;
      }

      const list = await getBusinesses();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
      res.end(JSON.stringify(list));
      return;
    }

    // POST /api/negocios (Guardar en la Nube Supabase)
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk;
        if (body.length > 25 * 1024 * 1024) {
          res.writeHead(413, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Payload demasiado grande' }));
          req.destroy();
        }
      });
      req.on('end', async () => {
        try {
          const payload = JSON.parse(body);
          if (!payload.name) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=UTF-8' });
            res.end(JSON.stringify({ error: 'El nombre es obligatorio' }));
            return;
          }

          let cleanSlug = (payload.slug || payload.name)
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9_-]/g, '-')
            .replace(/-+/g, '-');

          const dbRecord = {
            slug: cleanSlug,
            name: payload.name,
            category: payload.category || '',
            theme: payload.theme || 'volcan-villarrica',
            description: payload.description || '',
            logo: payload.logo || '',
            instagram: payload.instagram || '',
            whatsapp: payload.whatsapp || '',
            maps: payload.maps || '',
            website: payload.website || '',
            plan: payload.plan || 'PRO Anual',
            expires_at: payload.expiresAt || payload.expires_at || '2027-11-09',
            accounts: payload.accounts || [],
            updated_at: new Date().toISOString()
          };

          const saved = await upsertBusiness(dbRecord);

          res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
          res.end(JSON.stringify({ success: true, business: saved || dbRecord }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=UTF-8' });
          res.end(JSON.stringify({ error: 'JSON inválido' }));
        }
      });
      return;
    }

    // DELETE /api/negocios/:slug
    if (req.method === 'DELETE' && slug) {
      const ok = await deleteBusinessBySlug(slug);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
      res.end(JSON.stringify({ success: ok, deletedSlug: slug }));
      return;
    }
  }

  // ==========================================
  // RUTAS FRONTEND
  // ==========================================
  if (pathname === '/admin' || pathname === '/admin/' || pathname === '/pro') {
    pathname = '/admin.html';
  }

  if (pathname.startsWith('/p/')) {
    pathname = '/negocio.html';
  }

  if (pathname.startsWith('/cartel/')) {
    pathname = '/cartel-print.html';
  }

  // / -> index.html (Página Principal de Pago TransferChile)
  if (pathname === '/' || pathname === '') {
    pathname = '/index.html';
  }

  const filePath = path.join(PUBLIC_DIR, pathname);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=UTF-8' });
    res.end('Acceso denegado');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=UTF-8' });
      res.end(`<h2>404 - Archivo no encontrado: ${pathname}</h2><p><a href="/admin">Ir al Panel PRO de Negocios</a></p>`);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🚀 SERVIDOR TRANSFERCHILE PRO CON SUPABASE ACTIVO`);
  console.log(`====================================================`);
  console.log(`☁️  Base de Datos: Supabase Cloud (PostgreSQL Live)`);
  console.log(`🖥️  Panel de Control: http://localhost:${PORT}/admin`);
  console.log(`📱  Red LAN Móvil:    http://192.168.1.12:${PORT}/admin`);
  console.log(`====================================================`);
});
