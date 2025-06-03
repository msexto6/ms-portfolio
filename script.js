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

  // Handle page loader fade-out
  handlePageLoader();

  disablePinchZoom();
  setupMobileVideo();
  initGSAPAnimations();
  setupInitialStates();
  initLocomotiveScroll();
  initMagneticNavDot();
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
      } else {
        console.log('Setting up footer title for desktop - hiding for animation:', el);
        gsap.set(el, { opacity: 0, y: 40 });
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
      multiplier: 2.0,
    },
    tablet: {
      smooth: true,
      multiplier: 2.0,
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
        }, 16);
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

    console.log(`Element: ${el.className}, Top: ${rect.top}, Bottom: ${rect.bottom}, Threshold: ${threshold}, In View: ${isInView}`);

    // Remove from animated set if element goes out of view (to allow re-animation) - but not on mobile for footer
    if (isOutOfView && animatedElements.has(el)) {
      if (!(isMobile && (el.classList.contains('footer-title') || el.closest('.footer')))) {
        animatedElements.delete(el);
        console.log(`Element ${el.className} removed from animated set - can animate again`);

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

        // Skip button animations on mobile/narrow viewports - they're already visible via CSS
        if (isMobile || window.innerWidth <= 768) {
          // Just mark as animated
          console.log('Skipping footer button animations on mobile/narrow viewport - using CSS visibility');
          gsap.set(el, { opacity: 1 });
          return;
        }

        // Kill any existing animations
        gsap.killTweensOf(el);

        // Find all buttons within this container
        const buttons = el.querySelectorAll('.btn, a');

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
  navItems.forEach(item => {
    item.addEventListener('mouseenter', () => {
      magneticDot.classList.add('show');
      gsap.to(magneticDot, {
        x: getItemCenterX(item),
        duration: 0.28,
        ease: 'back.out(2)'
      });
    });
  });
  
  // Return to active item when leaving nav
  navList.addEventListener('mouseleave', () => {
    if (activeItem) {
      gsap.to(magneticDot, {
        x: getItemCenterX(activeItem),
        duration: 0.4,
        ease: 'back.out(1.5)'
      });
    } else {
      magneticDot.classList.remove('show');
    }
  });
  
  console.log('🟣 Magnetic nav dot initialized');
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
  // Apply to footer buttons and nav menu items
  const magneticElements = document.querySelectorAll('.magnetic-btn, .nav-item a, .slide-nav-item a, .close-btn');

  magneticElements.forEach((btn) => {
    // Disable CSS transitions that conflict with GSAP
    btn.style.transition = 'none';
    btn.style.willChange = 'auto';

    btn.addEventListener('mouseenter', () => {
      // Reduced scale for slide nav items
      const scale = btn.closest('.slide-nav-item') ? 1.05 : 1.1;
      
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
      
      // Reduced movement for slide nav items
      const multiplier = btn.closest('.slide-nav-item') ? 0.15 : 0.3;
      
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
        
        // Recreate scroll instance
        locoScroll = new LocomotiveScroll({
          el: document.querySelector('[data-scroll-container]'),
          smooth: true,
          multiplier: 0.8,
          class: 'is-revealed',
          smartphone: {
            smooth: true,
            multiplier: 2.0,
          },
          tablet: {
            smooth: true,
            multiplier: 2.0,
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

// ================= HELPER: IS MOBILE =================
function isMobileDevice() {
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) || window.innerWidth <= 768
  );
}