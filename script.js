/* =============================================
   XPOD — Premium Scroll Experience
   Powered by Lenis + GSAP + ScrollTrigger
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {

  // =============================================
  // SAFETY: Check if GSAP loaded
  // =============================================
  const hasGSAP = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  const hasLenis = typeof Lenis !== 'undefined';

  let lenis = null;

  // =============================================
  // LENIS — Buttery Smooth Scroll
  // =============================================
  if (hasLenis) {
    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    if (hasGSAP) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      // Fallback RAF loop for Lenis without GSAP
      function lenisRaf(time) {
        lenis.raf(time);
        requestAnimationFrame(lenisRaf);
      }
      requestAnimationFrame(lenisRaf);
    }
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        if (lenis) {
          lenis.scrollTo(target, { offset: -80 });
        } else {
          const navH = 80;
          const top = target.getBoundingClientRect().top + window.pageYOffset - navH;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      }
    });
  });

  // Register GSAP plugins
  if (hasGSAP) {
    gsap.registerPlugin(ScrollTrigger);
  }


  // =============================================
  // IMAGE SEQUENCE — Canvas Scroll Animation (GSAP Pinned)
  // =============================================
  const FRAME_COUNT = 121;
  const FRAME_PATH = 'IMAGE SEQ/ezgif-frame-';
  const canvas = document.getElementById('hero-canvas');
  const ctx = canvas ? canvas.getContext('2d') : null;
  const heroSection = document.getElementById('hero');
  const heroText1 = document.getElementById('hero-text-1');
  const heroText2 = document.getElementById('hero-text-2');
  const scrollIndicator = document.getElementById('hero-scroll-indicator');

  const images = [];
  let loadedCount = 0;
  let currentFrame = 0;

  function framePath(index) {
    const num = String(index).padStart(3, '0');
    return `${FRAME_PATH}${num}.jpg`;
  }

  function resizeCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function drawFrame(frameIndex) {
    if (!ctx || !images[frameIndex] || !images[frameIndex].complete) return;
    const img = images[frameIndex];
    const cw = canvas.width, ch = canvas.height;
    const iw = img.naturalWidth, ih = img.naturalHeight;
    const scale = Math.max(cw / iw, ch / ih);
    const sw = iw * scale, sh = ih * scale;
    const sx = (cw - sw) / 2, sy = (ch - sh) / 2;
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, sx, sy, sw, sh);
  }

  function preloadFrames() {
    for (let i = 1; i <= FRAME_COUNT; i++) {
      const img = new Image();
      img.src = framePath(i);
      img.onload = () => {
        loadedCount++;
        if (i === 1 && ctx) { resizeCanvas(); drawFrame(0); }
        if (loadedCount === FRAME_COUNT) {
          initHeroScrollTrigger();
        }
      };
      images.push(img);
    }
  }

  // Set up GSAP ScrollTrigger to PIN the hero and scrub through frames
  function initHeroScrollTrigger() {
    if (!hasGSAP || !heroSection || !ctx) return;

    // Create a dummy tween target for the scrub
    const frameObj = { frame: 0 };

    ScrollTrigger.create({
      trigger: heroSection,
      start: 'top top',
      end: '+=300%',     // 3x viewport height of scroll distance for the animation
      pin: true,          // PIN the hero — page stops scrolling here
      scrub: 0.5,         // Smooth scrub (0.5s catch-up)
      onUpdate: (self) => {
        const progress = self.progress;  // 0 → 1
        const frameIndex = Math.min(FRAME_COUNT - 1, Math.floor(progress * FRAME_COUNT));

        if (frameIndex !== currentFrame) {
          currentFrame = frameIndex;
          drawFrame(currentFrame);
        }

        // Text layers — appear at scroll milestones, stay visible
        if (heroText1) heroText1.classList.toggle('visible', progress > 0.40);
        if (heroText2) heroText2.classList.toggle('visible', progress > 0.55);
        if (scrollIndicator) scrollIndicator.classList.toggle('fade-out', progress > 0.05);
      },
    });

    // CRITICAL FIX: Because this hero trigger is created asynchronously (after images load),
    // it gets added to the DOM after the rest of the page's ScrollTriggers have calculated their positions.
    // The massive 300vh pin pushes everything down. We MUST sort and refresh to recalculate everything.
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
  }

  if (canvas && ctx) {
    resizeCanvas();
    preloadFrames();
    window.addEventListener('resize', () => { resizeCanvas(); drawFrame(currentFrame); });
  }


  // =============================================
  // PAGE LOADER
  // =============================================
  const loader = document.getElementById('loader');
  document.body.classList.add('locked');

  window.addEventListener('load', () => {
    if (lenis) lenis.stop();
    setTimeout(() => {
      loader.classList.add('hidden');
      document.body.classList.remove('locked');
      if (lenis) lenis.start();
      if (hasGSAP) initEntryAnimations();
    }, 1400);
  });

  setTimeout(() => {
    loader.classList.add('hidden');
    document.body.classList.remove('locked');
    if (lenis) lenis.start();
  }, 3500);


  // =============================================
  // GSAP — Entry Animations (after loader)
  // =============================================
  function initEntryAnimations() {
    if (!hasGSAP) return;
    gsap.from('.nav-container', { y: -40, opacity: 0, duration: 1, ease: 'power3.out' });
    gsap.from('#hero-scroll-indicator', { opacity: 0, y: 20, duration: 1, delay: 0.6, ease: 'power2.out' });
  }


  // =============================================
  // GSAP — Scroll-Triggered Reveals
  // =============================================
  if (hasGSAP) {

    // Helper: set initial state and animate
    function scrollReveal(selector, fromVars, triggerOptions = {}) {
      gsap.utils.toArray(selector).forEach(el => {
        gsap.set(el, { opacity: 0, ...fromVars });
        gsap.to(el, {
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            toggleActions: 'play none none none',
            ...triggerOptions,
          },
          opacity: 1,
          x: 0, y: 0, scale: 1,
          duration: 0.9,
          ease: 'power3.out',
          ...triggerOptions.tweenVars,
        });
      });
    }

    // Section labels
    scrollReveal('.section-label', { y: 30 });

    // Section titles
    scrollReveal('.section-title', { y: 60 }, { start: 'top 85%', tweenVars: { duration: 1 } });

    // Highlights — Pinned Scroll Container
    const highlightsSection = document.querySelector('.highlights-pinned');
    const capsulesWrapper = document.querySelector('.highlights-capsules-wrapper');
    const capsules = gsap.utils.toArray('.highlight-capsule');
    
    if (highlightsSection && capsulesWrapper && capsules.length) {
      gsap.fromTo(capsules, 
        { opacity: 0, y: 60, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          stagger: 0.15,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: highlightsSection,
            start: 'top 75%',
            toggleActions: 'play none none none'
          }
        }
      );
    }

    // Products hero image
    // Lineup Panels — Parallax & Card Reveal
    gsap.utils.toArray('.lineup-panel').forEach(panel => {
      const img = panel.querySelector('.lineup-img');
      const card = panel.querySelector('.lineup-card');

      // Parallax Image
      if (img) {
        gsap.to(img, {
          yPercent: 10,
          ease: 'none',
          scrollTrigger: {
            trigger: panel,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true
          }
        });
      }

      // Card Reveal
      if (card) {
        gsap.from(card, {
          y: 60,
          opacity: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: panel,
            start: 'top 75%',
            toggleActions: 'play none none none'
          }
        });
      }
    });
    // About image — slide from left
    gsap.set('.about-image', { opacity: 0, x: -80 });
    ScrollTrigger.create({
      trigger: '.about-grid',
      start: 'top 75%',
      onEnter: () => {
        gsap.to('.about-image', {
          opacity: 1, x: 0,
          duration: 1.1,
          ease: 'power3.out',
        });
      },
      once: true,
    });

    // About text — staggered
    const aboutItems = gsap.utils.toArray('.about-content .section-label, .about-content .section-title, .about-text, .about-stats');
    gsap.set(aboutItems, { opacity: 0, y: 50 });
    ScrollTrigger.create({
      trigger: '.about-content',
      start: 'top 80%',
      onEnter: () => {
        gsap.to(aboutItems, {
          opacity: 1, y: 0,
          duration: 0.9,
          stagger: 0.12,
          ease: 'power3.out',
        });
      },
      once: true,
    });

    // Feature cards — staggered with scale
    gsap.set('.feature-card', { opacity: 0, y: 60, scale: 0.95 });
    ScrollTrigger.create({
      trigger: '.features-grid',
      start: 'top 80%',
      onEnter: () => {
        gsap.to('.feature-card', {
          opacity: 1, y: 0, scale: 1,
          duration: 0.8,
          stagger: 0.12,
          ease: 'power3.out',
        });
      },
      once: true,
    });

    // CTA content
    gsap.set('.cta-content', { opacity: 0, y: 60 });
    ScrollTrigger.create({
      trigger: '.cta-section',
      start: 'top 70%',
      onEnter: () => {
        gsap.to('.cta-content', {
          opacity: 1, y: 0,
          duration: 1,
          ease: 'power3.out',
        });
      },
      once: true,
    });

    // Footer
    gsap.set('.footer-top', { opacity: 0, y: 40 });
    ScrollTrigger.create({
      trigger: '.footer',
      start: 'top 85%',
      onEnter: () => {
        gsap.to('.footer-top', {
          opacity: 1, y: 0,
          duration: 0.9,
          ease: 'power3.out',
        });
      },
      once: true,
    });


    // =============================================
    // GSAP — Parallax Effects
    // =============================================

    // About image parallax
    gsap.to('.about-image img', {
      scrollTrigger: {
        trigger: '.about',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1.5,
      },
      y: -60,
      ease: 'none',
    });

    // CTA background zoom
    gsap.to('.cta-bg-img', {
      scrollTrigger: {
        trigger: '.cta-section',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 2,
      },
      scale: 1.15,
      ease: 'none',
    });

    // Marquee acceleration
    gsap.to('.marquee-track', {
      scrollTrigger: {
        trigger: '.marquee-strip',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1,
      },
      x: -100,
      ease: 'none',
    });

  } // end hasGSAP


  // =============================================
  // NAVBAR SCROLL STATE
  // =============================================
  const navbar = document.getElementById('navbar');

  if (hasGSAP) {
    ScrollTrigger.create({
      start: 80,
      onUpdate: (self) => {
        navbar.classList.toggle('scrolled', self.scroll() > 80);
      },
    });
  } else {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.pageYOffset > 80);
    }, { passive: true });
  }


  // =============================================
  // HAMBURGER MENU
  // =============================================
  const hamburger = document.getElementById('hamburger');
  const navMobile = document.getElementById('nav-mobile');

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    if (navMobile) navMobile.classList.toggle('open');
    document.body.classList.toggle('locked');
    if (lenis) {
      navMobile && navMobile.classList.contains('open') ? lenis.stop() : lenis.start();
    }
  });

  if (navMobile) {
    navMobile.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMobile.classList.remove('open');
        document.body.classList.remove('locked');
        if (lenis) lenis.start();
      });
    });
  }


  // =============================================
  // CUSTOM CURSOR (Desktop Only)
  // =============================================
  const cursor = document.getElementById('cursor');
  const cursorDot = document.getElementById('cursor-dot');

  if (window.innerWidth > 768 && cursor && cursorDot) {
    let mouseX = 0, mouseY = 0;
    let cursorX = 0, cursorY = 0;

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursorDot.style.left = mouseX + 'px';
      cursorDot.style.top = mouseY + 'px';
    });

    if (hasGSAP) {
      gsap.ticker.add(() => {
        cursorX += (mouseX - cursorX) * 0.15;
        cursorY += (mouseY - cursorY) * 0.15;
        cursor.style.left = cursorX + 'px';
        cursor.style.top = cursorY + 'px';
      });
    } else {
      function animateCursor() {
        cursorX += (mouseX - cursorX) * 0.12;
        cursorY += (mouseY - cursorY) * 0.12;
        cursor.style.left = cursorX + 'px';
        cursor.style.top = cursorY + 'px';
        requestAnimationFrame(animateCursor);
      }
      animateCursor();
    }

    const hoverElements = document.querySelectorAll('a, button, .product-card, .feature-card');
    hoverElements.forEach(el => {
      el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
    });
  } else {
    if (cursor) cursor.style.display = 'none';
    if (cursorDot) cursorDot.style.display = 'none';
  }


  // =============================================
  // BROCHURE MODAL
  // =============================================
  const modal = document.getElementById('brochure-modal');
  const brochureBtn = document.getElementById('brochureBtn');

  function openModal() {
    if (!modal) return;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('locked');
    if (lenis) lenis.stop();
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('locked');
    if (lenis) lenis.start();
  }

  if (brochureBtn) {
    brochureBtn.addEventListener('click', (e) => { e.preventDefault(); openModal(); });
  }

  document.querySelectorAll('[data-close-modal]').forEach(el => {
    el.addEventListener('click', closeModal);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.classList.contains('is-open')) closeModal();
  });


  // =============================================
  // ACTIVE NAV ON SCROLL
  // =============================================
  const sections = document.querySelectorAll('section[id]');
  const navItems = document.querySelectorAll('[data-nav]');

  window.addEventListener('scroll', () => {
    const scrollY = window.pageYOffset;
    sections.forEach(section => {
      const top = section.offsetTop - 120;
      const bottom = top + section.offsetHeight;
      const id = section.getAttribute('id');
      navItems.forEach(item => {
        if (item.getAttribute('href') === `#${id}`) {
          item.classList.toggle('active-link', scrollY >= top && scrollY < bottom);
        }
      });
    });
  }, { passive: true });


  // =============================================
  // COUNTER ANIMATION FOR STATS
  // =============================================
  const statNums = document.querySelectorAll('.stat-num');

  if (hasGSAP) {
    statNums.forEach(el => {
      const target = parseInt(el.textContent);
      const suffix = el.textContent.replace(/[0-9]/g, '');
      let obj = { val: 0 };
      ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        onEnter: () => {
          gsap.to(obj, {
            val: target,
            duration: 1.5,
            ease: 'power2.out',
            onUpdate: () => { el.textContent = Math.round(obj.val) + suffix; },
          });
        },
        once: true,
      });
    });
  } else {
    // Fallback: IntersectionObserver
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.textContent);
          const suffix = el.textContent.replace(/[0-9]/g, '');
          let count = 0;
          const increment = Math.ceil(target / 40);
          const timer = setInterval(() => {
            count += increment;
            if (count >= target) { count = target; clearInterval(timer); }
            el.textContent = count + suffix;
          }, 30);
          counterObserver.unobserve(el);
        }
      });
    }, { threshold: 0.5 });
    statNums.forEach(el => counterObserver.observe(el));
  }


  // =============================================
  // TILT EFFECT ON PRODUCT CARDS (Desktop)
  // =============================================
  if (window.innerWidth > 768) {
    const cards = document.querySelectorAll('.product-card');
    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        if (hasGSAP) {
          gsap.to(card, {
            rotateY: x * 6, rotateX: -y * 6, y: -4,
            duration: 0.4, ease: 'power2.out', transformPerspective: 800,
          });
        } else {
          card.style.transform = `perspective(800px) rotateY(${x * 4}deg) rotateX(${-y * 4}deg) translateY(-4px)`;
        }
      });
      card.addEventListener('mouseleave', () => {
        if (hasGSAP) {
          gsap.to(card, { rotateY: 0, rotateX: 0, y: 0, duration: 0.6, ease: 'power2.out' });
        } else {
          card.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg) translateY(0)';
        }
      });
    });
  }

  // =============================================
  // CUSTOMIZATION MODULE LOGIC (VISUAL ONLY)
  // =============================================
  const podPreview = document.getElementById('pod-preview');
  const colorLabelText = document.getElementById('color-label-text');
  
  const colorNames = {
    'CUSTOM': 'Signature Silver (Default)',
    'GOLD': 'Brushed Gold',
    'SILVER': 'Brushed Silver',
    'BLACK': 'Matte Black'
  };

  // Color Logic
  const colorBtns = document.querySelectorAll('.color-btn');
  if (colorBtns.length && podPreview) {
    colorBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        // Remove active from all
        colorBtns.forEach(b => b.classList.remove('active'));
        // Add active to clicked
        btn.classList.add('active');
        
        const colorName = btn.getAttribute('data-color');
        
        // Smooth transition: Slide out left and fade out
        podPreview.style.transform = 'scale(1.3) translateX(-60px)';
        podPreview.style.opacity = '0';
        
        setTimeout(() => {
          // Temporarily disable transition to snap image to the right side invisibly
          podPreview.style.transition = 'none';
          podPreview.style.transform = 'scale(1.3) translateX(60px)';
          
          // Update the image source
          podPreview.src = `images/${colorName}.png?v=3`;
          
          const slideIn = () => {
            // Force browser reflow to apply the 'jump to right' immediately
            void podPreview.offsetWidth;
            
            // Re-enable transition and slide it into the center while fading up
            podPreview.style.transition = 'transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.4s ease';
            podPreview.style.transform = 'scale(1.3) translateX(0)';
            podPreview.style.opacity = '1';
            
            // Avoid calling multiple times if onload and setTimeout both trigger
            podPreview.onload = null;
          };

          podPreview.onload = slideIn;
          
          // Fallback just in case image is already cached
          setTimeout(slideIn, 50);
          
        }, 300); // Wait for the slide-out CSS transition to finish before swapping

        // Update Label Text
        if (colorLabelText) {
          colorLabelText.textContent = colorNames[colorName] || colorNames['CUSTOM'];
        }
      });
    });
  }

});
