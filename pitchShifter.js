

// https://github.com/urtzurd/html-audio/blob/gh-pages/static/js/pitch-shifter.js

function hannWindow(length) {
    var window = new Float32Array(length);
    for (var i = 0; i < length; i++) {
        window[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (length - 1)));
    }
    return window;
}

function linearInterpolation(a, b, t) {
    return a + (b - a) * t;
};

function pitchShifter(actx) {

    let validGranSizes = [256, 512, 1024, 2048, 4096, 8192]
    let grainSize = validGranSizes[0]

    let shifter = actx.createScriptProcessor(grainSize, 1, 1)
    let pitchRatio = 1
    let overlapRatio = 0.5

    shifter.buffer = new Float32Array(grainSize * 2)
    shifter.grainWindow = hannWindow(grainSize)
    shifter.onaudioprocess = function(event) {

        let inputData = event.inputBuffer.getChannelData(0)
        let outputData = event.outputBuffer.getChannelData(0)
        for (var i = 0; i < inputData.length; i++) {
            inputData[i] *= this.grainWindow[i];
            this.buffer[i] = this.buffer[i + grainSize]
            this.buffer[i + grainSize] = 0.0
        }

        var grainData = new Float32Array(grainSize * 2)
        for (var i = 0, j = 0.0; i < grainSize; i++, j += pitchRatio) {
            let idx = Math.floor(j) % grainSize
            let a = inputData[idx]
            let b = inputData[(idx + 1) % grainSize]
            grainData[i] += linearInterpolation(a, b, j % 1.0) * this.grainWindow[i]
        }

        for (var i = 0; i < grainSize; i += Math.round(grainSize * (1 - overlapRatio))) {
            for (var j = 0; j <= grainSize; j++) {
                this.buffer[i + j] += grainData[j]
            }
        }

        for (var i = 0; i < grainSize; i++) {
            outputData[i] = this.buffer[i]
        }
    }

    return { shifter: shifter, pitch: pitchRatio }

}
