import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as CANNON from "cannon-es";
import * as dat from "lil-gui";

/**
 * HTML Canvas Setup
 */
const canvas = document.querySelector("canvas.webgl");
if (!canvas) {
  throw new Error('Canvas with class "webgl" not found in the HTML.');
}

/**
 * Scene
 */
const scene = new THREE.Scene();

/**
 * Physics World
 */
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);

// Create a default physics material
const defaultMaterial = new CANNON.Material("default");
const bounceMaterial = new CANNON.ContactMaterial(
  defaultMaterial,
  defaultMaterial,
  {
    friction: 0.1,
    restitution: 0.9,
  }
);
world.addContactMaterial(bounceMaterial);

/**
 * Particles Outside the Floor (Edges Only)
 */
const particlesCount = 5000; // Number of particles
const positions = new Float32Array(particlesCount * 3); // Each particle has x, y, z
const colors = new Float32Array(particlesCount * 3); // Each particle has r, g, b (for color)

const randomColor = () => {
  return new THREE.Color(Math.random(), Math.random(), Math.random()); // Random color
};

for (let i = 0; i < particlesCount; i++) {
  const edge = Math.random();
  const x =
    edge < 0.25
      ? (Math.random() - 0.5) * 20
      : edge < 0.5
      ? 10
      : edge < 0.75
      ? -10
      : (Math.random() - 0.5) * 20; // Particle on the edges of the floor
  const z =
    edge < 0.25
      ? (Math.random() - 0.5) * 20
      : edge < 0.5
      ? (Math.random() - 0.5) * 20
      : edge < 0.75
      ? -10
      : 10; // Particle on the edges of the floor
  const y = Math.random() * 10 + 0.5; // Ensure particles are above the floor (y > 0)

  // Assign positions
  positions[i * 3] = x;
  positions[i * 3 + 1] = y;
  positions[i * 3 + 2] = z;

  // Assign colors
  const color = randomColor();
  colors[i * 3] = color.r;
  colors[i * 3 + 1] = color.g;
  colors[i * 3 + 2] = color.b;
}

const particlesGeometry = new THREE.BufferGeometry();
particlesGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(positions, 3)
);
particlesGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

const particlesMaterial = new THREE.PointsMaterial({
  size: 0.1, // Size of each particle
  vertexColors: true, // Allow for custom colors for each vertex
  transparent: true,
  opacity: 0.8,
});

const particles = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particles);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};
window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(0, 3, 10);
scene.add(camera);

/**
 * Controls
 */
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({ canvas: canvas });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Ground
 */
const groundBody = new CANNON.Body({
  mass: 0,
  shape: new CANNON.Plane(),
  material: defaultMaterial,
});
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
world.addBody(groundBody);

// Visual ground
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 20),
  new THREE.MeshStandardMaterial({ color: 0x808080 })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

/**
 * Debugging GUI
 */
const gui = new dat.GUI();
const debugObject = {};

/**
 * Objects to Update
 */
const objectsToUpdate = [];

/**
 * Create Sphere Function with Random Color
 */
const sphereGeometry = new THREE.SphereGeometry(1, 20, 20);
const createSphere = (radius, position) => {
  // Assign random color for the sphere
  const color = randomColor();
  const sphereMaterial = new THREE.MeshStandardMaterial({
    color: color, // Random color
    metalness: 0.3,
    roughness: 0.4,
  });

  // Three.js Mesh
  const mesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
  mesh.scale.set(radius, radius, radius);
  mesh.position.copy(position);
  scene.add(mesh);

  // Cannon.js Body
  const shape = new CANNON.Sphere(radius);
  const body = new CANNON.Body({
    mass: 1,
    position: new CANNON.Vec3(position.x, position.y, position.z),
    shape: shape,
    material: defaultMaterial,
  });
  world.addBody(body);

  // Save for Updates
  objectsToUpdate.push({ mesh, body });
};

/**
 * Create Box Function with Random Color
 */
const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
const createBox = (width, height, depth, position) => {
  // Assign random color for the box
  const color = randomColor();
  const boxMaterial = new THREE.MeshStandardMaterial({
    color: color, // Random color
    metalness: 0.3,
    roughness: 0.4,
  });

  // Three.js Mesh
  const mesh = new THREE.Mesh(boxGeometry, boxMaterial);
  mesh.scale.set(width, height, depth);
  mesh.position.copy(position);
  scene.add(mesh);

  // Cannon.js Body
  const shape = new CANNON.Box(
    new CANNON.Vec3(width * 0.5, height * 0.5, depth * 0.5)
  );
  const body = new CANNON.Body({
    mass: 1,
    position: new CANNON.Vec3(position.x, position.y, position.z),
    shape: shape,
    material: defaultMaterial,
  });
  world.addBody(body);

  // Save for Updates
  objectsToUpdate.push({ mesh, body });
};

/**
 * Add Debugging Options
 */
debugObject.createSphere = () => {
  createSphere(0.5, { x: 0, y: 3, z: 0 });
};
gui.add(debugObject, "createSphere");

debugObject.createBox = () => {
  createBox(Math.random(), Math.random(), Math.random(), {
    x: (Math.random() - 0.5) * 3,
    y: 3,
    z: (Math.random() - 0.5) * 3,
  });
};
gui.add(debugObject, "createBox");

/**
 * Animation Loop
 */
const clock = new THREE.Clock();
const tick = () => {
  const deltaTime = clock.getDelta();

  // Update Physics
  world.step(1 / 60, deltaTime, 3);

  // Sync Physics and Meshes
  for (const object of objectsToUpdate) {
    object.mesh.position.copy(object.body.position);
    object.mesh.quaternion.copy(object.body.quaternion);
  }

  // Update Particles Position
  const positions = particles.geometry.attributes.position.array;
  const colors = particles.geometry.attributes.color.array;

  for (let i = 0; i < particlesCount * 3; i += 3) {
    // If particle drops below the floor, reset its position and color
    if (positions[i + 1] < 0.5) {
      const edge = Math.random();
      positions[i] =
        edge < 0.25
          ? (Math.random() - 0.5) * 20
          : edge < 0.5
          ? 10
          : edge < 0.75
          ? -10
          : (Math.random() - 0.5) * 20; // Particle on the edges of the floor
      positions[i + 1] = Math.random() * 10 + 0.5; // New random y above floor
      positions[i + 2] =
        edge < 0.25
          ? (Math.random() - 0.5) * 20
          : edge < 0.5
          ? (Math.random() - 0.5) * 20
          : edge < 0.75
          ? -10
          : 10; // Particle on the edges of the floor

      // Assign a new color to the particle
      const color = randomColor();
      colors[i] = color.r;
      colors[i + 1] = color.g;
      colors[i + 2] = color.b;
    }
  }
  particles.geometry.attributes.position.needsUpdate = true;
  particles.geometry.attributes.color.needsUpdate = true;

  // Update Controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Request Next Frame
  window.requestAnimationFrame(tick);
};

tick();
