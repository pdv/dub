'use strict'

let $ = (id) => document.getElementById(id);
let RADIUS = 20
let ATTACK = 0.1
let DECAY = 0.3
let COLORS = {
    'red': '#DF151A',
    'orange': '#FD8603',
    'yellow': '#F4F328',
    'green': '#00DA3C',
    'blue': '#00CBE7'
}

// Canvas

let canvas = $('screen');
let sw = canvas.width;
let sh = canvas.height;
let ctx = canvas.getContext('2d')

// Audio

let actx = new window.AudioContext()
let osc = actx.createOscillator()
osc.type = 'sawtooth'

let env = actx.createGain()
env.gain.value = 0

let filter = actx.createBiquadFilter()
filter.type = 'lowpass'

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
    delayGain.gain.value = $('zoom').value
}

function openGate() {
    // env.gain.cancelAndHoldAtTime(actx.currentTime)
    env.gain.exponentialRampToValueAtTime(1.0, actx.currentTime + ATTACK)
}

function closeGate() {
    // env.gain.cancelAndHoldAtTime(actx.currentTime)
    env.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + DECAY)
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
    mouse.down = false
    setAudioParams()
    closeGate()
}, false)

canvas.addEventListener('mousemove', (e) => {
    let rect = canvas.getBoundingClientRect()
    mouse.x = e.clientX - rect.left - 15
    mouse.y = e.clientY - rect.top - 15

    osc.frequency.value = mouse.y * 3
    filter.frequency.value = mouse.x * 3
}, false)


// Drawing functions

function drawFrame(w) {
  ctx.fillStyle = '#222'
  ctx.fillRect(0, 0, sw, sh)
  ctx.clearRect(w, w, sw - 2 * w, sh - 2 * w)
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
  if (layers.length >= $('delay').value) {
    cameraTransform()
    ctx.drawImage(layers.pop(), 0, 0)
    ctx.setTransform(1, 0, 0, 1, 0, 0)
  }
  drawShape()
  window.requestAnimationFrame(draw)
}

draw()
