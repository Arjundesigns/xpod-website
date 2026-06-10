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
  // HERO — Cinematic Entry Animations (called after loader)
  // =============================================
  function initHeroEntryAnimations() {
    if (!hasGSAP) return;
    const bgEl      = document.querySelector('.hero-bg-img');
    const podEl     = document.querySelector('.hero-pod-img');
    const titleEl   = document.querySelector('.hero-title');
    const actionsEl = document.querySelector('.hero-actions');
    const descEl    = document.querySelector('.hero-desc');
    const scrollEl  = document.getElementById('hero-scroll-indicator');

    // Cinematic zoom out + blur fade for background and pod
    if (bgEl) {
      gsap.fromTo(bgEl, 
        { scale: 1.08, filter: 'blur(8px)' }, 
        { scale: 1.0, filter: 'blur(0px)', duration: 1.5, ease: 'power2.out' }
      );
    }
    if (podEl) {
      gsap.fromTo(podEl, 
        { scale: 1.08, filter: 'blur(8px)' }, 
        { scale: 1.0, filter: 'blur(0px)', duration: 1.5, ease: 'power2.out' }
      );
    }

    // Elegant fade-in of text content layers
    if (titleEl) {
      gsap.fromTo(titleEl, 
        { opacity: 0, y: 25 }, 
        { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out', delay: 0.2 }
      );
    }
    if (actionsEl) {
      gsap.fromTo(actionsEl, 
        { opacity: 0, y: 15 }, 
        { opacity: 1, y: 0, duration: 1.0, ease: 'power3.out', delay: 0.5 }
      );
    }
    if (descEl) {
      gsap.fromTo(descEl, 
        { opacity: 0, y: 10 }, 
        { opacity: 1, y: 0, duration: 1.0, ease: 'power3.out', delay: 0.7 }
      );
    }
    if (scrollEl) {
      gsap.fromTo(scrollEl, 
        { opacity: 0, y: 10 }, 
        { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', delay: 1.1 }
      );
    }
  }


  // =============================================
  // PAGE LOADER & ENTRY TRIGGER
  // =============================================
  const loader = document.getElementById('loader');
  document.body.classList.add('locked');

  window.addEventListener('load', () => {
    if (lenis) lenis.stop();
    setTimeout(() => {
      loader.classList.add('hidden');
      document.body.classList.remove('locked');
      if (lenis) lenis.start();
      if (hasGSAP) {
        initEntryAnimations();
        initHeroEntryAnimations();
      }
    }, 1400);
  });

  setTimeout(() => {
    if (loader && !loader.classList.contains('hidden')) {
      loader.classList.add('hidden');
      document.body.classList.remove('locked');
      if (lenis) lenis.start();
    }
  }, 3500);


  // =============================================
  // GSAP — Global Navigation Entry Animation
  // =============================================
  function initEntryAnimations() {
    if (!hasGSAP) return;
    gsap.from('.nav-container', { y: -40, opacity: 0, duration: 1.2, ease: 'power3.out' });
  }


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
