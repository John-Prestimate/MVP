(function() {
  // Get config from script tag
  var scriptTag = document.currentScript;
  var customerId = scriptTag.getAttribute('data-customer');
  var toolUrl = 'https://www.prestimate.io/Mapview/index.html?customer=' + encodeURIComponent(customerId);

  //create button
  var btn = document.createElement('button');
  btn.innerText = 'Open Measuring Tool';
  btn.style.position = 'fixed';
  btn.style.bottom = '24px';
  btn.style.right = '24px';
  btn.style.zIndex = 9999;
  btn.style.background = '#2d7ff9';
  btn.style.color = '#fff';
  btn.style.border = 'none';
  btn.style.borderRadius = '8px';
  btn.style.padding = '16px 24px';
  btn.style.fontSize = '16px';
  btn.style.cursor = 'pointer';

  // Modal
  var modal = document.createElement('div');
  modal.style.display = 'none';
  modal.style.position = 'fixed';
  modal.style.top = 0;
  modal.style.left = 0;
  modal.style.width = '100vw';
  modal.style.height = '100vh';
  modal.style.background = 'rgba(0,0,0,0.5)';
  modal.style.zIndex = 10000;
  modal.innerHTML = `
    <div style="position:relative;width:90vw;height:90vh;margin:5vh auto;background:#fff;border-radius:12px;box-shadow:0 2px 24px #0003;">
      <iframe src="${toolUrl}" style="width:100%;height:100%;border:none;border-radius:12px;"></iframe>
      <button id="prestimate-close" style="position:absolute;top:12px;right:12px;font-size:24px;background:none;border:none;cursor:pointer;">&times;</button>
    </div>
  `;

  // Button click opens modal
  btn.onclick = function() { modal.style.display = 'block'; };
  // Modal close
  modal.addEventListener('click', function(e) {
    if (e.target === modal) modal.style.display = 'none';
  });
  modal.querySelector('#prestimate-close').onclick = function() { modal.style.display = 'none'; };

  // Add to page
  window.addEventListener('DOMContentLoaded', function() {
    document.body.appendChild(btn);
    document.body.appendChild(modal);
  });
})();
