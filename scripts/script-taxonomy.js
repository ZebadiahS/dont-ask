/* -------------------------------------------------------
   CONFIGURATION
------------------------------------------------------- */
const hoverSound = new Audio("./sounds/stab.wav");
hoverSound.volume = 0.2;

// Sound volumes
const VOLUME = {
  mouseMove: 0.2,
  bubbleHover: 0.75,
};

// Bubble spacing from viewport edges
const BUBBLE_PADDING = 20;

// Mouse movement sound cooldown
const MOVE_COOLDOWN = 100;

// Mouse repulsion radius + force
const MOUSE_REPEL = {
  maxDist: 350,
  forceScale: 0.25,
};

/* -------------------------------------------------------
   DESCRIPTION DISPLAY + AUDIO PLAYBACK
------------------------------------------------------- */

let currentTaxonomyAudio = null;

function showDescriptionAndPlayAudio(text, audioPath) {
  const box = document.getElementById("description-box");

  // Show text
  box.textContent = text;
  box.style.opacity = 1;

  // Stop any currently playing taxonomy sound
  if (currentTaxonomyAudio) {
    currentTaxonomyAudio.pause();
    currentTaxonomyAudio.currentTime = 0;
  }

  // Play new audio
  if (audioPath) {
    currentTaxonomyAudio = new Audio(audioPath);
    currentTaxonomyAudio.volume = 1;

    currentTaxonomyAudio
      .play()
      .catch((err) => console.error("Error playing taxonomy sound:", err));

    // Fade out box when audio ends
    currentTaxonomyAudio.onended = () => {
      box.style.opacity = 0;
    };
  }
}

/* -------------------------------------------------------
   SOUND SETUP (GLOBAL)
------------------------------------------------------- */

function loadSounds(paths, volume) {
  return paths.map((path) => {
    const s = new Audio(path);
    s.volume = volume;
    return s;
  });
}

const mouseMoveSounds = loadSounds(
  ["./sounds/woosh.wav", "./sounds/woosh2.wav", "./sounds/woosh4.wav"],
  VOLUME.mouseMove
);

const bubbleHoverSounds = loadSounds(
  [
    "./sounds/glass.wav",
    "./sounds/glass2.wav",
    "./sounds/glass3.wav",
    "./sounds/glass4.wav",
    "./sounds/glass5.wav",
    "./sounds/glass6.wav",
    "./sounds/glass7.wav",
  ],
  VOLUME.bubbleHover
);

/* -------------------------------------------------------
   GLOBAL STATE
------------------------------------------------------- */

let bubbles = [];
let moving = false;
let moveTimeout = null;

const mouse = {
  x: window.innerWidth / 2,
  y: window.innerHeight / 2,
  active: false,
};

/* -------------------------------------------------------
   UTILITY FUNCTIONS
------------------------------------------------------- */

// Random array item
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

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
  {
    keyword: "Interaction",
    description:
      "An occasion when two or more people or things communicate with or react to each other.",
    audioPath: "../taxonomy-sounds/interaction.wav",
  },
  {
    keyword: "Transformation",
    description:
      "Physically altering or creating an object or space by materializing an imagined expectation.",
    audioPath: "../taxonomy-sounds/transformation.wav",
  },
  {
    keyword: "Authorship",
    description:
      "Who creates place? Who is considered in the making of place? Whose place is revealed?",
    audioPath: "../taxonomy-sounds/authorship.wav",
  },
  {
    keyword: "Multi-layered",
    description:
      "Incorporating imagination, expectation, and memory into objects, locations, and experiences.",
    audioPath: "../taxonomy-sounds/multi-layered.wav",
  },
  {
    keyword: "Narrative",
    description: "Telling a story or delivering a message.",
    audioPath: "../taxonomy-sounds/narrative.wav",
  },

  {
    keyword: "Critique",
    description: "Questioning and challenging systems of power and control.",
    audioPath: "../taxonomy-sounds/critique.wav",
  },
  {
    keyword: "Perspective",
    description: "The angle from which a topic is approached or discussed.",
    audioPath: "../taxonomy-sounds/perspective.wav",
  },
  {
    keyword: "Exploration",
    description:
      "Engaging with ideas, imagination, and individual or collective experiences beyond the surface level.",
    audioPath: "../taxonomy-sounds/exploration.wav",
  },
  {
    keyword: "Resonance",
    description: "Connecting to human emotion and experience.",
    audioPath: "../taxonomy-sounds/resonance.wav",
  },
  {
    keyword: "Observation",
    description: "Engaging with the world on a deeper human-centered level.",
    audioPath: "../taxonomy-sounds/observation.wav",
  },
  {
    keyword: "Revealing",
    description: "To make visible the hidden layers under the surface.",
    audioPath: "../taxonomy-sounds/revealing.wav",
  },

  {
    keyword: "Creating",
    description:
      "Bringing speculation and imagination to life in a physical manner.",
    audioPath: "../taxonomy-sounds/creating.wav",
  },
  {
    keyword: "Discovery",
    description: "Learning through exploration and observation.",
    audioPath: "../taxonomy-sounds/discovery.wav",
  },
  {
    keyword: "Translation",
    description: "Taking abstract thought and bringing it to reality.",
    audioPath: "../taxonomy-sounds/translation.wav",
  },
  {
    keyword: "Engaging",
    description:
      "Something that grabs attention and is intertwined with experience.",
    audioPath: "../taxonomy-sounds/engaging.wav",
  },
];

/* -------------------------------------------------------
   CREATE FLOATING BUBBLES
------------------------------------------------------- */

function createBubbles() {
  const container = document.querySelector(".floating-projects");

  TAXONOMY.forEach((item) => {
    const bubbleEl = document.createElement("div");
    const buttonEl = document.createElement("button");
    buttonEl.classList.add("project-bubble");
    buttonEl.classList.add("button");
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

    // 🔊 SPEAK DESCRIPTION ON CLICK (also play taxonomy audio if provided)
    buttonEl.addEventListener("click", () => {
      showDescriptionAndPlayAudio(item.description, item.audioPath);
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
      homePY: initialY / window.innerHeight,
    };

    bubbles.push(bubble);

    // After layout, measure size
    requestAnimationFrame(() => {
      const rect = buttonEl.getBoundingClientRect();
      bubble.width = rect.width;
      bubble.height = rect.height;

      bubble.homeX =
        Math.random() *
          (window.innerWidth - bubble.width - BUBBLE_PADDING * 2) +
        BUBBLE_PADDING;

      bubble.homeY =
        Math.random() *
          (window.innerHeight - bubble.height - BUBBLE_PADDING * 2) +
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
  document.querySelectorAll(".project-bubble").forEach((el) => {
    el.addEventListener("mouseenter", () => playOneShot(bubbleHoverSounds));
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
  bubbles.forEach((b) => {
    if (b.width && b.height) {
      b.homeX = b.homePX * window.innerWidth;
      b.homeY = b.homePY * window.innerHeight;

      b.homeX = Math.min(Math.max(b.homeX, 0), window.innerWidth - b.width);
      b.homeY = Math.min(Math.max(b.homeY, 0), window.innerHeight - b.height);
    }
  });
}

window.addEventListener("resize", handleResize);

/* -------------------------------------------------------
   BUTTON HOVER SOUND
------------------------------------------------------- */

document.querySelectorAll("button, a").forEach((btn) => {
  btn.addEventListener("mouseenter", () => {
    hoverSound.currentTime = 0;
    hoverSound.play();
  });
});

/* -------------------------------------------------------
   TILT EFFECT
------------------------------------------------------- */

function setupTiltEffects() {
  const applyTilt = (el) => {
    el.addEventListener("mouseenter", () => {
      el.style.setProperty("--tilt", `${Math.random() * 10 - 5}deg`);
    });
    el.addEventListener("mouseleave", () =>
      el.style.setProperty("--tilt", `0deg`)
    );
  };

  document.querySelectorAll("a, .button").forEach(applyTilt);
}

/* -------------------------------------------------------
   INIT
------------------------------------------------------- */

createBubbles();
setupBubbleHoverSounds();
setupTiltEffects();
animate();
