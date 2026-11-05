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
