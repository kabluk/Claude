/* Y2K Global — Main JS */
(function () {
  'use strict';

  /* ============================================================
     STICKY HEADER
     ============================================================ */
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => {
      header.classList.toggle('scrolled', window.scrollY > 40);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ============================================================
     MOBILE MENU TOGGLE
     ============================================================ */
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.main-navigation');
  if (menuToggle && nav) {
    menuToggle.addEventListener('click', () => {
      const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
      menuToggle.setAttribute('aria-expanded', String(!expanded));
      nav.classList.toggle('toggled');
      menuToggle.textContent = expanded ? '☰' : '✕';
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!nav.contains(e.target) && !menuToggle.contains(e.target)) {
        nav.classList.remove('toggled');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.textContent = '☰';
      }
    });
  }

  /* ============================================================
     EMAIL POPUP
     ============================================================ */
  const POPUP_COOKIE = 'y2k_popup_seen';
  const POPUP_DELAY  = 6000; // 6 seconds

  function getCookie(name) {
    return document.cookie.split('; ').reduce((acc, c) => {
      const [k, v] = c.split('=');
      return k === name ? decodeURIComponent(v) : acc;
    }, null);
  }

  function setCookie(name, value, days) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
  }

  function initPopup() {
    const overlay = document.getElementById('y2k-popup-overlay');
    const popup   = document.getElementById('y2k-popup');
    if (!overlay || !popup) return;

    // Don't show if already seen, or on checkout
    if (getCookie(POPUP_COOKIE)) return;
    if (document.body.classList.contains('woocommerce-checkout')) return;

    const showPopup = () => {
      overlay.classList.add('active');
      popup.classList.add('active');
      setCookie(POPUP_COOKIE, '1', 7);
    };

    // Show on exit-intent (desktop)
    let exitShown = false;
    document.addEventListener('mouseleave', (e) => {
      if (e.clientY < 5 && !exitShown) {
        exitShown = true;
        showPopup();
      }
    });

    // Fallback: show after delay
    setTimeout(() => {
      if (!overlay.classList.contains('active')) showPopup();
    }, POPUP_DELAY);

    // Close handlers
    const closePopup = () => {
      overlay.classList.remove('active');
      popup.classList.remove('active');
    };

    overlay.addEventListener('click', closePopup);
    popup.querySelectorAll('[data-close-popup]').forEach(el => {
      el.addEventListener('click', closePopup);
    });

    // Form submit
    const form = popup.querySelector('#y2k-popup-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email  = form.querySelector('input[type="email"]').value;
        const btn    = form.querySelector('button[type="submit"]');
        const msgEl  = form.querySelector('.y2k-popup__success');

        btn.disabled = true;
        btn.textContent = 'Sending…';

        try {
          const body = new URLSearchParams({
            action: 'y2k_subscribe',
            email,
            nonce: (window.y2kData && window.y2kData.nonce) || '',
          });

          const res  = await fetch((window.y2kData && window.y2kData.ajaxurl) || '/wp-admin/admin-ajax.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body,
          });
          const data = await res.json();

          if (data.success) {
            form.innerHTML = `<p class="y2k-popup__success">🎉 Your discount code: <strong>${getDiscountCode()}</strong></p>`;
          } else {
            btn.disabled = false;
            btn.textContent = 'Get My Discount';
            alert(data.data && data.data.message ? data.data.message : 'Something went wrong.');
          }
        } catch {
          btn.disabled = false;
          btn.textContent = 'Get My Discount';
        }
      });
    }
  }

  function getDiscountCode() {
    // Read from data attribute set by PHP
    const popup = document.getElementById('y2k-popup');
    return (popup && popup.dataset.discount) || 'WELCOME10';
  }

  /* ============================================================
     SIZE GUIDE MODAL
     ============================================================ */
  function initSizeGuide() {
    const triggers = document.querySelectorAll('[data-modal="size-guide"]');
    const overlay  = document.getElementById('y2k-size-guide-overlay');
    if (!overlay) return;

    const closeModal = () => overlay.classList.remove('active');

    triggers.forEach(btn => {
      btn.addEventListener('click', () => overlay.classList.add('active'));
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });

    overlay.querySelectorAll('[data-close-modal]').forEach(el => {
      el.addEventListener('click', closeModal);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });
  }

  /* ============================================================
     PRODUCT CARD HOVER (secondary image)
     Already handled via CSS; JS adds 'loaded' class after img loads
     ============================================================ */
  function initProductCards() {
    document.querySelectorAll('.product-card__image-secondary').forEach(img => {
      if (img.complete) return;
      img.addEventListener('load', () => img.classList.add('loaded'));
    });
  }

  /* ============================================================
     LAZY LOAD IMAGES (native + polyfill)
     ============================================================ */
  function initLazyLoad() {
    if ('loading' in HTMLImageElement.prototype) return; // native support

    const images = document.querySelectorAll('img[loading="lazy"]');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) img.src = img.dataset.src;
          observer.unobserve(img);
        }
      });
    }, { rootMargin: '200px' });

    images.forEach(img => observer.observe(img));
  }

  /* ============================================================
     SCROLL TO TOP BUTTON
     ============================================================ */
  function initScrollTop() {
    const btn = document.createElement('button');
    btn.id = 'y2k-scroll-top';
    btn.setAttribute('aria-label', 'Scroll to top');
    btn.innerHTML = '↑';
    btn.style.cssText = [
      'position:fixed', 'bottom:24px', 'right:24px', 'z-index:500',
      'width:40px', 'height:40px', 'background:#0d0d0d', 'color:#fff',
      'border:none', 'font-size:18px', 'cursor:pointer',
      'opacity:0', 'transition:opacity .25s', 'display:flex',
      'align-items:center', 'justify-content:center',
    ].join(';');

    document.body.appendChild(btn);

    window.addEventListener('scroll', () => {
      btn.style.opacity = window.scrollY > 400 ? '1' : '0';
    }, { passive: true });

    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* ============================================================
     QUANTITY BUTTONS (+/-)
     ============================================================ */
  function initQuantityButtons() {
    document.querySelectorAll('.quantity').forEach(wrap => {
      if (wrap.querySelector('.y2k-qty-btn')) return; // already initialized

      const input = wrap.querySelector('input[type="number"]');
      if (!input) return;

      const minus = document.createElement('button');
      minus.type = 'button';
      minus.className = 'y2k-qty-btn y2k-qty-minus';
      minus.textContent = '−';
      minus.style.cssText = 'background:none;border:1px solid #e5e5e5;width:36px;height:36px;font-size:16px;cursor:pointer;';

      const plus = document.createElement('button');
      plus.type = 'button';
      plus.className = 'y2k-qty-btn y2k-qty-plus';
      plus.textContent = '+';
      plus.style.cssText = minus.style.cssText;

      wrap.insertBefore(minus, input);
      wrap.appendChild(plus);

      minus.addEventListener('click', () => {
        const val = parseInt(input.value, 10);
        if (val > parseInt(input.min || 1, 10)) {
          input.value = val - 1;
          input.dispatchEvent(new Event('change'));
        }
      });

      plus.addEventListener('click', () => {
        const val = parseInt(input.value, 10);
        const max = input.max ? parseInt(input.max, 10) : Infinity;
        if (val < max) {
          input.value = val + 1;
          input.dispatchEvent(new Event('change'));
        }
      });
    });
  }

  /* ============================================================
     MINI CART ANIMATION
     ============================================================ */
  document.body.addEventListener('added_to_cart', () => {
    const cartLink = document.querySelector('.cart-contents');
    if (!cartLink) return;
    cartLink.classList.add('y2k-cart-pulse');
    setTimeout(() => cartLink.classList.remove('y2k-cart-pulse'), 600);
  });

  /* ============================================================
     INIT
     ============================================================ */
  document.addEventListener('DOMContentLoaded', () => {
    initPopup();
    initSizeGuide();
    initProductCards();
    initLazyLoad();
    initScrollTop();
    initQuantityButtons();
  });
})();
