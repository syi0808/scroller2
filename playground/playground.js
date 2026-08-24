import { createScrollEngine } from "./dist/index.js";

const distances = [100, 300, 700, 1500, 3000];
const controls = document.querySelector("#controls");
const comparisons = document.querySelector("#comparisons");
const template = document.querySelector("#comparison-template");
const engine = createScrollEngine();

function values() {
  const data = new FormData(controls);
  return {
    motion: data.get("motion"),
    alignment: data.get("alignment"),
    depth: Number(data.get("depth")),
    safeArea: Number(data.get("safeArea")),
  };
}

function makeContents(viewport, distance, depth) {
  let parent = viewport;
  for (let index = 1; index < depth; index += 1) {
    const nested = document.createElement("div");
    nested.className = "nested";
    parent.append(nested);
    parent = nested;
  }
  const spacer = document.createElement("div");
  spacer.className = "spacer";
  spacer.style.height = `${distance}px`;
  const target = document.createElement("div");
  target.className = "target";
  target.textContent = "TARGET";
  parent.append(spacer, target);
  return target;
}

function render() {
  comparisons.replaceChildren();
  const settings = values();
  controls.elements.depthOutput.value = settings.depth;
  controls.elements.safeAreaOutput.value = `${settings.safeArea}px`;
  for (const distance of distances) {
    const fragment = template.content.cloneNode(true);
    const article = fragment.querySelector("article");
    const viewport = fragment.querySelector(".viewport");
    article.querySelector("strong").textContent = `${distance}px`;
    const target = makeContents(viewport, distance, settings.depth);
    article.querySelector("button").addEventListener("click", () => run(article, target));
    comparisons.append(fragment);
  }
}

async function run(article, target) {
  const settings = values();
  const surfaces = [article.querySelector(".viewport"), ...article.querySelectorAll(".nested")];
  for (const surface of surfaces) surface.scrollTop = 0;
  const started = performance.now();
  const motion = settings.motion === "lerp" ? { type: "lerp", factor: 0.12 } : settings.motion;
  const result = await engine.reveal(target, {
    block: settings.alignment,
    safeArea: settings.safeArea,
    motion,
    settle: false,
  });
  article.querySelector(".elapsed").textContent = `${Math.round(performance.now() - started)}ms`;
  article.querySelector(".writes").textContent = result.steps.length;
}

controls.addEventListener("input", render);
document.querySelector("#run-all").addEventListener("click", () => {
  for (const button of comparisons.querySelectorAll("button")) button.click();
});
render();
