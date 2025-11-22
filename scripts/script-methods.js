/* -------------------------------------------------------
   GLOBAL STATE
------------------------------------------------------- */

const containerWidth = window.innerWidth;
const containerHeight = window.innerHeight;
const repelSound = new Audio("./sounds/chords.wav");
const hoverSound = new Audio("./sounds/stab.wav");
hoverSound.volume = 0.15;

let isInsideRepelZone = false;              // tracks state

const circles = [
  {
    el: document.getElementById("circle-physical"),
    x: 0, y: 0,
    vx: 0, vy: 0,
    radius: 200,
    homePX: 0.20, // 15% from left
    homePY: 0.5   // 50% from top
  },
  {
    el: document.getElementById("circle-imagined"),
    x: 0, y: 0,
    vx: 0, vy: 0,
    radius: 200,
    homePX: 0.80, // 85% from left
    homePY: 0.5
  }
];

const lived = document.getElementById("circle-lived");
let livedVisible = false;


const mouse = { x: window.innerWidth/2, y: window.innerHeight/2, active: false };

const MOUSE_REPEL = {
  maxDist: 400,
  forceScale: 0.04
};


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
      audio.volume = 1;      // reset for next play
      audio.pause();
      audio.currentTime = 0; // fully stop for next activation
    }
  }

  requestAnimationFrame(tick);
}


// Track mouse
document.addEventListener('mousemove', e => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
  mouse.active = true;
});

document.addEventListener('mouseleave', () => mouse.active = false);


function setInitialPositions() {
  circles.forEach(c => {
    c.x = c.homePX * window.innerWidth - c.radius;
    c.y = c.homePY * window.innerHeight - c.radius;
  });
}
setInitialPositions();

/* -------------------------------------------------------
   ANIMATION LOOP
------------------------------------------------------- */
function animate() {
  const t = Date.now() * 0.0025;

  circles.forEach((c, i) => {
    // Wobble effect
    const wobbleX = Math.sin(t + i) * 10;
    const wobbleY = Math.cos(t * 0.8 + i) * 10;

    // Mouse repulsion
    if (mouse.active) {
      const dx = mouse.x - (c.x + c.radius);
      const dy = mouse.y - (c.y + c.radius);
      const dist = Math.hypot(dx, dy);

      if (dist < MOUSE_REPEL.maxDist) {

        const force = (1 - dist / MOUSE_REPEL.maxDist) * MOUSE_REPEL.forceScale;
        c.vx += dx * force;
        c.vy += dy * force;

      }
    }

    // Pull toward initial position (centering)
    const homeX = (i === 0 ? 150 : window.innerWidth - 450);
    const homeY = window.innerHeight/2 - 150;
    c.vx += (c.homePX * window.innerWidth - c.radius - c.x) * 0.002;
    c.vy += (c.homePY * window.innerHeight - c.radius - c.y) * 0.002; 

    // Damping
    c.vx *= 0.9;
    c.vy *= 0.9;

    // Apply velocity
    c.x += c.vx;
    c.y += c.vy;

    // Move DOM element
    c.el.style.left = (c.x + wobbleX) + "px";
    c.el.style.top  = (c.y + wobbleY) + "px";
  });

  // Check overlap for Lived
  checkOverlap();

  requestAnimationFrame(animate);
}
animate();

/* -------------------------------------------------------
   CHECK OVERLAP
------------------------------------------------------- */
function checkOverlap() {
  const rectP = circles[0].el.getBoundingClientRect();
  const rectI = circles[1].el.getBoundingClientRect();

  const dx = (rectP.left + rectP.width/2) - (rectI.left + rectI.width/2);
  const dy = (rectP.top + rectP.height/2) - (rectI.top + rectI.height/2);
  const dist = Math.hypot(dx, dy);

  const overlapThreshold = (rectP.width/2 + rectI.width/2) * 0.75;

  // ---- Lived becomes visible (enter event) ----
  if (dist < overlapThreshold && !livedVisible) {

    livedVisible = true;

    lived.style.opacity = 1;
    lived.style.transform = "translate(-50%, -50%) scale(1)";

    // SOUND START
    repelSound.volume = 1;
    repelSound.play().catch(()=>{});

  }

  // ---- Lived becomes hidden (exit event) ----
  else if (dist >= overlapThreshold && livedVisible) {

    livedVisible = false;

    lived.style.opacity = 0;
    lived.style.transform = "translate(-50%, -50%) scale(0.9)";

    // SOUND STOP (fade-out)
    fadeOut(repelSound, 300);

  }
}

/* -------------------------------------------------------
   SOUNDS
------------------------------------------------------- */

document.querySelectorAll("button, a").forEach(btn => {
  btn.addEventListener("mouseenter", () => {
    hoverSound.currentTime = 0; // rewind
    hoverSound.play();
  });
});



function setupTiltEffects() {
  const applyTilt = el => {
    el.addEventListener('mouseenter', () => {
      el.style.setProperty('--tilt', `${(Math.random() * 10) - 5}deg`);
    });
    el.addEventListener('mouseleave', () => {
      el.style.setProperty('--tilt', `0deg`);
    });
  };

  document.querySelectorAll('a').forEach(applyTilt);
}

/* -------------------------------------------------------
   RESIZE HANDLING
------------------------------------------------------- */
window.addEventListener('resize', () => {
  setInitialPositions();
});

setupTiltEffects();
