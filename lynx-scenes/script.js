const tasks = {
  trajectory: {
    tag: "ACTION / 1 SECOND",
    title: "Instruction-conditioned trajectory prediction",
    description: "Predict a complete 10 × 3 future trajectory from sixteen historical images, current robot motion, and a three-layer semantic instruction.",
    specs: [["INPUT", "4 views × 4 timestamps"], ["OUTPUT", "10 planar poses"], ["LEAD METRIC", "QNS ↑"]],
    score: "0.843",
    scoreLabel: "NaVILA · QNS",
    width: "84.3%",
    insight: "The lowest imitation error is not always the safest or most instruction-compliant policy.",
    image: "./assets/task1-render.jpg",
    wideVisual: true,
    alt: "Qualitative instruction-conditioned trajectory predictions for straight, left-turn, and right-turn commands",
    caption: "<strong>Trajectory prediction.</strong> Predicted and ground-truth paths under three navigation instructions."
  },
  bev: {
    tag: "SPACE / ROBOT-CENTRIC",
    title: "BEV perception of objects and road structure",
    description: "Detect close-range oriented 3D objects, curbs, dividing lines, and crosswalk contours in the robot-centric bird’s-eye view.",
    specs: [["INPUT", "Camera / camera + LiDAR"], ["OUTPUT", "Boxes + polylines"], ["LEAD METRIC", "HDS ↑"]],
    score: "64.48",
    scoreLabel: "BEVFusion · HDS",
    width: "64.48%",
    insight: "SparseDrive leads road-line mAP, while the camera + LiDAR BEVFusion leads box mAP and HDS.",
    image: "./assets/task2-render.jpg",
    wideVisual: true,
    alt: "Bird's-eye-view perception result showing detected road structures and nearby objects",
    caption: "<strong>BEV perception.</strong> Robot-centric detection of 3D objects and navigation-relevant road structure."
  },
  future: {
    tag: "TIME / VISUAL ROLLOUT",
    title: "Future egocentric scene prediction",
    description: "Generate how the front-view observation evolves from an initial frame, using future motion conditions when the model supports them.",
    specs: [["INPUT", "Initial RGB + motion"], ["OUTPUT", "Future RGB video"], ["EVAL SET", "200 clips"]],
    score: "386.2",
    scoreLabel: "WorldStereo · FVD ↓",
    width: "72%",
    insight: "Quality, temporal coherence, appearance consistency, and distributional realism have different leaders.",
    image: "./assets/task-future.jpg",
    video: "./assets/future-scene-cosmos3-5episodes.mp4",
    poster: "./assets/future-scene-cosmos3-5episodes-poster.jpg",
    alt: "A montage of five Cosmos3 generated future-scene rollout episodes",
    caption: "<strong>Future scene prediction.</strong> Five Cosmos3 generated rollouts, using the middle five seconds of each episode."
  },
  reconstruction: {
    tag: "VIEWPOINT / 3D REPLAY",
    title: "Multi-view scene reconstruction",
    description: "Reconstruct the observed environment from context views, then render held-out viewpoints under camera translation and height changes.",
    specs: [["INPUT", "2–16 context views"], ["OUTPUT", "Novel-view RGB"], ["LEAD METRIC", "PSNR ↑"]],
    score: "15.94",
    scoreLabel: "ReCoSplat · PSNR",
    width: "79.7%",
    insight: "No method dominates all pixel, structural, and perceptual reconstruction metrics.",
    image: "./assets/task4-render.jpg",
    wideVisual: true,
    alt: "Multi-view scene reconstruction rendered at four different camera heights",
    caption: "<strong>Scene reconstruction.</strong> Novel-view renderings under increasing camera-height changes."
  }
};

const tabs = [...document.querySelectorAll("[data-task]")];
const panel = document.querySelector("#task-panel");

function selectTask(key) {
  const task = tasks[key];
  tabs.forEach((tab) => tab.setAttribute("aria-selected", String(tab.dataset.task === key)));
  panel.setAttribute("aria-labelledby", `tab-${key}`);
  document.querySelector("#task-tag").textContent = task.tag;
  document.querySelector("#task-title").textContent = task.title;
  document.querySelector("#task-description").textContent = task.description;
  document.querySelector("#task-specs").innerHTML = task.specs.map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join("");
  document.querySelector("#task-score").textContent = task.score;
  document.querySelector("#task-score-label").textContent = task.scoreLabel;
  document.querySelector("#score-fill").style.width = task.width;
  document.querySelector("#task-insight").textContent = task.insight;
  const taskVisual = document.querySelector(".task-visual");
  const taskStage = document.querySelector(".task-image-stage");
  const taskImage = document.querySelector("#task-image");
  const taskPdf = document.querySelector("#task-pdf");
  const taskVideo = document.querySelector("#task-video");
  taskVisual.classList.toggle("is-wide-visual", Boolean(task.wideVisual));
  taskStage.classList.toggle("is-wide", Boolean(task.wideVisual));
  taskStage.classList.toggle("is-pdf", Boolean(task.pdf));
  taskStage.classList.toggle("is-video", Boolean(task.video));
  taskVideo.pause();
  taskVideo.hidden = true;
  if (task.pdf) {
    taskImage.hidden = true;
    taskPdf.hidden = false;
    taskPdf.setAttribute("aria-label", task.alt);
    const pdfFallback = document.querySelector("#task-pdf-fallback");
    pdfFallback.href = task.pdf.split("#")[0];
    pdfFallback.textContent = `Open the complete ${task.title} visual`;
    if (taskPdf.getAttribute("data") !== task.pdf) taskPdf.setAttribute("data", task.pdf);
  } else if (task.video) {
    taskPdf.hidden = true;
    taskPdf.removeAttribute("data");
    taskImage.hidden = true;
    taskVideo.hidden = false;
    taskVideo.poster = task.poster;
    taskVideo.setAttribute("aria-label", task.alt);
    if (taskVideo.getAttribute("src") !== task.video) {
      taskVideo.src = task.video;
      taskVideo.load();
    }
    taskVideo.currentTime = 0;
    taskVideo.play().catch(() => {});
  } else {
    taskPdf.hidden = true;
    taskPdf.removeAttribute("data");
    taskImage.hidden = false;
    taskImage.src = task.image;
    taskImage.alt = task.alt;
  }
  document.querySelector("#task-caption").innerHTML = task.caption;
}

tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => selectTask(tab.dataset.task));
  tab.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === "ArrowRight" ? (index + 1) % tabs.length : (index - 1 + tabs.length) % tabs.length;
    tabs[next].focus();
    selectTask(tabs[next].dataset.task);
  });
});

const scenes = {
  campus: {
    title: "Campus flow",
    description: "Three campus-scale navigation views across sidewalks, shared paths, and parked mobility.",
    type: "image",
    image: "./assets/scene-campus-triptych.webp",
    alt: "Three real-world views of the LYNX M20 navigating campus sidewalks and shared paths"
  },
  crossing: {
    title: "Mixed traffic",
    description: "Shared bicycle zones, a marked crosswalk, and vehicle interaction at an urban junction.",
    type: "image",
    image: "./assets/scene-traffic-triptych.webp",
    alt: "Three real-world views of the LYNX M20 around bicycles, a crosswalk, and road traffic"
  },
  terrain: {
    title: "Rough terrain",
    description: "Irregular curbs and indoor-outdoor staircases test wheel-leg transitions.",
    type: "image",
    image: "./assets/scene-terrain-triptych.webp",
    alt: "Three views of the LYNX M20 navigating a curb line and two different staircases"
  },
  field: {
    title: "Real-world demo",
    description: "Six front-fisheye clips sampled from real 0724 runs and joined with soft crossfades.",
    type: "video",
    video: "./assets/real-world-demo-6episodes.mp4",
    poster: "./assets/real-world-demo-6episodes-poster.jpg",
    alt: "A montage of six real-world front-fisheye robot navigation episodes"
  },
  sand: {
    title: "Sand dynamics",
    description: "Wheel-leg propulsion maintains momentum through deep, loose sand.",
    type: "video",
    video: "./assets/m20-sand-dynamics.mp4",
    poster: "./assets/m20-sand-dynamics-poster.jpg",
    alt: "LYNX M20 wheel-leg driving through loose sand"
  },
  steps: {
    title: "Stone steps",
    description: "Active body reconfiguration negotiates irregular historic stone steps.",
    type: "video",
    video: "./assets/m20-stone-steps.mp4",
    poster: "./assets/m20-stone-steps-poster.jpg",
    alt: "LYNX M20 traversing uneven stone steps"
  },
  water: {
    title: "Water recovery",
    description: "A low-friction water exit tests traction, sealing, and whole-body recovery.",
    type: "video",
    video: "./assets/m20-water-recovery.mp4",
    poster: "./assets/m20-water-recovery-poster.jpg",
    alt: "LYNX M20 recovering from a shallow water feature"
  }
};

const sceneTabs = [...document.querySelectorAll("[data-scene]")];
function selectScene(key) {
  const scene = scenes[key];
  sceneTabs.forEach((tab) => tab.setAttribute("aria-selected", String(tab.dataset.scene === key)));
  document.querySelector("#scene-panel").setAttribute("aria-labelledby", `scene-tab-${key}`);
  const image = document.querySelector("#scene-image");
  const video = document.querySelector("#scene-video");
  if (scene.type === "video") {
    video.pause();
    if (video.getAttribute("src") !== scene.video) {
      video.src = scene.video;
      video.poster = scene.poster;
      video.setAttribute("aria-label", scene.alt);
      video.load();
    }
    image.hidden = true;
    video.hidden = false;
    video.currentTime = 0;
    video.play().catch(() => {});
  } else {
    video.pause();
    video.hidden = true;
    image.hidden = false;
    image.src = scene.image;
    image.alt = scene.alt;
  }
  document.querySelector("#scene-title").textContent = scene.title;
  document.querySelector("#scene-description").textContent = scene.description;
}

sceneTabs.forEach((tab, index) => {
  tab.addEventListener("click", () => selectScene(tab.dataset.scene));
  tab.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === "ArrowRight" ? (index + 1) % sceneTabs.length : (index - 1 + sceneTabs.length) % sceneTabs.length;
    sceneTabs[next].focus();
    selectScene(sceneTabs[next].dataset.scene);
  });
});

const toast = document.querySelector("#toast");
let toastTimer;
function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

document.querySelectorAll("[data-coming]").forEach((button) => {
  button.addEventListener("click", () => showToast(button.dataset.coming));
});

document.querySelector("#copy-citation").addEventListener("click", async (event) => {
  const text = document.querySelector("#bibtex").textContent;
  try {
    await navigator.clipboard.writeText(text);
    event.currentTarget.textContent = "Copied";
    showToast("BibTeX copied to clipboard.");
  } catch {
    showToast("Select the citation text to copy it.");
  }
  setTimeout(() => { event.currentTarget.textContent = "Copy BibTeX"; }, 1800);
});

const menu = document.querySelector(".menu-toggle");
const nav = document.querySelector("nav");
menu.addEventListener("click", () => {
  const open = menu.getAttribute("aria-expanded") === "true";
  menu.setAttribute("aria-expanded", String(!open));
  nav.classList.toggle("open", !open);
});
nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
  menu.setAttribute("aria-expanded", "false");
  nav.classList.remove("open");
}));

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
