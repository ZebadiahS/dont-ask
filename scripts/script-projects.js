/* -------------------------------------------------------
   GLOBAL STATE
------------------------------------------------------- */

const containerWidth = window.innerWidth;
const containerHeight = window.innerHeight;

const mouse = { x: window.innerWidth/2, y: window.innerHeight/2, active: false };

// CAROUSEL: support multiple carousels on the page and generate indicators dynamically
function initCarousel(carouselRoot) {
  const track = carouselRoot.querySelector('.carousel_track');
  const slides = Array.from(track.children);
  const nextButton = carouselRoot.querySelector('.carousel_button--right');
  const prevButton = carouselRoot.querySelector('.carousel_button--left');
  const dotNav = carouselRoot.querySelector('.carousel_nav');

  if (!track || slides.length === 0) return; // nothing to do

  // compute slide width each time (responsive)
  const slideWidth = slides[0].getBoundingClientRect().width;

  // Arrange slides next to each other
  slides.forEach((slide, index) => {
    slide.style.left = (slideWidth * index) + 'px';
  });

  // Build dot navigation dynamically from slides length
  dotNav.innerHTML = '';
  slides.forEach((_, i) => {
    const btn = document.createElement('button');
    btn.className = 'carousel_indicator';
    if (i === 0) btn.classList.add('current-slide');
    btn.setAttribute('aria-label', `Go to slide ${i+1}`);
    dotNav.appendChild(btn);
  });

  const dots = Array.from(dotNav.children);

  // helper to move and toggle buttons
  const moveToSlide = (track, currentSlide, targetSlide, currentDot, targetDot) => {
    if (!targetSlide) return;
    track.style.transform = 'translateX(-' + targetSlide.style.left + ')';
    currentSlide.classList.remove('current-slide');
    targetSlide.classList.add('current-slide');
    currentDot.classList.remove('current-slide');
    targetDot.classList.add('current-slide');
    const targetIndex = slides.findIndex(slide => slide === targetSlide);

    if (prevButton && nextButton) {
      if (targetIndex === 0) {
        prevButton.classList.add('is-hidden');
        nextButton.classList.remove('is-hidden');
      } else if (targetIndex === slides.length - 1) {
        prevButton.classList.remove('is-hidden');
        nextButton.classList.add('is-hidden');
      } else {
        prevButton.classList.remove('is-hidden');
        nextButton.classList.remove('is-hidden');
      }
    }
  };

  // prev/next handlers
  if (prevButton) {
    prevButton.addEventListener('click', () => {
      const currentSlide = track.querySelector('.current-slide');
      const prevSlide = currentSlide.previousElementSibling;
      const currentDot = dotNav.querySelector('.current-slide');
      const prevDot = currentDot && currentDot.previousElementSibling;
      moveToSlide(track, currentSlide, prevSlide, currentDot, prevDot);
    });
  }

  if (nextButton) {
    nextButton.addEventListener('click', () => {
      const currentSlide = track.querySelector('.current-slide');
      const nextSlide = currentSlide.nextElementSibling;
      const currentDot = dotNav.querySelector('.current-slide');
      const nextDot = currentDot && currentDot.nextElementSibling;
      moveToSlide(track, currentSlide, nextSlide, currentDot, nextDot);
    });
  }

  // dot nav click handlers
  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      const currentSlide = track.querySelector('.current-slide');
      const targetSlide = slides[index];
      const currentDot = dotNav.querySelector('.current-slide');
      moveToSlide(track, currentSlide, targetSlide, currentDot, dot);
    });
  });

  // Ensure initial state — hide prev if first slide
  if (prevButton) prevButton.classList.toggle('is-hidden', slides.length > 0 && slides[0] === track.querySelector('.current-slide'));
  if (nextButton) nextButton.classList.toggle('is-hidden', slides.length === 1);

  // Recalculate sizes on resize
  window.addEventListener('resize', () => {
    const newWidth = slides[0].getBoundingClientRect().width;
    slides.forEach((slide, idx) => slide.style.left = (newWidth * idx) + 'px');
    // Keep track transformed to current slide
    const currentSlide = track.querySelector('.current-slide') || slides[0];
    track.style.transform = 'translateX(-' + currentSlide.style.left + ')';
  });
}

// Initialize all carousels on the page
document.querySelectorAll('.carousel').forEach(initCarousel);

const hoverSound = new Audio("./sounds/stab.wav");
hoverSound.volume = 0.2;

/* -------------------------------------------------------
   AUDIO HELPERS
------------------------------------------------------- */

function fadeOut(audio, duration = 250) {
  const startVolume = audio.volume;
  const startTime = performance.now();

  function tick(now) {
    const p = (now - startTime) / duration;
    if (p < 1) {
      audio.volume = startVolume * (1 - p);
      requestAnimationFrame(tick);
    } else {
      audio.volume = 1;
      audio.pause();
      audio.currentTime = 0;
    }
  }

  requestAnimationFrame(tick);
}

/* -------------------------------------------------------
   MOUSE TRACKING
------------------------------------------------------- */

function setupMouseTracking() {
  document.addEventListener("mousemove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
  });

  document.addEventListener("mouseleave", () => {
    mouse.active = false;
  });
}

/* -------------------------------------------------------
   BUTTON HOVER SOUND
------------------------------------------------------- */

document.querySelectorAll("button, a").forEach(btn => {
  btn.addEventListener("mouseenter", () => {
    hoverSound.currentTime = 0;
    hoverSound.play();
  });
});

/* -------------------------------------------------------
   TILT EFFECTS
------------------------------------------------------- */

function setupTiltEffects() {
  const applyTilt = el => {
    el.addEventListener('mouseenter', () => {
      el.style.setProperty('--tilt', `${(Math.random() * 10) - 5}deg`);
    });
    el.addEventListener('mouseleave', () => {
      el.style.setProperty('--tilt', `0deg`);
    });
  };

  document.querySelectorAll('a, button').forEach(applyTilt);
}

/* -------------------------------------------------------
   SPIDER CURSOR FOLLOWER — SMALL + DEBUGGED VERSION
------------------------------------------------------- */

function initSpider() {
  // Create spider container
  const spider = document.createElement("div");
  spider.id = "spider";
  spider.style.cssText = `
    position: fixed;
    width: 50px;   /* smaller */
    height: 50px;  /* smaller */
    pointer-events: none;
  `;

  // Spider body
  const body = document.createElement("div");
  body.className = "spider-body";
  body.style.cssText = `
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 16px;   /* smaller */
    height: 16px;
    border: 2px solid grey;
    border-radius: 50%;
    background: grey;
  `;

  // Spider head
  const head = document.createElement("div");
  head.className = "spider-head";
  head.style.cssText = `
    position: absolute;
    left: 72%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 8px;  /* smaller */
    height: 8px;
    border: 2px solid grey;
    border-radius: 50%;
    background: grey;
  `;

  spider.appendChild(head);
  spider.appendChild(body);
  document.body.appendChild(spider);

  // Spider state
  let spiderX = mouse.x;
  let spiderY = mouse.y;
  let lastSpiderX = spiderX;
  let lastSpiderY = spiderY;
  let angle = 0;

  // Smaller legs: ~40% shorter than before
  const legConfigs = [
    { angle: 15, side: 1, upperLength: 36, lowerLength: 24, stepDist: 90 },
    { angle: 50, side: 1, upperLength: 36, lowerLength: 24, stepDist: 60 },
    { angle: 90, side: 1, upperLength: 36, lowerLength: 24, stepDist: 45 },
    { angle: 120, side: 1, upperLength: 36, lowerLength: 24, stepDist: 38 },
    { angle: -15, side: -1, upperLength: 36, lowerLength: 24, stepDist: 91 },
    { angle: -50, side: -1, upperLength: 36, lowerLength: 24, stepDist: 59 },
    { angle: -90, side: -1, upperLength: 36, lowerLength: 24, stepDist: 47 },
    { angle: -120, side: -1, upperLength: 36, lowerLength: 24, stepDist: 40 },
  ];

  const stepHeight = 12; // smaller upward arc when stepping

  // Create legs
  const legs = [];
  legConfigs.forEach((config, i) => {
    const upperLeg = document.createElement("div");
    upperLeg.style.cssText = `
      position: fixed;
      height: 2px;
      background: grey;
      transform-origin: 0 0;
      pointer-events: none;
      box-shadow: 0 0 3px grey;
    `;
    document.body.appendChild(upperLeg);

    const lowerLeg = document.createElement("div");
    lowerLeg.style.cssText = `
      position: fixed;
      height: 2px;
      background: grey;
      transform-origin: 0 0;
      pointer-events: none;
      box-shadow: 0 0 3px grey;
    `;
    document.body.appendChild(lowerLeg);

    const foot = document.createElement("div");
    foot.style.cssText = `
      position: fixed;
      width: 3px;   /* smaller */
      height: 3px;
      background: grey;
      border-radius: 50%;
      pointer-events: none;
      box-shadow: 0 0 5px grey;
    `;
    document.body.appendChild(foot);

    legs.push({
      config,
      upperLeg,
      lowerLeg,
      foot,
      footX: spiderX,
      footY: spiderY,
      targetX: spiderX,
      targetY: spiderY,
      isMoving: false,
      stepProgress: 0,
      stepPhase: (i * Math.PI) / 4
    });
  });

  // Inverse kinematics
  function inverseKinematics(startX, startY, endX, endY, length1, length2, bendDirection) {
    const dx = endX - startX;
    const dy = endY - startY;
    const dist = Math.hypot(dx, dy);
    const maxReach = length1 + length2;

    const targetDist = Math.min(dist, maxReach);


    const baseAngle = Math.atan2(dy, dx);
    const cosElbow = (length1**2 + targetDist**2 - length2**2) / (2 * length1 * targetDist);
    const elbowOffset = Math.acos(Math.max(-1, Math.min(1, cosElbow))) * bendDirection;

    const jointAngle = baseAngle + elbowOffset;
    const jointX = startX + length1 * Math.cos(jointAngle);
    const jointY = startY + length1 * Math.sin(jointAngle);

    return { jointX, jointY, angle: jointAngle };
  }

  // Animation loop
  function updateSpider() {
    const dx = mouse.x - spiderX;
    const dy = mouse.y - spiderY;
    const dist = Math.hypot(dx, dy);

    if (dist > 0.5) {
      lastSpiderX = spiderX;
      lastSpiderY = spiderY;
      spiderX += dx * 0.03; // slightly quicker reaction
      spiderY += dy * 0.03;
    }

    angle = Math.atan2(dy, dx);

    spider.style.left = spiderX - 25 + "px";
    spider.style.top = spiderY - 25 + "px";
    spider.style.transform = `rotate(${angle}rad)`;

    legs.forEach((leg, i) => {
      const legAngle = angle + (leg.config.angle * Math.PI) / 180;
      const attachX = spiderX + Math.cos(legAngle) * 8;
      const attachY = spiderY + Math.sin(legAngle) * 8;

      const idealX = spiderX + Math.cos(legAngle) * leg.config.stepDist;
      const idealY = spiderY + Math.sin(legAngle) * leg.config.stepDist;

      const footDist = Math.hypot(leg.footX - idealX, leg.footY - idealY);

      const spiderSpeed = Math.hypot(spiderX - lastSpiderX, spiderY - lastSpiderY);
      const threshold = Math.max(leg.config.stepDist * (0.7 - spiderSpeed * 0.025), leg.config.stepDist * 0.35);

      // Trigger step
      if (!leg.isMoving && footDist > threshold && !legs[(i + 4) % 8].isMoving) {
        leg.isMoving = true;
        leg.targetX = idealX;
        leg.targetY = idealY;
        leg.stepProgress = 0;
      }

      // Move step
      if (leg.isMoving) {
        const speedFactor = 0.07 + spiderSpeed * 0.03;
        leg.stepProgress += speedFactor;

        if (leg.stepProgress >= 1) {
          leg.isMoving = false;
          leg.footX = leg.targetX;
          leg.footY = leg.targetY;
        } else {
          const t = leg.stepProgress;
          const ease = t < 0.5 ? 2*t*t : 1 - (Math.pow(-2*t + 2, 2) / 2);

          leg.footX += (leg.targetX - leg.footX) * ease;
          leg.footY += (leg.targetY - leg.footY) * ease;

          const lift = Math.sin(t * Math.PI) * stepHeight;
          leg.footY -= lift;
        }
      }

      const ik = inverseKinematics(
        attachX,
        attachY,
        leg.footX,
        leg.footY,
        leg.config.upperLength,
        leg.config.lowerLength,
        leg.config.side
      );

      // Upper leg
      const upperDist = Math.hypot(ik.jointX - attachX, ik.jointY - attachY);
      leg.upperLeg.style.left = attachX + "px";
      leg.upperLeg.style.top = attachY + "px";
      leg.upperLeg.style.width = upperDist + "px";
      leg.upperLeg.style.transform = `rotate(${Math.atan2(ik.jointY - attachY, ik.jointX - attachX)}rad)`;

      // Lower leg
      const lowerDist = Math.hypot(leg.footX - ik.jointX, leg.footY - ik.jointY);
      leg.lowerLeg.style.left = ik.jointX + "px";
      leg.lowerLeg.style.top = ik.jointY + "px";
      leg.lowerLeg.style.width = lowerDist + "px";
      leg.lowerLeg.style.transform = `rotate(${Math.atan2(leg.footY - ik.jointY, leg.footX - ik.jointX)}rad)`;

      // Foot dot
      leg.foot.style.left = leg.footX - 1.5 + "px";
      leg.foot.style.top = leg.footY - 1.5 + "px";
    });

    requestAnimationFrame(updateSpider);
  }

  updateSpider();
}


/* -------------------------------------------------------
   INIT
------------------------------------------------------- */
setupMouseTracking();
initSpider();
setupTiltEffects();
