
const settings = {
    rotation: 20,
    // rotationFreq: 0,
    rotationOscFreq: 0.1,
    rotationOscAmt: 0,
    zoom: 0.7,
    zoomOscFreq: 0.1,
    zoomOscAmt: 0,
    frameThickness: 5
    // fade: 1,
    // delay: 0,
};

function initializeControls() {
    const gui = new dat.GUI();
    const rotationFolder = gui.addFolder('Rotation');
    rotationFolder.add(settings, 'rotation', 0, 360);
    rotationFolder.add(settings, 'rotationOscFreq', 0, 1.0);
    rotationFolder.add(settings, 'rotationOscAmt', 0, 360);
    rotationFolder.open();
    const zoomFolder = gui.addFolder('Zoom');
    zoomFolder.add(settings, 'zoom', 0.1, 1.5);
    zoomFolder.add(settings, 'zoomOscFreq', 0, 1);
    zoomFolder.add(settings, 'zoomOscAmt', 0, 0.8);
    zoomFolder.open();
    gui.add(settings, 'frameThickness', 0, 15);
}

// Returns a new canvas the same size as [oldCanvas]
function clone(oldCanvas) {
    const newCanvas = document.createElement('canvas');
    newCanvas.width = oldCanvas.width;
    newCanvas.height = oldCanvas.height;
    return newCanvas;
}

function mousePos(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top) * scaleY
    };
}

/**
 * Given canvas [camera] and identically sized canvas [tv],
 * Simulates the effect of pointing a camera at a tv that is monitoring
 * what the camera sees, rotated [rotation] degrees with [zoom] scalar.
 */
function recurse(camera, tv, zoom, rotation) {
    const cameraCtx = camera.getContext('2d');
    const tvCtx = tv.getContext('2d');
    const width = camera.width;
    const height = camera.height;

    // The TV shows what was previously in the camera
    tvCtx.clearRect(0, 0, width, height);
    tvCtx.drawImage(camera, 0, 0);

    // The camera picks up what the tv was showing, scaled and at an angle
    cameraCtx.clearRect(0, 0, width, height);
    cameraCtx.translate(width / 2, height / 2);
    cameraCtx.scale(zoom, zoom);
    cameraCtx.rotate(rotation * Math.PI / 180);
    cameraCtx.translate(width / -2, height / -2);
    cameraCtx.drawImage(tv, 0, 0);
    cameraCtx.setTransform(1, 0, 0, 1, 0, 0);
}

function drawFrame(ctx, color, thickness) {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    const t = thickness;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, t, h);
    ctx.fillRect(0, 0, w, t);
    ctx.fillRect(w - t, 0, t, h);
    ctx.fillRect(0, h - t, w, t);
}

function vfb(canvas, color) {
    initializeControls();
    const tvCanvas = clone(canvas);
    const start = Date.now();
    let mouse = { x: 0, y: 0, down: false };

    canvas.addEventListener('mousedown', (event) => {
        mouse = { ...mousePos(canvas, event), down: true };
        console.log(mouse);
    });

    canvas.addEventListener('mousemove', (event) => {
        mouse = { ...mousePos(canvas, event), down: mouse.down };
        console.log(mouse);
    });

    canvas.addEventListener('mouseup', (event) => {
        mouse = { down: false };
        console.log(mouse);
    });

    const drawShape = (ctx, color) => {
        if (mouse.down) {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(mouse.x, mouse.y, RADIUS, 0, 2 * Math.PI, false);
            ctx.fill();
        }
    };

    const oscillate = (period, amplitude) => {
        const elapsed = Date.now() - start;
        const phase = (elapsed / period) * (2 * Math.PI);
        return amplitude * Math.sin(phase);
    };

    const draw = () => {
        const rotationOsc = oscillate(
            1000 / settings.rotationOscFreq,
            settings.rotationOscAmt
        );
        const angle = settings.rotation + rotationOsc;
        const zoomOsc = oscillate(
            1000 / settings.zoomOscFreq,
            settings.zoomOscAmt
        );
        const zoom = settings.zoom + zoomOsc;
        const drawFn = (ctx) => {
            drawFrame(ctx, color, settings.frameThickness);
            // drawShape(ctx, color);
        };
        recurse(canvas, tvCanvas, zoom, angle);
        drawFn(canvas.getContext('2d'));
        window.requestAnimationFrame(draw);
    };
    draw();
}
