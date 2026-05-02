let currentAudio = null;

function playSound(file) {
  if (currentAudio) {
    currentAudio.pause(); // Stop the old one
  }
  currentAudio = new Audio(file);
  currentAudio.play();
}

console.log("Javascript loaded!")
