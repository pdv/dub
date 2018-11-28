
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

const FRAME_THICKNESS = 5;
const FADE = 1;
const RADIUS = 50;

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
        const angle = 0 + oscillate(100000, 100);
        const zoom = 0.7 + oscillate(90000, 0.299);
        const drawFn = (ctx) => {
            drawFrame(ctx, color, FRAME_THICKNESS);
            // drawShape(ctx, color);
        };
        recurse(canvas, tvCanvas, zoom, angle);
        drawFn(canvas.getContext('2d'));
        window.requestAnimationFrame(draw);
    };
    draw();
}
