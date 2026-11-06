
    if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
      location.replace('https://' + location.hostname + location.pathname + location.search + location.hash);
    }

    // ---- Solicitud de acceso a la prueba interna de Google Play ----
    // Cero servidores: se abre el WhatsApp del VISITANTE con el mensaje
    // pre-llenado dirigido al administrador, quien lo agrega como verificador
    // en Play Console y responde con el enlace oficial.
    var ADMIN_WHATSAPP = '56930113098';

    var btnAccess = document.getElementById('btn-play-access');
    var form = document.getElementById('play-form');
    var btnSubmit = document.getElementById('btn-play-submit');
    var successBox = document.getElementById('play-success');
    var errorBox = document.getElementById('play-error');

    if (btnAccess && form) {
      btnAccess.addEventListener('click', function () {
        var open = form.classList.toggle('open');
        btnAccess.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (open) {
          var first = document.getElementById('f-name');
          if (first) first.focus();
        }
      });
    }

    function showError(msg) {
      if (!errorBox) return;
      errorBox.textContent = msg;
      errorBox.style.display = 'block';
    }
    function clearError() {
      if (errorBox) errorBox.style.display = 'none';
    }

    if (btnSubmit) {
      btnSubmit.addEventListener('click', function () {
        clearError();
        var name = (document.getElementById('f-name') || {}).value || '';
        var phone = (document.getElementById('f-phone') || {}).value || '';
        var email = (document.getElementById('f-email') || {}).value || '';
        name = name.trim(); phone = phone.trim(); email = email.trim();

        if (!name || !phone || !email) {
          showError('Completa los 3 campos para solicitar tu acceso.');
          return;
        }
        if (name.length > 160) { showError('El nombre es demasiado largo.'); return; }
        if (!/^\+?[0-9 ()-]{8,16}$/.test(phone)) {
          showError('Revisa tu número de WhatsApp (ej: +56 9 1234 5678).');
          return;
        }
        if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
          showError('Revisa tu correo: debe ser el que usas en Play Store.');
          return;
        }

        var msg = '¡Hola! Quiero ser tester de TransferChile y descargar la app desde Google Play.\n' +
                  '• Nombre: ' + name + '\n' +
                  '• WhatsApp: ' + phone + '\n' +
                  '• Correo Play Store: ' + email;
        var url = 'https://wa.me/' + ADMIN_WHATSAPP + '?text=' + encodeURIComponent(msg);

        // En móvil y escritorio: nueva pestaña si se puede; si el navegador la
        // bloquea, navegamos directo (el aviso de éxito ya quedó visible).
        var win = window.open(url, '_blank', 'noopener,noreferrer');
        if (!win) { window.location.href = url; }

        if (successBox) {
          successBox.style.display = 'block';
          successBox.setAttribute('role', 'status');
        }
      });
    }
  