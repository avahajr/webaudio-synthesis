let audioCtx;
let waveform = "sine";
let synth = "none";
let num_oscs = parseInt(document.getElementById("num-oscs").value);

document.addEventListener(
  "DOMContentLoaded",
  function (event) {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const globalGain = audioCtx.createGain();
    globalGain.gain.setValueAtTime(0.8, audioCtx.currentTime);
    globalGain.connect(audioCtx.destination);

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
      let additive_osc_list = [];
      if (!activeOscillators[key]) {
        var gainNode = audioCtx.createGain();
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        for (let i = 1; i < num_oscs + 1; i++) {
          const additive_osc = audioCtx.createOscillator();
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

        gainNode.connect(audioCtx.destination);
        activeOscillators[key] = additive_osc_list;
        activeGainNodes[key] = gainNode;
        let gainFactor = Object.keys(activeGainNodes).length;
        // attack
        // reduce gain on all nodes for polyphony
        Object.keys(activeGainNodes).forEach(function (key) {
          activeGainNodes[key].gain.setTargetAtTime(
            0.7 / gainFactor,
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
