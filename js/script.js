/* ============================
   Educa Fácil EAD - Interatividade
   ============================ */
(() => {
    'use strict';

    /* ---------- Mobile nav toggle ---------- */
    const navToggle = document.querySelector('.nav-toggle');
    const nav = document.querySelector('.nav');

    if (navToggle && nav) {
        navToggle.addEventListener('click', () => {
            const isOpen = nav.classList.toggle('is-open');
            navToggle.setAttribute('aria-expanded', String(isOpen));
        });

        nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                nav.classList.remove('is-open');
                navToggle.setAttribute('aria-expanded', 'false');
            });
        });
    }

    /* ---------- Smooth scroll with header offset ---------- */
    const header = document.querySelector('.header');
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', e => {
            const targetId = anchor.getAttribute('href');
            if (targetId === '#' || targetId.length < 2) return;
            const target = document.querySelector(targetId);
            if (!target) return;
            e.preventDefault();
            const offset = header ? header.offsetHeight : 0;
            const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
            window.scrollTo({ top, behavior: 'smooth' });
        });
    });

    /* ---------- FAQ: only one item open at a time ---------- */
    const faqItems = document.querySelectorAll('.faq__item');
    faqItems.forEach(item => {
        item.addEventListener('toggle', () => {
            if (item.open) {
                faqItems.forEach(other => {
                    if (other !== item) other.open = false;
                });
            }
        });
    });

    /* ---------- Reveal on scroll ---------- */
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });

        document.querySelectorAll('.card, .phone, .courses__list li, .faq__item')
            .forEach(el => {
                el.style.opacity = '0';
                el.style.transform = 'translateY(20px)';
                el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                observer.observe(el);
            });

        const style = document.createElement('style');
        style.textContent = `.is-visible { opacity: 1 !important; transform: translateY(0) !important; }`;
        document.head.appendChild(style);
    }

    /* ---------- Image carousel ---------- */
    const carousel = document.querySelector('.carousel');
    if (carousel) {
        const slides = carousel.querySelectorAll('.carousel__slide');
        const dots   = carousel.querySelectorAll('.carousel__dot');
        const prevBtn = carousel.querySelector('.carousel__arrow--left');
        const nextBtn = carousel.querySelector('.carousel__arrow--right');
        const interval = parseInt(carousel.dataset.autoplay, 10) || 5000;

        let current = 0;
        let timer = null;

        const goTo = (index) => {
            current = (index + slides.length) % slides.length;
            slides.forEach((s, i) => s.classList.toggle('is-active', i === current));
            dots.forEach((d, i)   => d.classList.toggle('is-active', i === current));
        };

        const next  = () => goTo(current + 1);
        const prev  = () => goTo(current - 1);

        const start = () => {
            stop();
            timer = setInterval(next, interval);
        };
        const stop = () => {
            if (timer) { clearInterval(timer); timer = null; }
        };
        const restart = () => { stop(); start(); };

        nextBtn?.addEventListener('click', () => { next(); restart(); });
        prevBtn?.addEventListener('click', () => { prev(); restart(); });

        dots.forEach((dot, i) => {
            dot.addEventListener('click', () => { goTo(i); restart(); });
        });

        carousel.addEventListener('mouseenter', stop);
        carousel.addEventListener('mouseleave', start);

        document.addEventListener('visibilitychange', () => {
            document.hidden ? stop() : start();
        });

        // Touch / swipe support
        let touchStartX = 0;
        carousel.addEventListener('touchstart', e => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        carousel.addEventListener('touchend', e => {
            const diff = e.changedTouches[0].screenX - touchStartX;
            if (Math.abs(diff) > 50) {
                diff > 0 ? prev() : next();
                restart();
            }
        });

        start();
    }

    /* ---------- Header shadow on scroll ---------- */
    if (header) {
        const onScroll = () => {
            header.style.boxShadow = window.scrollY > 4
                ? '0 4px 14px rgba(0,0,0,0.08)'
                : 'none';
        };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
    }
})();
