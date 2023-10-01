let audioCtx;
let waveform = "sine";

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
      playNote(key);
    }

    function keyUp(event) {
      const key = (event.detail || event.which).toString();
      if (keyboardFrequencyMap[key] && activeOscillators[key]) {
        // release
        activeGainNodes[key].gain.cancelScheduledValues(audioCtx.currentTime);
        activeGainNodes[key].gain.setTargetAtTime(
          0,
          audioCtx.currentTime,
          0.05
        );
        activeOscillators[key].stop(audioCtx.currentTime + 0.05);
        delete activeOscillators[key];
        delete activeGainNodes[key];
      }
    }

    function playNote(key) {
      if (!activeOscillators[key]) {
        const osc = audioCtx.createOscillator();
        osc.type = waveform;
        osc.frequency.setValueAtTime(
          keyboardFrequencyMap[key],
          audioCtx.currentTime
        );

        var gainNode = audioCtx.createGain();
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        osc.connect(gainNode).connect(audioCtx.destination);
        osc.start();
        activeOscillators[key] = osc;
        activeGainNodes[key] = gainNode;
        let gainFactor = Object.keys(activeGainNodes).length;
        // attack
        // reduce gain on all nodes for polyphony
        Object.keys(activeGainNodes).forEach(function (key) {
          activeGainNodes[key].gain.setTargetAtTime(
            0.7 / gainFactor,
            audioCtx.currentTime,
            0.15
          );
        });
        // decay and sustain
        gainNode.gain.setTargetAtTime(
          0.425 / gainFactor,
          audioCtx.currentTime + 0.15,
          0.15
        );
      }
    }
  },
  false
);
