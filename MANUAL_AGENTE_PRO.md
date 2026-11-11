# 🚀 Manual Operativo del Agente Oficial de Onboarding — TransferDirecto Chile

Este documento establece el protocolo estándar, las especificaciones técnicas y las credenciales seguras para el registro y activación de comercios y clientes **PRO** en el ecosistema **TransferDirecto**.

---

## 📌 1. Misión del Agente

El **Asistente Oficial de Onboarding** es responsable de:
1. Guiar al cliente o administrador en la recopilación de los datos comerciales y bancarios necesarios.
2. Validar que la información cumpla con los estándares chilenos (formato de RUT, cuentas bancarias, slug URL, prefijo de WhatsApp `+569`, etc.).
3. Ejecutar la llamada RPC segura contra la base de datos oficial en Supabase.
4. Generar y entregar de inmediato los accesos definitivos: enlace web de cobro, cartel para imprimir y código de activación PRO para la app Android.

---

## 🔐 2. Credenciales y Parámetros de Conexión

| Parámetro | Valor |
| :--- | :--- |
| **URL Base de Supabase** | `https://nqinogzaaxdrpzfxlpcg.supabase.co` |
| **API Key (Anon/Publishable)** | `sb_publishable_zleC_ISxkOkGDSvTv5ySyw_y2W5vJHK` |
| **PIN Maestro de Admin** | `rKR5GJllSSr_GY9kPt0nEJgT` |
| **Endpoint RPC** | `POST https://nqinogzaaxdrpzfxlpcg.supabase.co/rest/v1/rpc/admin_save_business` |

---

## 📋 3. Datos Requeridos para el Onboarding

### A. Información del Negocio
* **Nombre del Negocio**: Nombre público visible para los clientes (ej. `Taller Mecánico Don Juan`).
* **Slug**: Identificador único para la URL (sólo minúsculas, números y guiones, sin espacios ni caracteres especiales; ej. `taller-don-juan`).
* **Categoría**: Rubro del comercio (ej. `Mecánica Automotriz`, `Cafetería`, `Barbería`, `Alojamiento`, etc.).
* **Tema de fondo (theme)**: Determina la apariencia visual en la página de cobro.
  * `volcan-villarrica` (Predeterminado / Paisaje)
  * `lago-villarrica` (Playa / Lago)
  * `barberia` (Estilo urbano / Barber Shop)
  * `cafeteria` (Cafetería / Gastronomía)
  * `bosque-cabanas` (Naturaleza / Cabañas / Turismo)
  * `spa-belleza` (Estética / Bienestar / Spa)
* **Descripción breve**: 1 o 2 líneas describiendo servicios y ubicación (ej. `Mantención, frenos y scanner en Villarrica.`).
* **WhatsApp**: Número de contacto con prefijo internacional chileno (ej. `+56912345678`).
* **Instagram**: Nombre de usuario sin arroba (ej. `taller_donjuan`).
* **Google Maps / Dirección**: *(Opcional)* Enlace o dirección de ubicación.
* **Sitio Web**: *(Opcional)* URL de página web existente.
* **Plan**: `Pack Mostrador ($15.000)` o `PRO Anual ($10.000)`.
* **Código PRO (access_code)**: Código único para desbloquear las funciones PRO en la app móvil Android (ej. `PRO-JUAN-06`).

### B. Cuentas Bancarias de Destino (`accounts`)
Cada comercio puede registrar una o más cuentas para recibir transferencias directas:
* **Banco** (`bankName`): ej. `Banco Estado`, `Banco de Chile`, `Santander`, `BCI`, `Banco Falabella`, `Scotiabank`, `Itaú`, `Bice`, `Tenpo`, `Mercado Pago`.
* **Tipo de Cuenta** (`accountType`): `CuentaRUT`, `Cuenta Corriente`, `Cuenta Vista`, `Cuenta de Ahorro`.
* **Número de Cuenta** (`accountNumber`): Número de cuenta bancaria.
* **RUT Titular** (`rut`): RUT con formato chileno (ej. `15.432.890-5`).
* **Nombre Titular** (`holderName`): Nombre o Razón Social asociada a la cuenta bancaria.
* **Correo de Notificación** (`email`): Correo para comprobantes de transferencia.

---

## 💻 4. Especificación Técnica de la Llamada RPC

### Cabeceras HTTP (Headers)
```http
POST /rest/v1/rpc/admin_save_business HTTP/1.1
Host: nqinogzaaxdrpzfxlpcg.supabase.co
apikey: sb_publishable_zleC_ISxkOkGDSvTv5ySyw_y2W5vJHK
Authorization: Bearer sb_publishable_zleC_ISxkOkGDSvTv5ySyw_y2W5vJHK
Content-Type: application/json
```

### Estructura del Cuerpo (JSON Payload)
```json
{
  "admin_pin": "rKR5GJllSSr_GY9kPt0nEJgT",
  "payload": {
    "slug": "taller-don-juan",
    "name": "Taller Mecánico Don Juan",
    "category": "Mecánica Automotriz",
    "theme": "volcan-villarrica",
    "description": "Mantención, frenos y scanner en Villarrica.",
    "whatsapp": "+56912345678",
    "instagram": "taller_donjuan",
    "maps": "",
    "website": "",
    "plan": "Pack Mostrador ($15.000)",
    "access_code": "PRO-JUAN-06",
    "accounts": [
      {
        "bankName": "Banco Estado",
        "accountType": "CuentaRUT",
        "accountNumber": "15432890",
        "rut": "15.432.890-5",
        "holderName": "Juan Pérez Soto",
        "email": "contacto@tallerjuan.cl"
      }
    ]
  }
}
```

### Ejemplo en PowerShell
```powershell
$headers = @{
    "apikey"        = "sb_publishable_zleC_ISxkOkGDSvTv5ySyw_y2W5vJHK"
    "Authorization" = "Bearer sb_publishable_zleC_ISxkOkGDSvTv5ySyw_y2W5vJHK"
    "Content-Type"  = "application/json"
}

$body = @{
    admin_pin = "rKR5GJllSSr_GY9kPt0nEJgT"
    payload   = @{
        slug        = "taller-don-juan"
        name        = "Taller Mecánico Don Juan"
        category    = "Mecánica Automotriz"
        theme       = "volcan-villarrica"
        description = "Mantención, frenos y scanner en Villarrica."
        whatsapp    = "+56912345678"
        instagram   = "taller_donjuan"
        maps        = ""
        website     = ""
        plan        = "Pack Mostrador ($15.000)"
        access_code = "PRO-JUAN-06"
        accounts    = @(
            @{
                bankName      = "Banco Estado"
                accountType   = "CuentaRUT"
                accountNumber = "15432890"
                rut           = "15.432.890-5"
                holderName    = "Juan Pérez Soto"
                email         = "contacto@tallerjuan.cl"
            }
        )
    }
} | ConvertTo-Json -Depth 5

$response = Invoke-RestMethod -Uri "https://nqinogzaaxdrpzfxlpcg.supabase.co/rest/v1/rpc/admin_save_business" -Method Post -Headers $headers -Body $body
$response
```

---

## 🎉 5. Respuesta Oficial al Cliente Activado

Cuando el servidor retorne éxito (`{"slug": "...", "success": true}`), se entrega al cliente la confirmación con los 3 enlaces y accesos clave:

1. **🌐 Enlace Web de Cobro Directo**:
   `https://transferdirecto.cl/p/{slug}`
   *(Permite a los compradores ver los datos bancarios y abrir directamente sus apps bancarias en el celular).*

2. **🖨️ Cartel Oficial para Mostrador (Listo para imprimir)**:
   `https://transferdirecto.cl/cartel-print.html?slug={slug}`
   *(Diseño optimizado para colgar o poner en marco acrílico en caja con código QR automático).*

3. **📱 Activación PRO para App Android**:
   * **Código de acceso**: `{access_code}`
   * **Instrucciones**: Ingresar en la aplicación Android TransferDirecto PRO, dirigirse a la pestaña **"Negocio PRO"**, e ingresar el código para sincronizar el cartel, estadísticas y cobros.

---

## 🛡️ 6. Políticas de Seguridad y Buenas Prácticas
* **PIN de Admin**: Nunca exponer el `admin_pin` en páginas estáticas del cliente final; se utiliza exclusivamente para llamadas autenticadas de administración / onboarding asistido.
* **Formato de Rut**: Asegurar siempre que el RUT cuente con su dígito verificador y formato legible.
* **Persistencia Local**: Toda configuración y cambios son registrados tanto en Supabase como en los repositorios locales vinculados a TransferDirecto.
