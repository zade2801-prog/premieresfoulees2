const workoutForm = document.querySelector("#workout-form");
const countdown = document.querySelector("#countdown");
const status = document.querySelector("#status");
const startButton = document.querySelector("#start");
const stopButton = document.querySelector("#stop");

let phases = [];
let phaseIndex = 0;
let phaseTimeout;
let countdownInterval;
let phaseEndsAt = 0;

function speakInstruction(text) {
  window.speechSynthesis.cancel();
  const instruction = new SpeechSynthesisUtterance(text);
  instruction.lang = "fr-FR";
  instruction.rate = 0.95;
  window.speechSynthesis.speak(instruction);
}

function formatTime(milliseconds) {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutesPart = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secondsPart = (seconds % 60).toString().padStart(2, "0");
  return `${minutesPart}:${secondsPart}`;
}

function setRunning(isRunning) {
  startButton.disabled = isRunning;
  stopButton.disabled = !isRunning;
  for (const input of workoutForm.querySelectorAll("input")) {
    input.disabled = isRunning;
  }
}

function stopWorkout(message) {
  window.clearTimeout(phaseTimeout);
  window.clearInterval(countdownInterval);
  window.speechSynthesis.cancel();
  setRunning(false);
  countdown.textContent = "Prêt pour ta séance ?";
  status.textContent = message;
}

function updateCountdown() {
  countdown.textContent = `Temps restant : ${formatTime(phaseEndsAt - Date.now())}`;
}

function startPhase() {
  if (phaseIndex >= phases.length) {
    stopWorkout("Séance terminée. Bravo !");
    speakInstruction("Séance terminée. Bravo !");
    return;
  }

  const phase = phases[phaseIndex];
  status.textContent = phase.label;
  speakInstruction(phase.spokenLabel);
  phaseEndsAt = Date.now() + phase.duration;
  updateCountdown();
  phaseTimeout = window.setTimeout(() => {
    phaseIndex += 1;
    startPhase();
  }, phase.duration);
}

workoutForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const warmup = Number(workoutForm.elements.warmup.value);
  const run = Number(workoutForm.elements.run.value);
  const walk = Number(workoutForm.elements.walk.value);
  const repetitions = Number(workoutForm.elements.repetitions.value);
  const cooldown = Number(workoutForm.elements.cooldown.value);

  if (
    !Number.isFinite(warmup) || warmup < 0 ||
    !Number.isFinite(run) || !Number.isInteger(run) || run < 1 ||
    !Number.isFinite(walk) || walk <= 0 ||
    !Number.isInteger(repetitions) || repetitions < 1 ||
    !Number.isFinite(cooldown) || cooldown < 0
  ) {
    status.textContent = "La durée de course doit être un nombre entier de minutes. Vérifie aussi les autres réglages.";
    return;
  }

  if (!("speechSynthesis" in window)) {
    status.textContent = "La lecture des consignes vocales n’est pas disponible dans ce navigateur.";
    return;
  }

  phases = [];
  if (warmup > 0) {
    phases.push({
      label: "Échauffement : marche",
      spokenLabel: "Échauffement. Marche.",
      duration: warmup * 60 * 1000,
    });
  }
  for (let repetition = 1; repetition <= repetitions; repetition += 1) {
    phases.push({
      label: `Course ${repetition} sur ${repetitions}`,
      spokenLabel: `Course, répétition ${repetition} sur ${repetitions}.`,
      duration: run * 60 * 1000,
    });
    if (repetition < repetitions) {
      phases.push({
        label: "Marche / récupération",
        spokenLabel: "Marche, récupération.",
        duration: walk * 60 * 1000,
      });
    }
  }
  if (cooldown > 0) {
    phases.push({
      label: "Retour au calme : marche",
      spokenLabel: "Retour au calme. Marche.",
      duration: cooldown * 60 * 1000,
    });
  }

  phaseIndex = 0;
  setRunning(true);
  countdownInterval = window.setInterval(updateCountdown, 250);
  startPhase();
});

stopButton.addEventListener("click", () => stopWorkout("Séance arrêtée."));
