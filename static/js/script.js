/* =============================================
   LEAFLET — Plant Disease Detection
   script.js  —  Vanilla JS, no dependencies
   ============================================= */

'use strict';

/* =============================================
   1. DARK MODE TOGGLE
   ============================================= */
(function initDarkMode() {
  const toggle = document.getElementById('darkToggle');
  const root   = document.documentElement;

  // Restore from localStorage, fall back to OS preference
  const saved = localStorage.getItem('leaflet_theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (prefersDark ? 'dark' : 'light');
  root.setAttribute('data-theme', theme);

  if (toggle) {
    toggle.addEventListener('click', () => {
      const current = root.getAttribute('data-theme');
      const next    = current === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem('leaflet_theme', next);
    });
  }
})();

/* =============================================
   2. NAVBAR — active link + scroll shadow + mobile toggle
   ============================================= */
(function initNavbar() {
  const navbar    = document.getElementById('navbar');
  const navToggle = document.getElementById('navToggle');
  const navLinks  = document.getElementById('navLinks');
  const links     = document.querySelectorAll('.nav-link');

  // Scroll shadow
  window.addEventListener('scroll', () => {
    navbar.style.boxShadow = window.scrollY > 10
      ? '0 2px 20px rgba(0,0,0,0.08)'
      : '';
  }, { passive: true });

  // Mobile toggle
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      navToggle.classList.toggle('open', isOpen);
      navToggle.setAttribute('aria-expanded', isOpen);
    });

    // Close on link click
    links.forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        navToggle.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!navbar.contains(e.target)) {
        navLinks.classList.remove('open');
        navToggle.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Active link highlighting via IntersectionObserver
  const sections = document.querySelectorAll('section[id], header[id]');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        links.forEach(link => {
          const href = link.getAttribute('href');
          if (href && href === `#${entry.target.id}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(section => observer.observe(section));
})();

/* =============================================
   3. SMOOTH SCROLL for anchor links
   ============================================= */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const navH = parseInt(getComputedStyle(document.documentElement)
        .getPropertyValue('--nav-h')) || 68;
      const top = target.getBoundingClientRect().top + window.scrollY - navH - 16;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

/* =============================================
   4. RIPPLE BUTTON EFFECT
   ============================================= */
document.querySelectorAll('.ripple').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const wave = document.createElement('span');
    wave.className = 'ripple-wave';
    wave.style.width  = size + 'px';
    wave.style.height = size + 'px';
    wave.style.left   = (e.clientX - rect.left - size / 2) + 'px';
    wave.style.top    = (e.clientY - rect.top  - size / 2) + 'px';
    btn.appendChild(wave);
    wave.addEventListener('animationend', () => wave.remove());
  });
});

/* =============================================
   5. FILE UPLOAD — drag & drop + preview
   ============================================= */
(function initUpload() {
  const uploadZone  = document.getElementById('uploadZone');
  const fileInput   = document.getElementById('fileInput');
  const uploadIdle  = document.getElementById('uploadIdle');
  const previewCard = document.getElementById('previewCard');
  const previewImg  = document.getElementById('previewImg');
  const previewName = document.getElementById('previewName');
  const previewSize = document.getElementById('previewSize');
  const previewRes  = document.getElementById('previewRes');
  const changeBtn   = document.getElementById('changeBtn');
  const removeBtn   = document.getElementById('removeBtn');
  const predictBtn  = document.getElementById('predictBtn');
  const uploadForm  = document.getElementById('uploadForm');

  // If any element is missing (e.g. after Flask renders result), bail gracefully
  if (!uploadZone) return;

  /* ---------- Show preview ---------- */
  function handleFile(file) {
    if (!file) return;

    // Validate type
    const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowed.includes(file.type)) {
      showFileError('Only JPG and PNG images are supported.');
      return;
    }

    // Validate size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      showFileError('File too large. Please use an image under 10 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      // Create temp image to get resolution
      const img = new Image();
      img.onload = () => {
        if (previewImg)  previewImg.src = e.target.result;
        if (previewName) previewName.textContent = file.name;
        if (previewSize) previewSize.textContent = formatBytes(file.size);
        if (previewRes)  previewRes.textContent  = `${img.naturalWidth} × ${img.naturalHeight}`;

        // Swap idle zone ↔ preview card
        if (uploadIdle)  uploadIdle.style.display  = 'none';
        if (uploadZone)  uploadZone.style.display  = 'none';
        if (previewCard) previewCard.style.display = 'grid';
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  /* ---------- File input change ---------- */
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
    });
  }

  /* ---------- Drag & drop ---------- */
  if (uploadZone) {
    uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadZone.classList.add('drag-over');
    });
    uploadZone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      uploadZone.classList.remove('drag-over');
    });
    uploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadZone.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file) {
        // Populate the actual file input so Flask form submission works
        const dt = new DataTransfer();
        dt.items.add(file);
        fileInput.files = dt.files;
        handleFile(file);
      }
    });

    // Keyboard accessibility for the zone
    uploadZone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fileInput && fileInput.click();
      }
    });
  }

  /* ---------- Change / Remove buttons ---------- */
  if (changeBtn) {
    changeBtn.addEventListener('click', () => {
      fileInput && fileInput.click();
    });
  }
  if (removeBtn) {
    removeBtn.addEventListener('click', () => {
      resetUpload();
    });
  }

  /* ---------- Form submit → show loading ---------- */
  if (uploadForm) {
    uploadForm.addEventListener('submit', (e) => {
      // Basic validation
      if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        e.preventDefault();
        showFileError('Please select an image before analyzing.');
        return;
      }
      showLoading();
    });
  }

  /* ---------- Helpers ---------- */
  function resetUpload() {
    if (fileInput)   { fileInput.value = ''; }
    if (previewCard) previewCard.style.display = 'none';
    if (uploadZone)  uploadZone.style.display  = 'block';
    if (uploadIdle)  uploadIdle.style.display  = 'block';
  }

  function showFileError(msg) {
    // Simple accessible alert — replace with a proper toast if desired
    alert(msg);
  }

  function formatBytes(bytes) {
    if (bytes < 1024)       return bytes + ' B';
    if (bytes < 1048576)    return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }
})();

/* =============================================
   6. LOADING ANIMATION — step progression
   ============================================= */
function showLoading() {
  const loadingSection = document.getElementById('loadingSection');
  const uploadZone     = document.getElementById('uploadZone');
  const previewCard    = document.getElementById('previewCard');

  if (previewCard)    previewCard.style.display    = 'none';
  if (uploadZone)     uploadZone.style.display     = 'none';
  if (loadingSection) loadingSection.style.display = 'block';

  // Animate steps in sequence
  const steps   = ['step1', 'step2', 'step3', 'step4'];
  const delays  = [0, 800, 1700, 2700];

  steps.forEach((id, i) => {
    setTimeout(() => {
      const el = document.getElementById(id);
      if (!el) return;

      // Mark previous as done
      if (i > 0) {
        const prev = document.getElementById(steps[i - 1]);
        if (prev) { prev.classList.remove('active'); prev.classList.add('done'); }
      }
      el.classList.add('active');
    }, delays[i]);
  });
}

/* =============================================
   7. CONFIDENCE BAR ANIMATION (for Flask result page)
   ============================================= */
(function animateConfidenceBar() {
  const fill   = document.getElementById('confFill');
  const valEl  = document.getElementById('confValue');
  if (!fill) return;

  const target  = parseFloat(fill.dataset.target) || 0;
  const rounded = Math.round(target * 10) / 10;

  // Color class based on confidence
  if (target >= 90)      fill.classList.remove('conf-orange', 'conf-red');
  else if (target >= 70) fill.classList.add('conf-orange');
  else                   fill.classList.add('conf-red');

  // Trigger CSS transition after a brief delay (allows repaint)
  requestAnimationFrame(() => {
    setTimeout(() => {
      fill.style.width = rounded + '%';
    }, 200);
  });

  // Count-up animation for the value
  if (valEl) {
    const duration  = 1200;
    const startTime = performance.now();
    const start     = 0;

    function countUp(now) {
      const elapsed  = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased    = 1 - Math.pow(1 - progress, 3);
      valEl.textContent = (start + (target - start) * eased).toFixed(1) + '%';
      if (progress < 1) requestAnimationFrame(countUp);
    }
    setTimeout(() => requestAnimationFrame(countUp), 200);
  }
})();

/* =============================================
   8. RESET — "Analyze Another Leaf" button
   ============================================= */
(function initReset() {
  const btn = document.getElementById('analyzeAnother');
  if (!btn) return;

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    // Hide result section, scroll to upload
    const result = document.getElementById('resultSection');
    if (result) result.style.display = 'none';

    const upload = document.getElementById('upload');
    if (upload) {
      const navH = parseInt(getComputedStyle(document.documentElement)
        .getPropertyValue('--nav-h')) || 68;
      const top = upload.getBoundingClientRect().top + window.scrollY - navH - 16;
      window.scrollTo({ top, behavior: 'smooth' });
    }

    // Reset file input and show upload zone
    const fileInput  = document.getElementById('fileInput');
    const uploadZone = document.getElementById('uploadZone');
    const uploadIdle = document.getElementById('uploadIdle');
    const previewCard = document.getElementById('previewCard');
    if (fileInput)   fileInput.value = '';
    if (previewCard) previewCard.style.display = 'none';
    if (uploadZone)  uploadZone.style.display  = 'block';
    if (uploadIdle)  uploadIdle.style.display  = 'block';
  });
})();

/* =============================================
   9. SCROLL REVEAL for section cards
   ============================================= */
(function initReveal() {
  // Add reveal class to target elements
  const targets = [
    '.tip-card', '.timeline-item', '.timeline-connector',
    '.tech-item', '.info-card', '.contact-card',
    '.about-visual', '.cnn-diagram', '.stat'
  ];
  targets.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => el.classList.add('reveal'));
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
})();

/* =============================================
   10. FOOTER YEAR
   ============================================= */
const yearEl = document.getElementById('footerYear');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* =============================================
   11. CNN DIAGRAM hover labels (about section)
   ============================================= */
(function initCnnDiagram() {
  document.querySelectorAll('.cnn-layer').forEach(layer => {
    layer.addEventListener('mouseenter', () => {
      layer.style.transform = 'translateY(-4px)';
      layer.style.transition = 'transform 0.2s ease';
    });
    layer.addEventListener('mouseleave', () => {
      layer.style.transform = '';
    });
  });
})();

/* =============================================
   12. AUTO-SCROLL to result on Flask page load
   ============================================= */
(function autoScrollToResult() {
  const result = document.getElementById('resultSection');
  if (!result) return;

  // If result section exists, Flask rendered a prediction — scroll to it
  setTimeout(() => {
    const navH = parseInt(getComputedStyle(document.documentElement)
      .getPropertyValue('--nav-h')) || 68;
    const top = result.getBoundingClientRect().top + window.scrollY - navH - 24;
    window.scrollTo({ top, behavior: 'smooth' });
  }, 400);
})();
