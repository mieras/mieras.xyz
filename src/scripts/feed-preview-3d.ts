/**
 * Centered 3D hover preview for /feed rows.
 * - book: thick box, cover on front/back
 * - music: square, almost flat
 * - film: poster aspect, almost flat
 * Ordered Bayer dither as a post-process (Codrops / niccolofanton approach, ShaderPass).
 */
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";

export type PreviewKind = "book" | "music" | "film";

const CANVAS_SIZE = 520;

/** Box size by media type (Three units). Depth is fixed per kind. */
function boxSize(kind: PreviewKind, aspect: number): THREE.Vector3 {
  if (kind === "music") {
    return new THREE.Vector3(1.15, 1.15, 0.045);
  }
  if (kind === "film") {
    const h = 1.35;
    const w = h * Math.min(Math.max(aspect, 0.55), 0.8);
    return new THREE.Vector3(w, h, 0.035);
  }
  // book — fixed depth, aspect from cover
  const h = 1.4;
  const w = h * Math.min(Math.max(aspect, 0.55), 0.85);
  return new THREE.Vector3(w, h, 0.14);
}

const BayerDitherShader = {
  name: "BayerDitherShader",
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    resolution: { value: new THREE.Vector2(1, 1) },
    gridSize: { value: 3.0 },
    pixelSizeRatio: { value: 1.25 },
    invertColor: { value: 0.0 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform vec2 resolution;
    uniform float gridSize;
    uniform float pixelSizeRatio;
    uniform float invertColor;
    varying vec2 vUv;

    bool getValue(float brightness, vec2 pos) {
      if (brightness > 16.0 / 17.0) return false;
      if (brightness < 1.0 / 17.0) return true;
      vec2 pixel = floor(mod(pos.xy / gridSize, 4.0));
      int x = int(pixel.x);
      int y = int(pixel.y);
      if (x == 0) {
        if (y == 0) return brightness < 16.0 / 17.0;
        if (y == 1) return brightness < 5.0 / 17.0;
        if (y == 2) return brightness < 13.0 / 17.0;
        return brightness < 1.0 / 17.0;
      } else if (x == 1) {
        if (y == 0) return brightness < 8.0 / 17.0;
        if (y == 1) return brightness < 12.0 / 17.0;
        if (y == 2) return brightness < 4.0 / 17.0;
        return brightness < 9.0 / 17.0;
      } else if (x == 2) {
        if (y == 0) return brightness < 14.0 / 17.0;
        if (y == 1) return brightness < 2.0 / 17.0;
        if (y == 2) return brightness < 15.0 / 17.0;
        return brightness < 3.0 / 17.0;
      } else {
        if (y == 0) return brightness < 6.0 / 17.0;
        if (y == 1) return brightness < 10.0 / 17.0;
        if (y == 2) return brightness < 7.0 / 17.0;
        return brightness < 11.0 / 17.0;
      }
    }

    void main() {
      vec2 fragCoord = vUv * resolution;
      float pixelSize = max(gridSize * pixelSizeRatio, 1.0);
      vec2 pixelatedUV = floor(fragCoord / pixelSize) * pixelSize / resolution;
      vec4 tex = texture2D(tDiffuse, pixelatedUV);
      float luminance = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
      // Binary Bayer: black / white (flip for dark mode)
      bool ink = getValue(luminance, fragCoord);
      if (invertColor > 0.5) ink = !ink;
      vec3 bw = ink ? vec3(0.0) : vec3(1.0);
      gl_FragColor = vec4(bw, tex.a);
    }
  `,
};

function isDarkTheme(): boolean {
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "dark") return true;
  if (attr === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function edgeColorFromTexture(tex: THREE.Texture): THREE.Color {
  // Neutral edge; tint slightly warm/cool via average would need canvas read —
  // keep a muted page-edge look for books.
  return new THREE.Color(0xc8c4bc);
}

export function initFeedPreview3D(root: ParentNode = document) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  const host = root.querySelector<HTMLElement>("[data-feed-preview]");
  if (!host) return;

  const canvas = document.createElement("canvas");
  canvas.className = "feed-preview__canvas";
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  canvas.setAttribute("aria-hidden", "true");
  host.appendChild(canvas);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(CANVAS_SIZE, CANVAS_SIZE, false);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 20);
  camera.position.set(0, 0.15, 3.4);

  const ambient = new THREE.AmbientLight(0xffffff, 0.85);
  scene.add(ambient);
  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(2.2, 3, 4);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xffffff, 0.35);
  fill.position.set(-2, 0.5, 2);
  scene.add(fill);

  const loader = new THREE.TextureLoader();
  loader.crossOrigin = "anonymous";

  let mesh: THREE.Mesh | null = null;
  let visible = false;
  let raf = 0;
  let rotY = 0;
  let targetRotY = 0.35;
  let currentSrc = "";
  let currentKind: PreviewKind = "book";

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const ditherPass = new ShaderPass(BayerDitherShader);
  ditherPass.uniforms.resolution.value.set(CANVAS_SIZE, CANVAS_SIZE);
  ditherPass.uniforms.invertColor.value = isDarkTheme() ? 1 : 0;
  composer.addPass(ditherPass);

  function syncTheme() {
    ditherPass.uniforms.invertColor.value = isDarkTheme() ? 1 : 0;
  }

  const themeObserver = new MutationObserver(syncTheme);
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", syncTheme);

  function disposeMesh() {
    if (!mesh) return;
    scene.remove(mesh);
    mesh.geometry.dispose();
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const maps = new Set<THREE.Texture>();
    for (const m of mats) {
      const mat = m as THREE.MeshStandardMaterial;
      if (mat.map) maps.add(mat.map);
      mat.dispose();
    }
    for (const map of maps) map.dispose();
    mesh = null;
  }

  function loadTexture(url: string): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
      loader.load(
        url,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
          tex.needsUpdate = true;
          resolve(tex);
        },
        undefined,
        reject
      );
    });
  }

  async function show(src: string, kind: PreviewKind, backSrc?: string | null) {
    if (!src) return;
    currentSrc = src;
    currentKind = kind;
    host.dataset.active = "true";
    visible = true;

    try {
      const front = await loadTexture(src);
      if (currentSrc !== src) {
        front.dispose();
        return;
      }

      const img = front.image as HTMLImageElement;
      const aspect = img?.width && img?.height ? img.width / img.height : 0.66;
      const size = boxSize(kind, aspect);

      let back = front;
      let ownBack = false;
      if (backSrc && backSrc !== src) {
        try {
          back = await loadTexture(backSrc);
          ownBack = true;
          if (currentSrc !== src) {
            front.dispose();
            back.dispose();
            return;
          }
        } catch {
          back = front;
          ownBack = false;
        }
      }

      disposeMesh();

      const edge = new THREE.MeshStandardMaterial({
        color: edgeColorFromTexture(front),
        roughness: 0.85,
        metalness: 0.05,
      });
      const frontMat = new THREE.MeshStandardMaterial({
        map: front,
        roughness: 0.7,
        metalness: 0.02,
      });
      const backMat = new THREE.MeshStandardMaterial({
        map: back,
        roughness: 0.7,
        metalness: 0.02,
      });

      // +X, -X, +Y, -Y, +Z (front), -Z (back)
      const materials = [edge, edge.clone(), edge.clone(), edge.clone(), frontMat, backMat];
      const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
      mesh = new THREE.Mesh(geometry, materials);
      mesh.rotation.set(-0.12, 0.45, 0.04);
      rotY = mesh.rotation.y;
      targetRotY = 0.45;
      scene.add(mesh);

      // Keep front texture; dispose orphaned back only if we created a failed path — ownBack stays on mesh
      void ownBack;
    } catch {
      hide();
    }

    startLoop();
  }

  function hide() {
    visible = false;
    host.dataset.active = "false";
    currentSrc = "";
    disposeMesh();
    renderer.clear();
    stopLoop();
  }

  function tick() {
    raf = requestAnimationFrame(tick);
    if (!visible || !mesh) return;
    // Gentle idle yaw
    targetRotY += 0.006;
    rotY += (targetRotY - rotY) * 0.08;
    mesh.rotation.y = rotY;
    mesh.rotation.x = -0.12 + Math.sin(performance.now() * 0.0007) * 0.04;
    composer.render();
  }

  function startLoop() {
    if (raf) return;
    tick();
  }

  function stopLoop() {
    if (!raf) return;
    cancelAnimationFrame(raf);
    raf = 0;
  }

  function kindFromLink(link: HTMLElement): PreviewKind {
    const raw = link.dataset.previewKind;
    if (raw === "book" || raw === "music" || raw === "film") return raw;
    return "book";
  }

  function onEnter(link: HTMLElement) {
    const img = link.querySelector<HTMLImageElement>("img.row__thumb");
    const src = img?.currentSrc || img?.src || link.dataset.previewSrc || "";
    const back = link.dataset.previewBack || null;
    if (!src) return;
    void show(src, kindFromLink(link), back);
  }

  const links = root.querySelectorAll<HTMLElement>(".feed .row__link");
  for (const link of links) {
    link.addEventListener("pointerenter", () => onEnter(link));
    link.addEventListener("pointerleave", () => hide());
    link.addEventListener("focus", () => onEnter(link));
    link.addEventListener("blur", () => hide());
  }

  document.documentElement.classList.add("feed-preview-3d");
}
