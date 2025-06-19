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
// Fix timing issue: call init immediately if DOM already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  // DOM already loaded, call init immediately
  init();
}
window.addEventListener('beforeunload', cleanup);

// ================= INIT FUNCTION =================
function init() {
  console.log('▶️ init()');

  // Remove no-js class if JavaScript is enabled
  document.documentElement.classList.remove('no-js');

  // Handle page loader fade-out
  handlePageLoader();

  disablePinchZoom();
  setupMobileVideo();
  initGSAPAnimations();
  setupInitialStates();
  initLocomotiveScroll();
  initMagneticNavDot();
  initSlideMagneticNavDot();
  addNavMagneticEffects();
  initMagneticButtons();
  initPortfolioFilter();
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

// ================= PAGE LOADER FADE-OUT =================
function handlePageLoader() {
  const pageLoader = document.querySelector('.page-loader');
  const video = document.querySelector('.background-video');
  
  if (!pageLoader) return;
  
  // If there's a video, wait for it to be ready
  if (video) {
    const fadeOutLoader = () => {
      setTimeout(() => {
        pageLoader.classList.add('fade-out');
        setTimeout(() => {
          pageLoader.remove();
        }, 1500); // Remove after transition completes
      }, 500); // Small delay to ensure smooth transition
    };
    
    // Wait for video to be ready to play
    if (video.readyState >= 3) {
      // Video already loaded
      fadeOutLoader();
    } else {
      video.addEventListener('canplaythrough', fadeOutLoader, { once: true });
      video.addEventListener('loadeddata', fadeOutLoader, { once: true });
      // Fallback timeout in case video doesn't load
      setTimeout(fadeOutLoader, 2000);
    }
  } else {
    // No video, fade out immediately
    setTimeout(() => {
      pageLoader.classList.add('fade-out');
      setTimeout(() => {
        pageLoader.remove();
      }, 1500);
    }, 300);
  }
  
  console.log('🎨 Page loader setup complete');
}

// ================= DISABLE PINCH-ZOOM =================
function disablePinchZoom() {
  // Only prevent multi-touch pinch, allow single-touch scroll
  document.addEventListener(
    'touchmove',
    function (e) {
      // Only prevent if it's a pinch gesture (2+ fingers)
      if (e.touches && e.touches.length > 1) {
        e.preventDefault();
      }
      // Allow single-touch scrolling by not preventing single touches
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
      
      // Only hide buttons for animation on desktop and wide viewports
      if (!isMobileDevice() && window.innerWidth > 768) {
        // Set all buttons inside to scale 0.1
        const buttons = el.querySelectorAll('.btn, a');
        buttons.forEach(btn => {
          console.log('Setting up footer button:', btn);
          gsap.set(btn, { opacity: 0, scale: 0.1 });
        });
      }
    } else if (el.classList.contains('footer-title')) {
      // Special handling for footer title - don't hide on narrow viewports
      if (isMobileDevice() || window.innerWidth <= 768) {
        console.log('Setting up footer title for mobile/narrow viewport - keeping visible:', el);
        gsap.set(el, { opacity: 1, y: 0 });
      } else if (el.classList.contains('resume-section')) {
        console.log('🔵 Animating resume section with button scale-in effect');

        // Kill any existing animations
        gsap.killTweensOf(el);

        const resumeButton = el.querySelector('.resume-download-btn');
        if (resumeButton) {
          // Set initial state for button - start scaled down like dropdown
          gsap.set(resumeButton, { opacity: 0, scale: 0.1 });
          
          // Animate button scale-in like the dropdown
          gsap.to(resumeButton, {
            opacity: 1,
            scale: 1,
            duration: 0.4,
            ease: 'back.out(1.7)', // Same bouncy effect as dropdown
            delay: 0.1, // Small delay like dropdown
          });
        }
        
        // Animate the text content normally
        const textContent = el.querySelector('p');
        if (textContent) {
          gsap.fromTo(
            textContent,
            { opacity: 0, y: 20 },
            {
              opacity: 1,
              y: 0,
              duration: 0.4,
              ease: 'power2.out',
            }
          );
        }
        
        // Make sure container is visible
        gsap.set(el, { opacity: 1 });

      } else {
        console.log('Setting up footer title for desktop - hiding for animation:', el);
        gsap.set(el, { opacity: 0, y: 40 });
      }
    } else if (el.classList.contains('sort-container')) {
    // Special handling for sort container - hide dropdown for pop-in effect
    console.log('Setting up sort container for pop-in animation:', el);
    gsap.set(el, { opacity: 1 });
    
    const dropdown = el.querySelector('.sort-dropdown');
    if (dropdown) {
    gsap.set(dropdown, { opacity: 0, scale: 0.1 });
    console.log('Dropdown set to scale 0.1 for pop-in effect');
    }
    } else if (el.classList.contains('resume-section')) {
        // Special handling for resume section - hide button for scale-in effect
        console.log('Setting up resume section for scale-in animation:', el);
        gsap.set(el, { opacity: 1 });
        
        const resumeButton = el.querySelector('.resume-download-btn');
        if (resumeButton) {
          gsap.set(resumeButton, { opacity: 0, scale: 0.1 });
          console.log('Resume button set to scale 0.1 for scale-in effect');
        }
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

  // Set scroll indicator to be immediately visible and stable
  const scrollIndicator = document.querySelector('.scroll-indicator');
  if (scrollIndicator) {
    gsap.set(scrollIndicator, {
      opacity: 1,
      y: 0,
      scale: 1,
      clearProps: 'transform'
    });
    // Ensure it's never processed by the fade-in system
    scrollIndicator.style.opacity = '1';
    scrollIndicator.style.transform = 'translateX(-50%)';
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
  const isMobile = isMobileDevice();
  console.log('🔍 Mobile detection:', isMobile, '| UserAgent:', navigator.userAgent, '| Platform:', navigator.platform, '| Touch points:', navigator.maxTouchPoints, '| Window width:', window.innerWidth);
  
  locoScroll = new LocomotiveScroll({
    el: document.querySelector('[data-scroll-container]'),
    smooth: !isMobile,  // Disable smooth scrolling on mobile
    multiplier: isMobile ? 1.0 : 0.8,  // Native speed on mobile
    class: 'is-revealed',
    smartphone: {
      smooth: false,  // Force native scrolling
      multiplier: 1.0,
    },
    tablet: {
      smooth: false,  // Force native scrolling  
      multiplier: 1.0,
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
          updateScrollIndicator(scrollY);
          window.mobileScrollThrottle = false;
        }, 16);
      }
    } else {
      checkElementsInView();
      updateFloatingButton(scrollY);
      updateScrollIndicator(scrollY);
    }

    if (args.scroll.y < 50 && !isMobileDevice()) {
      document
        .querySelectorAll('.hero .fade-in')
        .forEach((el) => animatedElements.delete(el));
    }
  });
  
  // Add native scroll listener for mobile when smooth scrolling is disabled
  if (isMobile) {
    // Add CSS to override any locomotive scroll styles
    const mobileCSS = `
      @media (hover: none) and (pointer: coarse) {
        [data-scroll-container] {
          overflow: visible !important;
          height: auto !important;
          position: static !important;
          transform: none !important;
          will-change: auto !important;
        }
        
        body, html {
          overflow: auto !important;
          height: auto !important;
          position: static !important;
        }
        
        .has-scroll-smooth,
        .has-scroll-init {
          overflow: visible !important;
        }
      }
    `;
    
    const styleElement = document.createElement('style');
    styleElement.textContent = mobileCSS;
    document.head.appendChild(styleElement);
    console.log('📱 Mobile: Added CSS overrides');
    
    // Aggressively reset all styles that could block scrolling
    const resetMobileScrolling = () => {
      const scrollContainer = document.querySelector('[data-scroll-container]');
      if (scrollContainer) {
        scrollContainer.style.overflow = 'visible !important';
        scrollContainer.style.height = 'auto !important';
        scrollContainer.style.position = 'static !important';
        scrollContainer.style.transform = 'none !important';
        scrollContainer.style.willChange = 'auto !important';
        scrollContainer.style.backfaceVisibility = 'visible !important';
        console.log('📱 Mobile: Aggressively reset scroll container');
      }
      
      // Reset body and html
      document.body.style.overflow = 'auto !important';
      document.body.style.height = 'auto !important';
      document.body.style.position = 'static !important';
      document.documentElement.style.overflow = 'auto !important';
      document.documentElement.style.height = 'auto !important';
      
      // Remove any locomotive scroll classes that might interfere
      document.body.classList.remove('has-scroll-smooth', 'has-scroll-init');
      
      console.log('📱 Mobile: Aggressively reset body/html styles');
    };
    
    // Reset immediately and after a delay
    resetMobileScrolling();
    setTimeout(resetMobileScrolling, 100);
    setTimeout(resetMobileScrolling, 500);
    
    // Create enhanced scroll handler
    let scrollTimeout;
    const handleNativeScroll = () => {
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;
      console.log('📱 Native scroll detected:', scrollY);
      
      // Clear existing timeout
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      
      // Immediate call for responsiveness
      try {
        checkElementsInView();
        updateFloatingButton(scrollY);
        updateScrollIndicator(scrollY);
      } catch (e) {
        console.error('🚨 Mobile scroll handler error:', e);
      }
      
      // Also call after scroll settles
      scrollTimeout = setTimeout(() => {
        try {
          checkElementsInView();
          updateFloatingButton(scrollY);
          updateScrollIndicator(scrollY);
          console.log('📱 Native scroll settled:', scrollY);
        } catch (e) {
          console.error('🚨 Mobile scroll settled error:', e);
        }
      }, 100);
    };
    
    // Add multiple scroll listeners for maximum compatibility
    window.addEventListener('scroll', handleNativeScroll, { passive: true });
    document.addEventListener('scroll', handleNativeScroll, { passive: true });
    
    // Touch events for iOS
    window.addEventListener('touchstart', () => {
      setTimeout(handleNativeScroll, 10);
    }, { passive: true });
    
    window.addEventListener('touchmove', () => {
      setTimeout(handleNativeScroll, 10);
    }, { passive: true });
    
    window.addEventListener('touchend', () => {
      setTimeout(handleNativeScroll, 50);
      setTimeout(handleNativeScroll, 200);
    }, { passive: true });
    
    console.log('📱 Mobile: Enhanced native scroll listeners added');
    
    // Force initial animation checks
    setTimeout(() => {
      console.log('📱 Mobile: Forcing initial animation check (500ms)');
      checkElementsInView();
    }, 500);
    
    setTimeout(() => {
      console.log('📱 Mobile: Forcing second animation check (1000ms)');
      checkElementsInView();
    }, 1000);
  }

  if (typeof ScrollTrigger !== 'undefined' && locoScroll && !isMobile) {
    // Only setup ScrollTrigger on desktop where smooth scrolling is enabled
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

  console.log('🌀 Locomotive Scroll initialized - Smooth scrolling:', !isMobile ? 'ENABLED (Desktop)' : 'DISABLED (Mobile - using native)');
}

// ================= FADE-IN ON SCROLL (GSAP) =================
function checkElementsInView() {
  // DEBUGGING: Prevent recursive calls
  if (window.checkingElements) {
    console.warn('🚫 checkElementsInView() called recursively - preventing stack overflow');
    return;
  }
  window.checkingElements = true;
  
  const windowHeight = window.innerHeight;
  const isMobile = isMobileDevice();

  document.querySelectorAll('.fade-in').forEach((el) => {
    // Don't reset footer elements on mobile/narrow viewports once they've been animated
    if (
      (isMobile || window.innerWidth <= 768) &&
      mobileFooterAnimated &&
      (el.classList.contains('footer-title') || el.closest('.footer'))
    ) {
      return;
    }

    // Get element position relative to viewport
    const rect = el.getBoundingClientRect();

    // Determine threshold based on element type and device
    let threshold = windowHeight * 0.85;
    
    // Use earlier trigger for footer elements on both mobile AND narrow viewports
    if (
      (isMobile || window.innerWidth <= 768) &&
      (el.classList.contains('footer-title') || el.closest('.footer-contact'))
    ) {
      threshold = windowHeight * 0.7; // Earlier trigger on mobile phones and narrow viewports
    }
    
    // Even more aggressive trigger for footer-title specifically on narrow viewports
    if (
      el.classList.contains('footer-title') && 
      window.innerWidth <= 768
    ) {
      threshold = windowHeight * 0.6; // Very early trigger for headline on narrow viewports
    }
    
    // Special handling for footer-contact on mobile AND narrow viewports - trigger immediately if footer is visible
    if ((isMobile || window.innerWidth <= 768) && el.classList.contains('footer-contact')) {
      const footer = el.closest('.footer');
      if (footer) {
        const footerRect = footer.getBoundingClientRect();
        // If any part of footer is visible, trigger the animation
        if (footerRect.top < windowHeight) {
          threshold = windowHeight + 100; // Always trigger
        }
      }
    }

    // Check if element is in view
    const isInView = rect.top < threshold && rect.bottom > 0;
    const isOutOfView = rect.bottom < 0 || rect.top > windowHeight;

    // Remove from animated set if element goes out of view (to allow re-animation) - but not on mobile for footer
    if (isOutOfView && animatedElements.has(el)) {
      if (!(isMobile && (el.classList.contains('footer-title') || el.closest('.footer')))) {
        animatedElements.delete(el);

        // Reset footer buttons to hidden state when they go out of view
        if (el.classList.contains('footer-contact')) {
          const buttons = el.querySelectorAll('.btn, a');
          buttons.forEach(btn => {
            gsap.set(btn, { opacity: 0, scale: 0.1 });
          });
        } else {
          // Reset regular elements to hidden state
          gsap.set(el, { opacity: 0, y: 40 });
        }
      }
    }

    if (isInView && !animatedElements.has(el)) {
      animatedElements.add(el);

      if (
        (isMobile || window.innerWidth <= 768) &&
        (el.classList.contains('footer-title') || el.closest('.footer'))
      ) {
        mobileFooterAnimated = true;
        console.log('📱 Mobile/narrow viewport footer animation locked in');
      }

      // Check if this is the footer-contact div containing buttons - use special handling
      if (el.classList.contains('footer-contact')) {
        console.log('🔵 Animating footer-contact container and buttons with pop-in effect');

        // Kill any existing animations
        gsap.killTweensOf(el);

        // Find all buttons within this container
        const buttons = el.querySelectorAll('.btn, a');

        // Check if we're on mobile/narrow viewport OR actually mobile
        const isMobileViewport = isMobile || window.innerWidth <= 768;
        
        if (isMobileViewport) {
          // Mobile animation - always animate buttons regardless of previous state
          console.log('📱 Mobile footer button animation');
          
          // Force buttons to start state for animation
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
            duration: 0.4, // Slightly longer for mobile
            ease: 'back.out(1.7)',
            stagger: 0.1 // More noticeable stagger for mobile
          });
        } else {
          // Desktop animation (original logic)
          console.log('🖥️ Desktop footer button animation');
          
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
            duration: 0.25,
            ease: 'power2.out',
            stagger: 0.08
          });
        }

        // Make the container visible
        gsap.set(el, { opacity: 1 });

      } else if (el.classList.contains('sort-container')) {
        console.log('🔵 Animating sort container with dropdown pop-in effect');

        // Kill any existing animations
        gsap.killTweensOf(el);

        const dropdown = el.querySelector('.sort-dropdown');
        if (dropdown) {
          // Set initial state
          gsap.set(dropdown, { opacity: 0, scale: 0.1 });
          
          // Animate dropdown pop-in
          gsap.to(dropdown, {
            opacity: 1,
            scale: 1,
            duration: 0.4,
            ease: 'back.out(1.7)', // Bouncy effect like footer buttons
            delay: 0.1, // Small delay for dramatic effect
            onComplete: () => {
              // After dropdown finishes, animate in thumbnails
              console.log('🖼️ Starting thumbnail animations after dropdown');
              animatePortfolioThumbnails();
            }
          });
        }
        
        // Make sure container is visible
        gsap.set(el, { opacity: 1 });

      } else if (el.classList.contains('resume-section')) {
        console.log('🔵 Animating resume section with button scale-in effect');

        // Kill any existing animations
        gsap.killTweensOf(el);

        const resumeButton = el.querySelector('.resume-download-btn');
        if (resumeButton) {
          // Set initial state for button - start scaled down like dropdown
          gsap.set(resumeButton, { opacity: 0, scale: 0.1 });
          
          // Animate button scale-in like the dropdown
          gsap.to(resumeButton, {
            opacity: 1,
            scale: 1,
            duration: 0.4,
            ease: 'back.out(1.7)', // Same bouncy effect as dropdown
            delay: 0.1, // Small delay like dropdown
          });
        }
        
        // Animate the text content normally
        const textContent = el.querySelector('p');
        if (textContent) {
          gsap.fromTo(
            textContent,
            { opacity: 0, y: 20 },
            {
              opacity: 1,
              y: 0,
              duration: 0.4,
              ease: 'power2.out',
            }
          );
        }
        
        // Make sure container is visible
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
              if (
                isMobile &&
                (el.classList.contains('footer-title') || el.closest('.footer'))
              ) {
                gsap.set(el, { opacity: 1, y: 0, clearProps: 'transform' });
                el.style.opacity = '1';
                el.style.transform = 'none';
              }
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
  
  // DEBUGGING: Reset the flag
  window.checkingElements = false;
}

// ================= SCROLL INDICATOR FADE =================
function updateScrollIndicator(scrollY) {
  const scrollIndicator = document.querySelector('.scroll-indicator');
  if (!scrollIndicator) return;
  
  // Use a quicker fade that starts sooner
  const fadeStartPoint = 50;  // Start fading after just 50px (was 200px)
  const fadeEndPoint = 300;   // Completely hidden after 300px (was 600px)
  
  let opacity;
  if (scrollY <= fadeStartPoint) {
    // Fully visible at the top
    opacity = 1;
  } else if (scrollY >= fadeEndPoint) {
    // Completely hidden after fade end point
    opacity = 0;
  } else {
    // Gradual fade between start and end points
    const fadeRange = fadeEndPoint - fadeStartPoint;
    const scrollRange = scrollY - fadeStartPoint;
    opacity = 1 - (scrollRange / fadeRange);
  }
  
  // Apply the opacity with smooth transitions
  scrollIndicator.style.opacity = opacity;
  
  // Add or remove the fade-out class for additional CSS control
  if (opacity <= 0.1) {
    scrollIndicator.classList.add('fade-out');
  } else {
    scrollIndicator.classList.remove('fade-out');
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

// ================= MAGNETIC NAV DOT =================
function initMagneticNavDot() {
  const magneticDot = document.querySelector('.nav-magnetic-dot');
  const navList = document.querySelector('.nav-list');
  const navItems = document.querySelectorAll('.nav-item');
  const activeItem = document.querySelector('.nav-item.active');
  
  if (!magneticDot || !navList || navItems.length === 0) return;
  
  // Position dot on active item initially
  if (activeItem) {
    positionDotOnItem(magneticDot, activeItem);
    magneticDot.classList.add('show');
  }
  
  // Add hover listeners to nav items
  navItems.forEach((item, index) => {
    const link = item.querySelector('a');
    if (!link) return;
    
    item.addEventListener('mouseenter', () => {
      // Purple dot movement
      magneticDot.classList.add('show');
      gsap.to(magneticDot, {
        x: getItemCenterX(item),
        duration: 0.3,
        ease: 'power2.inOut'
      });
    });
  });
  
  // Return to active item when leaving nav
  navList.addEventListener('mouseleave', () => {
    if (activeItem) {
      gsap.to(magneticDot, {
        x: getItemCenterX(activeItem),
        duration: 0.35,
        ease: 'power2.inOut'
      });
    } else {
      magneticDot.classList.remove('show');
    }
  });
}

// ================= SLIDE MENU MAGNETIC DOT =================
function initSlideMagneticNavDot() {
  const slideMagneticDot = document.querySelector('.slide-nav-magnetic-dot');
  const slideNavList = document.querySelector('.slide-nav-list');
  const slideNavItems = document.querySelectorAll('.slide-nav-item');
  const slideActiveItem = document.querySelector('.slide-nav-item.active');
  
  console.log('Slide nav debug:', {
    dot: !!slideMagneticDot,
    list: !!slideNavList,
    itemsCount: slideNavItems.length,
    activeItem: slideActiveItem?.querySelector('a')?.textContent
  });
  
  if (!slideMagneticDot || !slideNavList || slideNavItems.length === 0) return;
  
  // Position dot on active item initially
  if (slideActiveItem) {
    console.log('Positioning dot on active item:', slideActiveItem.querySelector('a')?.textContent);
    positionSlideNavDotOnItem(slideMagneticDot, slideActiveItem);
    slideMagneticDot.classList.add('show');
  }
  
  // Add hover listeners to slide nav items
  slideNavItems.forEach((item, index) => {
    const link = item.querySelector('a');
    if (!link) return;
    
    console.log(`Setting up slide nav item ${index}: ${link.textContent}`);
    
    item.addEventListener('mouseenter', () => {
      console.log(`Hovering over: ${link.textContent}`);
      // Purple dot movement
      slideMagneticDot.classList.add('show');
      gsap.to(slideMagneticDot, {
        y: getSlideItemCenterY(item),
        duration: 0.3,
        ease: 'power2.inOut'
      });
    });
  });
  
  // Return to active item when leaving slide nav
  slideNavList.addEventListener('mouseleave', () => {
    if (slideActiveItem) {
      console.log('Mouse left slide nav, returning to active item');
      gsap.to(slideMagneticDot, {
        y: getSlideItemCenterY(slideActiveItem),
        duration: 0.35,
        ease: 'power2.inOut'
      });
    } else {
      slideMagneticDot.classList.remove('show');
    }
  });
}

function positionSlideNavDotOnItem(dot, item) {
  const y = getSlideItemCenterY(item);
  gsap.set(dot, { y: y });
}

function getSlideItemCenterY(item) {
  const slideNavList = document.querySelector('.slide-nav-list');
  
  // Use offsetTop for more reliable positioning
  const itemOffsetTop = item.offsetTop;
  const itemHeight = item.offsetHeight;
  const centerY = itemOffsetTop + (itemHeight / 2) - 5; // -5 to center the 10px dot
  
  console.log(`Slide Item: ${item.querySelector('a')?.textContent}, OffsetTop: ${itemOffsetTop}, Height: ${itemHeight}, CenterY: ${centerY}`);
  return centerY;
}

// Add magnetic effects to nav links
function addNavMagneticEffects() {
  // Simple, direct approach
  document.addEventListener('DOMContentLoaded', () => {
    const links = document.querySelectorAll('.nav-item a');
    
    links.forEach(link => {
      // Force inline styles to override everything
      link.style.setProperty('transition', 'none', 'important');
      link.style.setProperty('transform-origin', 'center center', 'important');
      
      link.onmouseenter = function() {
        this.style.transform = 'scale(1.15)';
        this.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      };
      
      link.onmouseleave = function() {
        this.style.transform = 'scale(1)';
        this.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      };
      
      link.onmousemove = function(e) {
        const rect = this.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width / 2) * 0.4;
        const y = (e.clientY - rect.top - rect.height / 2) * 0.4;
        this.style.transform = `scale(1.15) translate(${x}px, ${y}px)`;
        this.style.transition = 'none';
      };
    });
  });
  
  // Also try immediately
  const links = document.querySelectorAll('.nav-item a');
  links.forEach(link => {
    link.style.setProperty('transition', 'none', 'important');
    link.style.setProperty('transform-origin', 'center center', 'important');
    
    link.onmouseenter = function() {
      this.style.transform = 'scale(1.15)';
      this.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    };
    
    link.onmouseleave = function() {
      this.style.transform = 'scale(1)';
      this.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    };
    
    link.onmousemove = function(e) {
      const rect = this.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) * 0.4;
      const y = (e.clientY - rect.top - rect.height / 2) * 0.4;
      this.style.transform = `scale(1.15) translate(${x}px, ${y}px)`;
      this.style.transition = 'none';
    };
  });
}

function positionDotOnItem(dot, item) {
  const x = getItemCenterX(item);
  gsap.set(dot, { x: x });
}

function getItemCenterX(item) {
  const navList = document.querySelector('.nav-list');
  const navListRect = navList.getBoundingClientRect();
  const itemRect = item.getBoundingClientRect();
  
  // Calculate the position relative to the nav-list container
  const navListPaddingLeft = parseInt(window.getComputedStyle(navList).paddingLeft) || 0;
  const relativeX = itemRect.left - navListRect.left;
  const centerX = relativeX + (itemRect.width / 2) - 5; // -5 to center the 10px dot
  
  console.log(`Item: ${item.textContent}, RelativeX: ${relativeX}, CenterX: ${centerX}`);
  return centerX;
}

// ================= MAGNETIC BUTTON EFFECTS =================
function initMagneticButtons() {
  // Apply to footer buttons, slide nav items, dropdown, and resume button
  const magneticElements = document.querySelectorAll('.magnetic-btn, .slide-nav-item a, .close-btn, .sort-dropdown, .resume-download-btn');

  magneticElements.forEach((btn) => {
    // Disable CSS transitions that conflict with GSAP
    btn.style.transition = 'none';
    btn.style.willChange = 'auto';

    btn.addEventListener('mouseenter', () => {
      // Reduced scale for slide nav items and dropdown
      const scale = btn.closest('.slide-nav-item') || btn.classList.contains('sort-dropdown') ? 1.05 : 1.1;
      
      gsap.to(btn, {
        scale: scale,
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
      
      // Much more reduced movement for slide nav items
      let multiplier = 0.3; // Default for footer buttons and resume button
      if (btn.closest('.slide-nav-item')) {
        multiplier = 0.05; // Very subtle movement for slide menu
      } else if (btn.classList.contains('sort-dropdown')) {
        multiplier = 0.15; // Slightly more for dropdown
      }
      
      gsap.to(btn, {
        x: x * multiplier,
        y: y * multiplier,
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

  // Fix for scroll freeze when returning from external apps (like email)
  const handleVisibilityChange = () => {
    if (!document.hidden && locoScroll) {
      // Page became visible again - completely reinitialize scroll
      setTimeout(() => {
        console.log('🔄 Reinitializing Locomotive Scroll after visibility change');
        
        // Destroy existing instance
        locoScroll.destroy();
        
        // Recreate scroll instance with same mobile logic
        const isMobile = isMobileDevice();
        locoScroll = new LocomotiveScroll({
          el: document.querySelector('[data-scroll-container]'),
          smooth: !isMobile,  // Disable smooth scrolling on mobile
          multiplier: isMobile ? 1.0 : 0.8,  // Native speed on mobile
          class: 'is-revealed',
          smartphone: {
            smooth: false,  // Force native scrolling
            multiplier: 1.0,
          },
          tablet: {
            smooth: false,  // Force native scrolling
            multiplier: 1.0,
          },
          lerp: 0.1,
          reloadOnContextChange: true,
        });
        
        // Re-setup scroll events
        locoScroll.on('scroll', (args) => {
          const scrollY = args.scroll.y;
          if (isMobileDevice()) {
            if (!window.mobileScrollThrottle) {
              window.mobileScrollThrottle = true;
              setTimeout(() => {
                checkElementsInView();
                updateFloatingButton(scrollY);
                window.mobileScrollThrottle = false;
              }, 16);
            }
          } else {
            checkElementsInView();
            updateFloatingButton(scrollY);
          }
        });
        
        // Re-setup ScrollTrigger if available
        if (typeof ScrollTrigger !== 'undefined') {
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
        
        // Refresh everything
        checkElementsInView();
        const currentScroll = locoScroll.scroll.instance.scroll.y;
        updateFloatingButton(currentScroll);
        
        console.log('✅ Locomotive Scroll completely reinitialized');
      }, 150);
    }
  };
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Additional fix for focus events
  const handleFocus = () => {
    if (locoScroll) {
      setTimeout(() => {
        locoScroll.update();
        locoScroll.start();
        console.log('🔄 Locomotive Scroll restarted on focus');
      }, 200);
    }
  };
  window.addEventListener('focus', handleFocus);

  // Chrome-specific fix for page show event
  const handlePageShow = (e) => {
    if (locoScroll) {
      setTimeout(() => {
        locoScroll.update();
        locoScroll.start();
        console.log('🔄 Locomotive Scroll restarted on page show');
      }, 300);
    }
  };
  window.addEventListener('pageshow', handlePageShow);

  // Additional Chrome fix - listen for document becoming visible
  let lastActiveTime = Date.now();
  const handleDocumentClick = () => {
    const now = Date.now();
    // If it's been more than 2 seconds since last activity, refresh scroll
    if (now - lastActiveTime > 2000 && locoScroll) {
      locoScroll.update();
      locoScroll.start();
      console.log('🔄 Locomotive Scroll refreshed after inactivity');
    }
    lastActiveTime = now;
  };
  document.addEventListener('click', handleDocumentClick);
  document.addEventListener('touchstart', handleDocumentClick);

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
  
  // No need to force footer buttons on mobile - handled by CSS

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

// ================= PORTFOLIO THUMBNAIL ANIMATIONS =================
function animatePortfolioThumbnails() {
  const projectItems = document.querySelectorAll('.project-item');
  
  if (projectItems.length === 0) {
    console.log('⚠️ No project items found for animation');
    return;
  }
  
  console.log(`🖼️ Animating ${projectItems.length} portfolio thumbnails`);
  
  // Animate thumbnails with stagger effect
  gsap.fromTo(projectItems, 
    {
      opacity: 0,
      scale: 0.8,
      y: 30
    },
    {
      opacity: 1,
      scale: 1,
      y: 0,
      duration: 0.6,
      ease: 'back.out(1.2)',
      stagger: 0.1, // 100ms delay between each thumbnail
      delay: 0.2 // Small delay after dropdown completes
    }
  );
}

// ================= PORTFOLIO FILTERING =================
function initPortfolioFilter() {
  const sortDropdown = document.getElementById('portfolio-sort');
  const projectItems = document.querySelectorAll('.project-item');
  
  if (!sortDropdown || projectItems.length === 0) {
    console.log('⚠️ Portfolio filter elements not found');
    return;
  }
  
  // Set initial state for thumbnails (hidden for animation)
  projectItems.forEach(item => {
    gsap.set(item, { opacity: 0, scale: 0.8, y: 30 });
  });
  console.log('🎯 Portfolio thumbnails set to hidden for animation');
  
  sortDropdown.addEventListener('change', (e) => {
    const selectedCategory = e.target.value;
    console.log(`🔍 Filtering by: ${selectedCategory}`);
    
    projectItems.forEach((item) => {
      const itemCategory = item.getAttribute('data-category');
      const shouldShow = selectedCategory === 'all' || itemCategory === selectedCategory;
      
      if (shouldShow) {
        gsap.to(item, {
          opacity: 1,
          scale: 1,
          duration: 0.3,
          ease: 'power2.out',
          onStart: () => {
            item.style.display = 'block';
            item.classList.remove('hidden');
          }
        });
      } else {
        gsap.to(item, {
          opacity: 0,
          scale: 0.8,
          duration: 0.2,
          ease: 'power2.in',
          onComplete: () => {
            item.style.display = 'none';
            item.classList.add('hidden');
          }
        });
      }
    });
    
    // Update Locomotive Scroll after filtering
    if (locoScroll) {
      setTimeout(() => {
        locoScroll.update();
        console.log('🔄 Locomotive Scroll updated after filtering');
      }, 350);
    }
  });
  
  console.log('🔍 Portfolio filter initialized');
}

// ================= HELPER: IS MOBILE =================
function isMobileDevice() {
  // More comprehensive mobile detection - don't just rely on screen width
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  
  // Only consider small screen if it's also a touch device
  const isSmallScreen = window.innerWidth <= 768;
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isSmallTouchDevice = isSmallScreen && isTouchDevice;
  
  // Check for iPad specifically (including newer iPads that report as Mac)
  const isIPad = /ipad/i.test(userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  
  // Additional checks for tablets
  const isTablet = /tablet|ipad|playbook|silk/i.test(userAgent) ||
    (navigator.maxTouchPoints > 1 && window.innerWidth > 768);
  
  // IMPORTANT: Don't disable Locomotive Scroll just because viewport is narrow
  // Only disable if it's actually a mobile/touch device
  const result = isMobileUA || isSmallTouchDevice || isIPad || isTablet;
  
  // Debug logging
  console.log('🔍 Mobile Detection Debug:', {
    userAgent,
    isMobileUA,
    isSmallScreen,
    isTouchDevice,
    isSmallTouchDevice,
    isIPad,
    isTablet,
    finalResult: result,
    windowSize: `${window.innerWidth}x${window.innerHeight}`,
    platform: navigator.platform,
    touchPoints: navigator.maxTouchPoints,
    reasoning: result ? 'MOBILE/TOUCH DEVICE' : 'DESKTOP (keeping Locomotive Scroll)'
  });
  
  return result;
}