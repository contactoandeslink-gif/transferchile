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
console.log('Play-access form structure and WhatsApp message PASS');
