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
  maxDist: 350,
  forceScale: 0.25
};


/* -------------------------------------------------------
   SPEECH SYNTHESIS WITH CUSTOM VOICE
------------------------------------------------------- */

let customVoice = null;

// Load available voices and select one
function loadCustomVoice(preferredName = "Google US English") {
  function setVoice() {
    const voices = speechSynthesis.getVoices();
    customVoice = voices.find(v => v.name === preferredName) || voices[0];
  }

  // Some browsers populate voices asynchronously
  speechSynthesis.onvoiceschanged = setVoice;
  setVoice();
}

function speakDescription(text) {
  if (!customVoice) return;

  // --- DISPLAY TEXT ---
  const box = document.getElementById("description-box");
  box.textContent = text;
  box.style.opacity = 1;

  // --- SPEAK TEXT ---
  speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.voice = customVoice;
  utter.rate = 1;
  utter.pitch = 1;
  utter.volume = 1;

  // Fade out after speaking
  utter.onend = () => {
    box.style.opacity = 0;
  };

  speechSynthesis.speak(utter);
}


// Call this once at the start
loadCustomVoice("Google US English"); // change to any available voice



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
   BUBBLE DATA
------------------------------------------------------- */

const TAXONOMY = [
  { keyword: "Interaction", description: "An occasion when two or more people or things communicate with or react to each other." },
  { keyword: "Transformation", description: "Physically altering or creating an object or space by materializing an imagined expectation." },
  { keyword: "Authorship", description: "Who creates place? Who is considered in the making of place? Whose place is revealed?" },
  { keyword: "Multi-layered", description: "Incorporating imagination, expectation, and memory into objects, locations, and experiences." },
  { keyword: "Narrative", description: "Telling a story or delivering a message." },

  { keyword: "Critique", description: "Questioning and challenging systems of power and control." },
  { keyword: "Perspective", description: "The angle from which a topic is approached or discussed." },
  { keyword: "Exploration", description: "Engaging with ideas, imagination, and individual or collective experiences beyond the surface level." },
  { keyword: "Resonance", description: "Connecting to human emotion and experience." },
  { keyword: "Observation", description: "Engaging with the world on a deeper human-centered level." },
  { keyword: "Revealing", description: "To make visible the hidden layers under the surface." },

  { keyword: "Creating", description: "Bringing speculation and imagination to life in a physical manner." },
  { keyword: "Discovery", description: "Learning through exploration and observation." },
  { keyword: "Translation", description: "Taking abstract thought and bringing it to reality." },
  { keyword: "Engaging", description: "Something that grabs attention and is intertwined with experience." },
];


/* -------------------------------------------------------
   CREATE FLOATING BUBBLES
------------------------------------------------------- */

function createBubbles() {
  const container = document.querySelector('.floating-projects');

  TAXONOMY.forEach(item => {
    const bubbleEl = document.createElement('div');
    const buttonEl = document.createElement('button');
    buttonEl.classList.add('project-bubble');
    buttonEl.classList.add('button');
    buttonEl.textContent = item.keyword;

    bubbleEl.style.position = "absolute";
    bubbleEl.style.display = "block";
    bubbleEl.style.whiteSpace = "nowrap";
    bubbleEl.style.width = "max-content";
    bubbleEl.style.height = "fit-content";

    buttonEl.style.position = "absolute";
    buttonEl.style.display = "block";
    buttonEl.style.whiteSpace = "nowrap";

    container.appendChild(bubbleEl);
    bubbleEl.appendChild(buttonEl);

    // 🔊 SPEAK DESCRIPTION ON CLICK
    buttonEl.addEventListener("click", () => {
      speakDescription(item.description);
    });

    // Store physics state
    const initialX = Math.random() * window.innerWidth;
    const initialY = Math.random() * window.innerHeight;

    const bubble = {
      el: bubbleEl,
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

    // After layout, measure size
    requestAnimationFrame(() => {
      const rect = buttonEl.getBoundingClientRect();
      bubble.width = rect.width;
      bubble.height = rect.height;

      bubble.homeX =
        Math.random() * (window.innerWidth - bubble.width - BUBBLE_PADDING * 2) +
        BUBBLE_PADDING;

      bubble.homeY =
        Math.random() * (window.innerHeight - bubble.height - BUBBLE_PADDING * 2) +
        BUBBLE_PADDING;

      bubble.homePX = bubble.homeX / window.innerWidth;
      bubble.homePY = bubble.homeY / window.innerHeight;
    });
  });
}


/* -------------------------------------------------------
   HOVER SOUNDS
------------------------------------------------------- */

function setupBubbleHoverSounds() {
  document.querySelectorAll('.project-bubble').forEach(el => {
    el.addEventListener('mouseenter', () => playOneShot(bubbleHoverSounds));
  });
}


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
   ANIMATION LOOP
------------------------------------------------------- */

function animate() {
  const t = Date.now() * 0.001;

  bubbles.forEach((b, i) => {
    const wobbleX = Math.sin(t + i) * 6;
    const wobbleY = Math.cos(t * 0.8 + i) * 6;

    b.vx += (b.homeX - b.x) * 0.002;
    b.vy += (b.homeY - b.y) * 0.002;

    b.vx *= 0.9;
    b.vy *= 0.9;

    b.x += b.vx;
    b.y += b.vy;

    b.el.style.transform = `translate(${b.x + wobbleX}px, ${b.y + wobbleY}px)`;
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
   TILT EFFECT
------------------------------------------------------- */

function setupTiltEffects() {
  const applyTilt = el => {
    el.addEventListener('mouseenter', () => {
      el.style.setProperty('--tilt', `${(Math.random() * 10) - 5}deg`);
    });
    el.addEventListener('mouseleave', () =>
      el.style.setProperty('--tilt', `0deg`)
    );
  };

  document.querySelectorAll('a, .button').forEach(applyTilt);
}


/* -------------------------------------------------------
   INIT
------------------------------------------------------- */

createBubbles();
setupMouseTracking();
setupBubbleHoverSounds();
setupTiltEffects();
animate();
