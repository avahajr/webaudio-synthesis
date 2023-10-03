let audioCtx;
let waveform = "sine";
let synth = "none";
let num_oscs = 1;

document.addEventListener(
  "DOMContentLoaded",
  function (event) {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

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

    function updateOscCount() {
      num_oscs = parseInt(document.getElementById("num-oscs").value);
      console.log(num_oscs);
    }

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

    function updateAM() {
      am = document.getElementById("am").checked;
      console.log("AM:", am);
    }
    function updateFM() {
      fm = document.getElementById("fm").checked;
      console.log("FM:", fm);
    }

    // select waveform
    const waveformControl = document.getElementById("waveform");
    waveformControl.addEventListener("change", function (event) {
      waveform = event.target.value;
    });

    let activeOscillators = {};
    let activeGainNodes = {};

    function keyDown(event) {
      const key = (event.detail || event.which).toString();
      if (keyboardFrequencyMap[key] && !activeOscillators[key]) {
        playNote(key);
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
          delete activeOscillators[key];
          delete activeGainNodes[key];
        }, asdrTimes.release * 5000);
      }
    }

    function playNote(key) {
      let additive_osc_list = []; // data structure for storing oscilators that are connected to a single gain node
      if (!activeOscillators[key]) {
        var modulatorFrequency = audioCtx.createOscillator(); // to modulate either the gain or the freq, depending
        modulatorFrequency.frequency.value = 100; // TODO: interface later

        var gainNode = audioCtx.createGain(); // aka modulated?
        var depth = audioCtx.createGain();
        depth.gain.value = 0.5;
        gainNode.gain.value = 1.0 - depth.gain.value;

        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);

        for (let i = 1; i < num_oscs + 1; i++) {
          // additive synthesis
          const additive_osc = audioCtx.createOscillator(); // aka carrier
          additive_osc.type = waveform;

          if (i == 1) {
            additive_osc.frequency.value = i * keyboardFrequencyMap[key];
          } else {
            // add randomness if it is a partial
            additive_osc.frequency.value =
              i * keyboardFrequencyMap[key] + Math.random() * 15;
          }

          additive_osc.connect(gainNode); // connect to the note's gain node
          additive_osc_list[i - 1] = additive_osc;
          additive_osc.start();
        }
        if (am) {
          modulatorFrequency.connect(depth).connect(gainNode.gain);
          modulatorFrequency.start();
        }
        gainNode.connect(audioCtx.destination);
        activeOscillators[key] = additive_osc_list;
        activeGainNodes[key] = gainNode;
        let gainFactor = Object.keys(activeGainNodes).length;
        // attack
        // handle polyphony
        Object.keys(activeGainNodes).forEach(function (key) {
          activeGainNodes[key].gain.setTargetAtTime(
            0.7 / gainFactor / num_oscs,
            audioCtx.currentTime,
            asdrTimes.attack
          );
        });
        // decay and sustain
        gainNode.gain.setTargetAtTime(
          0.425 / gainFactor / num_oscs,
          audioCtx.currentTime + asdrTimes.attack,
          asdrTimes.decaySustain
        );
      }
    }
  },
  false
);
