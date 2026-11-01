// --- NODE 1: LOCAL STORAGE & ENGINE ---
const manager = new FlexCapacityManager(40, 4.5);
let shiftHistory = JSON.parse(localStorage.getItem('wayne_flex_capacity') || '[]');

function saveShifts() { localStorage.setItem('wayne_flex_capacity', JSON.stringify(shiftHistory)); }

function updateDashboard() {
    const deployable = manager.getDeployableCapacity(shiftHistory, 0);
    document.getElementById('deployable-hours').textContent = deployable.toFixed(1);

    const activeBuffer = manager.getActiveBuffer();
    document.getElementById('buffer-status').textContent = activeBuffer > 0 ? `Active (${activeBuffer}h Locked)` : "Released (0h)";

    const list = document.getElementById('shift-history-list');
    list.innerHTML = '';
    shiftHistory.forEach(s => {
        const li = document.createElement('li');
        li.textContent = `${new Date(s.date).toLocaleDateString()} - ${s.duration} hrs`;
        list.appendChild(li);
    });
}

// Tick Clock
setInterval(() => {
    document.getElementById('local-time').textContent = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    updateDashboard(); 
}, 60000);
document.getElementById('local-time').textContent = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

// Time Ops Actions
document.getElementById('btn-log-shift').addEventListener('click', () => {
    const h = parseFloat(document.getElementById('shift-duration').value);
    if (!isNaN(h) && h > 0) {
        shiftHistory.push({ date: new Date().toISOString(), duration: h });
        saveShifts(); document.getElementById('shift-duration').value = ''; updateDashboard();
    }
});
document.getElementById('btn-force-release').addEventListener('click', () => { manager.reserveBuffer = 0; updateDashboard(); });
updateDashboard();

// --- NODE 2: TACTICAL ROUTING ---
const btnTime = document.getElementById('nav-time'), btnSpace = document.getElementById('nav-space');
const viewTime = document.getElementById('time-ops-view'), viewSpace = document.getElementById('cargo-ops-view');
let sceneInitialized = false;

btnTime.addEventListener('click', () => {
    btnTime.classList.add('active'); btnSpace.classList.remove('active');
    viewTime.classList.remove('hidden'); viewSpace.classList.add('hidden');
});

btnSpace.addEventListener('click', () => {
    btnSpace.classList.add('active'); btnTime.classList.remove('active');
    viewSpace.classList.remove('hidden'); viewTime.classList.add('hidden');
    if (!sceneInitialized) init3D();
});

// --- NODE 3: THREE.JS SPACE OPS ---
let scene, camera, renderer, packages = [];

function init3D() {
    sceneInitialized = true;
    const container = document.getElementById('3d-canvas-container');
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Sentra SV Trunk Wireframe (Scale Representation)
    const trunkGeo = new THREE.BoxGeometry(4, 2, 3);
    const trunkMat = new THREE.MeshBasicMaterial({ color: 0x4CAF50, wireframe: true });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    scene.add(trunk);

    camera.position.z = 5;
    camera.position.y = 2;
    camera.lookAt(0, 0, 0);

    const animate = function () {
        requestAnimationFrame(animate);
        trunk.rotation.y += 0.005; // Slow rotation for situational awareness
        renderer.render(scene, camera);
    };
    animate();

    window.addEventListener('resize', () => {
        if(viewSpace.classList.contains('hidden')) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
}

document.getElementById('btn-add-pkg').addEventListener('click', () => {
    if(!sceneInitialized) return;
    const size = parseFloat(document.getElementById('pkg-size').value);
    const geometry = new THREE.BoxGeometry(size, size, size);
    const material = new THREE.MeshBasicMaterial({ color: 0x007bff, wireframe: false });
    const pkg = new THREE.Mesh(geometry, material);
    
    // Random drop inside the wireframe
    pkg.position.x = (Math.random() - 0.5) * 3;
    pkg.position.y = (Math.random() - 0.5) * 1.5;
    pkg.position.z = (Math.random() - 0.5) * 2;
    
    scene.add(pkg);
    packages.push(pkg);

    const li = document.createElement('li');
    li.textContent = `Scanned: Size Tier [${size}] - Logged`;
    document.getElementById('package-list').appendChild(li);
});

document.getElementById('btn-clear-cargo').addEventListener('click', () => {
    packages.forEach(p => scene.remove(p));
    packages = [];
    document.getElementById('package-list').innerHTML = '';
});

// --- PWA FAILSAFE ARMING ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js'));
}