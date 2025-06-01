// ================= RESET ANIMATION TRACKING =================
function resetAnimationTracking() {
  if (isMobileDevice()) return;

  if (locoScroll && locoScroll.scroll && locoScroll.scroll.instance) {
    const scrollY = locoScroll.scroll.instance.scroll.y;
    if (scrollY < 50) {
      animatedElements.clear();
      console.log('🔄 Animation tracking reset');
    }
  }
}

// ================= GLOBAL VARIABLES =================
let locoScroll;
let isMenuOpen = false;
let animatedElements = new Set();
let mobileFooterAnimated = false;
let resizeTimeout;
let isFloatingButtonVisible = false; // Track button state to prevent constant animations

// ================= INITIALIZATION =================
document.addEventListener('DOMContentLoaded', init);
window.addEventListener('beforeunload', cleanup);

// ================= INIT FUNCTION =================
function init() {
  console.log('▶️ init()');

  // Remove no-js class if JavaScript is enabled
  document.documentElement.classList.remove('no-js');

  disablePinchZoom();
  setupMobileVideo();
  initGSAPAnimations();
  setupInitialStates();
  initLocomotiveScroll();
  initMagneticButtons();
  addEventListeners();

  // Force an initial "check visibility" for fade-ins (desktop + mobile)
  forceCheckVisible();
}

// ================= CLEANUP =================
function cleanup() {
  if (locoScroll) locoScroll.destroy();
  if (typeof ScrollTrigger !== 'undefined') {
    ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    ScrollTrigger.clearScrollMemory();
    ScrollTrigger.killAll();
  }
  console.log('🧹 Cleanup complete');
}

// ================= DISABLE PINCH-ZOOM =================
function disablePinchZoom() {
  document.addEventListener(
    'touchmove',
    function (e) {
      if (e.touches && e.touches.length > 1) e.preventDefault();
    },
    { passive: false }
  );
  document.addEventListener('gesturestart', function (e) {
    e.preventDefault();
  });
}

// ================= MOBILE VIDEO OPTIMIZATION =================
function setupMobileVideo() {
  const video = document.querySelector('.background-video');
  if (!video) return;

  video.addEventListener('canplaythrough', () => {
    if (locoScroll) {
      locoScroll.update();
      console.log('🎬 Locomotive Scroll updated after video canplaythrough');
    }
  });

  if (isMobileDevice()) {
    video.addEventListener('loadeddata', () => {
      video.play().catch((e) => console.log('Video autoplay prevented:', e));
    });
    console.log('📱 Mobile video optimization applied');
  }
}

// ================= GSAP + SCROLLTRIGGER SETUP =================
function initGSAPAnimations() {
  if (typeof gsap !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
    gsap.defaults({
      ease: 'power2.out',
      duration: 0.8,
    });
    console.log('🎬 GSAP initialized');
  }
}

// ================= SET INITIAL STATES =================
function setupInitialStates() {
  document.querySelectorAll('.fade-in').forEach((el) => {
    if (isMobileDevice() && el.getAttribute('data-mobile-animated') === 'true') {
      gsap.set(el, { opacity: 1, y: 0 });
      animatedElements.add(el);
      return;
    }

    // Check if this is the footer-contact container - set up buttons inside it
    if (el.classList.contains('footer-contact')) {
      console.log('Setting up footer-contact container with buttons:', el);
      // Set the container to be visible
      gsap.set(el, { opacity: 1 });
      // Set all buttons inside to scale 0.1
      const buttons = el.querySelectorAll('.btn, a');
      buttons.forEach(btn => {
        console.log('Setting up footer button:', btn);
        gsap.set(btn, { opacity: 0, scale: 0.1 });
      });
    } else {
      console.log('Setting up regular fade element:', el);
      gsap.set(el, { opacity: 0, y: 40 }); // More pronounced initial offset
    }
  });

  const floatingBtn = document.querySelector('.floating-menu-btn');
  if (floatingBtn) {
    // Move floating button to body to avoid Locomotive Scroll conflicts
    if (floatingBtn.parentElement !== document.body) {
      document.body.appendChild(floatingBtn);
      console.log('Moved floating button to body during setup');
    }

    gsap.set(floatingBtn, {
      opacity: 1,
      visibility: 'hidden',
      scale: 0.1,
    });
  }

  // Also move slide menu to body to avoid positioning issues
  const slideMenu = document.querySelector('.slide-menu');
  if (slideMenu && slideMenu.parentElement !== document.body) {
    document.body.appendChild(slideMenu);
    console.log('Moved slide menu to body during setup');
  }

  console.log('⚙️ Initial states set');
}

// ================= LOCOMOTIVE SCROLL SETUP =================
function initLocomotiveScroll() {
  locoScroll = new LocomotiveScroll({
    el: document.querySelector('[data-scroll-container]'),
    smooth: true,
    multiplier: 0.8,
    class: 'is-revealed',
    smartphone: {
      smooth: true,
      multiplier: 1.2, // Faster scroll on mobile
    },
    tablet: {
      smooth: true,
      multiplier: 0.7,
    },
    lerp: 0.1,
    reloadOnContextChange: true,
  });

  locoScroll.on('scroll', (args) => {
    const scrollY = args.scroll.y;

    if (isMobileDevice()) {
      if (!window.mobileScrollThrottle) {
        window.mobileScrollThrottle = true;
        setTimeout(() => {
          checkElementsInView();
          updateFloatingButton(scrollY);
          window.mobileScrollThrottle = false;
        }, 16); // 60fps for smoother animation
      }
    } else {
      checkElementsInView();
      updateFloatingButton(scrollY);
    }

    if (args.scroll.y < 50 && !isMobileDevice()) {
      document
        .querySelectorAll('.hero .fade-in')
        .forEach((el) => animatedElements.delete(el));
    }
  });

  if (typeof ScrollTrigger !== 'undefined' && locoScroll) {
    locoScroll.on('scroll', ScrollTrigger.update);
    ScrollTrigger.scrollerProxy('[data-scroll-container]', {
      scrollTop(value) {
        return arguments.length ? locoScroll.scrollTo(value, 0, 0) : locoScroll.scroll.instance.scroll.y;
      },
      getBoundingClientRect() {
        return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
      },
      pinType: document.querySelector('[data-scroll-container]').style.transform ? 'transform' : 'fixed'
    });
    ScrollTrigger.refresh();
  }

  console.log('🌀 Locomotive Scroll initialized');
}

// ================= FADE-IN ON SCROLL (GSAP) =================
function checkElementsInView() {
  const windowHeight = window.innerHeight;
  const isMobile = isMobileDevice();

  document.querySelectorAll('.fade-in').forEach((el) => {
    // Remove the mobile footer check - allow all elements to reset and re-animate

    // Get element position relative to viewport
    const rect = el.getBoundingClientRect();

    // Determine threshold based on element type and device
    let threshold = windowHeight * 0.85;
    if (
      isMobile &&
      (el.classList.contains('footer-title') || el.closest('.footer-contact'))
    ) {
      threshold = windowHeight * 0.75; // Earlier trigger on mobile
    }

    // Check if element is in view
    const isInView = rect.top < threshold && rect.bottom > 0;
    const isOutOfView = rect.bottom < 0 || rect.top > windowHeight;

    console.log(`Element: ${el.className}, Top: ${rect.top}, Bottom: ${rect.bottom}, Threshold: ${threshold}, In View: ${isInView}`);

    // Remove from animated set if element goes out of view (to allow re-animation)
    if (isOutOfView && animatedElements.has(el)) {
    animatedElements.delete(el);
    console.log(`Element ${el.className} removed from animated set - can animate again`);
    
    // Reset footer buttons to hidden state when they go out of view
    if (el.classList.contains('footer-contact')) {
    const buttons = el.querySelectorAll('.btn, a');
    buttons.forEach(btn => {
    gsap.set(btn, { opacity: 0, scale: 0.1 }); // Reset on both mobile and desktop
    });
    } else {
    // Reset regular elements to hidden state
    gsap.set(el, { opacity: 0, y: 40 });
    }
    }

    if (isInView && !animatedElements.has(el)) {
      animatedElements.add(el);

      // Check if this is the footer-contact div containing buttons - use special handling
      if (el.classList.contains('footer-contact')) {
        console.log('🔵 Animating footer-contact container and buttons with pop-in effect');

        // Kill any existing animations
        gsap.killTweensOf(el);

        // Find all buttons within this container
        const buttons = el.querySelectorAll('.btn, a');

        // On mobile, animate buttons with fade and scale effect
        if (isMobile) {
          // Set initial states for all buttons
          buttons.forEach(btn => {
            gsap.set(btn, { opacity: 0, scale: 0.1 });
          });
          
          // Convert to array and sort by vertical position (top to bottom for mobile stack)
          const sortedButtons = Array.from(buttons).sort((a, b) => {
            const rectA = a.getBoundingClientRect();
            const rectB = b.getBoundingClientRect();
            return rectA.top - rectB.top;
          });
          
          // Animate buttons with fade and scale
          gsap.to(sortedButtons, {
            opacity: 1,
            scale: 1,
            duration: 0.2,
            ease: 'power2.out',
            stagger: 0.08
          });
        } else {
          // Desktop animation
          // Set initial states for all buttons
          buttons.forEach(btn => {
            gsap.set(btn, { opacity: 0, scale: 0.1 });
          });

          // Convert to array and sort by horizontal position (left to right)
          const sortedButtons = Array.from(buttons).sort((a, b) => {
            const rectA = a.getBoundingClientRect();
            const rectB = b.getBoundingClientRect();
            return rectA.left - rectB.left;
          });

          // Animate buttons with stagger from left to right
          gsap.to(sortedButtons, {
            opacity: 1,
            scale: 1,
            duration: 0.25, // Slower desktop animation
            ease: 'power2.out',
            stagger: 0.08 // Slightly longer stagger
          });
        }

        // Make the container visible
        gsap.set(el, { opacity: 1 });

      } else {
        console.log('🔵 Animating regular element with slide-in effect:', el.className, el.tagName);

        // Kill any existing animations
        gsap.killTweensOf(el);

        // Regular fade-in animation for other elements
        gsap.fromTo(
          el,
          { opacity: 0, y: 40 }, // More pronounced slide distance
          {
            opacity: 1,
            y: 0,
            duration: 0.35, // Faster text animations
            ease: 'power2.out',
            onStart: () => {
              // Ensure the parent h1 or h2 is visible
              if (el.parentElement && (el.parentElement.tagName === 'H1' || el.parentElement.tagName === 'H2')) {
                el.parentElement.classList.add('animate-in');
              }
            },
            onComplete: () => {
              // Remove mobile footer animation lock behavior
            },
          }
        );
      }
    }
  });

  // Handle portfolio peek rotation
  const portfolioPeek = document.querySelector('.portfolio-peek');
  if (portfolioPeek) {
    const container = document.querySelector('.portfolio-peek-wrapper');

    if (container) {
      const containerRect = container.getBoundingClientRect();
      const containerHeight = container.offsetHeight;

      // Calculate scroll progress based on container position
      const scrollProgress = Math.max(
        0,
        Math.min(
          1,
          (windowHeight - containerRect.top) / (windowHeight + containerHeight)
        )
      );

      // Smoother rotation calculation
      const rotationMultiplier = isMobileDevice() ? 0.8 : 1.5; // Even slower on mobile
      const rotation = scrollProgress * 360 * rotationMultiplier;

      // Use requestAnimationFrame for ultra-smooth animation on mobile
      if (isMobileDevice()) {
        requestAnimationFrame(() => {
          portfolioPeek.style.transform = `translateY(6%) rotate(${rotation}deg)`;
        });
      } else {
        // Use GSAP for desktop
        gsap.set(portfolioPeek, {
          rotation: rotation,
          y: '6%',
          force3D: true,
          transformOrigin: 'center center'
        });
      }
    }
  }
}

// ================= FLOATING BUTTON SHOW/HIDE =================
function updateFloatingButton(scrollY) {
  const floatingBtn = document.querySelector('.floating-menu-btn');
  const header = document.querySelector('.site-header');
  if (!floatingBtn || !header) {
    console.log('⚠️ Missing floating button or header');
    return;
  }

  // Ensure button is always in body (move it once if needed)
  if (floatingBtn.parentElement !== document.body) {
    document.body.appendChild(floatingBtn);
    console.log('Moved floating button to body');
  }

  if (isMenuOpen) {
    if (isFloatingButtonVisible) {
      isFloatingButtonVisible = false;
      gsap.to(floatingBtn, {
        scale: 0.1,
        duration: 0.15, // Faster out
        ease: 'power2.in',
        onComplete: () => {
          floatingBtn.style.visibility = 'hidden';
        }
      });
    }
    return;
  }

  const headerRect = header.getBoundingClientRect();
  // More precise threshold - button should show when header is completely out of view
  const shouldShow = headerRect.bottom <= -10; // Add 10px buffer to prevent flickering

  console.log(`📍 Header bottom: ${headerRect.bottom}, Should show: ${shouldShow}, Currently visible: ${isFloatingButtonVisible}`);

  // Only animate if state actually changes
  if (shouldShow && !isFloatingButtonVisible) {
    console.log('🔵 Showing floating button');
    isFloatingButtonVisible = true;

    // Force the button positioning and display with proper styling
    floatingBtn.style.position = 'fixed';
    floatingBtn.style.top = '2rem';
    floatingBtn.style.right = '2rem';
    floatingBtn.style.zIndex = '1002';
    floatingBtn.style.display = 'flex';
    floatingBtn.style.visibility = 'visible';
    floatingBtn.style.pointerEvents = 'auto';
    floatingBtn.style.width = '60px';
    floatingBtn.style.height = '60px';
    floatingBtn.style.background = 'var(--bg)';
    floatingBtn.style.border = '1px solid #ffffff';
    floatingBtn.style.borderRadius = '50%';
    floatingBtn.style.transform = 'none';

    // Kill any existing animations and start fresh
    gsap.killTweensOf(floatingBtn);

    // Quick scale-up animation
    gsap.set(floatingBtn, {
      opacity: 1,
      scale: 0.1
    });

    gsap.to(floatingBtn, {
      scale: 1,
      duration: 0.25, // Faster
      ease: 'power2.out'
    });
  } else if (!shouldShow && isFloatingButtonVisible) {
    console.log('🔴 Hiding floating button');
    isFloatingButtonVisible = false;
    gsap.to(floatingBtn, {
      scale: 0.1,
      duration: 0.15, // Faster out
      ease: 'power2.in',
      onComplete: () => {
        floatingBtn.style.visibility = 'hidden';
      }
    });
  }
}

// ================= MAGNETIC BUTTON EFFECTS =================
function initMagneticButtons() {
  // Apply to footer buttons and nav menu items
  const magneticElements = document.querySelectorAll('.magnetic-btn, .nav-item a, .slide-nav-item a, .close-btn');

  magneticElements.forEach((btn) => {
    // Disable CSS transitions that conflict with GSAP
    btn.style.transition = 'none';
    btn.style.willChange = 'auto';

    btn.addEventListener('mouseenter', () => {
      gsap.to(btn, {
        scale: 1.1, // Subtle scale increase
        duration: 0.3,
        ease: 'power2.out',
        force3D: false
      });
      btn.classList.add('is-magnetic');
    });

    btn.addEventListener('mousemove', (e) => {
      if (!btn.classList.contains('is-magnetic')) return;
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      gsap.to(btn, {
        x: x * 0.3, // Subtle movement
        y: y * 0.3, // Subtle movement
        duration: 0.3,
        ease: 'power2.out',
        force3D: false
      });
    });

    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, {
        x: 0,
        y: 0,
        scale: 1,
        duration: 0.5,
        ease: 'elastic.out(1, 0.3)',
        force3D: false
      });
      btn.classList.remove('is-magnetic');
    });
  });

  console.log(`✨ Magnetic effects applied`);
}

// ================= SLIDE-IN MENU FUNCTIONS =================
function openSlideMenu() {
  const slideMenu = document.querySelector('.slide-menu');
  const floatingBtn = document.querySelector('.floating-menu-btn');
  if (!slideMenu) return;

  // Move slide menu to body if it's not already there
  if (slideMenu.parentElement !== document.body) {
    document.body.appendChild(slideMenu);
    console.log('Moved slide menu to body');
  }

  isMenuOpen = true;
  document.body.style.overflow = 'hidden';

  gsap.to(slideMenu, {
    x: 0,
    duration: 0.4,
    ease: 'power2.out',
  });

  if (floatingBtn) {
    // Properly hide the floating button and update state
    if (isFloatingButtonVisible) {
      isFloatingButtonVisible = false;
    }
    floatingBtn.style.visibility = 'hidden';
    gsap.set(floatingBtn, { opacity: 0, scale: 0.1 });
  }

  const menuItems = slideMenu.querySelectorAll('.slide-nav-item');
  gsap.fromTo(
    menuItems,
    { x: 50, opacity: 0 },
    {
      x: 0,
      opacity: 1,
      duration: 0.3,
      stagger: 0.1,
      delay: 0.2,
      ease: 'power2.out',
    }
  );
}

function closeSlideMenu() {
  const slideMenu = document.querySelector('.slide-menu');
  const floatingBtn = document.querySelector('.floating-menu-btn');
  if (!slideMenu) return;

  isMenuOpen = false;
  document.body.style.overflow = '';

  gsap.to(slideMenu, {
    x: '100%',
    duration: 0.4,
    ease: 'power2.in',
    onComplete: () => {
      if (locoScroll) {
        locoScroll.update();
        // Force a scroll update to check floating button state
        const currentScroll = locoScroll.scroll.instance.scroll.y;
        updateFloatingButton(currentScroll);
      }
    },
  });
}

function toggleMobileMenu() {
  if (window.innerWidth <= 768) openSlideMenu();
}

// ================= EVENT LISTENERS =================
function addEventListeners() {
  const navToggle = document.querySelector('.nav-toggle');
  if (navToggle) {
    navToggle.addEventListener('click', toggleMobileMenu);
  }

  const floatingBtn = document.querySelector('.floating-menu-btn');
  if (floatingBtn) {
    floatingBtn.addEventListener('click', openSlideMenu);
  }

  const closeBtn = document.querySelector('.close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeSlideMenu);
  }

  const handleResize = () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (locoScroll) {
        locoScroll.update();
        console.log('🔄 Locomotive Scroll updated on resize');
        if (!isMobileDevice()) checkElementsInView();
      }
      if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.refresh(true);
      }
    }, 250);
  };
  window.addEventListener('resize', handleResize);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isMenuOpen) closeSlideMenu();
  });

  console.log('📌 Event listeners attached');
}

// ================= FORCE VISIBILITY CHECKS =================
function forceCheckVisible() {
  // Immediate check
  setTimeout(() => {
    checkElementsInView();
    if (locoScroll) locoScroll.update();
    console.log('🔄 Forced check #1');
  }, 100);

  // Secondary check after layout settles
  setTimeout(() => {
    checkElementsInView();
    if (locoScroll) locoScroll.update();
    console.log('🔄 Forced check #2');
  }, 500);

  // Force specific elements that should be visible on load
  setTimeout(() => {
    // Force all elements that are currently in view to animate
    document.querySelectorAll('.fade-in').forEach((el) => {
      if (animatedElements.has(el)) return;

      const rect = el.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Check if element is currently visible in viewport
      if (rect.top < windowHeight * 0.85 && rect.bottom > 0) {
        console.log(`Force animating: ${el.className || el.tagName}`);
        animatedElements.add(el);

        gsap.fromTo(
          el,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power2.out',
            onStart: () => {
              if (el.parentElement && (el.parentElement.tagName === 'H1' || el.parentElement.tagName === 'H2')) {
                el.parentElement.classList.add('animate-in');
              }
            },
          }
        );
      }
    });

    if (locoScroll) locoScroll.update();
    console.log('🔄 Forced check #3 - Force animate visible elements');
  }, 1000);

  // Final update
  setTimeout(() => {
    if (locoScroll) locoScroll.update();
    console.log('🔄 Final Locomotive Scroll update');
  }, 2000);
}

// ================= HELPER: IS MOBILE =================
function isMobileDevice() {
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) || window.innerWidth <= 768
  );
}