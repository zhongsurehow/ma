import * as THREE from 'three';
// import { OrbitControls } from 'three/addons/controls/OrbitControls.js'; // Uncomment if you need orbit controls

// --- DOM Elements ---
const animationContainer = document.getElementById('animation-container');
const scenes = document.querySelectorAll('.scene');

// --- GSAP Master Timeline ---
const masterTimeline = gsap.timeline({
    // paused: true, // Useful for debugging
    onComplete: () => console.log("Master Animation Sequence Complete!")
});

// --- Helper Functions ---
function setActiveScene(sceneId) {
    scenes.forEach(s => {
        if (s.id === sceneId) {
            s.classList.add('active-scene');
        } else {
            s.classList.remove('active-scene');
        }
    });
}

function createTextAppearAnimation(elements, stagger = 0.1, duration = 0.6, fromVars = {}, toVars = {}) {
    const defaultFrom = { opacity: 0, y: 20, scale: 0.8, filter: 'blur(3px)' };
    const defaultTo = { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: duration, stagger: stagger, ease: 'back.out(1.7)' };
    return gsap.fromTo(elements, { ...defaultFrom, ...fromVars }, { ...defaultTo, ...toVars });
}

function createTextDisappearAnimation(elements, stagger = 0.05, duration = 0.3, toVars = {}) {
    const defaultTo = { opacity: 0, y: -10, scale: 0.9, filter: 'blur(2px)', duration: duration, stagger: stagger, ease: 'power2.in' };
    return gsap.to(elements, { ...defaultTo, ...toVars });
}


// --- Scene Animations ---

// Scene 0: Intro
function animateScene0() {
    const sceneEl = document.getElementById('scene0-intro');
    const titleSpans = sceneEl.querySelectorAll('.intro-title span');
    const subtitle = sceneEl.querySelector('.intro-subtitle');
    const tl = gsap.timeline({ onStart: () => setActiveScene('scene0-intro') });

    tl.from(titleSpans, {
        opacity: 0,
        y: -50,
        scale: 0.5,
        rotationX: -90,
        filter: 'blur(10px)',
        duration: 0.8,
        stagger: 0.15,
        ease: 'elastic.out(1, 0.5)'
    })
    .to(subtitle, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, "-=0.5")
    .to({}, { duration: 1.5 }) // Hold scene
    .add(createTextDisappearAnimation([titleSpans, subtitle], 0.1, 0.5));

    return tl;
}

// Scene 1: "你不是信息焦虑"
function animateScene1() {
    const sceneEl = document.getElementById('scene1-anxiety');
    const anxietyTextSpans = sceneEl.querySelectorAll('.text-anxiety span');
    const notAnxietyText = sceneEl.querySelector('.text-not-anxiety');
    const tl = gsap.timeline({ onStart: () => setActiveScene('scene1-anxiety') });

    tl.from(anxietyTextSpans, {
        duration: 0.7,
        opacity: 0,
        x: () => anime.random(-40, 40),
        y: () => anime.random(-40, 40),
        scale: () => anime.random(0.2, 1.8),
        skewX: () => anime.random(-30, 30),
        filter: 'blur(8px) saturate(2)',
        stagger: { each: 0.1, from: "random" },
        ease: 'back.out(2)'
    })
    .to(notAnxietyText, {
        opacity: 1,
        scale: 1.1,
        duration: 1,
        ease: 'elastic.out(1, 0.4)'
    }, "-=0.4")
    .to(anxietyTextSpans, {
        duration: 0.6,
        opacity: 0,
        filter: 'blur(15px) hue-rotate(180deg)',
        scale: 0.1,
        x: () => anime.random(-100, 100),
        y: () => anime.random(-100, 100),
        stagger: 0.05,
        ease: 'power2.in'
    }, "+=0.8")
    .add(createTextDisappearAnimation(notAnxietyText, 0, 0.4));

    return tl;
}

// Scene 2: "是你一直在拿漏斗接瀑布"
let threeScene2 = {}; // Store Three.js objects for cleanup
function animateScene2() {
    const sceneEl = document.getElementById('scene2-waterfall');
    const textContainer = document.querySelector('.scene2-waterfall-text-container');
    const textLine1 = textContainer.querySelector('.text-line1');
    const textLine2 = textContainer.querySelector('.text-line2');
    const funnelText = textContainer.querySelector('.text-funnel');
    const waterfallText = textContainer.querySelector('.text-waterfall');

    const tl = gsap.timeline({ onStart: () => setActiveScene('scene2-waterfall') });

    tl.call(() => { // Setup Three.js
        setupThreeScene2(sceneEl);
    })
    .to(textLine1, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, "+=0.5")
    .to(textLine2, { opacity: 1, y: 0, duration: 0.1 }, "-=0.2") // Appear container
    .from(funnelText, { opacity:0, scale: 0.2, x:-20, duration: 0.8, ease: 'elastic.out(1,0.6)'}, "-=0.1")
    .from(waterfallText, { opacity:0, y: -30, scaleY:0, transformOrigin:"top", duration: 0.8, ease: 'power3.out'}, "-=0.5")
    .call(() => { // Trigger funnel animation within Three.js if needed
        if (threeScene2.funnel) {
            gsap.to(threeScene2.funnel.scale, { x: 0.8, y: 0.8, z: 0.8, duration: 0.5, yoyo: true, repeat: 3, ease: "power1.inOut" }); // Funnel struggling
        }
    }, null, "+=1") // After text, simulate struggle
    .to({}, { duration: 3.5 }) // Hold Three.js scene visual
    .add(createTextDisappearAnimation([textLine1, textLine2], 0.1, 0.4))
    .to(sceneEl, { // Fade out canvas, specific to Three.js scenes
        opacity: 0,
        duration: 0.5,
        onComplete: () => {
            if (threeScene2.renderer) {
                threeScene2.renderer.dispose();
                if (threeScene2.animationFrameId) cancelAnimationFrame(threeScene2.animationFrameId);
                sceneEl.innerHTML = ''; // Clear canvas
                threeScene2 = {};
            }
        }
    }, "-=0.4");

    return tl;
}

function setupThreeScene2(container) {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 1, 6);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); // Alpha for potential css background
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);
    threeScene2.renderer = renderer;

    // Funnel
    const funnelGeometry = new THREE.ConeGeometry(1, 2.5, 32, 4, true); // Open ended cone
    const funnelMaterial = new THREE.MeshPhongMaterial({ color: 0xFFCA28, side: THREE.DoubleSide, emissive: 0x443300, shininess: 50 });
    const funnel = new THREE.Mesh(funnelGeometry, funnelMaterial);
    funnel.position.y = -1;
    funnel.rotation.x = Math.PI; // Point upwards
    scene.add(funnel);
    threeScene2.funnel = funnel;
    gsap.from(funnel.scale, { x: 0.1, y: 0.1, z: 0.1, duration: 1, ease: "elastic.out(1,0.5)"});


    // Waterfall Particles
    const particleCount = 10000;
    const particlesGeometry = new THREE.BufferGeometry();
    const posArray = new Float32Array(particleCount * 3);
    const particleVelocities = [];
    const particleLifespan = [];

    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        posArray[i3] = (Math.random() - 0.5) * 6; // Wider spread for waterfall
        posArray[i3 + 1] = Math.random() * 5 + 4; // Start higher
        posArray[i3 + 2] = (Math.random() - 0.5) * 2;
        particleVelocities.push(new THREE.Vector3(
            (Math.random() - 0.5) * 0.01, // Slight horizontal drift
            -Math.random() * 0.08 - 0.05, // Base downward speed
            (Math.random() - 0.5) * 0.01
        ));
        particleLifespan.push(Math.random() * 100 + 50); // Frames
    }
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particleMaterial = new THREE.PointsMaterial({
        size: 0.05,
        color: 0x4FC3F7,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
    });
    const particleMesh = new THREE.Points(particlesGeometry, particleMaterial);
    scene.add(particleMesh);
    threeScene2.particleMesh = particleMesh;
    threeScene2.particleVelocities = particleVelocities;
    threeScene2.particleLifespan = particleLifespan;


    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7);
    scene.add(directionalLight);

    function animate() {
        threeScene2.animationFrameId = requestAnimationFrame(animate);
        const positions = threeScene2.particleMesh.geometry.attributes.position.array;
        const velocities = threeScene2.particleVelocities;
        const lifespans = threeScene2.particleLifespan;

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            positions[i3] += velocities[i].x;
            positions[i3 + 1] += velocities[i].y;
            positions[i3 + 2] += velocities[i].z;

            lifespans[i]--;

            // Collision with funnel (simplified) & splashing
            const funnelTopY = funnel.position.y + funnelGeometry.parameters.height / 2;
            const funnelRadiusAtY = (yPos) => {
                const progress = (yPos - (funnel.position.y - funnelGeometry.parameters.height / 2)) / funnelGeometry.parameters.height;
                return funnelGeometry.parameters.radiusTop * (1-progress); // Simplified linear interpolation of radius
            };

            if (positions[i3+1] < funnelTopY && positions[i3+1] > funnel.position.y - funnelGeometry.parameters.height / 2) {
                 const currentRadius = funnelRadiusAtY(positions[i3+1]);
                 const distToCenter = Math.sqrt(positions[i3]*positions[i3] + positions[i3+2]*positions[i3+2]);
                 if(distToCenter > currentRadius && distToCenter < currentRadius + 0.5) { // Near funnel edge
                    velocities[i].y *= -0.3; // Bounce up slightly
                    velocities[i].x += (Math.random() - 0.5) * 0.1; // Splash out
                    velocities[i].z += (Math.random() - 0.5) * 0.1;
                    positions[i3+1] += 0.1; // Push out from surface
                 }
            }


            if (positions[i3 + 1] < -3 || lifespans[i] <= 0) { // Reset particle
                positions[i3] = (Math.random() - 0.5) * 6;
                positions[i3 + 1] = Math.random() * 3 + 5; // Reset to top
                positions[i3 + 2] = (Math.random() - 0.5) * 2;
                velocities[i].y = -Math.random() * 0.08 - 0.05; // Reset speed
                lifespans[i] = Math.random() * 100 + 50;
            }
        }
        threeScene2.particleMesh.geometry.attributes.position.needsUpdate = true;
        renderer.render(scene, camera);
    }
    animate();
}

// Scene 3: "现在的信息世界，像水一样..."
function animateScene3() {
    const sceneEl = document.getElementById('scene3-water-world');
    const svg = d3.select("#water-streams-svg");
    const textContainer = sceneEl.querySelector('.scene3-water-world-text-container');
    const textWaterLike = textContainer.querySelector('.text-water-like');
    const textWaterFastSpans = textContainer.querySelectorAll('.text-water-fast span');

    const width = sceneEl.clientWidth;
    const height = sceneEl.clientHeight;

    const tl = gsap.timeline({ onStart: () => setActiveScene('scene3-water-world') });

    const numStreams = 25;
    const streamsData = [];
    for (let i = 0; i < numStreams; i++) {
        streamsData.push({
            id: i,
            points: d3.range(0, Math.floor(width / 50) + 2).map(j => [
                j * 50,
                height * (0.2 + Math.random() * 0.6) + Math.sin(j * 0.2 + i * 0.5 + Math.random()*Math.PI) * (height * 0.15)
            ])
        });
    }

    const lineGenerator = d3.line()
        .x(d => d[0])
        .y(d => d[1])
        .curve(d3.curveCatmullRom.alpha(0.5)); // Smooth, flowing curves

    svg.selectAll("path.stream").remove(); // Clear previous if any
    const paths = svg.selectAll("path.stream")
        .data(streamsData)
        .enter()
        .append("path")
        .attr("class", "stream")
        .attr("d", d => lineGenerator(d.points))
        .attr("fill", "none")
        .attr("stroke", () => d3.interpolateCool(Math.random())) // Varying colors
        .attr("stroke-width", () => Math.random() * 4 + 1.5)
        .attr("stroke-opacity", () => Math.random() * 0.5 + 0.3)
        .attr("stroke-dasharray", function() { const L = this.getTotalLength(); return `${L} ${L}`; })
        .attr("stroke-dashoffset", function() { return this.getTotalLength(); });

    tl.add(createTextAppearAnimation(textWaterLike, 0.1, 0.8))
      .to(paths.nodes(), { // Animate D3 paths with GSAP
          strokeDashoffset: 0,
          duration: () => Math.random() * 1.5 + 1, // Varied speed
          stagger: 0.05,
          ease: "power1.inOut"
      }, "-=0.5")
      .add(createTextAppearAnimation(textWaterFastSpans, 0.05, 0.6,
        { x: (i) => (i % 2 === 0 ? -20 : 20), skewX: (i) => (i % 2 === 0 ? -15 : 15), filter:'blur(0px)' },
        { x:0, skewX:0 }
      ), "-=1")
      .to({}, { duration: 2.5 }) // Hold scene
      .add(createTextDisappearAnimation([textWaterLike, textWaterFastSpans], 0.05, 0.4))
      .to(paths.nodes(), {
          strokeDashoffset: function() { return -this.getTotalLength(); }, // Animate off
          duration: 1,
          stagger: 0.03,
          ease: "power1.in"
      }, "-=0.4");

    return tl;
}


// --- Subsequent Scene Placeholders (Implement these following similar patterns) ---

function animateScene4() { // "你以为你能接住所有水..."
    const sceneEl = document.getElementById('scene4-drowning');
    const textLines = sceneEl.querySelectorAll('.scene4-drowning-text-container div');
    const drownWords = sceneEl.querySelectorAll('.text-drown-word');
    const drowningEffect = document.getElementById('drowning-effect-container');
    const tl = gsap.timeline({ onStart: () => setActiveScene('scene4-drowning') });

    tl.add(createTextAppearAnimation(textLines[0]))
      .add(createTextAppearAnimation(textLines[1], 0, 0.2, {y:0, scale:1}, {opacity:1}), "-=0.1") // Reveal second line container
      .from(drownWords, {
          opacity: 0,
          scale: 2,
          filter: 'blur(10px) contrast(200%)',
          stagger: 0.4,
          duration: 1,
          ease: 'power3.out',
          onStart: function() { // GSAP's onStart for individual stagger items
            if (this.targets()[0].classList.contains('text-drown-choked')) {
                gsap.to(drowningEffect, { opacity: 0.6, duration: 0.5, ease: "power2.inOut", filter: 'blur(5px) saturate(0.5)'});
            } else if (this.targets()[0].classList.contains('text-drown-filled')) {
                gsap.to(drowningEffect, { opacity: 0.4, duration: 0.5, ease: "power2.inOut", filter: 'blur(3px)'});
            } else {
                gsap.to(drowningEffect, { opacity: 0.2, duration: 0.5 });
            }
          }
      }, "+=0.2")
      .to(drowningEffect, {
        keyframes: [ // Quick visual "choke" / "glitch"
            { filter: 'blur(10px) contrast(3)', duration: 0.1},
            { filter: 'blur(3px) contrast(1)', x: '+=10', duration: 0.1},
            { filter: 'blur(8px) contrast(2)', x: '-=20', duration: 0.1},
            { filter: 'blur(0px) contrast(1)', x: '0', duration: 0.1}
        ],
        repeat: 1,
        yoyo: true
      }, "-=0.3")
      .to({}, { duration: 2 })
      .add(createTextDisappearAnimation(textLines))
      .to(drowningEffect, {opacity:0, duration:0.5}, "-=0.5");
    return tl;
}

function animateScene5() { // "所以，聪明人不去“接”"
    const sceneEl = document.getElementById('scene5-dont-catch');
    const textLines = sceneEl.querySelectorAll('.scene5-text-container div');
    const catchWord = sceneEl.querySelector('.text-catch-word');
    const crossOutSVG = sceneEl.querySelector('.cross-out-svg');
    const linesInCross = crossOutSVG.querySelectorAll('line');

    const tl = gsap.timeline({ onStart: () => setActiveScene('scene5-dont-catch') });
    tl.add(createTextAppearAnimation(textLines[0]))
      .add(createTextAppearAnimation(textLines[1], 0, 0.2, {y:0, scale:1}, {opacity:1})) // Reveal container for "接"
      .fromTo(catchWord, { opacity:0, scale:0.5, color:"#FF8A65"}, {opacity:1, scale:1, color:"#FF8A65", duration:0.8, ease:"elastic.out(1,0.5)"})
      .to(crossOutSVG, {opacity:1, duration:0.1}, "+=0.5")
      .from(linesInCross, {
          attr: { x2: (i,t) => t.getAttribute('x1'), y2: (i,t) => t.getAttribute('y1') }, // Start line collapsed
          duration: 0.4,
          stagger: 0.1,
          ease: "power2.out"
      })
      .to({}, { duration: 1.5 })
      .add(createTextDisappearAnimation(textLines))
      .to(crossOutSVG, {opacity:0, duration:0.3}, "-=0.5");
    return tl;
}


// ... Implement animateScene6, animateScene7, etc. using similar structure ...
// For scenes with SVG or Three.js, create setup functions like setupThreeScene2.

// Example placeholder for a more complex scene (Valve 1)
function animateScene8() {
    const sceneEl = document.getElementById('scene8-valve1-filter');
    const titleNum = sceneEl.querySelector('.valve-number');
    const titleName = sceneEl.querySelector('.valve-name');
    const descLines = sceneEl.querySelectorAll('.valve-description div');
    const filterSvg = d3.select("#filter-animation-svg");

    const tl = gsap.timeline({ onStart: () => setActiveScene('scene8-valve1-filter') });

    tl.add(createTextAppearAnimation(titleNum))
      .add(createTextAppearAnimation(titleName), "-=0.4")
      .add(createTextAppearAnimation(descLines, 0.15, 0.5), "+=0.3");

    // Simple filter animation example with D3/GSAP
    tl.call(() => {
        filterSvg.selectAll("*").remove(); // Clear
        const width = sceneEl.clientWidth;
        const height = sceneEl.clientHeight;

        // Filter mesh
        const meshSize = 20;
        for (let i = 0; i < width; i += meshSize) {
            filterSvg.append("line").attr("x1", i).attr("y1", 0).attr("x2", i).attr("y2", height).attr("stroke", "#555").attr("stroke-width", 1);
        }
        for (let j = 0; j < height; j += meshSize) {
            filterSvg.append("line").attr("x1", 0).attr("y1", j).attr("x2", width).attr("y2", j).attr("stroke", "#555").attr("stroke-width", 1);
        }
        const filterMesh = filterSvg.selectAll("line").style("opacity",0);
        gsap.to(filterMesh.nodes(), {opacity:0.3, duration:1, stagger:0.01});


        // Particles (chaotic)
        const chaoticParticles = filterSvg.selectAll("circle.chaotic")
            .data(d3.range(100))
            .enter().append("circle").attr("class", "chaotic")
            .attr("cx", () => Math.random() * width * 0.3 + width * 0.1) // Left side
            .attr("cy", () => Math.random() * height)
            .attr("r", () => Math.random() * 5 + 2)
            .attr("fill", () => d3.interpolateRainbow(Math.random()))
            .style("opacity",0);

        gsap.to(chaoticParticles.nodes(), {
            opacity:0.8,
            duration:0.5,
            stagger:0.02,
            cx: `+=${width * 0.6}`, // Move towards right
            ease: "power1.inOut",
            yoyo:true,
            repeat:3,
            modifiers: { // Simulate getting blocked by filter
                cx: function(value, target) {
                    if (parseFloat(target.getAttribute("cx")) > width/2 && parseFloat(target.getAttribute("cx")) < width/2 + 50) {
                        return Math.min(value, width/2 - Math.random()*10); // Bounce back
                    }
                    return value;
                }
            }
        });

        // Focused particle (passes through)
        const focusedParticle = filterSvg.append("circle")
            .attr("cx", width * 0.1)
            .attr("cy", height / 2)
            .attr("r", 8)
            .attr("fill", "#FFF59D")
            .style("opacity",0)
            .style("filter", "drop-shadow(0 0 5px #FFF59D)");

        gsap.to(focusedParticle.node(), {
            opacity:1,
            cx: width * 0.9,
            duration: 2,
            delay:1,
            ease: "power2.out"
        });


    }, null, "+=0.5") // After text
    .to({}, { duration: 4.5 }) // Hold visual
    .add(createTextDisappearAnimation([titleNum, titleName, descLines]))
    .to(filterSvg.node(), {opacity:0, duration:0.5, onComplete:()=>filterSvg.selectAll("*").remove()}, "-=0.5");


    return tl;
}

// --- Add Scene Animations to Master Timeline ---
masterTimeline
    .add(animateScene0())
    .add(animateScene1(), "-=0.5") // Slight overlap
    .add(animateScene2(), "-=0.5")
    .add(animateScene3(), "-=0.5")
    .add(animateScene4(), "-=0.5")
    .add(animateScene5(), "-=0.5")
    // For remaining scenes, create functions and add them here
    // .add(animateScene6(), "-=0.5")
    // .add(animateScene7(), "-=0.5")
    .add(animateScene8(), "-=0.5") // Example for Valve 1
    // .add(animateScene9(), "-=0.5")
    // .add(animateScene10(), "-=0.5")
    // .add(animateScene11(), "-=0.5")
    // .add(animateScene12(), "-=0.5")
    // .add(animateScene13(), "-=0.5") // Outro
    ;

// --- Auto-play (optional) ---
// masterTimeline.play(); // Uncomment to play automatically on load
// You might want to add a play button or trigger it after assets load.

console.log("Script loaded. Master timeline created.");
// For debugging, you can access the timeline in the console:
// window.masterTimeline = masterTimeline;
// Then use masterTimeline.play(), masterTimeline.pause(), masterTimeline.seek(), etc.