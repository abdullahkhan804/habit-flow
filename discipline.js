
const STORAGE_KEY = "disciplineDays";

const START_DATE = "2026-11-01";
const END_DATE = "2027-02-28";

const months = [
  { name: "November", year: 2026, month: 10 },
  { name: "December", year: 2026, month: 11 },
  { name: "January", year: 2027, month: 0 },
  { name: "February", year: 2027, month: 1 }
];

const quotes = [
  { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Will Durant" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Great things are done by a series of small things brought together.", author: "Vincent van Gogh" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Discipline is choosing what you want most over what you want now.", author: "Unknown" }
];

const startDate = parseDate(START_DATE);
const endDate = parseDate(END_DATE);
const totalDays = Math.round((endDate - startDate) / 86400000) + 1;

let completedDays = loadSavedDays();
let audioContext;

function parseDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date, amount) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

function loadSavedDays() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (Array.isArray(saved)) {
      return new Set(saved.filter(value =>
        typeof value === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(value)
      ));
    }
  } catch (error) {
    console.warn("Could not read saved progress:", error);
  }
  return new Set();
}

function saveDays() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...completedDays]));
    return true;
  } catch (error) {
    console.error("Could not save progress:", error);
    setStatus("Unable to save. Check browser storage settings.");
    return false;
  }
}

function isChallengeDate(date) {
  return date >= startDate && date <= endDate;
}

function isCompleted(date) {
  return completedDays.has(formatDate(date));
}

function getChallengeDates() {
  return Array.from({ length: totalDays }, (_, index) =>
    addDays(startDate, index)
  );
}

function getValidCompletedDates() {
  return getChallengeDates().filter(isCompleted);
}

function getCurrentStreak() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (today < startDate || today > endDate) return 0;

  // A streak can include today or end yesterday.
  let cursor = isCompleted(today) ? today : addDays(today, -1);
  let streak = 0;

  while (cursor >= startDate && isCompleted(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

function getBestStreak() {
  let best = 0;
  let current = 0;

  for (const date of getChallengeDates()) {
    if (isCompleted(date)) {
      current++;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  }

  return best;
}

function renderCalendar() {
  const calendar = document.getElementById("calendar");
  calendar.innerHTML = "";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Monday-first grid: Sunday is the seventh row.
  const leadingBlanks = (startDate.getDay() + 6) % 7;

  for (let i = 0; i < leadingBlanks; i++) {
    const blank = document.createElement("span");
    blank.className = "day-cell blank-cell";
    blank.style.visibility = "hidden";
    blank.setAttribute("aria-hidden", "true");
    calendar.appendChild(blank);
  }

  for (const date of getChallengeDates()) {
    const key = formatDate(date);
    const button = document.createElement("button");

    button.type = "button";
    button.className = "day-cell";
    button.title = `${date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric"
    })} — ${isCompleted(date) ? "Completed" : "Not completed"}`;

    button.setAttribute("aria-label", button.title);
    button.setAttribute("aria-pressed", String(isCompleted(date)));

    if (isCompleted(date)) button.classList.add("completed");
    if (date.getTime() === today.getTime()) button.classList.add("today");
    if (date > today) button.classList.add("future");

    button.addEventListener("click", () => toggleDay(key));
    calendar.appendChild(button);
  }
}

function toggleDay(key) {
  const date = parseDate(key);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!isChallengeDate(date)) return;

  if (date > today) {
    setStatus("Future days cannot be completed yet.");
    return;
  }
const completedBefore = getValidCompletedDates().length;
  if (completedDays.has(key)) {
    completedDays.delete(key);
    saveDays();
    renderAll();
    setStatus("Day unchecked. You can try again.");
  } else {
    
completedDays.add(key);
saveDays();
playCompletionSound();
renderAll();
setStatus("Nice work! Another day completed ✦");

const completedAfter = getValidCompletedDates().length;
const newlyUnlocked = Object.keys(milestoneRewards)
  .map(Number)
  .find(milestone =>
    completedBefore < milestone && completedAfter >= milestone
  );

if (newlyUnlocked) {
  celebrateMilestone(newlyUnlocked);
}

  }
}

function updateStats() {
  const done = getValidCompletedDates().length;
  const percentage = Math.round((done / totalDays) * 100);
  const remaining = totalDays - done;

  document.getElementById("progressText").textContent = `${percentage}%`;
  document.getElementById("daysText").textContent = done;
  document.getElementById("currentStreak").textContent = getCurrentStreak();
  document.getElementById("bestStreak").textContent = getBestStreak();
  document.getElementById("progressFill").style.width = `${percentage}%`;
  document.getElementById("progressCaption").textContent =
    `${done} of ${totalDays} days completed`;
  document.getElementById("remainingDays").textContent =
    `${remaining} days remaining`;
}

function updateDateLabel() {
  const today = new Date();
  document.getElementById("todayLabel").textContent =
    today.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
}

function updateQuote() {
  const dayNumber = Math.floor(Date.now() / 86400000);
  const quote = quotes[((dayNumber % quotes.length) + quotes.length) % quotes.length];

  document.getElementById("quoteText").textContent = quote.text;
  document.getElementById("quoteAuthor").textContent = `— ${quote.author}`;
}

function setStatus(message) {
  document.getElementById("statusMessage").textContent = message;
}

// Small completion sound using the browser's built-in audio API.
function playCompletionSound() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    audioContext ??= new AudioContextClass();

    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(660, now);
    oscillator.frequency.setValueAtTime(880, now + 0.1);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.3);
  } catch (error) {
    console.warn("Sound is unavailable in this browser.", error);
  }
}

// Prepare a canvas at its real pixel density for crisp charts.
function prepareCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;

  canvas.width = Math.max(1, Math.round(rect.width * ratio));
  canvas.height = Math.max(1, Math.round(rect.height * ratio));

  const ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  return { ctx, width: rect.width, height: rect.height };
}

function drawLineChart() {
  const canvas = document.getElementById("lineChart");
  const { ctx, width, height } = prepareCanvas(canvas);

  ctx.clearRect(0, 0, width, height);

  const dates = getChallengeDates();
  const values = [];
  let runningTotal = 0;

  dates.forEach(date => {
    if (isCompleted(date)) runningTotal++;
    values.push(runningTotal);
  });

  const padding = { top: 12, right: 12, bottom: 25, left: 25 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(5, Math.ceil(Math.max(...values, 0) / 5) * 5);

  ctx.font = "9px Inter, sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";

  for (let i = 0; i <= 4; i++) {
    const y = padding.top + chartHeight * i / 4;
    const label = Math.round(maxValue * (4 - i) / 4);

    ctx.strokeStyle = "rgba(140,165,195,0.12)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();

    ctx.fillStyle = "#71839b";
    ctx.fillText(String(label), padding.left - 7, y);
  }

  const points = values.map((value, index) => ({
    x: padding.left + (index / (totalDays - 1)) * chartWidth,
    y: padding.top + chartHeight - (value / maxValue) * chartHeight
  }));

  // Soft area fill under the line.
  const gradient = ctx.createLinearGradient(0, padding.top, 0, height);
  gradient.addColorStop(0, "rgba(0,230,160,0.24)");
  gradient.addColorStop(1, "rgba(0,230,160,0)");

  ctx.beginPath();
  ctx.moveTo(points[0].x, padding.top + chartHeight);
  points.forEach(point => ctx.lineTo(point.x, point.y));
  ctx.lineTo(points[points.length - 1].x, padding.top + chartHeight);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });

  ctx.strokeStyle = "#00e6a0";
  ctx.lineWidth = 2.5;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.stroke();

  const last = points[points.length - 1];
  ctx.beginPath();
  ctx.arc(last.x, last.y, 4, 0, Math.PI * 2);
  ctx.fillStyle = "#00e6a0";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(last.x, last.y, 7, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(0,230,160,0.3)";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawBarChart() {
  const canvas = document.getElementById("barChart");
  const { ctx, width, height } = prepareCanvas(canvas);

  ctx.clearRect(0, 0, width, height);

  const monthData = months.map(item => {
    const days = getChallengeDates().filter(date =>
      date.getFullYear() === item.year && date.getMonth() === item.month
    );

    return {
      name: item.name.slice(0, 3),
      completed: days.filter(isCompleted).length,
      total: days.length
    };
  });

  const padding = { top: 14, right: 10, bottom: 25, left: 25 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxValue = 31;
  const slotWidth = chartWidth / monthData.length;
  const barWidth = Math.min(30, slotWidth * 0.42);

  ctx.font = "9px Inter, sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";

  [0, 10, 20, 30].forEach(value => {
    const y = padding.top + chartHeight - (value / maxValue) * chartHeight;

    ctx.strokeStyle = "rgba(140,165,195,0.12)";
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();

    ctx.fillStyle = "#71839b";
    ctx.fillText(String(value), padding.left - 7, y);
  });

  monthData.forEach((item, index) => {
    const centerX = padding.left + slotWidth * index + slotWidth / 2;
    const barHeight = (item.completed / maxValue) * chartHeight;
    const x = centerX - barWidth / 2;
    const y = padding.top + chartHeight - barHeight;

    // Background bar shows the maximum possible days in that month.
    const trackHeight = (item.total / maxValue) * chartHeight;
    const trackY = padding.top + chartHeight - trackHeight;

    ctx.fillStyle = "#202e43";
    roundedRect(ctx, x, trackY, barWidth, trackHeight, 5);
    ctx.fill();

    if (item.completed > 0) {
      const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
      gradient.addColorStop(0, "#bd83ff");
      gradient.addColorStop(1, "#7950dc");

      ctx.fillStyle = gradient;
      roundedRect(ctx, x, y, barWidth, barHeight, 5);
      ctx.fill();

      ctx.fillStyle = "#d9c3ff";
      ctx.textAlign = "center";
      ctx.fillText(String(item.completed), centerX, Math.max(8, y - 8));
    }

    ctx.fillStyle = "#8294ad";
    ctx.textAlign = "center";
    ctx.fillText(item.name, centerX, height - 8);
  });
}

function roundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawCharts() {
  drawLineChart();
  drawBarChart();
}


function updateAchievements() {
  const completed = getValidCompletedDates().length;

  document.querySelectorAll(".achievement-card").forEach(card => {
    const milestone = Number(card.dataset.milestone);
    const unlocked = completed >= milestone;
    const progress = Math.min(100, (completed / milestone) * 100);

    card.classList.toggle("unlocked", unlocked);

    const art = card.querySelector(".badge-art");
    const status = card.querySelector(".badge-status");
    const track = card.querySelector(".badge-track span");

    status.textContent = unlocked
      ? "✓ Unlocked!"
      : `${completed} / ${milestone} days`;

    track.style.width = `${progress}%`;
    art.setAttribute("aria-label", unlocked ? "Badge unlocked" : "Badge locked");
  });
}


const milestoneRewards = {
  7: {
    emoji: "⚔️",
    title: "7-Day Warrior!",
    message: "You've built momentum. Keep showing up!"
  },
  14: {
    emoji: "🔥",
    title: "14-Day Fighter!",
    message: "Two weeks of effort. You're getting stronger!"
  },
  30: {
    emoji: "🏆",
    title: "30-Day Legend!",
    message: "Thirty completed days! Your discipline is growing."
  },
  60: {
    emoji: "👑",
    title: "60-Day Master!",
    message: "Sixty days of progress. Be proud of your commitment."
  },
  90: {
    emoji: "💎",
    title: "90-Day Elite!",
    message: "You've come a long way. Keep your momentum alive."
  },
  120: {
    emoji: "🌟",
    title: "120-Day Champion!",
    message: "You completed the entire challenge. Outstanding work!"
  }
};

function celebrateMilestone(milestone) {
  const reward = milestoneRewards[milestone];
  if (!reward) return;

  const overlay = document.getElementById("celebrationOverlay");
  const confetti = document.getElementById("confettiContainer");

  document.getElementById("celebrationEmoji").textContent = reward.emoji;
  document.getElementById("celebrationTitle").textContent = reward.title;
  document.getElementById("celebrationMessage").textContent = reward.message;

  confetti.innerHTML = "";

  const colors = ["#00e6a0", "#a970ff", "#ffd477", "#19c9d7", "#ff8cba"];

  for (let i = 0; i < 55; i++) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.setProperty("--confetti-color", colors[i % colors.length]);
    piece.style.setProperty("--fall-duration", `${1.8 + Math.random() * 2}s`);
    piece.style.setProperty("--fall-delay", `${Math.random() * 0.8}s`);
    piece.style.setProperty("--drift", `${Math.random() * 150 - 75}px`);
    confetti.appendChild(piece);
  }

  overlay.hidden = false;
  document.getElementById("celebrationContinue").focus();
}

function closeCelebration() {
  document.getElementById("celebrationOverlay").hidden = true;
}

document.getElementById("closeCelebration")
  .addEventListener("click", closeCelebration);

document.getElementById("celebrationContinue")
  .addEventListener("click", closeCelebration);

document.getElementById("celebrationOverlay")
  .addEventListener("click", event => {
    if (event.target.id === "celebrationOverlay") {
      closeCelebration();
    }
  });

document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeCelebration();
});


function renderAll() {
  renderCalendar();
  updateStats();
  updateAchievements();
  drawCharts();
}

document.getElementById("resetBtn").addEventListener("click", () => {
  const confirmed = window.confirm(
    "Reset all completed days from this November–February challenge? This cannot be undone."
  );

  if (!confirmed) return;

  // Remove only dates belonging to this challenge.
  for (const date of getChallengeDates()) {
    completedDays.delete(formatDate(date));
  }

  saveDays();
  renderAll();
  setStatus("Challenge progress reset.");
});

document.getElementById("calendarRange").textContent =
  `${months[0].name} ${months[0].year} — ${months[3].name} ${months[3].year}`;

updateDateLabel();
updateQuote();
renderAll();

// Keep charts sharp and correctly sized after resizing the window.
let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(drawCharts, 120);
});
