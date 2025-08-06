document.addEventListener("DOMContentLoaded", () => {
  const recordBtn = document.getElementById("recordBtn");
  const pauseBtn = document.getElementById("pauseBtn");
  const output = document.getElementById("output");
  const tgtLang = document.getElementById("tgtLang");

  let recognizing = false;
  let paused = false;
  let recognition;

  if (!("webkitSpeechRecognition" in window)) {
    alert("Speech recognition is not supported in this browser.");
    return;
  }

  recognition = new webkitSpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = false;

  recognition.onstart = () => {
    recognizing = true;
    recordBtn.textContent = "Stop";
    output.value += "\nListening...";
  };

  recognition.onerror = (event) => {
    output.value += `\nError: ${event.error}`;
  };

  recognition.onend = () => {
    recognizing = false;
    recordBtn.textContent = "Start";
    output.value += "\nStopped listening.";
  };

  recognition.onresult = async (event) => {
    if (paused) return;

    const transcript = event.results[event.results.length - 1][0].transcript.trim();
    output.value += `\nRecognized: ${transcript}`;

    if (["finish", "exit", "stop"].includes(transcript.toLowerCase())) {
      recognition.stop();
      output.value += "\nVoice command to stop received!";
      return;
    }

    try {
      const response = await fetch("/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: transcript,
          src: "auto", // خودکار تشخیص داده میشه
          tgt: tgtLang.value, // زبان مقصد از کاربر
        }),
      });

      const data = await response.json();
      if (data.translated) {
        output.value += `\nTranslated: ${data.translated}\n`;
      } else if (data.error) {
        output.value += `\nTranslation error: ${data.error}`;
      } else {
        output.value += `\nTranslation failed.`;
      }
    } catch (error) {
      output.value += `\nFetch error: ${error}`;
    }
  };

  recordBtn.addEventListener("click", () => {
    if (recognizing) {
      recognition.stop();
    } else {
      recognition.lang = "fa-IR"; // تشخیص بهتر فارسی و انگلیسی
      recognition.start();
    }
  });

  pauseBtn.addEventListener("click", () => {
    paused = !paused;
    pauseBtn.textContent = paused ? "Resume" : "Pause";
    output.value += paused ? "\nPaused listening." : "\nResumed listening.";
  });
});
