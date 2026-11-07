
    if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
      location.replace('https://' + location.hostname + location.pathname + location.search + location.hash);
    }
  

    window.addEventListener('hashchange', function() { window.location.reload(); });
    var searchStr = window.location.search || '';
    if (!searchStr && window.location.hash) {
      searchStr = '?' + window.location.hash.substring(1);
    }
    var oversizedInput = searchStr.length > 16384;
    var params = new URLSearchParams(oversizedInput ? '' : searchStr);

    if (!oversizedInput && !params.get('n') && !params.get('r') && !params.get('c')) {
      window.location.replace('andeslink.html');
    }

    var nameVal = params.get('n') || 'Destinatario';
    var rutVal = params.get('r') || '';
    var bankVal = params.get('b') || 'Banco';
    var typeVal = params.get('t') || 'Cuenta';
    var accountVal = params.get('c') || '';
    var emailVal = params.get('e') || '';
    var amountVal = params.get('m') || '';

    function validRut(value) {
      var clean = value.replace(/[.\s-]/g, '').toUpperCase();
      if (!/^\d{1,8}[0-9K]$/.test(clean)) return false;
      var body = clean.slice(0, -1);
      if (Number(body) === 0) return false;
      var sum = 0, factor = 2;
      for (var i = body.length - 1; i >= 0; i--) {
        sum += Number(body[i]) * factor;
        factor = factor === 7 ? 2 : factor + 1;
      }
      var dv = 11 - sum % 11;
      return clean.slice(-1) === (dv === 11 ? '0' : dv === 10 ? 'K' : String(dv));
    }

    function payloadErrors(values) {
      var errors = [];
      if (values.toString().length > 16384) return ['El enlace es demasiado largo'];
      var limits = {n:160, r:32, b:80, t:80, c:64, e:254, m:12};
      Object.keys(limits).forEach(function(key) {
        var field = values.get(key) || '';
        if (field.length > limits[key] || /[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]/.test(field))
          errors.push('Campo demasiado largo o con caracteres de control: ' + key);
      });
      ['n', 'r', 'b', 't', 'c'].forEach(function(key) {
        if (!(values.get(key) || '').trim()) errors.push('Falta un dato obligatorio: ' + key);
      });
      ['n', 'r', 'b', 't', 'c', 'e', 'm'].forEach(function(key) {
        if (new Set(values.getAll(key).map(function(v) { return v.trim(); })).size > 1)
          errors.push('El enlace contiene datos contradictorios: ' + key);
      });
      var rut = values.get('r') || '';
      var number = values.get('c') || '';
      if (!validRut(rut)) errors.push('RUT inválido');
      if (!/^[0-9 .-]+$/.test(number) || !/^\d{4,18}$/.test(number.replace(/[ .-]/g, '')))
        errors.push('Número de cuenta inválido');
      if ((values.get('t') || '').trim().toLowerCase() === 'cuentarut' &&
          number.replace(/[ .-]/g, '') !== rut.replace(/[.\s-]/g, '').slice(0, -1))
        errors.push('La CuentaRUT no coincide con el RUT');
      var email = values.get('e') || '';
      if (email && !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email))
        errors.push('Correo inválido');
      var monto = values.get('m') || '';
      if (monto && !/^\d{1,9}$/.test(monto.trim())) errors.push('Monto inválido');
      return errors;
    }

    var dataErrors = oversizedInput ? ['El enlace es demasiado largo'] : payloadErrors(params);
    // No escoger silenciosamente entre dos destinatarios distintos en query y fragmento.
    if (window.location.search && window.location.hash) {
      var fragmentValues = new URLSearchParams(window.location.hash.slice(1));
      ['n','r','b','t','c','e','m'].forEach(function(key) {
        if (fragmentValues.has(key) && fragmentValues.get(key) !== params.get(key))
          dataErrors.push('El enlace contiene dos juegos de datos distintos');
      });
    }
    // Aviso según el estado: con errores, tarjeta roja suave ANTES del botón
    // (no se puede copiar nada). Sin errores, sello verde sutil DESPUÉS de la
    // tarjeta: confirma sin intimidar.
    var noticeSlot = document.getElementById('notice-slot');
    if (dataErrors.length) {
      var errBox = document.createElement('div');
      errBox.setAttribute('role', 'alert');
      errBox.className = 'notice-error';
      errBox.textContent = 'No copies estos datos todavía. Solicita un enlace corregido al destinatario. ' + dataErrors.join('. ');
      if (noticeSlot) noticeSlot.appendChild(errBox);
    } else {
      var seal = document.createElement('p');
      seal.className = 'seal-ok';
      seal.setAttribute('role', 'status');
      seal.textContent = '✅ Datos validados matemáticamente para transferencia.';
      if (noticeSlot) noticeSlot.appendChild(seal);
    }
    if (dataErrors.length) document.querySelectorAll('.btn-copy-small, .btn-hero-copy').forEach(function(button) { button.disabled = true; button.setAttribute('aria-label', 'Datos pendientes de corrección'); });

    // CATÁLOGO DE TEMAS PREMIUM POR BANCO DESTINO: la tarjeta se tiñe con los
    // colores de marca del banco y muestra su logo oficial en la insignia.
    var bankThemes = [
      { key: 'mach', name: 'MACH', logo: 'assets/mach-icon.svg', grad: 'linear-gradient(135deg, #1c062e 0%, #3e0c66 55%, #6200ee 100%)' },
      { key: 'estado', name: 'BancoEstado', logo: 'assets/bancoestado.svg', grad: 'linear-gradient(135deg, #091e42 0%, #0047b3 55%, #eb5505 100%)' },
      { key: 'chile', name: 'Banco de Chile', logo: 'assets/bancochile-icon.png', grad: 'linear-gradient(135deg, #001233 0%, #002255 55%, #004b99 100%)' },
      { key: 'santander', name: 'Santander', logo: 'assets/santander-icon.svg', grad: 'linear-gradient(135deg, #2b0003 0%, #6e060d 55%, #b30f18 100%)' },
      { key: 'falabella', name: 'Banco Falabella', logo: 'assets/falabella.svg', grad: 'linear-gradient(135deg, #031c0d 0%, #0c4720 55%, #157335 100%)' },
      { key: 'bci', name: 'BCI', logo: 'assets/bci.svg', grad: 'linear-gradient(135deg, #001833 0%, #003666 55%, #005ca9 100%)' },
      { key: 'scotia', name: 'Scotiabank', logo: 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path fill="#ed0722" d="M19.8 8.5c-1.2-.6-2.6-.9-4-.9-3.2 0-5.8 1.8-5.8 4.4 0 5.4 10 3.2 10 7.8 0 2.2-2 3.8-4.8 3.8-1.8 0-3.5-.5-4.8-1.4l-.8 2.8c1.5.8 3.5 1.2 5.5 1.2 4.5 0 7.8-2.2 7.8-5.8 0-5.8-10-3.6-10-7.8 0-1.8 1.6-3 3.8-3 1.4 0 2.8.4 3.8.9l.3-2z"/></svg>'), grad: 'linear-gradient(135deg, #4a0002 0%, #8a0a14 55%, #c8102e 100%)' },
      { key: 'itau', name: 'Banco Itaú', logo: 'assets/itau.svg', grad: 'linear-gradient(135deg, #261100 0%, #5c2900 55%, #b85400 100%)' },
      { key: 'ripley', name: 'Banco Ripley', logo: 'assets/ripley-icon.svg', grad: 'linear-gradient(135deg, #2b0c42 0%, #5d2a84 60%, #833ab4 100%)' },
      { key: 'bice', name: 'Banco BICE', logo: 'assets/bice-icon.svg', grad: 'linear-gradient(135deg, #002b30 0%, #005a63 55%, #007a87 100%)' },
      { key: 'security', name: 'Banco Security', logo: 'assets/security-icon.svg', grad: 'linear-gradient(135deg, #001526 0%, #002543 55%, #003057 100%)' },
      { key: 'consorcio', name: 'Banco Consorcio', logo: 'assets/consorcio-icon.svg', grad: 'linear-gradient(135deg, #001a33 0%, #003366 55%, #f58220 100%)' },
      { key: 'btg', name: 'BTG Pactual', logo: 'assets/btgpactual-icon.svg', grad: 'linear-gradient(135deg, #000d2b 0%, #001e61 60%, #003399 100%)' },
      { key: 'global', name: 'Global66', logo: 'assets/global66-icon.svg', grad: 'linear-gradient(135deg, #050714 0%, #0a0e27 60%, #00ffa3 100%)' },
      { key: 'coopeuch', name: 'Coopeuch', logo: 'assets/coopeuch-icon.svg', grad: 'linear-gradient(135deg, #003816 0%, #006627 55%, #008d36 100%)' },
      { key: 'tapp', name: 'Tapp', logo: 'assets/tapp-icon.svg', grad: 'linear-gradient(135deg, #240540 0%, #4a157a 55%, #ff3366 100%)' },
      { key: 'copec', name: 'Copec Pay', logo: 'assets/copecpay-icon.svg', grad: 'linear-gradient(135deg, #4d0004 0%, #99000a 55%, #e30613 100%)' }
    ];

    var bankLower = bankVal.toLowerCase();
    var bankLowerNorm = bankLower.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    var matchedTheme = null;
    for (var ti = 0; ti < bankThemes.length; ti++) {
      if (bankLowerNorm.indexOf(bankThemes[ti].key) > -1) { matchedTheme = bankThemes[ti]; break; }
    }
    var badgeLogo = document.getElementById('card-badge-logo');
    var badgeName = document.getElementById('card-badge-name');
    if (matchedTheme) {
      badgeName.textContent = matchedTheme.name;
      badgeLogo.src = matchedTheme.logo;
      badgeLogo.style.display = '';
      document.getElementById('main-bank-card').style.background = matchedTheme.grad;
    } else {
      badgeName.textContent = normalizeBankName(bankVal);
      badgeLogo.style.display = 'none';
    }

    // Tarjeta: titular, banco/tipo normalizado, RUT, N° cuenta y monto SIEMPRE a la vista.
    document.getElementById('disp-name').textContent = nameVal;
    document.getElementById('card-rut').textContent = rutVal || '—';
    document.getElementById('card-account').textContent = accountVal || '—';
    if (amountVal && /^\d+$/.test(amountVal.trim())) {
      document.getElementById('card-amount-row').style.display = 'block';
      document.getElementById('card-amount').textContent = '$' + Number(amountVal.trim()).toLocaleString('es-CL');
    }
    document.getElementById('val-rut').value = rutVal;

    if (accountVal) {
      document.getElementById('val-account').value = accountVal;
    } else {
      document.getElementById('row-account').style.display = 'none';
    }

    if (params.get('b')) {
      var displayType = (typeVal || '').trim().toLowerCase() === 'cuentarut' ? 'Cuenta Vista / CuentaRUT' : typeVal;
      document.getElementById('disp-bank-type').textContent = normalizeBankName(bankVal) + (displayType ? ' • ' + displayType : '');
      document.getElementById('val-bank-desc').value = normalizeBankName(bankVal) + (typeVal ? ' (' + typeVal + ')' : '');
    } else {
      document.getElementById('disp-bank-type').style.display = 'none';
      document.getElementById('row-bank').style.display = 'none';
    }

    if (emailVal) {
      document.getElementById('val-email').value = emailVal;
    } else {
      document.getElementById('row-email').style.display = 'none';
    }

    function showToast(msg) {
      var t = document.getElementById('toast');
      t.textContent = msg;
      t.className = 'toast show';
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
      setTimeout(function() {
        t.className = 'toast';
      }, 2000);
    }

    function universalCopy(text, inputElem) {
      if (dataErrors.length) {
        showToast('Solicita datos completos y corregidos antes de copiar');
        return Promise.reject(new Error('Datos sin validar'));
      }
      if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text).catch(function() {
          return execCommandFallback(text, inputElem);
        });
      }
      return execCommandFallback(text, inputElem);
    }

    function execCommandFallback(text, inputElem) {
      return new Promise(function(resolve, reject) {
        try {
          var target = inputElem;
          var created = false;
          if (!target) {
            target = document.createElement('textarea');
            target.value = text;
            target.style.position = 'fixed';
            target.style.left = '-9999px';
            target.style.top = '-9999px';
            document.body.appendChild(target);
            created = true;
          }
          target.focus();
          if (target.select) {
            target.select();
            target.setSelectionRange(0, 99999);
          }
          var successful = document.execCommand('copy');
          if (created) {
            document.body.removeChild(target);
          }
          if (successful) resolve();
          else reject(new Error('execCommand failed'));
        } catch (err) {
          reject(err);
        }
      });
    }

    function normalizeBankName(b) {
      if (!b) return '';
      var clean = b.trim();
      var lower = clean.toLowerCase();
      if (lower === 'bancoestado' || lower === 'banco estado' || lower.includes('cuentarut')) {
        return 'Banco Estado';
      }
      if (lower.includes('santander')) return 'Banco Santander';
      if (lower.includes('chile') || lower.includes('edwards')) return 'Banco de Chile';
      if (lower.includes('bci') || lower === 'banco de credito e inversiones') return 'BCI';
      if (lower.includes('falabella')) return 'Banco Falabella';
      if (lower.includes('scotia')) return 'Scotiabank';
      if (lower.includes('itau') || lower.includes('itaú')) return 'Banco Itaú';
      if (lower.includes('ripley')) return 'Banco Ripley';
      if (lower.includes('security')) return 'Banco Security';
      if (lower.includes('bice')) return 'Banco BICE';
      if (lower.includes('consorcio')) return 'Banco Consorcio';
      if (lower.includes('internacional')) return 'Banco Internacional';
      if (lower.includes('btg') || lower.includes('pactual')) return 'BTG Pactual';
      if (lower.includes('global') || lower.includes('global66')) return 'Global66';
      if (lower.includes('tenpo')) return 'Tenpo';
      if (lower.includes('mach')) return 'MACH';
      if (lower.includes('mercado') || lower.includes('mercadopago')) return 'Mercado Pago';
      if (lower.includes('coopeuch')) return 'Coopeuch';
      if (lower.includes('chek')) return 'Chek';
      if (lower.includes('tapp')) return 'Tapp';
      if (lower.includes('copec')) return 'Copec Pay';
      return clean;
    }

    function copyAllText() {
      var parts = [];
      if (nameVal && nameVal !== 'Destinatario') parts.push('Nombre: ' + nameVal);
      if (rutVal) parts.push('RUT: ' + rutVal);
      if (params.get('b')) parts.push('Banco: ' + normalizeBankName(bankVal));
      // Match universal: MACH/Banco de Chile/Santander/Scotiabank no tienen la
      // opción "CuentaRUT" en su menú; sí "Cuenta Vista". Exportar ambos nombres
      // hace que el autollenado haga match en todos los bancos.
      var typeText = (typeVal || '').trim().toLowerCase() === 'cuentarut' ? 'Cuenta Vista / CuentaRUT' : typeVal;
      if (params.get('t')) parts.push('Tipo de cuenta: ' + typeText);
      if (accountVal) parts.push('Número de cuenta: ' + accountVal);
      if (emailVal) parts.push('Correo: ' + emailVal);
      if (amountVal && /^\d+$/.test(amountVal.trim())) parts.push('Monto: $' + amountVal.trim());

      var full = parts.join('\n');
      var heroBtn = document.getElementById('btn-hero');
      universalCopy(full.trim(), null).then(function() {
        showToast('✅ ¡Datos copiados! Elige tu banco abajo');
        revealStepBanks();
        if (heroBtn) {
          var orig = heroBtn.textContent;
          heroBtn.textContent = '✅ ¡Copiado con Éxito!';
          heroBtn.className = 'btn-hero-copy copied';
          setTimeout(function() {
            heroBtn.textContent = orig;
            heroBtn.className = 'btn-hero-copy';
          }, 2500);
        }
      }).catch(function() {
        showToast('Error al copiar');
      });
    }

    // Flujo inteligente 2 pasos (2.4.0): solo tras copiar se revelan los bancos.
    // Así nadie abre su banco con el portapapeles vacío.
    function revealStepBanks() {
      var step = document.getElementById('step-banks');
      if (step && step.hidden) {
        step.hidden = false;
        step.classList.add('tc-reveal');
        step.setAttribute('aria-hidden', 'false');
      }
    }

    function setupFieldsToggle() {
      var toggle = document.getElementById('toggle-fields');
      var step = document.getElementById('step-fields');
      if (!toggle || !step) return;
      var originalLabel = toggle.textContent;
      toggle.addEventListener('click', function(event) {
        event.preventDefault();
        var show = step.hidden;
        step.hidden = !show;
        if (show) {
          step.classList.add('tc-reveal');
        } else {
          step.classList.remove('tc-reveal');
        }
        toggle.setAttribute('aria-expanded', show ? 'true' : 'false');
        toggle.textContent = show ? 'Ocultar campos' : originalLabel;
      });
    }
    setupFieldsToggle();

    function copyFromInput(inputId, label, btn) {
      var input = document.getElementById(inputId);
      var text = input.value.trim();
      universalCopy(text, input).then(function() {
        showToast('✅ ' + label + ' copiado');
        if (btn) {
          var orig = btn.textContent;
          btn.textContent = '¡Listo!';
          btn.className = 'btn-copy-small copied';
          setTimeout(function() {
            btn.textContent = orig;
            btn.className = 'btn-copy-small';
          }, 1500);
        }
      }).catch(function(e) {
        input.focus();
        input.select();
        showToast('Mantén presionado para copiar');
      });
    }

    function filterBanks() {
      var q = document.getElementById('bank-filter').value.toLowerCase().trim();
      var items = document.querySelectorAll('#banks-container .btn-bank');
      for (var i = 0; i < items.length; i++) {
        var name = items[i].getAttribute('data-name') || items[i].textContent.toLowerCase();
        if (name.indexOf(q) > -1) {
          items[i].style.display = 'flex';
        } else {
          items[i].style.display = 'none';
        }
      }
    }

    // IDs de App Store (Chile) verificados uno a uno contra la API pública de iTunes
    // en nov-2024/2026; los anteriores apuntaban a apps equivocadas o inexistentes.
    var iosAppStoreIds = {
      'net.veritran.becl.prod': 'id1143576734', // BancoEstado (Banco del Estado de Chile)
      'cl.santander.smartphone': 'id604982236', // Santander Chile
      'cl.bancochile.mi_banco': 'id1516872542', // Mi Banco Chile (Banco de Chile)
      'cl.android': 'id447266660',              // Banco Falabella Chile
      'cl.bci.app.personas': 'id1207892426',    // Bci
      'cl.scotiabank.go': 'id1309863707',       // App Scotia (Scotiabank Chile)
      'com.konylabs.ItauMobileBank': 'id636150714', // Itaú Chile
      'cl.bancoripley.appbanco': 'id1287625215',// Banco Ripley Chile
      'cl.bice.apppersonas': 'id1562225088',    // BICE
      'com.sec.retail': 'id6473542745',         // Banco Security
      'cl.consorcio.mobileapp': 'id1325252307', // Banco Consorcio
      'com.krealo.tenpo': 'id1480047892',       // Tenpo
      'cl.bci.sismo.mach': 'id1262116570',      // MACHBANK (MACH de BCI)
      'com.global66.cards': 'id1494957339',     // Global66
      'com.mercadopago.wallet': 'id925436649',  // Mercado Pago
      'com.coopeuchapp': 'id1520619303',        // AppCoopeuch
      'cl.tapp': 'id1578548929',                // Tapp de Caja Los Andes
      'cl.copec.PagoClick': 'id699938289'       // Copec (Copec Pay vive dentro de la app Copec)
      // 'com.baninter' RETIRADO: ficha de App Store sin verificar.
    };

    // Navegadores embebidos (WhatsApp, Instagram, Facebook, Telegram...): sus
    // webviews NO ejecutan intent://, por eso un banco instalado caía en Play
    // Store. Detectarlos y dar el atajo: abrir la página en Chrome/Safari.
    function isEmbeddedBrowser() {
      var ua = navigator.userAgent || '';
      return /WhatsApp|FBAN|FBAV|Instagram|Telegram|Twitter|Snapchat|wv\)/i.test(ua);
    }

    function showWebViewHint(pkg) {
      var hint = document.getElementById('webview-hint');
      if (!hint) return;
      var pkgNames = {
        'net.veritran.becl.prod': 'BancoEstado', 'cl.santander.smartphone': 'Santander',
        'cl.bancochile.mi_banco': 'Banco de Chile', 'cl.android': 'Banco Falabella',
        'cl.bci.app.personas': 'BCI', 'cl.scotiabank.go': 'Scotiabank',
        'com.konylabs.ItauMobileBank': 'Banco Itaú', 'cl.bancoripley.appbanco': 'Banco Ripley',
        'cl.bice.apppersonas': 'Banco BICE', 'com.sec.retail': 'Banco Security',
        'cl.consorcio.mobileapp': 'Banco Consorcio', 'com.finmarkets.celfinandroid': 'BTG Pactual',
        'com.krealo.tenpo': 'Tenpo', 'cl.bci.sismo.mach': 'MACH',
        'com.global66.cards': 'Global66', 'com.mercadopago.wallet': 'Mercado Pago',
        'com.coopeuchapp': 'Coopeuch', 'cl.tapp': 'Tapp', 'cl.copec.PagoClick': 'Copec Pay'
      };
      var bankName = pkgNames[pkg] || 'tu banco';
      hint.textContent = 'Estás dentro de WhatsApp (navegador integrado): para que ' + bankName +
        ' se abra DIRECTO, toca el menú ⋮ arriba a la derecha → «Abrir en el navegador» y vuelve a tocar tu banco. Tus datos quedan copiados.';
      hint.style.display = 'block';
    }

    function openBankApp(pkg, scheme) {
      if (pkg === 'com.mercadopago.wallet') {
        openMercadoPagoAssistant();
        return;
      }

      var isAndroid = navigator.userAgent && navigator.userAgent.toLowerCase().indexOf('android') > -1;
      var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

      if (isAndroid) {
        // Navegadores embebidos (WhatsApp/Instagram/FB) NO ejecutan intent://:
        // avisar con el atajo "Abrir en navegador". Los datos ya están copiados.
        if (isEmbeddedBrowser()) showWebViewHint(pkg);
        // En Android: si la app está instalada, se abre en el acto. Si no, va directo a Google Play Store
        window.location.href = 'intent://#Intent;package=' + pkg + ';S.browser_fallback_url=https://play.google.com/store/apps/details?id=' + pkg + ';end';
      } else if (isIOS && scheme) {
        var appId = iosAppStoreIds[pkg];
        if (scheme) {
          var start = Date.now();
          window.location.href = scheme;
          setTimeout(function() {
            if (Date.now() - start < 2000 && !document.hidden && appId) {
              window.location.href = 'https://apps.apple.com/cl/app/' + appId;
            }
          }, 1500);
        } else if (appId) {
          window.location.href = 'https://apps.apple.com/cl/app/' + appId;
        }
      } else {
        // En navegador de escritorio PC: abre la ficha oficial de Play Store
        window.open('https://play.google.com/store/apps/details?id=' + pkg, '_blank', 'noopener,noreferrer');
      }
    }

    function openMercadoPagoAssistant() {
      if (dataErrors.length) { showToast('Solicita datos corregidos antes de continuar'); return; }
      var cleanRut = rutVal.replace(/\./g, '').trim();
      var combined = nameVal + ' - ' + cleanRut;
      var bankFormatted = normalizeBankName(bankVal);

      // Por defecto para el Paso 1: copiamos Nombre y RUT juntos
      universalCopy(combined, null);

      document.getElementById('mp-name-rut-display').textContent = combined;
      document.getElementById('mp-bank-display').textContent = bankFormatted;
      document.getElementById('mp-type-display').textContent = typeVal || 'Cuenta Vista / CuentaRUT';
      document.getElementById('mp-acc-display').textContent = 'N°: ' + (accountVal || '--');

      var mpBankCard = document.getElementById('mp-bank-card');
      if (mpBankCard) {
        mpBankCard.style.display = params.get('b') ? 'block' : 'none';
      }

      var mpAccCard = document.getElementById('mp-acc-card');
      if (mpAccCard) {
        mpAccCard.style.display = accountVal ? 'block' : 'none';
      }

      var btnBoth = document.getElementById('btn-mp-both');
      if (btnBoth) {
        btnBoth.textContent = 'Copiar Nombre y RUT ✔';
        btnBoth.className = 'btn-copy-small copied';
      }

      var modal = document.getElementById('mp-modal');
      modal.style.display = 'flex';
      showToast('📋 Copiado: ' + combined);
    }

    function closeMpModal() {
      document.getElementById('mp-modal').style.display = 'none';
    }

    function copyMpField(field, btn) {
      var cleanRut = rutVal.replace(/\./g, '').trim();
      var text = '';
      var label = '';

      if (field === 'both') {
        text = nameVal + ' - ' + cleanRut;
        label = 'Nombre y RUT';
      } else if (field === 'rut') {
        text = cleanRut;
        label = 'RUT';
      } else if (field === 'bank') {
        text = normalizeBankName(bankVal);
        label = 'Banco: ' + text;
      } else if (field === 'name') {
        text = nameVal;
        label = 'Nombre';
      } else if (field === 'acc') {
        text = accountVal.trim();
        label = 'N° de Cuenta';
      }

      universalCopy(text, null).then(function() {
        showToast('✅ ' + label + ' copiado');
        if (btn) {
          var orig = btn.textContent;
          btn.textContent = '¡Listo!';
          btn.className = 'btn-copy-small copied';
          setTimeout(function() {
            btn.textContent = orig;
            btn.className = 'btn-copy-small';
          }, 1500);
        }
      });
    }

    function launchMercadoPagoApp() {
      // Mantenemos el modal abierto para que el usuario pueda volver a copiar los pasos 2 y 3
      var isAndroid = navigator.userAgent && navigator.userAgent.toLowerCase().indexOf('android') > -1;
      var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

      if (isAndroid) {
        window.location.href = 'intent://#Intent;package=com.mercadopago.wallet;S.browser_fallback_url=https://play.google.com/store/apps/details?id=com.mercadopago.wallet;end';
      } else if (isIOS) {
        window.location.href = 'mercadopago://';
      } else {
        window.open('https://play.google.com/store/apps/details?id=com.mercadopago.wallet', '_blank', 'noopener,noreferrer');
      }
    }
  
document.querySelectorAll('[data-tc-click="0"]').forEach(function(el) {
  el.addEventListener('click', function(event) {
    event.preventDefault();
    copyAllText()
  });
});

document.querySelectorAll('[data-tc-keyup="1"]').forEach(function(el) {
  el.addEventListener('keyup', function(event) {
    
    filterBanks()
  });
});

document.querySelectorAll('[data-tc-click="2"]').forEach(function(el) {
  el.addEventListener('click', function(event) {
    event.preventDefault();
    openBankApp('net.veritran.becl.prod', 'bancoestado://')
  });
});

document.querySelectorAll('[data-tc-click="3"]').forEach(function(el) {
  el.addEventListener('click', function(event) {
    event.preventDefault();
    openBankApp('cl.santander.smartphone', 'santandercl://')
  });
});

document.querySelectorAll('[data-tc-click="4"]').forEach(function(el) {
  el.addEventListener('click', function(event) {
    event.preventDefault();
    openBankApp('cl.bancochile.mi_banco', 'bancochile://')
  });
});

document.querySelectorAll('[data-tc-click="5"]').forEach(function(el) {
  el.addEventListener('click', function(event) {
    event.preventDefault();
    openBankApp('cl.android', 'bancofalabella://')
  });
});

document.querySelectorAll('[data-tc-click="6"]').forEach(function(el) {
  el.addEventListener('click', function(event) {
    event.preventDefault();
    openBankApp('cl.bci.app.personas', 'bci://')
  });
});

document.querySelectorAll('[data-tc-click="7"]').forEach(function(el) {
  el.addEventListener('click', function(event) {
    event.preventDefault();
    openBankApp('cl.scotiabank.go', 'scotiago://')
  });
});

document.querySelectorAll('[data-tc-click="8"]').forEach(function(el) {
  el.addEventListener('click', function(event) {
    event.preventDefault();
    openBankApp('com.konylabs.ItauMobileBank', 'itaupersonas://')
  });
});

document.querySelectorAll('[data-tc-click="9"]').forEach(function(el) {
  el.addEventListener('click', function(event) {
    event.preventDefault();
    openBankApp('cl.bancoripley.appbanco', 'bancoripley://')
  });
});

document.querySelectorAll('[data-tc-click="10"]').forEach(function(el) {
  el.addEventListener('click', function(event) {
    event.preventDefault();
    openBankApp('cl.bice.apppersonas', 'bice://')
  });
});

document.querySelectorAll('[data-tc-click="11"]').forEach(function(el) {
  el.addEventListener('click', function(event) {
    event.preventDefault();
    openBankApp('com.sec.retail', 'bancosecurity://')
  });
});

document.querySelectorAll('[data-tc-click="12"]').forEach(function(el) {
  el.addEventListener('click', function(event) {
    event.preventDefault();
    openBankApp('cl.consorcio.mobileapp', 'bancoconsorcio://')
  });
});

document.querySelectorAll('[data-tc-click="13"]').forEach(function(el) {
  el.addEventListener('click', function(event) {
    event.preventDefault();
    openBankApp('com.finmarkets.celfinandroid', 'btgpactual://')
  });
});

document.querySelectorAll('[data-tc-click="14"]').forEach(function(el) {
  el.addEventListener('click', function(event) {
    event.preventDefault();
    openBankApp('com.krealo.tenpo', 'tenpo://')
  });
});

document.querySelectorAll('[data-tc-click="15"]').forEach(function(el) {
  el.addEventListener('click', function(event) {
    event.preventDefault();
    openBankApp('cl.bci.sismo.mach', 'mach://')
  });
});

document.querySelectorAll('[data-tc-click="16"]').forEach(function(el) {
  el.addEventListener('click', function(event) {
    event.preventDefault();
    openBankApp('com.global66.cards', 'global66://')
  });
});

document.querySelectorAll('[data-tc-click="17"]').forEach(function(el) {
  el.addEventListener('click', function(event) {
    event.preventDefault();
    openBankApp('com.mercadopago.wallet', 'mercadopago://')
  });
});

document.querySelectorAll('[data-tc-click="18"]').forEach(function(el) {
  el.addEventListener('click', function(event) {
    event.preventDefault();
    openBankApp('com.coopeuchapp', 'coopeuch://')
  });
});

document.querySelectorAll('[data-tc-click="19"]').forEach(function(el) {
  el.addEventListener('click', function(event) {
    event.preventDefault();
    openBankApp('cl.tapp', 'tapp://')
  });
});

document.querySelectorAll('[data-tc-click="20"]').forEach(function(el) {
  el.addEventListener('click', function(event) {
    event.preventDefault();
    openBankApp('cl.copec.PagoClick', 'copecpay://')
  });
});

document.querySelectorAll('[data-tc-click="21"]').forEach(function(el) {
  el.addEventListener('click', function(event) {
    event.preventDefault();
    copyFromInput('val-rut', 'RUT', this)
  });
});

document.querySelectorAll('[data-tc-click="22"]').forEach(function(el) {
  el.addEventListener('click', function(event) {
    event.preventDefault();
    copyFromInput('val-account', 'N° Cuenta', this)
  });
});

document.querySelectorAll('[data-tc-click="23"]').forEach(function(el) {
  el.addEventListener('click', function(event) {
    event.preventDefault();
    copyFromInput('val-email', 'Correo', this)
  });
});

document.querySelectorAll('[data-tc-click="24"]').forEach(function(el) {
  el.addEventListener('click', function(event) {
    event.preventDefault();
    copyFromInput('val-bank-desc', 'Banco', this)
  });
});

document.querySelectorAll('[data-tc-click="25"]').forEach(function(el) {
  el.addEventListener('click', function(event) {
    event.preventDefault();
    if(event.target===this)closeMpModal()
  });
});

document.querySelectorAll('[data-tc-click="26"]').forEach(function(el) {
  el.addEventListener('click', function(event) {
    event.preventDefault();
    closeMpModal()
  });
});

document.querySelectorAll('[data-tc-click="27"]').forEach(function(el) {
  el.addEventListener('click', function(event) {
    event.preventDefault();
    copyMpField('both', this)
  });
});

document.querySelectorAll('[data-tc-click="28"]').forEach(function(el) {
  el.addEventListener('click', function(event) {
    event.preventDefault();
    copyMpField('rut', this)
  });
});

document.querySelectorAll('[data-tc-click="29"]').forEach(function(el) {
  el.addEventListener('click', function(event) {
    event.preventDefault();
    copyMpField('bank', this)
  });
});

document.querySelectorAll('[data-tc-click="30"]').forEach(function(el) {
  el.addEventListener('click', function(event) {
    event.preventDefault();
    copyMpField('acc', this)
  });
});

document.querySelectorAll('[data-tc-click="31"]').forEach(function(el) {
  el.addEventListener('click', function(event) {
    event.preventDefault();
    launchMercadoPagoApp()
  });
});
