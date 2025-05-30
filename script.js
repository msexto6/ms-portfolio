



// ────────────────────────────────────────────────
// PERMANENTLY DISABLE PINCH & GESTURE ZOOM
// ────────────────────────────────────────────────
; (function () {
  // Prevent 2-finger pinch on touchmove
  document.addEventListener('touchmove', function (e) {
    if (e.touches && e.touches.length > 1) {
      e.preventDefault();
    }
  }, { passive: false });

  // Prevent the old iOS "gesturestart" (pinch/spread)
  document.addEventListener('gesturestart', function (e) {
    e.preventDefault();
  });
})();








// ================= GLOBAL VARIABLES =================
let lastScrollY = window.scrollY;
let scrollDirection = 1;
let ticking = false;
let currentRotation = 0;
let rotationSpeed = 0.1;

// Store observers for cleanup
let intersectionObserver = null;
let floatingButtonObserver = null;

// Menu state
let isMenuOpen = false;
let headerHeight = 0;

// ================= MOBILE VIDEO DETECTION =================
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
}

function setupMobileVideo() {
  const video = document.querySelector('.background-video');
  if (!video) return;

  if (isMobileDevice()) {
    // Update source elements for mobile
    const sources = video.querySelectorAll('source');
    sources.forEach(source => {
      const src = source.getAttribute('src');
      if (src.includes('.mp4')) {
        source.setAttribute('src', './public/wave-loop-mobile-5.30.mp4');
      } else if (src.includes('.webm')) {
        source.setAttribute('src', './public/wave-loop-mobile-5.30.webm');
      }
    });
    
    // Force video to reload with new sources
    video.load();
    
    // Mobile video sizing fix
    function resizeMobileVideo() {
      const videoRect = video.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // If video doesn't fill viewport, apply additional scaling
      if (videoRect.width < viewportWidth || videoRect.height < viewportHeight) {
        const scaleX = viewportWidth / videoRect.width;
        const scaleY = viewportHeight / videoRect.height;
        const scale = Math.max(scaleX, scaleY);
        video.style.transform = `scale(${scale})`;
      }
    }
    
    // Attempt to play after loading
    video.addEventListener('loadeddata', () => {
      resizeMobileVideo();
      video.play().catch(e => {
        console.log('Video autoplay prevented:', e);
      });
    });
    
    // Also resize on window resize
    window.addEventListener('resize', resizeMobileVideo);
  }
}

// ================= SCROLL DIRECTION TRACKING =================
function updateScrollDirection() {
  const currentY = window.scrollY;
  scrollDirection = currentY > lastScrollY ? 1 : -1;
  lastScrollY = currentY;
}

// ================= ANIMATION FUNCTIONS =================
function animateOnScroll() {
  const fadeElements = document.querySelectorAll('h1.fade-in, p.fade-in, .footer-title.fade-in, .footer-contact.fade-in');

  // Clean up existing observer if it exists
  if (intersectionObserver) {
    intersectionObserver.disconnect();
  }

  intersectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && scrollDirection === 1) {
        entry.target.classList.add('animated');
      }
    });
  }, { threshold: 0.2 });

  fadeElements.forEach(el => intersectionObserver.observe(el));
}

function animateRotation() {
  const circularText = document.querySelector('.portfolio-peek');
  if (circularText) {
    currentRotation += rotationSpeed * scrollDirection;
    circularText.style.transform = `rotate3d(0, 0, 1, ${currentRotation}deg)`;
  }
  requestAnimationFrame(animateRotation);
}

// ================= PARALLAX FUNCTIONS =================
function updateParallax() {
  const scrollY = window.pageYOffset;

  const hero = document.querySelector('.hero');
  if (hero) hero.style.transform = `translate3d(0, ${scrollY * -0.1}px, 0)`;

  const pageContent = document.querySelector('.page-content');
  if (pageContent) pageContent.style.transform = `translate3d(0, ${scrollY * -0.15}px, 0)`;

  const heroLogoDesktop = document.querySelector('.hero-logo-desktop');
  const heroLogoMobile = document.querySelector('.hero-logo-mobile');

  if (heroLogoDesktop) {
    if (window.innerWidth > 768) {
      const horizontalOffset = scrollY * 0.3;
      heroLogoDesktop.style.transform = `translate3d(-${horizontalOffset}px, ${scrollY * -0.05}px, 0)`;
    } else {
      heroLogoDesktop.style.transform = `translate3d(0, ${scrollY * -0.05}px, 0)`;
    }
  }

  if (heroLogoMobile) {
    heroLogoMobile.style.transform = `translate3d(0, ${scrollY * -0.05}px, 0)`;
  }

  const footer = document.querySelector('.footer');
  if (footer) footer.style.transform = `translate3d(0, ${scrollY * -0.15}px, 0)`;

  lastScrollY = scrollY;
  ticking = false;
}

function requestTick() {
  if (!ticking) {
    requestAnimationFrame(updateParallax);
    ticking = true;
  }
}

// ================= MENU FUNCTIONS =================
function calculateHeaderHeight() {
  const hero = document.querySelector('.hero');
  if (hero) {
    headerHeight = hero.offsetHeight;
  }
}





// New approach using Intersection Observer on the header


function setupFloatingButtonObserver() {
  const floatingBtn = document.querySelector('.floating-menu-btn');
  const header = document.querySelector('.site-header');

  if (!floatingBtn || !header) {
    console.error('Required elements not found');
    return;
  }

  // Tear down previous header observer
  if (floatingButtonObserver) floatingButtonObserver.disconnect();

  // Observe header for ANY viewport
  floatingButtonObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      // show as soon as header (with hamburger) scrolls out of view, menu closed
      if (!entry.isIntersecting && !isMenuOpen) {
        floatingBtn.classList.add('show');
      } else {
        floatingBtn.classList.remove('show');
      }
    });
  }, { threshold: 0 });

  floatingButtonObserver.observe(header);
}







// Keep old function for compatibility
function handleFloatingButton() {
  // This function is now replaced by the Intersection Observer
}

function openSlideMenu() {
  const slideMenu = document.querySelector('.slide-menu');
  const floatingBtn = document.querySelector('.floating-menu-btn');

  if (slideMenu) {
    slideMenu.classList.add('open');
    isMenuOpen = true;
    document.body.style.overflow = 'hidden';

    // Hide floating button when menu is open
    if (floatingBtn) {
      floatingBtn.classList.remove('show');
    }
  }
}

function closeSlideMenu() {
  const slideMenu = document.querySelector('.slide-menu');
  const floatingBtn = document.querySelector('.floating-menu-btn');
  const header = document.querySelector('.site-header');

  if (slideMenu) {
    slideMenu.classList.remove('open');
    isMenuOpen = false;
    document.body.style.overflow = '';

    // Re-check if floating button should be visible after menu closes
    if (floatingBtn && header) {
      const headerRect = header.getBoundingClientRect();
      // show whenever header is scrolled out of view
      if (headerRect.bottom <= 0) {
        setTimeout(() => {
          floatingBtn.classList.add('show');
        }, 300); // match your slide-menu transition
      }

    }
  }
}

function toggleMobileMenu() {
  const navList = document.querySelector('.nav-list');
  if (navList) {
    navList.classList.toggle('open');
  }

  // If mobile menu is being opened, open slide menu instead
  if (window.innerWidth <= 768) {
    openSlideMenu();
  }
}

// ================= EVENT LISTENERS =================
function addEventListeners() {
  // Scroll event listeners
  window.addEventListener("scroll", updateScrollDirection);
  window.addEventListener('scroll', requestTick, { passive: true });
  // Removed handleFloatingButton from scroll - now using Intersection Observer

  // Wheel event for scroll direction
  window.addEventListener('wheel', function (e) {
    scrollDirection = e.deltaY > 0 ? 1 : -1;
  }, { passive: true });

  // Mobile menu toggle
  const navToggle = document.querySelector('.nav-toggle');
  if (navToggle) {
    navToggle.addEventListener('click', toggleMobileMenu);
  }

  // Floating menu button
  const floatingBtn = document.querySelector('.floating-menu-btn');
  if (floatingBtn) {
    floatingBtn.addEventListener('click', openSlideMenu);
  }

  // Close menu button
  const closeBtn = document.querySelector('.close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeSlideMenu);
  }

  // Window resize
  window.addEventListener('resize', () => {
    calculateHeaderHeight();
    handleFloatingButton();
  });

  // Escape key to close menu
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isMenuOpen) {
      closeSlideMenu();
    }
  });
}

function removeEventListeners() {
  window.removeEventListener("scroll", updateScrollDirection);
  window.removeEventListener('scroll', requestTick);
  window.removeEventListener('scroll', handleFloatingButton);
  window.removeEventListener('wheel', function (e) {
    scrollDirection = e.deltaY > 0 ? 1 : -1;
  });

  const navToggle = document.querySelector('.nav-toggle');
  if (navToggle) {
    navToggle.removeEventListener('click', toggleMobileMenu);
  }

  // Clean up intersection observer
  if (intersectionObserver) {
    intersectionObserver.disconnect();
    intersectionObserver = null;
  }

  // Clean up floating button observer
  if (floatingButtonObserver) {
    floatingButtonObserver.disconnect();
    floatingButtonObserver = null;
  }
}

// ================= INITIALIZATION =================
function init() {
  setupMobileVideo();
  calculateHeaderHeight();
  animateOnScroll();
  animateRotation();
  addEventListeners();

  // Set up the intersection observer for floating button
  floatingButtonObserver = setupFloatingButtonObserver();
}

// ================= PAGE LIFECYCLE =================
document.addEventListener('DOMContentLoaded', init);

// Cleanup on page unload
window.addEventListener('beforeunload', removeEventListeners);
