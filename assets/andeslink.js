
    if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
      location.replace('https://' + location.hostname + location.pathname + location.search + location.hash);
    }
  

    function filterBankPills() {
      var query = document.getElementById('bank-filter').value.toLowerCase().trim();
      var pills = document.querySelectorAll('#banks-cloud-list .bank-pill');
      for (var i = 0; i < pills.length; i++) {
        var text = pills[i].textContent.toLowerCase();
        if (text.indexOf(query) > -1) {
          pills[i].style.display = 'flex';
        } else {
          pills[i].style.display = 'none';
        }
      }
    }
  
document.querySelectorAll('[data-tc-keyup="0"]').forEach(function(el) {
  el.addEventListener('keyup', function(event) {
    
    filterBankPills()
  });
});
