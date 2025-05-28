



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
let scrollRAF = null;

// Store observers for cleanup
let intersectionObserver = null;
let floatingButtonObserver = null;

// Menu state
let isMenuOpen = false;
let headerHeight = 0;

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
  // Get scroll position
  const scrollY = window.scrollY || window.pageYOffset || 0;
  
  console.log('Parallax update called, scrollY:', scrollY);
  
  // Simple parallax test - background video should move slower
  const backgroundVideo = document.querySelector('.background-video');
  if (backgroundVideo) {
    const videoOffset = scrollY * 0.5;
    backgroundVideo.style.transform = `translateY(${videoOffset}px)`;
    console.log('Video parallax applied:', videoOffset);
  }
  
  // Hero logo parallax
  const heroLogoDesktop = document.querySelector('.hero-logo-desktop');
  const heroLogoMobile = document.querySelector('.hero-logo-mobile');
  
  if (heroLogoDesktop && window.innerWidth > 768) {
    const logoOffset = scrollY * 0.3;
    heroLogoDesktop.style.transform = `translateY(${logoOffset}px)`;
    console.log('Desktop logo parallax applied:', logoOffset);
  }
  
  if (heroLogoMobile && window.innerWidth <= 768) {
    const logoOffset = scrollY * 0.3;
    heroLogoMobile.style.transform = `translateY(${logoOffset}px)`;
    console.log('Mobile logo parallax applied:', logoOffset);
  }
  
  scrollRAF = null;
}

function requestTick() {
  if (scrollRAF) {
    cancelAnimationFrame(scrollRAF);
  }
  scrollRAF = requestAnimationFrame(updateParallax);
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
  calculateHeaderHeight();
  animateOnScroll();
  animateRotation();
  addEventListeners();

  // Set up the intersection observer for floating button
  floatingButtonObserver = setupFloatingButtonObserver();
  
  // Test if parallax is working at all
  console.log('Parallax initialized');
  
  // Force initial parallax update
  updateParallax();
}

// ================= PAGE LIFECYCLE =================
document.addEventListener('DOMContentLoaded', init);

// Cleanup on page unload
window.addEventListener('beforeunload', removeEventListeners);