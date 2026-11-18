import { sampleHeroEntrance, paintHeroPose, HERO_STRIDE_PX } from "./heroMotion";
// Adapted from megany128/portfolio SitePet.astro at 8aa5ecf65352f93ab4ddff07473c7cf85c8ef186.

  /*
    SitePet runtime. Walks, bumps off walls, speaks, and supports
    pointer-drag. The anchor element carries `transition:persist` so one
    RAF loop + global pointer listeners cover the whole site session.
  */
  export function startCloverRuntime() {
    if ((window as any).__sitePetInit) return;
    (window as any).__sitePetInit = true;

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    function el(): HTMLElement | null {
      return document.querySelector<HTMLElement>("[data-site-pet]");
    }

    function anchorEl(): HTMLElement | null {
      return document.querySelector<HTMLElement>("[data-pet-anchor]");
    }

    /*
      Parent the anchor just before the page footer (same trick as the hat
      rack). Once in flow with [data-anchored], sticky bottom:0 keeps it on
      the viewport's bottom edge until the footer scrolls in, then the
      footer pushes it up in normal flow — the compositor owns the motion,
      so the pet can't lag into the footer no matter how fast the scroll.
      Re-run on every ClientRouter swap: persist re-slots the anchor back
      to its original body-level position.
    */
    function anchorPet() {
      const a = anchorEl();
      if (!a) return;
      const footer = document.querySelector<HTMLElement>("footer[data-footer-root]");
      if (footer && footer.parentElement) {
        if (a.nextElementSibling !== footer) footer.parentElement.insertBefore(a, footer);
        a.setAttribute("data-anchored", "");
      } else {
        a.removeAttribute("data-anchored"); // fixed fallback on footer-less pages
      }
    }

    // Viewport-Y of the pet's resting baseline: the anchor's bottom edge —
    // the viewport bottom normally, the footer's top when the footer is in
    // view. Re-measured once per frame in tick(); every viewport-coordinate
    // conversion below uses this instead of window.innerHeight.
    let groundBase = window.innerHeight;
    function measureGroundBase() {
      const a = anchorEl();
      groundBase = (a ? a.getBoundingClientRect().bottom : window.innerHeight) - 6;
    }

    const PET_W = 72;
    const PET_H = 90;
    const _MARGIN_R = 12;
    const SPEED = 34; // px / sec

    // Quips keyed by event. Picked at random each time.
    const BUMP_PHRASES = ["ow!", "oof", "ouch!", "argh", "oof!"];
    // Click quips escalate as the user pokes the pet repeatedly. The
    // `clickCount` decays (resets) after ~5s of no clicks so the pet
    // returns to being friendly once left alone.
    const CLICK_PHRASES_MILD = ["heya!", "hi there", "sup", "yo", "oh hi"];
    const CLICK_PHRASES_MEH = ["still here", "again?", "hi again", "yes?", "pspsps"];
    const CLICK_PHRASES_ANNOYED = [
      "why do you keep\npoking me?",
      "stop that",
      "okay okay",
      "quit it",
      "enough.",
    ];
    const CLICK_PHRASES_DONE = ["rude.", "really?", "ow.", "i'm not a button", "stop!"];
    function clickPool(count: number): string[] {
      if (count <= 2) return CLICK_PHRASES_MILD;
      if (count <= 4) return CLICK_PHRASES_MEH;
      if (count <= 7) return CLICK_PHRASES_ANNOYED;
      return CLICK_PHRASES_DONE;
    }
    // Global poke count — fetched once, incremented optimistically on click.
    let globalPokes = 0;
    let pokeQuipUsed = false;
    let sessionClicks = 0;
    try { globalPokes = Number(localStorage.getItem("sitepet:pokes")) || 0; } catch {}

    const HOVER_PHRASES = ["what's up?", "hi!", "oh hey", "howdy", "sup?", "hello"];
    const DRAG_PHRASES = [
      "where are you\ntaking me?",
      "put me down!",
      "wheeee",
      "careful, careful",
      "oh no",
    ];
    const DROP_PHRASES = ["phew", "back to it", "thanks i guess", "okay okay"];
    const DIZZY_PHRASES = ["whoaa....", "ugh.", "...stars", "head spinny"];
    const IDLE_PHRASES = [
      "hi there",
      "friendly neighborhood patrol",
      "dum de dum",
      "anyone there?",
      "hmm",
      "psst",
      "megan hasn't fed me\nin three days",
      "have you tried putting\na hat on me yet?",
      "i bet i could stand\non one of those...",
      "try dropping me\non something!",
    ];
    const CASE_STUDY_PHRASES = [
      "ooh interesting",
      "wow she made this??",
      "this is so cool",
      "i'm learning things",
      "tell me more",
      "fascinating",
      "i love this project",
    ];
    // Page-specific case study extras (merged with generic pool)
    const CASE_STUDY_PAGE_PHRASES: Record<string, string[]> = {
      "/work/sklonuj": ["i want to learn a\nnew language now"],
    };
    const PLAYGROUND_PHRASES = [
      "whooaaa",
      "what's gonna be here?",
      "curious...",
      "coming soon huh",
      "i wanna play!",
      "the stars are pretty",
      "feels cosmic in here",
      "are we in space??",
    ];
    const ABOUT_PHRASES = [
      "wow a sticker shop?!?",
      "brandon sanderson fan!\ngood taste",
      "she plays hades?? nice",
      "terraforming mars is\nso good",
      "ooh arcane",
      "malaysia sounds cool",
      "so many communities",
      "arcs is my fave too",
    ];
    const GALLERY_PHRASES = [
      "so many visitors!",
      "ooh who's this one",
      "i wonder who'll\ncome next",
      "look at all\nthese people",
      "everyone has\nsuch cool colors",
      "am i a visitor too?",
      "it's a party in here",
      "the gallery is growing!",
    ];
    const LEDGE_LAND_PHRASES = [
      "nice view up here",
      "i can see everything!",
      "ooh a perch",
      "cozy spot",
      "i live here now",
      "higher ground!",
      "king of the hill",
      "don't look down",
    ];
    const LEDGE_IDLE_PHRASES = [
      "kinda high up huh",
      "wonder what's below",
      "living on the edge",
      "i'm supervising",
      "overseeing operations",
      "this is my domain now",
      "megan can't reach me\nup here",
      "contemplating existence",
    ];
    // Context-specific perch phrases keyed by selector match
    const PERCH_CONTEXT: { match: string; phrases: string[] }[] = [
      {
        match: "[data-toc]",
        phrases: [
          "i'm the explore guide now",
          "which page next?",
          "navigation assistant\nreporting for duty",
          "pick a page, any page",
        ],
      },
      {
        match: "[data-latest-log]",
        phrases: [
          "ooh fresh updates",
          "breaking news!",
          "i'm on top of\nthe news",
          "latest scoop right here",
        ],
      },
      {
        match: ".index-card",
        phrases: [
          "this project looks cool",
          "i'm guarding this one",
          "click it! click it!",
          "megan worked hard\non this",
          "i helped (i didn't)",
        ],
      },
      {
        match: "[data-portrait]",
        phrases: [
          "nice photo!",
          "she's so photogenic",
          "sitting on her head hehe",
          "portrait guardian",
        ],
      },
      {
        match: "[data-community-card]",
        phrases: ["ooh a club!", "megan's so involved", "community vibes", "she's busy huh"],
      },
      {
        match: "[data-fave]",
        phrases: [
          "good taste confirmed",
          "i approve of this pick",
          "ooh what's this one?",
          "megan's favorites\nare elite",
        ],
      },
      {
        match: "[data-mini-card-wrap]",
        phrases: ["hi visitor!", "whose card is this?", "nice color choice", "welcome welcome"],
      },
      {
        match: ".cs-solution-card",
        phrases: [
          "smart solution",
          "design brain activated",
          "this is clever",
          "i see what she did here",
        ],
      },
      {
        match: ".cs-hero, [data-clover-ledge]",
        phrases: [
          "hero shot! dramatic",
          "big picture energy",
          "the main event",
          "sitting on the banner",
        ],
      },
      {
        match: ".cs-phone",
        phrases: ["tiny phone! cute", "can i download this?", "app looks nice", "mobile vibes"],
      },
      {
        match: ".cs-feature-tile",
        phrases: ["feature spotted", "ooh what's this do?", "fancy feature", "reading the specs"],
      },
      {
        match: ".cs-reflection-tile",
        phrases: ["reflective moment", "deep thoughts", "she learned things!", "growth mindset"],
      },
    ];
    const LEDGE_FALL_PHRASES = [
      "AHHH",
      "woah woah woah—",
      "not again!",
      "gravity why",
      "i slipped!!",
      "floor is lava— wait no",
      "mayday mayday",
      "aaand down we go",
    ];

    let x = Math.max(8, Math.min(document.documentElement.clientWidth - PET_W - 8, window.innerWidth * .73));
    let y = 0; // height above ground, px
    let yVel = 0; // vertical velocity (px/sec) — gravity-based
    let xVel = 0; // horizontal launch velocity after a throw
    let groundOffset = 0; // lift above the anchor baseline (ledge height when perched)
    let dir: 1 | -1 = 1;
    let lastT = performance.now();
    let hovered = false;
    let dragging = false;
    let pressActive = false;
    let pressStart: { x: number; y: number; t: number } | null = null;
    let dragPointerId: number | null = null;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    let leftWall = 0;
    let rightWall = 0;
    let lastBumpAt = 0;
    let bubbleTimer = 0;
    let blinkTimeoutId = 0;
    let idleTimeoutId = 0;
    let idleFirstTimeoutId = 0;
    let lastPointerX = -9999;
    let lastPointerY = -9999;
    let hoverTimer = 0;
    let dizzy = false;
    let dizzyUntil = 0;
    let clickCount = 0;
    let lastClickAt = 0;
    let freeRoam = true; // unlocked after the user first drags the pet into
    // the main content area
    let shakeSamples: number[] = []; // timestamps of direction flips
    let lastShakeDx = 0;
    // Pointer velocity tracking — feeds the launch velocity on drop so a
    // quick flick actually throws the pet instead of dropping it.
    let ptrHistory: { t: number; x: number; y: number }[] = [];

    // Ledge system — pet can be dropped onto DOM elements and walk on them.
    const LEDGE_SELECTORS = [
      // Home
      "[data-toc], .index-card, [data-latest-log]",
      // About
      "[data-portrait], [data-community-card], [data-fave]",
      // Visitor Gallery
      "[data-mini-card-wrap]",
      // Case studies
      ".cs-solution-card, .cs-feature-tile, .cs-phone, .cs-reflection-tile",
      ".cs-hero, [data-clover-ledge]",
    ].join(", ");

    // Cached ledge candidate list — avoids querySelectorAll every frame.
    let ledgeCache: HTMLElement[] = [];
    let ledgeCacheDirty = true;
    let ledgeScanFrame = 0;
    const LEDGE_SCAN_INTERVAL = 4; // only scan for ledges every Nth frame

    function refreshLedgeCache() {
      ledgeCache = Array.from(document.querySelectorAll<HTMLElement>(LEDGE_SELECTORS));
      ledgeCacheDirty = false;
    }
    function invalidateLedgeCache() { ledgeCacheDirty = true; }
    window.addEventListener("hashchange", invalidateLedgeCache);
    window.addEventListener("gallery:shuffle", invalidateLedgeCache);
    window.addEventListener("gallery:cards-added", invalidateLedgeCache);

    function getLedgeCandidates(): HTMLElement[] {
      if (ledgeCacheDirty) refreshLedgeCache();
      return ledgeCache;
    }
    let currentLedge: HTMLElement | null = null; // element the pet is perched on
    let ledgeGroundY = 0; // viewport-bottom-relative ground when on a ledge
    let ledgeLeftWall = 0;
    let ledgeRightWall = 0;
    const LEDGE_FALL_CHANCE = 0.03; // 3% chance to slip off on wall bump
    let isScrolling = false;
    let lastLedgeTop = 0; // track ledge vertical position for wobble detection
    let ledgeWobbleAccum = 0; // accumulated scroll movement while perched
    let lastWobbleQuipAt = 0; // throttle wobble quips
    const LEDGE_WOBBLE_PHRASES = [
      "w-woah!",
      "hey! steady!",
      "earthquake!!",
      "whoaaa",
      "i'm gonna fall!",
      "hold on hold on",
      "the ground is moving!",
      "stop scrolling!",
      "ahhh shaky!",
      "too wobbly!!",
    ];

    const JUMP_GAP_MAX = 120; // max horizontal gap (px) between ledges to attempt a jump
    const JUMP_HEIGHT_MAX = 80; // max vertical difference to jump up/down
    let lastJumpAt = 0; // cooldown so pet doesn't chain-jump instantly
    const JUMP_COOLDOWN = 2000; // ms to walk on a ledge before jumping again

    /**
     * Find the nearest ledge adjacent to the current one in the given
     * direction (1 = right, -1 = left). Returns null if nothing is close
     * enough to jump to.
     */
    function findAdjacentLedge(direction: 1 | -1): HTMLElement | null {
      if (!currentLedge) return null;
      if (performance.now() - lastJumpAt < JUMP_COOLDOWN) return null;
      const cur = currentLedge.getBoundingClientRect();
      const candidates = getLedgeCandidates();
      let best: HTMLElement | null = null;
      let bestDist = Infinity;
      for (const el of candidates) {
        if (el === currentLedge) continue;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        // Vertical difference between ledge tops — must be reachable
        const vDiff = Math.abs(r.top - cur.top);
        if (vDiff > JUMP_HEIGHT_MAX) continue;
        // Horizontal gap in the walk direction
        let gap: number;
        if (direction === 1) {
          // Walking right — gap from current right edge to next left edge
          gap = r.left - cur.right;
        } else {
          // Walking left — gap from next right edge to current left edge
          gap = cur.left - r.right;
        }
        // Must be ahead (positive gap) and within range
        if (gap < -10 || gap > JUMP_GAP_MAX) continue;
        if (gap < bestDist) {
          best = el;
          bestDist = gap;
        }
      }
      return best;
    }

    const JUMP_PHRASES = [
      "wheee!",
      "parkour!",
      "boing!",
      "hop hop",
      "watch this!",
      "nailed it",
      "comin through!",
    ];

    /**
     * Launch the pet in an arc toward an adjacent ledge. The mid-flight
     * catch system handles the actual landing.
     */
    function jumpToLedge(target: HTMLElement, direction: 1 | -1) {
      const cur = currentLedge!.getBoundingClientRect();
      const dest = target.getBoundingClientRect();
      // Horizontal distance to cover (center-to-center of the gap)
      const hDist =
        direction === 1
          ? dest.left + dest.width / 2 - (cur.right - PET_W / 2)
          : cur.left + PET_W / 2 - (dest.right - dest.width / 2);
      // Vertical difference (positive = target is higher)
      const vDiff = cur.top - dest.top;
      // Dismount current ledge — preserve absolute position.
      // Pet is at y=0 on ledge whose surface is ledgeGroundY from viewport bottom.
      // Convert to floor-relative y so pet stays at same screen position.
      const ledgeAltitude = groundOffset; // ledgeGroundY was already in groundOffset
      currentLedge = null;
      ledgeGroundY = 0;
      groundOffset = 0;
      // Altitude above the anchor baseline is unchanged — the sticky anchor
      // already accounts for the footer, so no footer math here.
      y = Math.max(0, ledgeAltitude);
      // Calculate arc velocity — time-of-flight ~0.45s
      const tFlight = 0.45;
      xVel = (hDist / tFlight) * direction;
      // Need enough upward velocity to clear the height difference + arc peak
      const peakExtra = 40 + Math.max(0, vDiff); // extra height for nice arc
      // v = sqrt(2 * g * peakHeight), using g=3200 (rising gravity)
      yVel = Math.sqrt(2 * 3200 * peakExtra);
      fallSuspended = false;
      lastJumpAt = performance.now();
      measureWalls();
      const pet = el();
      if (pet) {
        pet.removeAttribute("data-on-clickable");
        saySomething(pet, JUMP_PHRASES, 1400);
      }
    }

    function findLedgeAtPosition(px: number, py: number): HTMLElement | null {
      // Find all ledge elements and check if the pet's feet overlap any.
      const candidates = getLedgeCandidates();
      let best: HTMLElement | null = null;
      let bestDist = Infinity;
      for (const el of candidates) {
        const r = el.getBoundingClientRect();
        // Pet feet position: px is left edge, py is bottom of pet (feet).
        // Check horizontal overlap: pet center within element bounds
        const petCenter = px + PET_W / 2;
        if (petCenter < r.left - 10 || petCenter > r.right + 10) continue;
        // Skip elements whose top is far from the pet's feet position
        if (Math.abs(r.top - py) > 50) continue;
        // Check vertical: pet feet should be near the top edge of element
        // (within 30px above or 15px below the top)
        const distToTop = Math.abs(py - r.top);
        if (distToTop < 30 && distToTop < bestDist) {
          best = el;
          bestDist = distToTop;
        }
      }
      return best;
    }

    function mountLedge(ledge: HTMLElement) {
      currentLedge = ledge;
      lastLedgeTop = ledge.getBoundingClientRect().top;
      ledgeWobbleAccum = 0;
      updateLedgeBounds();
      // Flag for extra hit slop when perched on clickable elements
      const pet = el();
      if (pet) {
        if (ledge.matches("a, [data-cursor]")) {
          pet.setAttribute("data-on-clickable", "");
        } else {
          pet.removeAttribute("data-on-clickable");
        }
      }
    }

    function updateLedgeBounds() {
      if (!currentLedge) return;
      const r = currentLedge.getBoundingClientRect();
      // Detect vertical movement of ledge (scrolling) for wobble quips
      const newTop = r.top;
      if (lastLedgeTop !== 0) {
        const delta = Math.abs(newTop - lastLedgeTop);
        if (delta > 1) {
          ledgeWobbleAccum += delta;
          const now = performance.now();
          // Trigger wobble quip after 40px of accumulated movement, throttled to every 3s
          if (ledgeWobbleAccum > 40 && now - lastWobbleQuipAt > 3000) {
            const pet = el();
            if (pet && !dragging && !dizzy) {
              saySomething(pet, LEDGE_WOBBLE_PHRASES, 1600);
              lastWobbleQuipAt = now;
            }
            ledgeWobbleAccum = 0;
          }
        }
      }
      lastLedgeTop = newTop;
      // Ground offset from the anchor baseline up to the ledge's top edge
      ledgeGroundY = groundBase - r.top;
      // Walk walls = ledge horizontal bounds (with padding)
      ledgeLeftWall = Math.max(0, r.left + 4);
      ledgeRightWall = Math.max(ledgeLeftWall + 4, r.right - PET_W - 4);
    }

    let fallSuspended = false; // true during the "hang time" before a ledge fall
    let fallResumeAt = 0;
    // Cooldown so the pet doesn't immediately re-mount onto a neighboring
    // ledge mid-flight after falling off one — that creates a quip loop on
    // dense pages like the visitor gallery.
    let lastDismountAt = 0;
    let lastLedgeFallSpokenAt = 0;

    function dismountLedge() {
      // Convert current absolute position to ground-relative y so pet
      // doesn't teleport — it should fall from where it was.
      const oldGroundOffset = ledgeGroundY;
      currentLedge = null;
      ledgeGroundY = 0;
      lastDismountAt = performance.now();
      const pet = el();
      if (pet) pet.removeAttribute("data-on-clickable");
      // Pet was at y=0 relative to the ledge surface, oldGroundOffset above
      // the anchor baseline — that altitude carries over unchanged (the
      // sticky anchor owns the footer offset now).
      const rawY = Math.max(0, oldGroundOffset + y);
      // If pet would start above viewport, give it initial downward velocity
      // so it enters the screen already moving fast (no appearing-then-falling).
      const viewportTop = groundBase - PET_H;
      if (rawY > viewportTop) {
        y = rawY;
        // Pre-calculate velocity needed to look like it's been falling
        // from above: v = sqrt(2 * g * distance_above_viewport)
        const distAbove = rawY - viewportTop;
        fallSuspended = false;
        yVel = -Math.sqrt(2 * 9000 * distAbove); // already at speed
      } else {
        y = rawY;
        // Cartoon coyote moment — freeze 350ms, then plummet.
        fallSuspended = true;
        fallResumeAt = performance.now() + 350;
        yVel = 0;
      }
      measureWalls();
    }

    /*
      Pet starts confined to the sidebar — walks between its left and right
      inner edges. Once the user drags it into the main area for the first
      time, `freeRoam` unlocks and the walls expand to the full viewport.
    */
    function measureWalls() {
      // clientWidth, not innerWidth — the pet is clipped at the body's edge
      // (overflow-x: clip), which excludes any classic scrollbar gutter.
      const vw = document.documentElement.clientWidth;
      if (freeRoam) {
        leftWall = 8;
        rightWall = vw - PET_W - 8;
        return;
      }
      const sidebar = document.querySelector<HTMLElement>(".site-sidebar");
      let L = 8;
      let R = vw - PET_W - 8;
      if (sidebar) {
        const r = sidebar.getBoundingClientRect();
        if (r.right > 0 && r.left < vw) {
          L = Math.max(8, r.left + 8);
          R = Math.min(vw - PET_W - 8, r.right - PET_W - 8);
        }
      }
      leftWall = L;
      rightWall = Math.max(L + 4, R);
    }

    // Attempt to restore free-roam preference across sessions.
    try {
      freeRoam = localStorage.getItem("sitepet:freeRoam") !== "0";
    } catch {}
    measureWalls();
    window.addEventListener("resize", measureWalls, { passive: true });

    function clamp(v: number, lo: number, hi: number) {
      return Math.max(lo, Math.min(hi, v));
    }

    // If dizzy, override any quip pool with dizzy phrases.
    function dizzyOr(pool: string[]): string[] {
      return dizzy ? DIZZY_PHRASES : pool;
    }

    let bubbleNudgeRaf = 0;
    function clampBubbleNudge(bubble: HTMLElement) {
      // Reset to 0, measure, then re-apply the clamp. Without resetting the
      // measured rect would already include the previous frame's shift.
      bubble.style.setProperty("--bubble-shift-x", "0px");
      const r = bubble.getBoundingClientRect();
      const PAD = 8;
      let shift = 0;
      if (r.left < PAD) shift = PAD - r.left;
      else if (r.right > document.documentElement.clientWidth - PAD)
        shift = document.documentElement.clientWidth - PAD - r.right;
      if (shift !== 0) bubble.style.setProperty("--bubble-shift-x", `${shift}px`);
    }

    function saySomething(pet: HTMLElement, pool: string[], ms = 1800) {
      const bubble = pet.querySelector<HTMLElement>("[data-pet-bubble]");
      if (!bubble) return;
      const phrase = pool[Math.floor(Math.random() * pool.length)];
      if (phrase.includes("\n")) {
        bubble.innerHTML = phrase.replace(/\n/g, "<br>");
      } else {
        bubble.textContent = phrase;
      }
      bubble.style.setProperty("--bubble-shift-x", "0px");
      bubble.setAttribute("data-show", "");
      // Continuously re-clamp while the bubble is visible — the pet keeps
      // walking, so a bubble that fit at show-time can drift offscreen.
      if (bubbleNudgeRaf) cancelAnimationFrame(bubbleNudgeRaf);
      const tick = () => {
        if (!bubble.hasAttribute("data-show")) {
          bubbleNudgeRaf = 0;
          return;
        }
        clampBubbleNudge(bubble);
        bubbleNudgeRaf = requestAnimationFrame(tick);
      };
      bubbleNudgeRaf = requestAnimationFrame(tick);
      if (bubbleTimer) window.clearTimeout(bubbleTimer);
      bubbleTimer = window.setTimeout(() => {
        bubble.removeAttribute("data-show");
        bubble.style.setProperty("--bubble-shift-x", "0px");
      }, ms);
    }

    // Tracks whether the pet has already "met" each wall — the first
    // bump always speaks, subsequent bumps speak rarely so the pet
    // doesn't become a chatterbox every time it paces the sidebar.
    let bumpedLeft = false;
    let bumpedRight = false;

    function bump(pet: HTMLElement, direction: 1 | -1) {
      // On a ledge edge — just turn around silently, no bump animation/quip.
      if (currentLedge) return;

      const now = performance.now();
      if (now - lastBumpAt < 600) return;
      lastBumpAt = now;
      pet.style.setProperty("--pet-bump-dir", direction === 1 ? "1" : "-1");
      pet.setAttribute("data-bump", "");
      window.setTimeout(() => pet.removeAttribute("data-bump"), 420);

      // First time hitting this side: always speak. After that: 5% chance
      // (reduced now that context quips provide most personality).
      const side = direction === 1 ? "left" : "right";
      const firstTime = side === "left" ? !bumpedLeft : !bumpedRight;
      if (firstTime) {
        if (side === "left") bumpedLeft = true;
        else bumpedRight = true;
      }
      if (firstTime || Math.random() < 0.05) {
        saySomething(pet, BUMP_PHRASES, 1400);
      }
    }

    /*
      Ground = the anchor baseline (y=0) unless perched on a ledge. The
      footer no longer contributes here — the sticky anchor handles it in
      CSS, which is the whole point of the fix.
    */
    function measureGround() {
      if (currentLedge) {
        updateLedgeBounds();
        const r = currentLedge.getBoundingClientRect();
        // Only dismount after scroll settles — prevents glitchy mid-scroll drops.
        // While scrolling, just track the ledge position silently.
        const petTopVP = r.top - PET_H;
        const offScreen =
          petTopVP < -20 || r.top > window.innerHeight + 10 || r.width === 0 || r.height === 0;
        if (!dragging && offScreen && !isScrolling) {
          const pet = el();
          if (pet && performance.now() - lastLedgeFallSpokenAt > 4000) {
            saySomething(pet, dizzyOr(LEDGE_FALL_PHRASES), 1800);
            lastLedgeFallSpokenAt = performance.now();
          }
          dismountLedge();
          groundOffset = 0;
          return;
        }
        groundOffset = ledgeGroundY;
      } else {
        groundOffset = 0;
      }
    }

    // One entrance per tab session. The existing loop owns all animation.
    let entryDone = !!reduced;
    try { entryDone ||= sessionStorage.getItem("hero:entered") === "1"; } catch {}
    let entryStartedAt: number | null = null;
    let entryWalkAt = 0;
    let gaitPhase = 0;
    let lastPoseX = x;
    let landingAt = -1000;
    const web = document.querySelector<HTMLElement>("[data-hero-web]");
    const webAnchorX = x + 56 * .9;
    let releaseWebLength = 0;
    const firstPet = el();
    firstPet?.setAttribute("data-entry", entryDone ? "walking" : "waiting");
    if (entryDone && web) web.hidden = true;

    let petRafId = 0;

    function tick(now: number) {
      const dt = Math.min(48, now - lastT);
      lastT = now;
      const pet = el();
      if (!pet) {
        petRafId = requestAnimationFrame(tick);
        return;
      }
      measureGroundBase();
      // Wait for the portfolio's existing intro to finish before entering.
      if (!entryDone) {
        if (window.__introActive) { petRafId = requestAnimationFrame(tick); return; }
        if (entryStartedAt === null) entryStartedAt = now;
        const elapsed = now - entryStartedAt;
        const pose = sampleHeroEntrance(elapsed, groundBase);
        if (pet.dataset.entry !== pose.stage) pet.dataset.entry = pose.stage;
        if (pose.stage !== "walking") {
          x = webAnchorX - 56 * .9 + pose.sway;
          y = groundBase - pose.feet;
          pet.style.setProperty("--pet-x", `${x}px`);
          pet.style.setProperty("--pet-y", `${y}px`);
          pet.style.setProperty("--pet-ground", "0px");
          pet.style.setProperty("--hero-sway", `${pose.sway * .6}deg`);
          paintHeroPose(pet, 0, false, pose.compression, pose.tethered || pose.stage === "falling", !!reduced);
          if (web) {
            const handY = Math.max(0, pose.feet - PET_H + 4);
            if (pose.tethered) releaseWebLength = handY;
            web.style.left = `${webAnchorX}px`;
            web.style.height = `${(pose.tethered ? handY : releaseWebLength * pose.web)}px`;
            web.style.transform = `rotate(${-Math.atan2(pose.sway, Math.max(1, handY))*180/Math.PI}deg)`;
            web.hidden = pose.web <= 0;
          }
          petRafId = requestAnimationFrame(tick);
          return;
        }
        entryDone = true;
        entryWalkAt = now;
        y = 0; yVel = 0; lastPoseX = x;
        if (web) web.hidden = true;
        try { sessionStorage.setItem("hero:entered", "1"); } catch {}
      }
      measureGround();
      pet.style.setProperty("--pet-ground", `${groundOffset}px`);
      const now2 = now;
      const inDizzy = dizzy && now2 < dizzyUntil;
      if (dizzy && now2 >= dizzyUntil) {
        dizzy = false;
        pet.removeAttribute("data-dizzy");
        const emotesLayer = pet.querySelector<HTMLElement>("[data-pet-emotes]");
        emotesLayer?.querySelectorAll(".site-pet-spin-star").forEach((s) => s.remove());
      }

      if (!hovered && !dragging && !reduced && !inDizzy) {
        const step = SPEED * (dt / 1000) * Math.min(1, (now - entryWalkAt) / 500);
        // Use ledge walls when perched, otherwise normal walls.
        const wL = currentLedge ? ledgeLeftWall : leftWall;
        const wR = currentLedge ? ledgeRightWall : rightWall;
        // If the pet ended up outside its current walls (after a throw /
        // resize / sidebar collapse) walk it back toward the nearest wall
        // until it's inside again, then resume the normal bounce cycle.
        if (x < wL) {
          x = Math.min(wL, x + step);
          dir = 1;
        } else if (x > wR) {
          x = Math.max(wR, x - step);
          dir = -1;
        } else {
          // Carry any residual launch velocity first, then fall back to
          // the steady walking speed.
          if (Math.abs(xVel) > 8) {
            x += xVel * (dt / 1000);
            xVel *= Math.pow(0.04, dt / 1000);
            dir = xVel >= 0 ? 1 : -1;
          } else {
            xVel = 0;
            x += dir * step;
          }
          if (x <= wL) {
            x = wL;
            if (dir === -1) {
              if (currentLedge) {
                // Try jumping to adjacent ledge first
                const neighbor = findAdjacentLedge(-1);
                if (neighbor) {
                  jumpToLedge(neighbor, -1);
                } else if (Math.random() < LEDGE_FALL_CHANCE) {
                  if (performance.now() - lastLedgeFallSpokenAt > 4000) {
                    saySomething(pet, dizzyOr(LEDGE_FALL_PHRASES), 1800);
                    lastLedgeFallSpokenAt = performance.now();
                  }
                  dismountLedge();
                }
              } else {
                bump(pet, 1);
              }
            }
            dir = 1;
          } else if (x >= wR) {
            x = wR;
            if (dir === 1) {
              if (currentLedge) {
                const neighbor = findAdjacentLedge(1);
                if (neighbor) {
                  jumpToLedge(neighbor, 1);
                } else if (Math.random() < LEDGE_FALL_CHANCE) {
                  if (performance.now() - lastLedgeFallSpokenAt > 4000) {
                    saySomething(pet, dizzyOr(LEDGE_FALL_PHRASES), 1800);
                    lastLedgeFallSpokenAt = performance.now();
                  }
                  dismountLedge();
                }
              } else {
                bump(pet, -1);
              }
            }
            dir = -1;
          }
        }
      }

      /*
        Vertical physics — constant-acceleration gravity with a small
        elastic bounce on landing. Feels heavier + more predictable than a
        spring, and makes both scroll-jolts and post-drag drops land
        convincingly.
      */
      if (!dragging) {
        // Hang time after ledge fall — freeze in air briefly, then kick.
        if (fallSuspended) {
          if (now >= fallResumeAt) {
            fallSuspended = false;
            yVel = 0; // start from zero — gravity does the work
          }
          // While suspended: no gravity, no movement — cartoon hang.
        } else {
          const dtSec = dt / 1000;
          // Use much heavier gravity after a ledge fall so it reads as
          // genuine freefall (accelerates dramatically) not a push.
          const isFallingFromLedge = !currentLedge && yVel <= 0 && y > 40;
          const g = yVel > 0 ? 2000 : isFallingFromLedge ? 9000 : 3200;
          yVel -= g * dtSec;
          y += yVel * dtSec;

          // Mid-flight ledge catch — while falling (not on a ledge already),
          // check if the pet's feet cross through a ledge surface this frame.
          // Throttled to every Nth frame to avoid per-frame querySelectorAll on
          // pages with many ledge candidates (e.g. visitor gallery).
          ledgeScanFrame = (ledgeScanFrame + 1) % LEDGE_SCAN_INTERVAL;
          // Skip the catch for ~700ms after a forced dismount so the pet
          // actually falls instead of grabbing a neighbor and looping
          // through fall-quips on dense pages.
          const recentDismount = performance.now() - lastDismountAt < 700;
          if (!currentLedge && yVel < 0 && !dizzy && !recentDismount && ledgeScanFrame === 0) {
            const petFeetVP = groundBase - groundOffset - y;
            const ledge = findLedgeAtPosition(x, petFeetVP);
            if (ledge) {
              const r = ledge.getBoundingClientRect();
              // Only catch if pet is descending past the top edge (not rising through it)
              const ledgeTopFromBottom = groundBase - r.top;
              const petAltitude = groundOffset + y;
              // Pet should be within ~20px of ledge surface to "land"
              if (Math.abs(petAltitude - ledgeTopFromBottom) < 20) {
                mountLedge(ledge);
                y = 0;
                xVel *= 0.3; // dampen horizontal on ledge catch
                yVel = 0;
                lastJumpAt = performance.now(); // cooldown before next jump
                if (!freeRoam) {
                  freeRoam = true;
                  try {
                    localStorage.setItem("sitepet:freeRoam", "1");
                  } catch {}
                }
                saySomething(pet, dizzyOr(LEDGE_LAND_PHRASES), 2200);
              }
            }
          }

          if (y <= 0) {
            if (yVel < -160 && !reduced) landingAt = now;
            // Reset dizzy timer on first landing so full effect plays on ground
            if (dizzy && yVel < -100) dizzyUntil = performance.now() + 2200;
            y = 0;
            if (yVel < -160) {
              yVel = -yVel * 0.1; // tiny bounce on hard landings
            } else {
              yVel = 0;
            }
          }
        } // end else (not fallSuspended)
      }

      pet.style.setProperty("--pet-x", `${x}px`);
      pet.style.setProperty("--pet-y", `${y}px`);
      pet.style.setProperty("--pet-flip", dir === 1 ? "1" : "-1");
      const moving = !hovered && !dragging && !inDizzy && y < 2 && !reduced;
      if (moving) gaitPhase += Math.abs(x - lastPoseX) / HERO_STRIDE_PX * Math.PI * 2;
      lastPoseX = x;
      const landT = now - landingAt;
      const compression = landT < 90 ? landT / 90 : landT < 520 ? (1 - (landT - 90) / 430) : 0;
      paintHeroPose(pet, gaitPhase, moving, Math.max(0, compression), dragging || y > 8, !!reduced);
      if (pet.dataset.moving !== String(moving)) pet.dataset.moving = String(moving);

      // Eye tracking toward the cursor.
      // Pet position is known from x, y, groundOffset — no need for getBoundingClientRect().
      // The pet sits at the anchor baseline, translated by (x, -(y + groundOffset)).
      // Viewport coords: left = x, top = groundBase - groundOffset - y - PET_H.
      const eyes = pet.querySelector<SVGGElement>(".site-pet__eyes");
      if (eyes && lastPointerX > -9999) {
        const cx = x + PET_W / 2;
        const cy = groundBase - groundOffset - y - PET_H / 2;
        const dx = lastPointerX - cx;
        const dy = lastPointerY - cy;
        const d = Math.hypot(dx, dy) || 1;
        const ex = clamp((dx / d) * 1.4, -1.4, 1.4);
        const ey = clamp((dy / d) * 1, -1, 1);
        eyes.style.transform = `translate(${ex.toFixed(2)}px, ${ey.toFixed(2)}px)`;
      }

      petRafId = requestAnimationFrame(tick);
    }
    petRafId = requestAnimationFrame(tick);

    // Pause RAF when page is hidden (tab/window switch) — resume on return.
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        cancelAnimationFrame(petRafId);
        petRafId = 0;
      } else if (!petRafId) {
        lastT = performance.now();
        petRafId = requestAnimationFrame(tick);
      }
    });

    window.addEventListener(
      "pointermove",
      (e) => {
        lastPointerX = e.clientX;
        lastPointerY = e.clientY;
      },
      { passive: true },
    );

    /*
      Scroll jolts. Any scroll event injects an upward impulse into yVel
      scaled by the delta — small scrolls get a tiny hop, big ones a real
      lift. Sign of the delta seeds jitter so the landing feels organic.
    */
    let lastScrollY = window.scrollY;
    let scrollIdleTimer = 0;
    window.addEventListener(
      "scroll",
      () => {
        isScrolling = true;
        if (scrollIdleTimer) window.clearTimeout(scrollIdleTimer);
        scrollIdleTimer = window.setTimeout(() => {
          isScrolling = false;
        }, 150);

        if (!entryDone || reduced || dragging || currentLedge) {
          lastScrollY = window.scrollY;
          return;
        }
        const dy = window.scrollY - lastScrollY;
        lastScrollY = window.scrollY;
        const mag = Math.min(400, Math.abs(dy));
        if (mag < 2) return;
        // Only register a new jolt when the pet is near the ground so
        // momentum-scroll bursts can't keep pinning it mid-air.
        if (y > 6) return;
        const impulse = Math.min(520, Math.sqrt(mag) * 26);
        yVel = Math.min(560, Math.max(yVel, impulse));
      },
      { passive: true },
    );

    function wire(pet: HTMLElement) {
      if (pet.dataset.wired === "1") return;
      pet.dataset.wired = "1";

      const hit = pet.querySelector<HTMLButtonElement>("[data-pet-hit]");
      const emotes = pet.querySelector<HTMLElement>("[data-pet-emotes]");
      if (!hit) return;

      const DRAG_THRESHOLD = 6; // px — movement before press becomes a drag

      function triggerHop() {
        if (reduced) return;
        pet.setAttribute("data-hopping", "");
        pet.setAttribute("data-blink", "");
        window.setTimeout(() => pet.removeAttribute("data-hopping"), 520);
        window.setTimeout(() => pet.removeAttribute("data-blink"), 180);
      }

      function triggerDizzy() {
        if (dizzy) return;
        dizzy = true;
        dizzyUntil = performance.now() + 2200;
        pet.setAttribute("data-dizzy", "");
        saySomething(pet, DIZZY_PHRASES, 2000);
        if (emotes) {
          for (let i = 0; i < 3; i++) {
            const star = document.createElement("span");
            star.className = "site-pet-spin-star";
            star.style.animationDelay = `${-i * 0.3}s`;
            emotes.appendChild(star);
          }
        }
      }

      const SWIRL_SVG = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M6 10 A4 4 0 1 0 2 6"/></svg>`;
      function spawnSwirl() {
        if (!emotes || reduced) return;
        const swirl = document.createElement("span");
        swirl.className = "site-pet-swirl";
        swirl.innerHTML = SWIRL_SVG;
        swirl.style.setProperty("--swirl-dx", `${(Math.random() - 0.5) * 32}px`);
        emotes.appendChild(swirl);
        window.setTimeout(() => swirl.remove(), 1000);
      }

      hit.addEventListener("pointerenter", () => {
        if (dragging) return;
        hovered = true;
        pet.setAttribute("data-paused", "");
        const r = pet.getBoundingClientRect();
        dir = lastPointerX < r.left + r.width / 2 ? -1 : 1;
        // Short delay so accidental cursor brushes don't pop bubbles.
        window.clearTimeout(hoverTimer);
        hoverTimer = window.setTimeout(() => {
          if (hovered && !dragging && !dizzy) {
            saySomething(pet, HOVER_PHRASES, 1600);
          }
        }, 260);
      });
      hit.addEventListener("pointerleave", () => {
        if (dragging) return;
        hovered = false;
        pet.removeAttribute("data-paused");
        window.clearTimeout(hoverTimer);
      });

      hit.addEventListener("pointerdown", (e) => {
        if (!entryDone || (e.button !== undefined && e.button !== 0)) return;
        pressActive = true;
        pressStart = { x: e.clientX, y: e.clientY, t: performance.now() };
        dragPointerId = e.pointerId;
        hit.setPointerCapture(e.pointerId);
        ptrHistory.length = 0;
        ptrHistory.push({ t: pressStart.t, x: e.clientX, y: e.clientY });
        // Reset shake tracking.
        shakeSamples.length = 0;
        lastShakeDx = 0;
      });

      hit.addEventListener("pointermove", (e) => {
        if (!pressActive || e.pointerId !== dragPointerId) return;
        const nowT = performance.now();
        ptrHistory.push({ t: nowT, x: e.clientX, y: e.clientY });
        // Trim history to the last 140ms for a clean release velocity.
        while (ptrHistory.length > 2 && nowT - ptrHistory[0].t > 140) {
          ptrHistory.shift();
        }
        if (!dragging) {
          const ds = pressStart!;
          const dx = e.clientX - ds.x;
          const dy = e.clientY - ds.y;
          // Enter drag only after a real lift — upward of THRESH or any
          // sideways drag beyond THRESH. Small jitter stays a click.
          if (dy < -DRAG_THRESHOLD || Math.abs(dx) > DRAG_THRESHOLD * 2) {
            dragging = true;
            // Dismount ledge on drag start — preserve absolute position
            // so there's no visual jump before drag positioning takes over.
            if (currentLedge) {
              const oldGround = groundOffset;
              currentLedge = null;
              ledgeGroundY = 0;
              // Convert y to be relative to the anchor baseline (no ledge)
              y = y + oldGround;
              groundOffset = 0;
            }
            const r = pet.getBoundingClientRect();
            dragOffsetX = ds.x - r.left;
            dragOffsetY = ds.y - r.top;
            pet.setAttribute("data-dragging", "");
            pet.setAttribute("data-paused", "");
            saySomething(pet, DRAG_PHRASES, 2200);
          } else {
            return;
          }
        }
        // Drag active — track the grab point against the cursor. The anchor
        // baseline (groundBase) already sits on the footer top when the
        // footer is visible, so the pet can't be dragged under it.
        const newLeft = e.clientX - dragOffsetX;
        const newTop = e.clientY - dragOffsetY;
        x = clamp(newLeft, 4, document.documentElement.clientWidth - PET_W - 4);
        const yFromGround = groundBase - newTop - PET_H - groundOffset;
        y = clamp(yFromGround, 0, Math.max(0, groundBase - PET_H - groundOffset - 4));

        // Shake detection — count rapid horizontal direction flips.
        const rawDx = e.movementX ?? 0;
        const dirNow = Math.sign(rawDx);
        if (Math.abs(rawDx) > 2 && dirNow !== 0) {
          if (lastShakeDx !== 0 && dirNow !== lastShakeDx) {
            shakeSamples.push(nowT);
            // Keep only flips within the last 600ms.
            while (shakeSamples.length && nowT - shakeSamples[0] > 600) {
              shakeSamples.shift();
            }
            // Every flip spawns a swirl trail so the user sees immediate
            // feedback while shaking, well before dizzy fully kicks in.
            if (!dizzy) spawnSwirl();
            if (shakeSamples.length >= 4) {
              triggerDizzy();
              shakeSamples.length = 0;
            }
          }
          lastShakeDx = dirNow;
        }
      });

      const endPress = (e: PointerEvent) => {
        if (!pressActive || e.pointerId !== dragPointerId) return;
        pressActive = false;
        dragPointerId = null;

        if (dragging) {
          dragging = false;
          pet.removeAttribute("data-dragging");
          pet.removeAttribute("data-paused");

          // Compute release velocity from the last ~140ms of pointer samples.
          if (ptrHistory.length >= 2) {
            const first = ptrHistory[0];
            const last = ptrHistory[ptrHistory.length - 1];
            const dtMs = Math.max(8, last.t - first.t);
            // Scale down pointer velocity so a fast flick is a modest toss,
            // not a launch into space.
            const vx = ((last.x - first.x) / dtMs) * 1000 * 0.55;
            const vy = ((last.y - first.y) / dtMs) * 1000 * 0.55;
            xVel = clamp(vx, -500, 500);
            // Screen-y-down is pet-y-up reversed; cap the upward launch so
            // the max toss peaks around ~60px above the ground.
            yVel = clamp(-vy, -420, 420);
          } else {
            xVel = 0;
            yVel = 0;
          }

          // Ledge detection — check if pet was dropped onto a DOM element.
          // Pet feet position in viewport coords:
          const petFeetY = groundBase - groundOffset - y;
          const ledge = findLedgeAtPosition(x, petFeetY);
          if (ledge && !dizzy) {
            // Land on ledge — cancel velocity, snap to surface.
            xVel = 0;
            yVel = 0;
            mountLedge(ledge);
            // Snap y to ledge surface
            y = 0;
            // Ensure free roam is on (must be to walk on ledges in main area)
            if (!freeRoam) {
              freeRoam = true;
              try {
                localStorage.setItem("sitepet:freeRoam", "1");
              } catch {}
            }
            saySomething(pet, dizzyOr(LEDGE_LAND_PHRASES), 2200);
          } else {
            // Normal drop — dismount any current ledge
            if (currentLedge) dismountLedge();

            // Unlock/lock free roam based on drop position relative to sidebar.
            const sidebar = document.querySelector<HTMLElement>(".site-sidebar");
            const sidebarRight = sidebar?.getBoundingClientRect().right ?? 0;
            if (x > sidebarRight + 20) {
              if (!freeRoam) {
                freeRoam = true;
                try {
                  localStorage.setItem("sitepet:freeRoam", "1");
                } catch {}
                measureWalls();
                saySomething(
                  pet,
                  [
                    "ooo i've never been here before",
                    "whoa... the world is big",
                    "first time out here",
                    "oh! outside",
                  ],
                  2400,
                );
              } else {
                saySomething(pet, dizzyOr(DROP_PHRASES), 1400);
              }
            } else {
              // Dropped back inside sidebar — re-constrain.
              if (freeRoam) {
                freeRoam = false;
                try {
                  localStorage.setItem("sitepet:freeRoam", "0");
                } catch {}
                measureWalls();
                saySomething(
                  pet,
                  dizzyOr(["back home", "cozy in here", "okay okay i'll stay"]),
                  1400,
                );
              } else {
                saySomething(pet, dizzyOr(DROP_PHRASES), 1400);
              }
            }
          }
        } else {
          // No drag — short tap / click. Hop + escalating quip.
          const nowT = performance.now();
          if (nowT - lastClickAt > 5000) clickCount = 0;
          clickCount += 1;
          sessionClicks += 1;
          globalPokes += 1;
          lastClickAt = nowT;
          triggerHop();

          // First poke of the session always shows the global count fact.
          if (!pokeQuipUsed && globalPokes > 0) {
            pokeQuipUsed = true;
            saySomething(pet, [`this is the ${globalPokes}${globalPokes === 1 ? "st" : globalPokes === 2 ? "nd" : globalPokes === 3 ? "rd" : "th"} time\nyou have poked me :(`], 2400);
          } else {
            saySomething(pet, clickPool(clickCount), 1400);
          }

          // Increment server counter (fire-and-forget).
          // Poke totals stay in this browser; this static portfolio has no shared counter API.
          try {
            const p = parseInt(localStorage.getItem("sitepet:pokes") ?? "0", 10);
            localStorage.setItem("sitepet:pokes", String(p + 1));
          } catch {}
        }
        pressStart = null;
      };
      hit.addEventListener("pointerup", endPress);
      hit.addEventListener("pointercancel", endPress);
      // Safety net — if the pointer is released anywhere in the window
      // (e.g. after a lost pointer-capture), make sure the pet doesn't
      // stay pinned in "dragging" state.
      window.addEventListener("pointerup", (_e) => {
        if (!pressActive && !dragging) return;
        pressActive = false;
        dragPointerId = null;
        if (dragging) {
          dragging = false;
          pet.removeAttribute("data-dragging");
          pet.removeAttribute("data-paused");
          // Check for ledge landing even on safety-net drop
          const petFeetY = groundBase - groundOffset - y;
          const ledge = findLedgeAtPosition(x, petFeetY);
          if (ledge && !dizzy) {
            xVel = 0;
            yVel = 0;
            mountLedge(ledge);
            y = 0;
            if (!freeRoam) {
              freeRoam = true;
              try {
                localStorage.setItem("sitepet:freeRoam", "1");
              } catch {}
            }
            saySomething(pet, dizzyOr(LEDGE_LAND_PHRASES), 2200);
          } else {
            // Drop cleanly — let gravity handle the fall from current y.
            yVel = 0;
            saySomething(pet, dizzyOr(DROP_PHRASES), 1200);
          }
        }
      });

      /*
        Idle blinks — 150ms blink every 3–7 seconds so the pet feels
        alive. Skipped while dizzy (eyes are already animating) or
        actively blinking from a recent click.
      */
      function scheduleBlink() {
        if (blinkTimeoutId) window.clearTimeout(blinkTimeoutId);
        const delay = 3000 + Math.random() * 4000;
        blinkTimeoutId = window.setTimeout(() => {
          if (!dizzy && !pet.hasAttribute("data-blink")) {
            pet.setAttribute("data-blink", "");
            window.setTimeout(() => pet.removeAttribute("data-blink"), 160);
          }
          scheduleBlink();
        }, delay);
      }
      scheduleBlink();

      /*
        Idle chatter — every 18–34 seconds the pet says something small
        when it's just walking around (not hovered, not dragged, not
        dizzy). Seeds the first quip 12s after the page loads so the
        behavior is discoverable.
      */
      function perchPool(): string[] {
        if (!currentLedge) return LEDGE_IDLE_PHRASES;
        for (const ctx of PERCH_CONTEXT) {
          if (currentLedge.matches(ctx.match)) {
            // 50/50 split between context-specific and generic ledge quips
            return Math.random() < 0.5 ? ctx.phrases : LEDGE_IDLE_PHRASES;
          }
        }
        return LEDGE_IDLE_PHRASES;
      }
      function idlePool(): string[] {
        if (currentLedge) return perchPool();
        const path = window.location.hash.slice(1) || "/";
        if (path.startsWith("/work/")) {
          const extras = CASE_STUDY_PAGE_PHRASES[path] ?? [];
          return extras.length ? [...CASE_STUDY_PHRASES, ...extras] : CASE_STUDY_PHRASES;
        }
        if (path.startsWith("/playground")) return PLAYGROUND_PHRASES;
        if (path.startsWith("/about")) return ABOUT_PHRASES;
        if (path.startsWith("/visitor-gallery")) return GALLERY_PHRASES;
        return IDLE_PHRASES;
      }
      let lastIdleQuipAt = 0;
      function scheduleIdle() {
        if (idleTimeoutId) window.clearTimeout(idleTimeoutId);
        const delay = 18000 + Math.random() * 16000;
        idleTimeoutId = window.setTimeout(() => {
          const now = Date.now();
          if (entryDone && !hovered && !dragging && !dizzy && now - lastIdleQuipAt >= 15_000) {
            saySomething(pet, idlePool(), 2200);
            lastIdleQuipAt = now;
          }
          scheduleIdle();
        }, delay);
      }
      if (idleFirstTimeoutId) window.clearTimeout(idleFirstTimeoutId);
      idleFirstTimeoutId = window.setTimeout(() => {
        if (!hovered && !dragging && !dizzy) {
          saySomething(pet, idlePool(), 2200);
          lastIdleQuipAt = Date.now();
        }
        scheduleIdle();
      }, 12000);
    }

    /*
      Hat rack wiring. Reads the saved choice from localStorage on every
      init (so SPA nav doesn't reset the hat), applies it to the pet's
      data-hat attribute, and re-renders the toggle preview.
    */
    const HAT_KEY = "sitepet:hat";
    const HAT_VALUES = ["none", "bucket", "top", "cap", "sprout", "party"] as const;
    type HatKey = (typeof HAT_VALUES)[number];

    function readHat(): HatKey {
      try {
        const v = localStorage.getItem(HAT_KEY);
        if (v && (HAT_VALUES as readonly string[]).includes(v)) return v as HatKey;
      } catch {}
      return "none";
    }
    function applyHat(hat: HatKey) {
      const pet = el();
      if (!pet) return;
      if (hat === "none") pet.removeAttribute("data-hat");
      else pet.setAttribute("data-hat", hat);
      const rack = document.querySelector<HTMLElement>("[data-hat-rack]");
      if (rack) {
        if (hat === "none") rack.removeAttribute("data-has-hat");
        else rack.setAttribute("data-has-hat", "");
        // Mark selected option.
        rack.querySelectorAll<HTMLElement>("[data-hat-choice]").forEach((btn) => {
          if (btn.dataset.hatChoice === hat) btn.setAttribute("data-selected", "");
          else btn.removeAttribute("data-selected");
        });
        // Render the current hat as the toggle preview. Clone the
        // menu option's full SVG so the hat's own viewBox + sizing
        // travel with it — the slot CSS bottom-aligns the SVG to the
        // toggle, so each hat's brim sits flush on the Explore nav.
        const slot = rack.querySelector<HTMLElement>("[data-rack-preview-slot]");
        if (slot) {
          slot.innerHTML = "";
          if (hat !== "none") {
            const source = rack.querySelector<SVGElement>(`[data-hat-choice="${hat}"] svg`);
            if (source) {
              const clone = source.cloneNode(true) as SVGElement;
              slot.appendChild(clone);
            }
          }
        }
      }
    }

    /*
      Anchor the rack on top of the sidebar "Explore" nav (`[data-toc]`)
      by parenting it INTO the nav and positioning absolutely. The rack
      then rides the sidebar on the compositor — no per-scroll JS, so it
      can never lag behind during fast scrolling or rubber-band overscroll
      (the old fixed-position + scroll-handler approach bounced).
    */
    function positionRack(rack: HTMLElement) {
      rack.style.display = "";
    }

    function wireRack() {
      const rack = document.querySelector<HTMLElement>("[data-hat-rack]");
      if (!rack) return;
      positionRack(rack);
      if (rack.dataset.wired === "1") {
        applyHat(readHat());
        return;
      }
      rack.dataset.wired = "1";
      rack.querySelectorAll<HTMLElement>("[data-hat-choice]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const prev = readHat();
          const choice = (btn.dataset.hatChoice || "none") as HatKey;
          try {
            localStorage.setItem(HAT_KEY, choice);
          } catch {}
          applyHat(choice);
          if (prev !== choice) {
// Hat preference is saved locally.
          }
          rack.removeAttribute("data-open");
          rack.setAttribute("data-hat-picked", "");
          // Blur so :focus-within doesn't keep the menu visible.
          (document.activeElement as HTMLElement)?.blur?.();
          const pet = el();
          if (pet && !reduced) {
            pet.setAttribute("data-hopping", "");
            window.setTimeout(() => pet.removeAttribute("data-hopping"), 520);
          }
        });
      });
      const toggle = rack.querySelector<HTMLButtonElement>("[data-rack-toggle]");
      toggle?.addEventListener("click", (e) => {
        e.stopPropagation();
        if (rack.hasAttribute("data-open")) rack.removeAttribute("data-open");
        else rack.setAttribute("data-open", "");
      });
      rack.addEventListener("pointerleave", () => rack.removeAttribute("data-hat-picked"));
      // Click outside closes the menu.
      document.addEventListener("click", (e) => {
        if (!rack.hasAttribute("data-open")) return;
        const target = e.target;
        if (target instanceof Node && rack.contains(target)) return;
        rack.removeAttribute("data-open");
      });
      applyHat(readHat());
    }

    function init() {
      anchorPet();
      measureWalls();
      const pet = el();
      if (pet) wire(pet);
      wireRack();
    }
    init();
    window.addEventListener("hashchange", init);
  }
