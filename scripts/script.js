/* -------------------------------------------------------
   CONFIGURATION
------------------------------------------------------- */

// Sound volumes
const VOLUME = {
  mouseMove: 0.2,
  bubbleHover: 0.75
};

// Bubble spacing from viewport edges
const BUBBLE_PADDING = 20;

// Mouse movement sound cooldown
const MOVE_COOLDOWN = 50;

// Mouse repulsion radius + force
const MOUSE_REPEL = {
  maxDist: 400,
  forceScale: 0.25
};


/* -------------------------------------------------------
   SOUND SETUP (GLOBAL)
------------------------------------------------------- */

function loadSounds(paths, volume) {
  return paths.map(path => {
    const s = new Audio(path);
    s.volume = volume;
    return s;
  });
}

const hoverSound = new Audio("./sounds/stab.wav");
hoverSound.volume = 0.15;

const mouseMoveSounds = loadSounds([
  './sounds/woosh.wav',
  './sounds/woosh2.wav',
  './sounds/woosh4.wav'
], VOLUME.mouseMove);

const bubbleHoverSounds = loadSounds([
  './sounds/glass.wav',
  './sounds/glass2.wav',
  './sounds/glass3.wav',
  './sounds/glass4.wav',
  './sounds/glass5.wav',
  './sounds/glass6.wav',
  './sounds/glass7.wav'
], VOLUME.bubbleHover);


/* -------------------------------------------------------
   GLOBAL STATE
------------------------------------------------------- */

let bubbles = [];
let moving = false;
let moveTimeout = null;

const mouse = {
  x: window.innerWidth / 2,
  y: window.innerHeight / 2,
  active: false
};


/* -------------------------------------------------------
   UTILITY FUNCTIONS
------------------------------------------------------- */

// Random array item
const rand = arr => arr[Math.floor(Math.random() * arr.length)];

// Play a one-off sound (non-cutting)
function playOneShot(soundArray) {
  const original = rand(soundArray);
  const clone = original.cloneNode(true);
  clone.volume = original.volume;
  clone.play();
}

// Mouse movement sound (only play once per movement session)
function handleMouseMoveSound() {
  if (!moving) {
    moving = true;
    const s = rand(mouseMoveSounds);
    s.currentTime = 0;
    s.play().catch(() => {});
  }

  clearTimeout(moveTimeout);
  moveTimeout = setTimeout(() => {
    moving = false;
  }, MOVE_COOLDOWN);
}


/* -------------------------------------------------------
   BUBBLE CREATION
------------------------------------------------------- */

const PROJECT_IMAGES = [
  "./images/landing-images/barrier.png",
  "./images/landing-images/table.png",
  "./images/landing-images/chair.png",
  "./images/landing-images/chair2.png",
  "./images/landing-images/cone.png",
  "./images/landing-images/pencil.png",
  "./images/landing-images/pencil2.png",
  "./images/landing-images/pencil3.png",
  "./images/landing-images/pencil4.png",
  "./images/landing-images/knife.png",
  "./images/landing-images/knife2.png",
  "./images/landing-images/magnify.png",
  "./images/landing-images/magnify2.png",
  "./images/landing-images/eraser.png",
  "./images/landing-images/eraser2.png",
  "./images/landing-images/eraser3.png",
  "./images/landing-images/ruler.png",
  "./images/landing-images/hammer.png",
  "./images/landing-images/mug.png"
];


/* Create all floating project bubbles */
function createBubbles() {
  const container = document.querySelector('.floating-projects');

  PROJECT_IMAGES.forEach(src => {
    const img = document.createElement('img');
    img.classList.add('project-bubble');
    img.src = src;
    img.style.position = 'absolute';
    img.style.display = 'block';

    container.appendChild(img);

    const initialX = Math.random() * window.innerWidth;
    const initialY = Math.random() * window.innerHeight;

    const bubble = {
      el: img,
      x: initialX,
      y: initialY,
      vx: 0,
      vy: 0,
      width: 0,
      height: 0,
      homeX: initialX,
      homeY: initialY,
      homePX: initialX / window.innerWidth,
      homePY: initialY / window.innerHeight
    };

    bubbles.push(bubble);

    img.onload = () => {
      bubble.width = img.naturalWidth;
      bubble.height = img.naturalHeight;

      img.style.width = `${bubble.width}px`;
      img.style.height = `${bubble.height}px`;

      bubble.homeX = Math.random() * (window.innerWidth - bubble.width - BUBBLE_PADDING * 2) + BUBBLE_PADDING;
      bubble.homeY = Math.random() * (window.innerHeight - bubble.height - BUBBLE_PADDING * 2) + BUBBLE_PADDING;

      bubble.homePX = bubble.homeX / window.innerWidth;
      bubble.homePY = bubble.homeY / window.innerHeight;
    };
  });
}


/* -------------------------------------------------------
   SOUNDS
------------------------------------------------------- */

function setupBubbleHoverSounds() {
  document.querySelectorAll('.project-bubble').forEach(el => {
    el.addEventListener('mouseenter', () => playOneShot(bubbleHoverSounds));
  });
}

document.querySelectorAll("button, a").forEach(btn => {
  btn.addEventListener("mouseenter", () => {
    hoverSound.currentTime = 0; // rewind
    hoverSound.play();
  });
});


/* -------------------------------------------------------
   MOUSE TRACKING
------------------------------------------------------- */

function setupMouseTracking() {
  document.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;

    handleMouseMoveSound();
  });

  document.addEventListener('mouseleave', () => {
    mouse.active = false;
  });
}


/* -------------------------------------------------------
   BUBBLE ANIMATION LOOP
------------------------------------------------------- */

function animate() {
  const t = Date.now() * 0.001;

  bubbles.forEach((b, i) => {
    const wobbleX = Math.sin(t + i) * 6;
    const wobbleY = Math.cos(t * 0.8 + i) * 6;

    // Mouse repulsion
    if (mouse.active && b.width && b.height) {
      const dx = mouse.x - (b.x + b.width / 2);
      const dy = mouse.y - (b.y + b.height / 2);
      const dist = Math.hypot(dx, dy);

      if (dist < MOUSE_REPEL.maxDist) {
        const force = (1 - dist / MOUSE_REPEL.maxDist) * MOUSE_REPEL.forceScale;
        b.vx -= dx * force;
        b.vy -= dy * force;
      }
    }

    // Pull toward home
    b.vx += (b.homeX - b.x) * 0.002;
    b.vy += (b.homeY - b.y) * 0.002;

    // Damping
    b.vx *= 0.9;
    b.vy *= 0.9;

    // Apply velocity
    b.x += b.vx;
    b.y += b.vy;

    // Move DOM element
    b.el.style.transform = `translate(${b.x + wobbleX}px, ${b.y + wobbleY}px) rotate(${b.el.style.getPropertyValue('--hit-react') || '0deg'})`;

  });

  requestAnimationFrame(animate);
}


/* -------------------------------------------------------
   RESIZE HANDLING
------------------------------------------------------- */

function handleResize() {
  bubbles.forEach(b => {
    if (b.width && b.height) {
      b.homeX = b.homePX * window.innerWidth;
      b.homeY = b.homePY * window.innerHeight;

      b.homeX = Math.min(Math.max(b.homeX, 0), window.innerWidth - b.width);
      b.homeY = Math.min(Math.max(b.homeY, 0), window.innerHeight - b.height);
    }
  });
}

window.addEventListener('resize', handleResize);


/* -------------------------------------------------------
   SMALL RANDOM ROTATION EFFECTS
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

  document.querySelectorAll('a').forEach(applyTilt);
}

function hitReact() {
  const applyReact = el => {
    el.addEventListener('mouseenter', () => {
      el.style.setProperty('--hit-react', `360deg`);
    });
    el.addEventListener('mouseleave', () => {
      setTimeout(() => {
      el.style.setProperty('--hit-react', `0deg`);
      }, 600);
    });
  };

  document.querySelectorAll('.project-bubble').forEach(applyReact);
}


/* -------------------------------------------------------
   INIT
------------------------------------------------------- */

createBubbles();
createBubbles();
setupMouseTracking();
setupBubbleHoverSounds();
setupTiltEffects();
hitReact();
animate();
