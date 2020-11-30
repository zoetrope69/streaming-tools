function TTS(text) {
  if (!text || text.length === 0) {
    return;
  }

  const audioElement = new Audio(
    `https://www.ispeech.org/p/generic/getaudio?action=convert&pitch=100&voice=ukenglishmale&speed=0&text=${text}`
  );

  audioElement.addEventListener("canplaythrough", (event) => {
    audioElement.addEventListener("playing", () => {
      console.log(audioElement.duration);
      setTimeout(() => {
        audioElement.pause();
      }, audioElement.duration * 1000 - 2300);
    });
    audioElement.play();
  });
}
