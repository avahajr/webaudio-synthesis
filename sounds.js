// import * as poem from poem.js;
let audioCtx;
let waveform = "sine";
let num_oscs = 1;
var globalAnalyser;
var am_modulation_freq = 100;
var fm_modulation_freq = 100;
var lfo_modulation_freq = 5;
var modulation_index = 100;

var lfo; // the actual node
var lfoGain; // gain node
var lfoGainValue = 10;

document.addEventListener(
  "DOMContentLoaded",
  function (event) {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    document.getElementById("am").checked = false;
    document.getElementById("fm").checked = false;
    document.getElementById("lfo").checked = false;

    document.getElementById("num-oscs").value = 1;
    const keyboardFrequencyMap = {
      90: 261.625565300598634, //Z - C
      83: 277.182630976872096, //S - C#
      88: 293.66476791740756, //X - D
      68: 311.12698372208091, //D - D#
      67: 329.627556912869929, //C - E
      86: 349.228231433003884, //V - F
      71: 369.994422711634398, //G - F#
      66: 391.995435981749294, //B - G
      72: 415.304697579945138, //H - G#
      78: 440.0, //N - A
      74: 466.163761518089916, //J - A#
      77: 493.883301256124111, //M - B
      81: 523.251130601197269, //Q - C
      50: 554.365261953744192, //2 - C#
      87: 587.32953583481512, //W - D
      51: 622.253967444161821, //3 - D#
      69: 659.255113825739859, //E - E
      82: 698.456462866007768, //R - F
      53: 739.988845423268797, //5 - F#
      84: 783.990871963498588, //T - G
      54: 830.609395159890277, //6 - G#
      89: 880.0, //Y - A
      55: 932.327523036179832, //7 - A#
      85: 987.766602512248223, //U - B
    };

    const asdrTimes = {
      attack: 0.15,
      decaySustain: 0.15,
      release: 0.05,
    };

    function updateAMModFreq() {
      am_modulation_freq = parseInt(
        document.getElementById("am-modulation-freq").value
      );
      document.getElementById("am-modulation-label").textContent =
        " " + am_modulation_freq.toString();
    }
    function updateFMModFreq() {
      fm_modulation_freq = parseInt(
        document.getElementById("fm-modulation-freq").value
      );
      document.getElementById("fm-modulation-label").textContent =
        " " + fm_modulation_freq.toString();
    }
    function updateLFOModFreq() {
      lfo_modulation_freq = parseFloat(
        document.getElementById("lfo-modulation-freq").value
      );
      document.getElementById("lfo-modulation-label").textContent =
        " " + lfo_modulation_freq.toString();
    }
    function updateLFOGain() {
      lfoGainValue = parseFloat(document.getElementById("lfo-gain").value);
      document.getElementById("lfo-gain-label").textContent =
        " " + lfoGainValue.toString();
    }
    function updateOscCount() {
      const osc_slider = document.getElementById("num-oscs").value;

      num_oscs = parseInt(osc_slider);
      document.getElementById("osc-label").textContent = num_oscs.toString();
      console.log(num_oscs);
    }

    document.getElementById("am-modulation-label").textContent =
      " " + am_modulation_freq.toString();

    document.getElementById("fm-modulation-label").textContent =
      " " + fm_modulation_freq.toString();

    document.getElementById("lfo-modulation-label").textContent =
      " " + lfo_modulation_freq.toString();

    document
      .getElementById("am-modulation-freq")
      .addEventListener("change", function () {
        updateAMModFreq();
      });

    document
      .getElementById("fm-modulation-freq")
      .addEventListener("change", function () {
        updateFMModFreq();
      });
    document
      .getElementById("lfo-modulation-freq")
      .addEventListener("change", function () {
        updateLFOModFreq();
      });
    document.getElementById("lfo-gain").addEventListener("change", function () {
      updateLFOGain();
    });
    document.getElementById("num-oscs").addEventListener("change", function () {
      updateOscCount();
    });

    window.addEventListener("keydown", keyDown, false);
    window.addEventListener("keyup", keyUp, false);

    let fm = document
      .getElementById("fm")
      .addEventListener("change", function () {
        updateFM();
      });
    let am = document
      .getElementById("am")
      .addEventListener("change", function () {
        updateAM();
      });
    let isLFO = document
      .getElementById("lfo")
      .addEventListener("change", function () {
        updateLFO();
      });

    function updateAM() {
      am = document.getElementById("am").checked;
      if (!am) {
        // console.log("disabling?");
        document.getElementById("hide-not-am").setAttribute("hidden", true);
      } else {
        document.getElementById("hide-not-am").removeAttribute("hidden");
      }
      // console.log("AM:", am);
    }
    function updateFM() {
      fm = document.getElementById("fm").checked;
      if (!fm) {
        // console.log("disabling?");
        document.getElementById("hide-not-fm").setAttribute("hidden", true);
      } else {
        document.getElementById("hide-not-fm").removeAttribute("hidden");
      }
      // console.log("FM:", fm);
    }
    function updateLFO() {
      isLFO = document.getElementById("lfo").checked;
      if (!isLFO) {
        // console.log("disabling?");
        document.getElementById("hide-not-lfo").setAttribute("hidden", true);
      } else {
        document.getElementById("hide-not-lfo").removeAttribute("hidden");
      }
    }

    // select waveform
    const waveformControl = document.getElementById("waveform");
    waveformControl.addEventListener("change", function (event) {
      waveform = event.target.value;
    });

    function draw() {
      globalAnalyser.fftSize = 2048;
      var bufferLength = globalAnalyser.frequencyBinCount;
      var dataArray = new Uint8Array(bufferLength);
      globalAnalyser.getByteTimeDomainData(dataArray);

      var canvas = document.querySelector("#globalVisualizer");
      var canvasCtx = canvas.getContext("2d");

      requestAnimationFrame(draw);

      globalAnalyser.getByteTimeDomainData(dataArray);

      canvasCtx.fillStyle = "white";
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

      canvasCtx.lineWidth = 2;
      canvasCtx.strokeStyle = "rgb(0, 0, 0)";

      canvasCtx.beginPath();

      var sliceWidth = (canvas.width * 1.0) / bufferLength;
      var x = 0;

      for (var i = 0; i < bufferLength; i++) {
        var v = dataArray[i] / 128.0;
        var y = (v * canvas.height) / 2;
        if (i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      canvasCtx.lineTo(canvas.width, canvas.height / 2);
      canvasCtx.stroke();
    }

    let activeOscillators = {};
    let activeGainNodes = {};

    function keyDown(event) {
      const key = (event.detail || event.which).toString();
      if (keyboardFrequencyMap[key] && !activeOscillators[key]) {
        playNote(key);
        // poem.logNextWord()
      }
    }

    function keyUp(event) {
      const key = (event.detail || event.which).toString();
      if (keyboardFrequencyMap[key] && activeOscillators[key]) {
        // release
        activeGainNodes[key].gain.cancelScheduledValues(audioCtx.currentTime);
        activeGainNodes[key].gain.setTargetAtTime(
          0.0,
          audioCtx.currentTime,
          asdrTimes.release
        );
        setTimeout(() => {
          console.log("gain val:", activeGainNodes[key].gain.value);
          activeOscillators[key].forEach((element) =>
            element.stop(audioCtx.currentTime + asdrTimes.release)
          );
          activeOscillators[key].forEach((oscNode) => {
            delete oscNode;
          });
          delete activeOscillators[key];
          delete activeGainNodes[key];
        }, asdrTimes.release * 5000);
      }
    }

    function playNote(key) {
      let additive_osc_list = []; // data structure for storing oscilators that are connected to a single gain node

      if (!activeOscillators[key]) {
        var gainNode = audioCtx.createGain(); // aka modulated?
        var depth = audioCtx.createGain();
        depth.gain.value = 0.5 / num_oscs;
        gainNode.gain.value = 1.0 - depth.gain.value;

        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);

        for (let i = 1; i < num_oscs + 1; i++) {
          // additive synthesis
          const additive_osc = audioCtx.createOscillator(); // aka carrier
          additive_osc.type = waveform;
          if (isLFO) {
            lfo = audioCtx.createOscillator();
            lfo.frequency.value = lfo_modulation_freq;
            lfoGain = audioCtx.createGain();
            lfoGain.gain.value = lfoGainValue;
            lfo.connect(lfoGain).connect(additive_osc.frequency);
            lfo.start();
          }
          if (fm) {
            var modulationIndex = audioCtx.createGain();
            var modulatorFrequency = audioCtx.createOscillator();
            modulatorFrequency.frequency.value = fm_modulation_freq;
            modulationIndex.gain.value = modulation_index;
            modulatorFrequency.connect(modulationIndex);
            modulationIndex.connect(additive_osc.frequency);

            modulatorFrequency.start();
          }

          if (i == 1) {
            additive_osc.frequency.value = i * keyboardFrequencyMap[key];
          } else {
            // add randomness if it is a partial
            additive_osc.frequency.value =
              i * keyboardFrequencyMap[key] + Math.random() * 15;
          }

          additive_osc.connect(gainNode).connect(audioCtx.destination); // connect to the note's gain node
          additive_osc_list[i - 1] = additive_osc;
          additive_osc.start();
        }

        if (am) {
          var modulatorFrequency = audioCtx.createOscillator(); // to modulate either the gain or the freq, depending
          modulatorFrequency.frequency.value = am_modulation_freq;
          modulatorFrequency.connect(depth).connect(gainNode.gain);
          modulatorFrequency.start();
        }

        globalAnalyser = audioCtx.createAnalyser();
        gainNode.connect(globalAnalyser);
        draw();
        activeOscillators[key] = additive_osc_list;
        activeGainNodes[key] = gainNode;
        let gainFactor = Object.keys(activeGainNodes).length * num_oscs;
        // attack
        // handle polyphony
        Object.keys(activeGainNodes).forEach(function (key) {
          activeGainNodes[key].gain.setTargetAtTime(
            0.6 / gainFactor,
            audioCtx.currentTime,
            asdrTimes.attack
          );
        });
        // decay and sustain
        gainNode.gain.setTargetAtTime(
          0.425 / gainFactor,
          audioCtx.currentTime + asdrTimes.attack,
          asdrTimes.decaySustain
        );
      }
    }
  },
  false
);
