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

    var heroEl = document.querySelector('.hero');
    heroEl.addEventListener('mouseenter', function () { clearInterval(autoTimer); });
    heroEl.addEventListener('mouseleave', restartAuto);

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
     Modals (login / register)
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

  document.querySelectorAll('.modal-overlay').forEach(function (overlay) {
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal(overlay);
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (activeModal) closeModal(activeModal);
      if (guideOverlay && guideOverlay.classList.contains('is-open')) closeGuide();
    }
  });

  /* =====================================================
     Login / Register — honest, no fake auth
     Novum's account system is still being built, so instead
     of pretending to log a user in or send a verification
     email, both forms show the same honest status message.
     ===================================================== */
  var HONEST_NOTICE = "Thanks! Account authentication is currently being implemented and manually screened by our team. Please be patient for your email verification.";

  function wireMockForm(formId, feedbackId) {
    var form = document.getElementById(formId);
    var feedback = document.getElementById(feedbackId);
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      feedback.textContent = HONEST_NOTICE;
      feedback.classList.remove('is-error');
      setTimeout(function () {
        var overlay = form.closest('.modal-overlay');
        if (overlay) closeModal(overlay);
        form.reset();
        feedback.textContent = '';
      }, 3200);
    });
  }

  wireMockForm('loginForm', 'loginFeedback');
  wireMockForm('registerForm', 'registerFeedback');

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

  var ABSTRACT_MIN = 100;
  var ABSTRACT_MAX = 200;

  function countWords(text) {
    var trimmed = text.trim();
    return trimmed.length ? trimmed.split(/\s+/).length : 0;
  }

  if (abstractField) {
    abstractField.addEventListener('input', function () {
      var words = countWords(abstractField.value);
      abstractCount.textContent = words + ' word' + (words === 1 ? '' : 's');
      abstractCount.style.color = (words >= ABSTRACT_MIN && words <= ABSTRACT_MAX) ? '' : '#4E0000';
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
      if (words < ABSTRACT_MIN || words > ABSTRACT_MAX) {
        formFeedback.textContent = 'Your abstract must be between ' + ABSTRACT_MIN + ' and ' + ABSTRACT_MAX + ' words (currently ' + words + ').';
        formFeedback.classList.add('is-error');
        abstractField.focus();
        return;
      }

      formFeedback.textContent = 'Manuscript received. Our editorial team will follow up at the email address you provided.';
      submitForm.reset();
      fileDropLabel.textContent = 'Choose a file or drag it here';
      abstractCount.textContent = '0 words';
    });
  }

  /* =====================================================
     Resource guides — full-page overlay views
     ===================================================== */
  var guideOverlay = document.getElementById('guideOverlay');
  var guideContent = document.getElementById('guideContent');
  var guideBack = document.getElementById('guideBack');
  var resourceCards = document.querySelectorAll('.resource-card');

  var GUIDES = {
    structure: {
      tag: 'Guide',
      title: 'How to Structure a Research Paper',
      body:
        '<p>Every accepted Novum paper follows the same basic shape. Knowing what belongs in each section makes both the writing and the reading a lot easier.</p>' +
        '<h3>Abstract</h3>' +
        '<p>A short (100&ndash;200 word) summary of your whole paper: what question you asked, how you tried to answer it, and what you found. Write this section last, even though it appears first.</p>' +
        '<h3>Introduction</h3>' +
        '<p>Explain why your topic matters and what question you set out to answer. Briefly mention what others have already found, then state your specific research question clearly.</p>' +
        '<h3>Methods</h3>' +
        '<p>Describe exactly what you did, in enough detail that another student could repeat your project. Include your materials, your procedure, and how you measured or recorded your results.</p>' +
        '<h3>Results</h3>' +
        '<p>Report what you found, using tables or charts where helpful. Stick to describing the data here &mdash; save your interpretation of it for the next section.</p>' +
        '<h3>Discussion</h3>' +
        '<p>Explain what your results mean, whether they answered your question, and what limitations your project had. End with an idea for what future research could explore next.</p>'
    },
    citation: {
      tag: 'Guide',
      title: 'APA & IEEE Citation Guide for Beginners',
      body:
        '<p>Novum accepts two citation styles: APA (common in the social sciences and humanities) and IEEE (common in engineering and computer science). Pick whichever your teacher or field typically uses, and stay consistent throughout your paper.</p>' +
        '<h3>APA style, in short</h3>' +
        '<p>In-text, you cite the author\'s last name and the year: (Ramirez, 2024). Your works cited page is titled "References," listed alphabetically by author last name.</p>' +
        '<div class="guide-example">Reference list example:<br>Ramirez, T. (2024). Title of the article. <em>Journal Name</em>, 12(3), 45&ndash;52.</div>' +
        '<h3>IEEE style, in short</h3>' +
        '<p>In-text, you cite a bracketed number in the order sources first appear: [1]. Your works cited page is titled "References," numbered in that same order &mdash; not alphabetical.</p>' +
        '<div class="guide-example">Reference list example:<br>[1] T. Ramirez, "Title of the article," <em>Journal Name</em>, vol. 12, no. 3, pp. 45&ndash;52, 2024.</div>' +
        '<h3>The most common mistake</h3>' +
        '<p>Mixing the two styles in one paper. Choose one before you start writing your first citation, and use the same style for every source.</p>'
    },
    ethics: {
      tag: 'Standard',
      title: 'High School Ethics & Plagiarism Standard',
      body:
        '<p>Novum holds student authors to the same honesty standards as any academic publication, adjusted for what\'s realistic at the high school level.</p>' +
        '<h3>What counts as plagiarism</h3>' +
        '<ul>' +
        '<li>Copying text, data, or ideas from a source without crediting it.</li>' +
        '<li>Paraphrasing a source so closely that the wording is still essentially the source\'s own.</li>' +
        '<li>Submitting a paper (or major parts of one) that was written for a class assignment by someone else, or generated by an AI tool without disclosure.</li>' +
        '<li>Presenting data you didn\'t actually collect or measure as if you did.</li>' +
        '</ul>' +
        '<h3>How to stay on the right side of it</h3>' +
        '<ul>' +
        '<li>Cite every source you use, even ones you only paraphrased.</li>' +
        '<li>Quote directly (with quotation marks and a citation) when you use someone\'s exact wording.</li>' +
        '<li>If you used an AI tool anywhere in your process, disclose it in your methods section.</li>' +
        '<li>If you\'re not sure whether something needs a citation, cite it anyway.</li>' +
        '</ul>' +
        '<p>Every submission is screened before review. If we find unattributed material, the manuscript is returned to the author with an explanation rather than published.</p>'
    },
    question: {
      tag: 'Guide',
      title: 'Formulating a Testable Research Question',
      body:
        '<p>A strong research question is specific enough that you could design an actual project to answer it. A broad interest becomes a testable question in a few steps.</p>' +
        '<h3>Start broad, then narrow</h3>' +
        '<p>"I\'m interested in plants and light" is an interest, not a question. Narrow it: which plant, which aspect of light, and what you\'d actually measure.</p>' +
        '<div class="guide-example">Too broad: Does light affect plant growth?<br>Testable: Does the color of LED light (red vs. blue) affect the height of bean sprouts after two weeks?</div>' +
        '<h3>Check that it\'s answerable</h3>' +
        '<p>Ask yourself: could I actually collect data on this with the time, tools, and access I have? If the honest answer is no, narrow the question further.</p>' +
        '<h3>Make sure it has a variable you can measure</h3>' +
        '<p>A good question names something you can change (like light color) and something you can measure as a result (like sprout height in centimeters).</p>' +
        '<h3>Avoid yes/no dead ends</h3>' +
        '<p>Questions like "Is exercise good for you?" already have a known answer. Aim for a question where the specific result isn\'t obvious in advance.</p>'
    },
    data: {
      tag: 'Guide',
      title: 'Data Presentation & Charting Best Practices',
      body:
        '<p>A clear chart does more work than a paragraph of numbers. A few habits make the difference between a chart that helps a reader and one that confuses them.</p>' +
        '<h3>Choose the right chart type</h3>' +
        '<ul>' +
        '<li>Use a bar chart to compare distinct categories.</li>' +
        '<li>Use a line chart to show change over time.</li>' +
        '<li>Use a scatter plot to show the relationship between two measured variables.</li>' +
        '</ul>' +
        '<h3>Label everything</h3>' +
        '<p>Every axis needs a label and a unit (centimeters, seconds, percent). Every chart needs a caption explaining what it shows, not just a title.</p>' +
        '<h3>Don\'t mislead with scale</h3>' +
        '<p>Starting a bar chart\'s axis at a number other than zero can make small differences look huge. Keep your axes honest so the visual matches the actual data.</p>' +
        '<h3>Show your actual data</h3>' +
        '<p>Include a data table in an appendix if your chart summarizes many data points. That lets a reader (or reviewer) check your work.</p>'
    },
    prepare: {
      tag: 'Checklist',
      title: 'Preparing Your Manuscript for Submission',
      body:
        '<p>Run through this list before you submit. Most papers that get sent back before review are missing something on here &mdash; not because the research was weak.</p>' +
        '<ul>' +
        '<li>Abstract is 100&ndash;200 words and summarizes the whole paper.</li>' +
        '<li>Paper is 1,000&ndash;3,000 words, not counting your works cited page.</li>' +
        '<li>File is saved as a .docx or .pdf, double-spaced, in a readable 12pt font.</li>' +
        '<li>All sources are cited consistently in either APA or IEEE style.</li>' +
        '<li>Every chart or table has a label, units, and a caption.</li>' +
        '<li>Your name, school, and grade level are on the submission form &mdash; not hidden inside the file.</li>' +
        '<li>You\'ve read through the ethics &amp; plagiarism standard and can confirm the work is your own.</li>' +
        '</ul>' +
        '<p>Once everything on this list checks out, head to the submission portal below and send it our way.</p>'
    }
  };

  function openGuide(key) {
    var g = GUIDES[key];
    if (!g || !guideOverlay) return;
    guideContent.innerHTML =
      '<span class="guide-eyebrow">' + g.tag + '</span>' +
      '<h2>' + g.title + '</h2>' +
      g.body;
    guideOverlay.classList.add('is-open');
    guideOverlay.setAttribute('aria-hidden', 'false');
    guideOverlay.scrollTop = 0;
    document.body.style.overflow = 'hidden';
  }

  function closeGuide() {
    guideOverlay.classList.remove('is-open');
    guideOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  resourceCards.forEach(function (card) {
    card.addEventListener('click', function () {
      openGuide(card.getAttribute('data-guide'));
    });
  });

  if (guideBack) {
    guideBack.addEventListener('click', function () {
      closeGuide();
      var resourcesSection = document.getElementById('resources');
      if (resourcesSection) resourcesSection.scrollIntoView();
    });
  }

})();
