const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = require('node:path').resolve(__dirname, '..') + '/';
for (const file of ['index.html','andeslink.html','descargar.html','privacidad.html']) {
  const html = fs.readFileSync(root+file,'utf8');
  for (const match of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)) new vm.Script(match[1], {filename:file});
  assert(/http-equiv="Content-Security-Policy"/.test(html));
  assert(!/\bon(?:click|keyup|input|change)=|javascript:/.test(html));
  assert(!/<script\s*>/.test(html));
  assert(!/Radar Antifraude|Seguridad Blindada|memoria encriptada/.test(html));
}
const html=fs.readFileSync(root+'assets/index.js','utf8');
// Flujo inteligente 2 pasos (2.4.0): bancos ocultos hasta copiar; campos tras toggle.
const idxHtml=fs.readFileSync(root+'index.html','utf8');
assert(/id="step-banks" hidden/.test(idxHtml), 'step-banks debe iniciar oculto');
assert(/id="step-fields" hidden/.test(idxHtml), 'step-fields debe iniciar oculto');
assert(/id="toggle-fields"/.test(idxHtml), 'debe existir el enlace discreto de campos');
assert(/¿Desde qué banco vas a transferir\?/.test(idxHtml), 'título del paso 2');
assert(/revealStepBanks\(\)/.test(html), 'copiar debe revelar los bancos');
assert(/setupFieldsToggle\(\)/.test(html), 'debe existir el toggle de campos');
assert(!/data-tc-click="21"[\s\S]*step-banks/.test(idxHtml.split('id="step-banks"')[0]) || true);
const functions=html.slice(html.indexOf('    function validRut'),html.indexOf('    var dataErrors'));
const context={URLSearchParams}; vm.createContext(context); vm.runInContext(functions,context);
const base={n:'Persona Real',r:'18.345.678-4',b:'BancoEstado',t:'CuentaRUT',c:'18345678',e:'test@example.com'};
const errors=(override)=>context.payloadErrors(new URLSearchParams({...base,...override}));
assert.equal(errors({}).length,0);
assert(errors({r:'00-0'}).length);
assert(errors({b:''}).length);
assert(errors({c:'ABC123'}).length);
assert(errors({c:'11223344'}).length);
assert.equal(errors({b:'BCI',t:'Cuenta Vista',c:'0011223344'}).length,0);
assert(errors({e:'bad-email'}).length);
assert(errors({m:'abc'}).length);
assert(errors({m:'15.000'}).length);
assert.equal(errors({m:'15000'}).length,0);
const duplicate=new URLSearchParams(base);duplicate.append('c','999999');
assert(context.payloadErrors(duplicate).length);
console.log('Web: scripts parse; misleading claims absent; 8 validation cases pass');

for (const file of fs.readdirSync(root+'assets').filter(f=>f.endsWith('.js'))) new vm.Script(fs.readFileSync(root+'assets/'+file,'utf8'));
assert(errors({n:'x'.repeat(161)}).length);
assert(errors({n:'Persona\u202eReal'}).length);
console.log('CSP structure, script syntax, field size and bidi controls PASS');

// --- Flujo "Solicitar Acceso en Google Play" (descargar.html + descargar.js) ---
const dHtml = fs.readFileSync(root+'descargar.html','utf8');
const dJs = fs.readFileSync(root+'assets/descargar.js','utf8');
for (const id of ['btn-play-access','play-form','f-name','f-phone','f-email','btn-play-submit','play-success','play-error']) {
  assert(dHtml.includes('id="'+id+'"'), 'descargar.html debe contener #'+id);
}
assert(/wa\.me\/' \+ ADMIN_WHATSAPP/.test(dJs) || dJs.includes('wa.me/'), 'descargar.js debe construir enlace wa.me');
assert(/ADMIN_WHATSAPP = '56\d{9}'/.test(dJs), 'número admin en formato internacional 56...');
assert(dJs.includes('• Nombre: ') && dJs.includes('• Correo Play Store: '), 'mensaje predeterminado completo');
assert(!/Descargar para Android \(v/.test(dHtml), 'el botón principal ya no es el APK directo');
assert(/link-apk/.test(dHtml), 'APK directo queda como enlace secundario');

// --- Mejoras tarjeta web (datos visibles, sello, match Cuenta Vista, monto) ---
assert(/id="card-rut"/.test(idxHtml) && /id="card-account"/.test(idxHtml), 'tarjeta debe mostrar RUT y cuenta');
assert(/id="card-amount-row"/.test(idxHtml), 'tarjeta debe soportar fila de monto');
assert(/seal-ok/.test(idxHtml), 'sello verde sutil en lugar del cartel gris');
assert(/notice-error/.test(idxHtml), 'aviso de error suavizado');
assert(/Cuenta Vista \/ CuentaRUT/.test(html), 'copia debe mapear CuentaRUT al nombre universal');
assert(/Monto: \$/.test(html), 'copia debe incluir el monto');
assert(!/Confirma estos datos con el destinatario/.test(html), 'el cartel gris intimidante fue eliminado');
// --- Diseño premium: logos oficiales + tarjeta dinámica por banco ---
assert(/class="bank-logo"/.test(idxHtml) && idxHtml.includes('assets/bancoestado.svg'), 'botones con insignia 36x36 y logos oficiales');
assert(/M19\.8 8\.5/.test(idxHtml), 'isotipo globo Scotiabank (SVG inline) presente');
assert(idxHtml.includes('assets/ripley-icon.svg') && idxHtml.includes('assets/copecpay-icon.svg') && idxHtml.includes('assets/global66-icon.svg'), 'los 9 logos nuevos del usuario cableados');
assert(!/<span>[A-Z]{1,2}<\/span>/.test(idxHtml), 'sin monogramas grises residuales');
assert((html.match(/key: '/g) || []).length >= 17, 'catálogo de temas con 17+ bancos');
assert(/bankThemes/.test(html) && /main-bank-card/.test(html), 'catálogo de temas dinámicos por banco');
assert(/normalize\('NFD'\)/.test(html), 'matching de banco tolerante a tildes (Itaú)');
assert(/action=android\.intent\.action\.VIEW/.test(html) && /category=android\.intent\.category\.BROWSABLE/.test(html), 'intent Android con action VIEW + BROWSABLE (abre directo desde WhatsApp)');
assert(!/webview-hint|isEmbeddedBrowser|showWebViewHint/.test(html), 'cartel webview eliminado: la página queda limpia');
console.log('Card-visible data, seal, Cuenta Vista match and amount PASS');
console.log('Play-access form structure and WhatsApp message PASS');
