(function () {
  'use strict';

  /* =====================================================
     Mobile nav toggle
     ===================================================== */
  var navToggle = document.getElementById('navToggle');
  var navSub = document.getElementById('navSub');
  var navActions = document.querySelector('.nav-actions');

  if (navToggle) {
    navToggle.addEventListener('click', function () {
      var isOpen = navSub.classList.toggle('is-open');
      navActions.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  // Close mobile nav after tapping a link
  document.querySelectorAll('.nav-sub a').forEach(function (link) {
    link.addEventListener('click', function () {
      navSub.classList.remove('is-open');
      navActions.classList.remove('is-open');
      if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  /* =====================================================
     Hero carousel
     ===================================================== */
  var slides = Array.prototype.slice.call(document.querySelectorAll('.hero-slide'));
  var dotsWrap = document.getElementById('heroDots');
  var prevBtn = document.getElementById('heroPrev');
  var nextBtn = document.getElementById('heroNext');
  var current = 0;
  var autoTimer = null;
  var AUTO_MS = 6500;

  function buildDots() {
    slides.forEach(function (_, i) {
      var dot = document.createElement('button');
      dot.className = 'hero-dot' + (i === 0 ? ' is-active' : '');
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
      dot.addEventListener('click', function () {
        goTo(i);
        restartAuto();
      });
      dotsWrap.appendChild(dot);
    });
  }

  function goTo(index) {
    if (!slides.length) return;
    slides[current].classList.remove('is-active');
    dotsWrap.children[current].classList.remove('is-active');
    current = (index + slides.length) % slides.length;
    slides[current].classList.add('is-active');
    dotsWrap.children[current].classList.add('is-active');
  }

  function restartAuto() {
    clearInterval(autoTimer);
    autoTimer = setInterval(function () { goTo(current + 1); }, AUTO_MS);
  }

  if (slides.length) {
    buildDots();
    restartAuto();

    nextBtn.addEventListener('click', function () { goTo(current + 1); restartAuto(); });
    prevBtn.addEventListener('click', function () { goTo(current - 1); restartAuto(); });

    // Pause on hover for readability
    var heroEl = document.querySelector('.hero');
    heroEl.addEventListener('mouseenter', function () { clearInterval(autoTimer); });
    heroEl.addEventListener('mouseleave', restartAuto);

    // Basic swipe support for touch devices
    var touchStartX = null;
    heroEl.addEventListener('touchstart', function (e) {
      touchStartX = e.changedTouches[0].clientX;
    }, { passive: true });
    heroEl.addEventListener('touchend', function (e) {
      if (touchStartX === null) return;
      var delta = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(delta) > 40) {
        goTo(current + (delta < 0 ? 1 : -1));
        restartAuto();
      }
      touchStartX = null;
    }, { passive: true });
  }

  /* =====================================================
     Modals
     ===================================================== */
  var openTriggers = document.querySelectorAll('[data-modal-open]');
  var closeTriggers = document.querySelectorAll('[data-modal-close]');
  var switchTriggers = document.querySelectorAll('[data-modal-switch]');
  var activeModal = null;

  function openModal(modal) {
    if (!modal) return;
    if (activeModal) closeModal(activeModal);
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    activeModal = modal;
    var firstField = modal.querySelector('input, select, textarea');
    if (firstField) setTimeout(function () { firstField.focus(); }, 250);
    document.body.style.overflow = 'hidden';
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    if (activeModal === modal) activeModal = null;
    document.body.style.overflow = '';
  }

  openTriggers.forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var modal = document.getElementById(btn.getAttribute('data-modal-open'));
      openModal(modal);
    });
  });

  closeTriggers.forEach(function (btn) {
    btn.addEventListener('click', function () {
      closeModal(btn.closest('.modal-overlay'));
    });
  });

  switchTriggers.forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      var target = document.getElementById(link.getAttribute('data-modal-switch'));
      openModal(target);
    });
  });

  // Close on backdrop click
  document.querySelectorAll('.modal-overlay').forEach(function (overlay) {
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal(overlay);
    });
  });

  // Close on Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && activeModal) closeModal(activeModal);
  });

  /* =====================================================
     Login / Register form feedback (front-end mock)
     ===================================================== */
  function wireMockForm(formId, feedbackId, successMessage) {
    var form = document.getElementById(formId);
    var feedback = document.getElementById(feedbackId);
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      feedback.textContent = successMessage;
      feedback.classList.remove('is-error');
      setTimeout(function () {
        var overlay = form.closest('.modal-overlay');
        if (overlay) closeModal(overlay);
        form.reset();
        feedback.textContent = '';
      }, 1400);
    });
  }

  wireMockForm('loginForm', 'loginFeedback', 'Welcome back — redirecting to your dashboard…');
  wireMockForm('registerForm', 'registerFeedback', 'Account created — check your email to verify.');

  /* =====================================================
     Manuscript submission form
     ===================================================== */
  var submitForm = document.getElementById('submitForm');
  var abstractField = document.getElementById('abstract');
  var abstractCount = document.getElementById('abstractCount');
  var fileInput = document.getElementById('fileUpload');
  var fileDrop = document.getElementById('fileDrop');
  var fileDropLabel = document.getElementById('fileDropLabel');
  var formFeedback = document.getElementById('formFeedback');

  function countWords(text) {
    var trimmed = text.trim();
    return trimmed.length ? trimmed.split(/\s+/).length : 0;
  }

  if (abstractField) {
    abstractField.addEventListener('input', function () {
      var words = countWords(abstractField.value);
      abstractCount.textContent = words + ' word' + (words === 1 ? '' : 's');
      abstractCount.style.color = (words >= 150 && words <= 250) ? '' : '#B3423A';
    });
  }

  if (fileInput) {
    fileInput.addEventListener('change', function () {
      if (fileInput.files && fileInput.files.length) {
        fileDropLabel.textContent = fileInput.files[0].name;
      } else {
        fileDropLabel.textContent = 'Choose a file or drag it here';
      }
    });

    ['dragover', 'dragenter'].forEach(function (evt) {
      fileDrop.addEventListener(evt, function (e) {
        e.preventDefault();
        fileDrop.classList.add('is-dragover');
      });
    });
    ['dragleave', 'drop'].forEach(function (evt) {
      fileDrop.addEventListener(evt, function (e) {
        e.preventDefault();
        fileDrop.classList.remove('is-dragover');
      });
    });
    fileDrop.addEventListener('drop', function (e) {
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files;
        fileDropLabel.textContent = e.dataTransfer.files[0].name;
      }
    });
  }

  if (submitForm) {
    submitForm.addEventListener('submit', function (e) {
      e.preventDefault();
      formFeedback.classList.remove('is-error');

      if (!submitForm.checkValidity()) {
        submitForm.reportValidity();
        return;
      }

      var words = countWords(abstractField.value);
      if (words < 150 || words > 250) {
        formFeedback.textContent = 'Your abstract must be between 150 and 250 words (currently ' + words + ').';
        formFeedback.classList.add('is-error');
        abstractField.focus();
        return;
      }

      formFeedback.textContent = 'Manuscript received — a confirmation has been sent to your email.';
      submitForm.reset();
      fileDropLabel.textContent = 'Choose a file or drag it here';
      abstractCount.textContent = '0 words';
    });
  }

})();
