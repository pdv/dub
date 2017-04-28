'use strict'

let $ = (id) => document.getElementById(id);
let RADIUS = 20
let COLORS = {
    'red': '#DF151A',
    'orange': '#FD8603',
    'yellow': '#F4F328',
    'green': '#00DA3C',
    'blue': '#00CBE7'
}

// Canvas

let canvas = $('screen')
let sw = canvas.width
let sh = canvas.height
let ctx = canvas.getContext('2d')

// Audio

let actx = new window.AudioContext()
let osc = actx.createOscillator()
osc.type = 'sawtooth'

let env = actx.createGain()
env.gain.value = 0

let filter = actx.createBiquadFilter()
filter.type = 'peaking'
filter.Q.value = 1.5

let delay = actx.createDelay(3)
let delayGain = actx.createGain()
delayGain.gain.value = 0.3

let out = actx.createGain()
out.gain.value = 0.1

osc.connect(env)
env.connect(filter)
filter.connect(out)
filter.connect(delay)

delay.connect(delayGain)
delayGain.connect(delay)
delayGain.connect(out)

out.connect(actx.destination)

osc.start()

function setAudioParams() {
    delay.delayTime.value = $('delay').value / 40
    delayGain.gain.value = $('1:1').checked ? 1 : $('zoom').value
    // delayFilter.frequency.value = $('rotate').value * 20
}

function openGate() {
    let attack = parseFloat($('attack').value)
    env.gain.exponentialRampToValueAtTime(1.0, actx.currentTime + attack)
}

function closeGate() {
    let decay = parseFloat($('decay').value)
    env.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + decay)
}

$('delay').addEventListener('input', setAudioParams)
$('zoom').addEventListener('input', setAudioParams)
$('color').addEventListener('input', (e) => {
    switch ($('color').value) {
    case 'red':
        osc.type = 'sawtooth'
        break
    case 'orange':
        osc.type = 'square'
        break
    case 'yellow':
        osc.type = 'triangle'
        break
    case 'green':
    case 'blue':
        osc.type = 'sine'
    }
})

// Quantization

function midiToHz(note) {
    return 440 * (Math.pow(2, (note - 69) / 12))
}

let MAJ_INC = [2, 2, 1, 2, 2, 2, 1]
let MAJ = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6]

function quantize(note) {
    let noteInt = Math.floor(note)
    let noteInScale = MAJ[noteInt % 12]
    let root = Math.floor(noteInt / 12) * 12
    return root + noteInScale
}


// Mouse

let mouse = {
    x: 0,
    y: 0,
    down: false
};

canvas.addEventListener('mousedown', (e) => {
    mouse.down = true
    setAudioParams()
    openGate()
}, false)

canvas.addEventListener('mouseup', (e) => {
    if (!$('hold').checked) {
        mouse.down = false
        setAudioParams()
        closeGate()
    }
}, false)

canvas.addEventListener('mousemove', (e) => {
    let rect = canvas.getBoundingClientRect()
    mouse.x = e.clientX - rect.left - 15
    mouse.y = e.clientY - rect.top - 15

    let note = (sh + 200 - mouse.y) / 10
    osc.frequency.value = midiToHz($('quant').checked ? quantize(note) : note)
    filter.frequency.value = midiToHz(mouse.x / 10)
}, false)


// Drawing functions

function drawFrame(w) {
    ctx.fillStyle = '#222'
    ctx.fillRect(0, 0, sw, sh)
    ctx.clearRect(w, w, sw - 2 * w, sh - 2 * w)
}

function drawGrid(count) {
    for (var i = 2; i < sw; i += (sw - 4) / count) {
        for (var j = 2; j < sh; j += (sh - 4) / count) {
            let red = parseInt($('gridColor').value)
            let green = Math.floor((i / sw) * 255)
            let blue = Math.floor(((sh - j) / sh) * 255)
            ctx.fillStyle = 'rgb(' + red + ',' + green + ',' + blue + ')'
            ctx.beginPath()
            ctx.arc(i, j, 1, 0, 2 * Math.PI)
            ctx.fill()
        }
    }
}

function drawShape() {
    if (mouse.down) {
        ctx.fillStyle = COLORS[$('color').value]
        ctx.beginPath()
        ctx.arc(mouse.x, mouse.y, RADIUS, 0, 2 * Math.PI, false)
        ctx.fill()
    }
}


// Capture and transform

function cloneCanvas(oldCanvas) {
    let newCanvas = document.createElement('canvas')
    newCanvas.width = oldCanvas.width;
    newCanvas.height = oldCanvas.height;
    newCanvas.getContext('2d').drawImage(oldCanvas, 0, 0)
    return newCanvas
}

function cameraTransform() {
    let scale = $('1:1').checked ? 1 : $('zoom').value
    let angle = $('rotate').value
    ctx.translate(sw / 2, sh / 2)
    ctx.scale(scale, scale)
    ctx.rotate(angle * Math.PI / 180)
    ctx.translate(-sw / 2, -sh / 2)
}


// Draw loop

let layers = new Array()

function draw() {
    layers.unshift(cloneCanvas(canvas))
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, sw, sh)

    if ($('frame').checked) {
        drawFrame(2)
    }
    drawGrid($('grid').value)

    if (layers.length >= $('delay').value) {
        cameraTransform()
        ctx.globalAlpha = $('opacity').value
        ctx.drawImage(layers.pop(), 0, 0)
        ctx.setTransform(1, 0, 0, 1, 0, 0)
    }
    drawShape()
    window.requestAnimationFrame(draw)
}

draw()
