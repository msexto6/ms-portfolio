// ================= GLOBAL VARIABLES =================
let isMenuOpen = false;
let animatedElements = new Set();
let mobileFooterAnimated = false;
let resizeTimeout;
let isFloatingButtonVisible = false;
let scrollTimeout;

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
  initScrollSmoother();
  initMagneticNavDot();
  initSlideMagneticNavDot();
  addNavMagneticEffects();
  initMagneticButtons();
  initCircularWipeEffect();
  initPortfolioFilter();
  addEventListeners();

  // Force an initial "check visibility" for fade-ins
  forceCheckVisible();
}

// ================= CLEANUP =================
function cleanup() {
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
    
    // Register ScrollSmoother if available
    if (typeof ScrollSmoother !== 'undefined') {
      gsap.registerPlugin(ScrollSmoother);
    }
    
    gsap.defaults({
      ease: 'power2.out',
      duration: 0.8,
    });
    console.log('🎬 GSAP initialized');
  }
}

// ================= SCROLL SMOOTHER SETUP =================
function initScrollSmoother() {
  if (typeof ScrollSmoother !== 'undefined') {
    try {
      const smoother = ScrollSmoother.create({
        wrapper: "#smooth-wrapper",
        content: "#smooth-content",
        smooth: 2,                    // Reduced smoothing
        normalizeScroll: true,        // Helps with mobile issues
        ignoreMobileResize: true,     // Prevents mobile viewport issues
        effects: false,               // Don't interfere with existing animations
        smoothTouch: 0.1,            // Subtle touch smoothing for mobile
        onUpdate: self => {
          // Trigger our custom scroll handler when ScrollSmoother updates
          handleScroll();
          // Ensure content elements maintain normal scroll speed
          ensureNormalScrollSpeed();
        }
      });
      
      // Refresh after a short delay to ensure proper height calculation
      setTimeout(() => {
        if (smoother && smoother.refresh) {
          smoother.refresh();
          const content = document.getElementById('smooth-content');
          console.log('🔄 ScrollSmoother refreshed');
          console.log('Content height:', content ? content.offsetHeight + 'px' : 'unknown');
        }
      }, 100);
      
      // Additional refresh after content settles
      setTimeout(() => {
        if (smoother && smoother.refresh) {
          smoother.refresh();
          const content = document.getElementById('smooth-content');
          console.log('🔄 ScrollSmoother final refresh');
          console.log('Final content height:', content ? content.offsetHeight + 'px' : 'unknown');
        }
      }, 500);
      
      console.log('✨ ScrollSmoother initialized with smooth: 2');
      return smoother;
    } catch (error) {
      console.warn('ScrollSmoother initialization failed:', error);
    }
  } else {
    console.log('ScrollSmoother not available');
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
      
      // Hide buttons for animation on ALL screen sizes and ensure no y transform
      const buttons = el.querySelectorAll('.btn, a');
      buttons.forEach(btn => {
        console.log('Setting up footer button:', btn);
        gsap.set(btn, { opacity: 0, scale: 0.1, y: 0 }); // Explicitly set y: 0
      });
    } else if (el.classList.contains('footer-title')) {
      // Special handling for footer title - don't hide on narrow viewports
      if (isMobileDevice() || window.innerWidth <= 768) {
        console.log('Setting up footer title for mobile/narrow viewport - keeping visible:', el);
        gsap.set(el, { opacity: 1, y: 0 });
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
    // Move floating button to body to avoid positioning conflicts
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

// ================= NATIVE SCROLL EVENT HANDLER =================
function handleScroll() {
  // Use ScrollSmoother's scroll position if available, otherwise fall back to native
  let scrollY;
  const smoother = ScrollSmoother.get();
  if (smoother) {
    scrollY = smoother.scrollTop();
  } else {
    scrollY = window.pageYOffset || document.documentElement.scrollTop;
  }

  // Add parallax effect to video background
  updateVideoParallax(scrollY);

  // Throttle scroll events on mobile for performance
  if (isMobileDevice()) {
    if (!scrollTimeout) {
      scrollTimeout = setTimeout(() => {
        checkElementsInView();
        updateFloatingButton(scrollY);
        updateScrollIndicator(scrollY);
        scrollTimeout = null;
      }, 16); // ~60fps
    }
  } else {
    checkElementsInView();
    updateFloatingButton(scrollY);
    updateScrollIndicator(scrollY);
  }

  // Reset animation tracking when scrolled to top
  if (scrollY < 50 && !isMobileDevice()) {
    document
      .querySelectorAll('.hero .fade-in')
      .forEach((el) => animatedElements.delete(el));
  }
}

// ================= FADE-IN ON SCROLL (GSAP) =================
function checkElementsInView() {
  const windowHeight = window.innerHeight;
  const isMobile = isMobileDevice();

  document.querySelectorAll('.fade-in').forEach((el) => {
    // Don't reset footer elements on mobile/narrow viewports once they've been animated
    // But allow footer-contact buttons to reset for re-animation
    if (
      (isMobile || window.innerWidth <= 768) &&
      mobileFooterAnimated &&
      el.classList.contains('footer-title') // Only lock footer-title, not footer-contact
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
      if (!(isMobile && el.classList.contains('footer-title'))) { // Only prevent reset for footer-title on mobile
        animatedElements.delete(el);
        console.log(`Element ${el.className} removed from animated set - can animate again`);

        // Reset footer buttons to hidden state when they go out of view
        if (el.classList.contains('footer-contact')) {
          const buttons = el.querySelectorAll('.btn, a');
          buttons.forEach(btn => {
            gsap.set(btn, { opacity: 0, scale: 0.1, y: 0 });
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
        el.classList.contains('footer-title') // Only lock animation for footer-title
      ) {
        mobileFooterAnimated = true;
        console.log('📱 Mobile/narrow viewport footer title animation locked in');
      }

      // Check if this is the footer-contact div containing buttons - use special handling
      if (el.classList.contains('footer-contact')) {
        console.log('🔵 Animating footer-contact container and buttons with pop-in effect');

        // Kill any existing animations
        gsap.killTweensOf(el);

        // Find all buttons within this container
        const buttons = el.querySelectorAll('.btn, a');

        // Set initial states for all buttons (ensure no y transform)
        buttons.forEach(btn => {
          gsap.set(btn, { opacity: 0, scale: 0.1, y: 0 });
        });

        // Sort buttons based on layout (horizontal on desktop, vertical on mobile)
        const sortedButtons = Array.from(buttons).sort((a, b) => {
          const rectA = a.getBoundingClientRect();
          const rectB = b.getBoundingClientRect();
          
          // On mobile/narrow screens, sort vertically (top to bottom)
          if (isMobile || window.innerWidth <= 768) {
            return rectA.top - rectB.top;
          }
          // On desktop, sort horizontally (left to right)  
          return rectA.left - rectB.left;
        });

        // Animate buttons with stagger and scale-in effect (no y animation)
        gsap.to(sortedButtons, {
          opacity: 1,
          scale: 1,
          y: 0, // Explicitly keep y at 0
          duration: 0.3, // Slightly longer for more pronounced effect
          ease: 'back.out(1.2)', // Bouncy scale-in effect
          stagger: 0.1, // Slightly longer stagger for mobile visibility
          delay: (isMobile || window.innerWidth <= 768) ? 0.6 : 0.1 // Extra delay on mobile
        });

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
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;

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

// ================= ENSURE NORMAL SCROLL SPEED =================
function ensureNormalScrollSpeed() {
  const pageContent = document.querySelector('.page-content');
  const footer = document.querySelector('.footer');
  
  // Force reset any transforms on content elements to ensure they move at normal speed
  if (pageContent) {
    pageContent.style.transform = 'none';
    pageContent.style.willChange = 'auto';
  }
  if (footer) {
    footer.style.transform = 'none';
    footer.style.willChange = 'auto';
  }
}

// ================= PARALLAX EFFECTS =================
function updateVideoParallax(scrollY) {
  const video = document.querySelector('.background-video');
  const heroLogo = document.querySelector('.hero-logo');
  const pageContent = document.querySelector('.page-content');
  const footer = document.querySelector('.footer');
  
  if (!video) return;
  
  // Video moves slowest (40% of scroll speed - deep background)
  // Positive transform so video moves DOWN slower than content
  const videoParallaxSpeed = 0.4;
  const videoOffset = scrollY * videoParallaxSpeed;
  
  // Apply transform to video
  video.style.transform = `translateY(${videoOffset}px)`;
  video.style.willChange = 'transform';
  
  // Hero logo moves at medium speed (60% of scroll speed - middle layer)
  if (heroLogo) {
    const logoParallaxSpeed = 0.6;
    const logoOffset = scrollY * logoParallaxSpeed;
    
    heroLogo.style.transform = `translateY(${logoOffset}px)`;
    heroLogo.style.willChange = 'transform';
  }
  
  // Ensure white content block and footer move together at normal speed (100%)
  // Reset any transforms that might have been applied by other systems
  if (pageContent) {
    pageContent.style.transform = 'none';
    pageContent.style.willChange = 'auto';
  }
  if (footer) {
    footer.style.transform = 'none';
    footer.style.willChange = 'auto';
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

// ================= CIRCULAR WIPE EFFECT =================
function initCircularWipeEffect() {
  const wipeButtons = document.querySelectorAll('.wipe-btn');
  
  wipeButtons.forEach(btn => {
    const overlay = btn.querySelector('.circular-wipe-overlay');
    if (!overlay) return;
    
    // Set initial state
    gsap.set(overlay, {
      clipPath: 'circle(0% at 50% 50%)'
    });
    
    btn.addEventListener('mouseenter', (e) => {
      // Kill any existing animations immediately
      gsap.killTweensOf(overlay);
      
      // Calculate mouse position relative to button
      const rect = btn.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      // Start wipe from mouse position with slightly slower timing
      gsap.fromTo(overlay, {
        clipPath: `circle(0% at ${x}% ${y}%)`
      }, {
        clipPath: `circle(150% at ${x}% ${y}%)`,
        duration: 0.5,
        ease: 'power2.inOut',
        immediateRender: true,
        overwrite: 'auto'
      });
    });
    
    btn.addEventListener('mouseleave', (e) => {
      // Kill animations and start exit immediately
      gsap.killTweensOf(overlay);
      
      // Calculate mouse position for exit animation
      const rect = btn.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      gsap.to(overlay, {
        clipPath: `circle(0% at ${x}% ${y}%)`,
        duration: 0.35,
        ease: 'power2.inOut',
        immediateRender: true,
        overwrite: 'auto'
      });
    });
  });
  
  console.log('🎯 Circular wipe effect initialized');
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
      // Force a scroll update to check floating button state
      const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
      updateFloatingButton(currentScroll);
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

  // Add native scroll event listener
  window.addEventListener('scroll', handleScroll, { passive: true });

  const handleResize = () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.refresh(true);
      }
      if (!isMobileDevice()) checkElementsInView();
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
    console.log('🔄 Forced check #1');
  }, 100);

  // Secondary check after layout settles
  setTimeout(() => {
    checkElementsInView();
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

    console.log('🔄 Forced check #3 - Force animate visible elements');
  }, 1000);

  console.log('⚙️ Force visibility checks complete');
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
  });
  
  console.log('🔍 Portfolio filter initialized');
}

// ================= HELPER: IS MOBILE =================
function isMobileDevice() {
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) || window.innerWidth <= 768
  );
}