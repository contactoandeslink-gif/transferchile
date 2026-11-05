# Seguridad de TransferChile 2.2.8

La web es estática. No ejecuta transferencias ni verifica titularidad o fraude.
Las cuatro páginas aplican CSP mediante meta: scripts solo del mismo origen,
sin scripts ni manejadores inline; connect-src none, object-src none,
base-uri none y form-action none. El CSS inline sigue permitido.
Los enlaces externos usan noopener/noreferrer y la política de referencia es no-referrer.
Los datos del fragmento de URL siguen siendo visibles para quien recibe el enlace.

`_headers` es una plantilla para un alojamiento compatible. GitHub Pages NO
la aplica: no afirmar que HSTS, frame-ancestors, X-Frame-Options o Permissions-Policy
estén configurados por este archivo. Para activarlos hace falta configurar un
proxy/alojamiento compatible y verificar las respuestas HTTP reales.

Validación: node tests/validation.cjs. Las pruebas de navegador verifican copia,
cambio de destinatario, bloqueo de contradicciones y de ejecución/exfiltración CSP.
Mantener scripts en assets/ y no volver a introducir onclick o javascript:.

Activar/verificar 2FA o passkeys en Google, GitHub, Microsoft/OneDrive y Namecheap.
Guardar códigos de recuperación fuera del repositorio. Los permisos locales de la
llave no protegen por sí solos la cuenta de OneDrive ni sus enlaces compartidos.
La firma permanece fuera del proyecto. Nunca publicar JKS, signing.properties,
local.properties, cachés de Gradle, volcados de memoria ni credenciales.
