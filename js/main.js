/* Sorane Skin Clinic LP - vanilla JS */
(() => {
  'use strict';

  const pcQuery = window.matchMedia('(min-width: 1024px)');

  /* ---------- Hamburger menu ---------- */
  const menuBtn = document.querySelector('.menu-btn');
  const nav = document.getElementById('global-nav');

  const setMenu = (open) => {
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('is-menu-open', open);
  };
  const isMenuOpen = () => menuBtn.getAttribute('aria-expanded') === 'true';

  menuBtn.addEventListener('click', () => {
    const open = !isMenuOpen();
    setMenu(open);
    if (open) nav.querySelector('a').focus();
  });

  // ナビ内のリンクを押したら閉じる
  nav.addEventListener('click', (e) => {
    if (e.target.closest('a') && isMenuOpen()) setMenu(false);
  });

  document.addEventListener('keydown', (e) => {
    if (!isMenuOpen()) return;
    // Esc で閉じてボタンにフォーカスを戻す
    if (e.key === 'Escape') {
      setMenu(false);
      menuBtn.focus();
      return;
    }
    // メニュー表示中はフォーカスをボタンとナビ内に閉じ込める
    if (e.key === 'Tab') {
      const items = [menuBtn, ...nav.querySelectorAll('a')];
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  // PC 幅になったらメニュー状態をリセット
  pcQuery.addEventListener('change', (e) => {
    if (e.matches) setMenu(false);
  });

  /* ---------- Accordion ---------- */
  document.querySelectorAll('.accordion__btn').forEach((btn) => {
    const panel = document.getElementById(btn.getAttribute('aria-controls'));
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      panel.classList.toggle('is-open', open);
    });
  });

  /* ---------- Scroll fade-in ---------- */
  const fadeTargets = document.querySelectorAll('.js-fade');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -10% 0px' });

    // 同じ親の中で順番に少しずつ遅らせて表示する
    fadeTargets.forEach((el) => {
      const siblings = [...el.parentElement.children].filter((c) => c.classList.contains('js-fade'));
      const index = siblings.indexOf(el);
      if (index > 0) el.style.transitionDelay = `${Math.min(index, 6) * 0.08}s`;
      io.observe(el);
    });
  } else {
    fadeTargets.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- Fixed CTA (SP) ---------- */
  const fixedCta = document.querySelector('.fixed-cta');
  const hero = document.querySelector('.hero');
  const reserve = document.getElementById('reserve');
  let heroPassed = false;
  let reserveVisible = false;
  const updateCta = () => fixedCta.classList.toggle('is-show', heroPassed && !reserveVisible);

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      heroPassed = !entry.isIntersecting;
      updateCta();
    }).observe(hero);
    // 予約セクションが見えている間は重複するので隠す
    new IntersectionObserver(([entry]) => {
      reserveVisible = entry.isIntersecting;
      updateCta();
    }).observe(reserve);
  } else {
    fixedCta.classList.add('is-show');
  }
})();
