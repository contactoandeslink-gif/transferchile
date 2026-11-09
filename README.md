# 📘 TransferDirecto — Documentación Maestra y Estado del Proyecto

> **Versión Actual:** 2.5.7  
> **Última Actualización:** 09 de Noviembre de 2026  
> **Titular del Proyecto:** Isaac Navarro  
> **Repositorio Web:** `https://github.com/contactoandeslink-gif/transferchile.git`  
> **Dominio Oficial:** `transferdirecto.cl` (Inscrito en NIC Chile hasta 09/11/2027)

---

## 1. Identidad de Marca y Dominio Oficial

### 1.1. Dominio en NIC Chile
* **Nombre de Dominio:** `transferdirecto.cl`
* **Estado:** Inscrito y activo (Vigencia: 09/11/2026 al 09/11/2027)
* **Titular:** Isaac Navarro
* **Misión:** Entregar la ficha con datos bancarios oficiales y verificados de un negocio para llegar, copiar con 1 toque y transferir seguro desde la app del banco del cliente.
* **Por qué este nombre:** Describe exactamente la mecánica (transferencia directa entre cuentas bancarias, sin pasarelas de pago, sin intermediarios y sin comisiones).

### 1.2. Mensaje Ganador de WhatsApp (Copia Rápida + Seguridad)
```text
¡Hola! 👋 Acá están mis datos para que me transfieras rápido y directo:
🔗 https://transferdirecto.cl/p/{slug}

⚡ Solo tocas un botón para copiar los datos sin anotar nada a mano.
🛡️ 100% seguro: transfieres desde la app de tu propio banco; este link jamás te pedirá claves ni datos confidenciales.
```

---

## 2. Infraestructura y Hosting

### 2.1. Opciones de Hosting Web
1. **GitHub Pages + Fastly / Cloudflare (Actual en Producción):**
   * Repositorio: `contactoandeslink-gif/transferchile`
   * Ventaja: Carga en < 15ms en Santiago de Chile, 100% gratis, sin servidores que mantener.
2. **Hugging Face Spaces (Opción AI / Backend):**
   * Permite montar aplicaciones Docker / Node.js / Python FastAPI con 16 GB de RAM gratis.
   * Ideal para procesar **OCR de comprobantes y fotos de datos bancarios** sin pagar API de Claude o OpenAI.
   * Permite asignarle un dominio personalizado o conectar via API interna.

### 2.2. Configuración DNS (NIC Chile)
* En NIC Chile (`transferdirecto.cl`):
  * **Servidores DNS recomendados:** Cloudflare (`ns1.cloudflare.com` / `ns2.cloudflare.com`).
  * **Beneficios:** Candado verde SSL/HTTPS automático, protección contra ataques y caché perimetral en Chile.

---

## 3. Base de Datos en la Nube (Supabase Cloud PostgreSQL)

* **Host:** `aws-0-us-east-1.pooler.supabase.com:6543`
* **Project Ref:** `nqinogzaaxdrpzfxlpcg`
* **API REST PostgREST:** `https://nqinogzaaxdrpzfxlpcg.supabase.co/rest/v1`
* **Tabla Principal:** `public.businesses`
  * `slug TEXT PRIMARY KEY`: Identificador único (ej: `barberia-villarrica`).
  * `name TEXT`: Nombre comercial del negocio.
  * `category TEXT`: Categoría (Barbería, Cafetería, etc.).
  * `theme TEXT`: Fondo fotográfico (`volcan-villarrica`, `lago-villarrica`, etc.).
  * `description TEXT`: Descripción corta del local.
  * `accounts JSONB`: Lista de cuentas bancarias (Banco, Tipo, Número, RUT, Titular, Correo).
  * `access_code TEXT UNIQUE`: Código de activación en la App móvil (ej: `PRO-BARBER-01`).
  * `plan TEXT`: Plan contratado (`PRO Anual ($10.000)`).
  * `created_at / updated_at TIMESTAMPTZ`.

### 3.1. Comercios Semilla Activos en Villarrica
1. `barberia-villarrica` -> Código: `PRO-BARBER-01`
2. `cafe-volcan` -> Código: `PRO-VOLCAN-02`
3. `cabanas-alto-villarrica` -> Código: `PRO-CABANA-03`
4. `kutral-pizzeria` -> Código: `PRO-KUTRAL-04`
5. `spa-bellas-villarrica` -> Código: `PRO-BELLAS-05`

---

## 4. Ecosistema de la Plataforma Web (`transferchile-web`)

Ubicación local: `D:\Proyectos\TransferChile\transferchile-web`

* **`index.html`:** Visor de transferencia ultra rápido. Abre los datos del enlace en 1 toque con accesos directos a los principales bancos de Chile (BancoEstado, Santander, Banco de Chile, BCI, Tenpo, MACH, Mercado Pago).
* **`negocio.html`:** Perfil web dinámico del negocio (`transferdirecto.cl/p/{slug}`). Carga desde Supabase el fondo fotográfico real del sur, logo, WhatsApp, Maps y tarjetas de cuentas bancarias de lujo.
* **`cartel-print.html`:** Cartel de mostrador A5 listo para imprimir con QR de alta definición y sello de seguridad para cajas de locales físicos.
* **`admin.html`:** Panel de administración PRO. Permite crear/editar comercios, generar códigos de activación, ver links y copiar el mensaje de WhatsApp.
* **`descargar.html`:** Página de descarga directa de la APK y solicitud de acceso oficial en Google Play.
* **`dev-server.js`:** Servidor local de desarrollo en Node.js que conecta a Supabase y emula las rutas en `http://localhost:3000`.

---

## 5. Aplicación Android Nativa (`transfers-cl-nfc-qr`)

Ubicación local: `D:\Proyectos\TransferChile\transfers-cl-nfc-qr`  
APK de Depuración Generada: `C:\Users\sorte\Downloads\TransferDirecto-PRO.apk` (64.8 MB, Versión 2.5.7)

### 5.1. Arquitectura y Tecnologías
* **Lenguaje:** Kotlin 2.1.0 / Jetpack Compose / Material 3.
* **Red:** HTTPS directo vía Ktor / HttpURLConnection hacia la API de Supabase PostgREST.
* **Seguridad de Datos:** `android.permission.INTERNET`, validación estricta de RUT chileno (módulo 11) y sanitización de portapapeles.
* **Navegación:**
  1. **Tab 1 (Mis Cuentas):** Tarjetas bancarias personales y guardadas.
  2. **Tab 2 (Lector QR / Compartir):** Generador de QR dinámico y compartición rápida.
  3. **Tab 3 (Historial):** Registro de transferencias y verificaciones.
  4. **Tab 4 (Negocio PRO 🏪):**
     * **Modo Inactivo:** Explicación de beneficios y caja de código de activación (`PRO-BARBER-01`).
     * **Modo Activo:** Ficha del local, botón de QR pantalla completa para mesón, enlace web verificado y botón nativo para compartir por WhatsApp con mensaje pre-cargado.

---

## 6. Integración Hugging Face (Captura Inteligente con Fotos / OCR)

Para resolver la captura automática de datos a partir de capturas de pantalla o fotos de cartolas (similar a lo que hace `transfiereme.cl`), Hugging Face ofrece dos alternativas de costo $0:

1. **Hugging Face Space (Microservicio Python/FastAPI):**
   * Crear un Space gratuito (CPU Basic: 2 vCPU, 16 GB RAM).
   * Desplegar un modelo de visión ligero como `Qwen2-VL-7B-Instruct` o `PaddleOCR`.
   * El usuario sube la foto de la cartola o comprobante, el Space extrae los campos JSON:
     ```json
     {
       "banco": "BancoEstado",
       "tipo_cuenta": "CuentaRUT",
       "numero_cuenta": "19061110",
       "rut": "19.061.110-8",
       "titular": "Isaac Navarro"
     }
     ```
2. **Hugging Face Serverless Inference API:**
   * Utilizar un token de API de Hugging Face para consultar directamente modelos de OCR de documentos sin montar infraestructura propia.
