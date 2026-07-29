const roster = [
  { name: "Avery Morgan", role: "Experience Guide", progress: 72 },
  { name: "Noah Patel", role: "Experience Guide", progress: 78 },
  { name: "Sam Rivera", role: "Shift Lead", progress: 83 },
  { name: "Maya Brooks", role: "Experience Guide", progress: 89 },
  { name: "Eli Turner", role: "Assistant Manager", progress: 86 },
  { name: "Riley Chen", role: "Store Manager", progress: 91 },
];

const agenda = {
  1: {
    title: "Guest Experience Foundations",
    summary: "Build the mental model, service language, and complete guest journey before technical complexity.",
    blocks: [
      ["20 min", "Welcome and opening standards", "3 objectives"],
      ["40 min", "The complete guest journey", "4 objectives"],
      ["60 min", "Guided guest-flow practice", "Observed practice"],
      ["45 min", "Guest recovery language", "Scenario lab"],
    ],
  },
  2: {
    title: "Service and Technical Response",
    summary: "Connect issue recognition, escalation boundaries, and guest communication.",
    blocks: [
      ["30 min", "Technical issue categories", "4 objectives"],
      ["60 min", "Recovery tools and escalation", "Practice lab"],
      ["90 min", "Timed technical scenarios", "Observed practice"],
      ["30 min", "Process-confusion review", "Coach debrief"],
    ],
  },
  3: {
    title: "Role-Play and Operations",
    summary: "Convert procedures into fluent performance through coached scenarios and progressive independence.",
    blocks: [
      ["15 min", "Day 2 retrieval practice", "3 prompts"],
      ["45 min", "Opening procedure rehearsal", "5 objectives"],
      ["90 min", "Full guest-flow scenarios", "Observed practice"],
      ["60 min", "Technical recovery under pressure", "Scenario lab"],
      ["45 min", "Closing procedure rehearsal", "5 objectives"],
    ],
  },
  4: {
    title: "Full Opening Simulation",
    summary: "Run the operation as a complete system while the coach observes, scores, and intervenes only when required.",
    blocks: [
      ["30 min", "Leadership huddle", "Readiness plan"],
      ["180 min", "Full opening simulation", "Observed performance"],
      ["45 min", "Partner readiness review", "Formal review"],
      ["30 min", "Gap-closing plan", "Named owners"],
    ],
  },
  5: {
    title: "Launch Readiness",
    summary: "Validate independent performance, close remaining gaps, and make the formal readiness decision.",
    blocks: [
      ["45 min", "Targeted remediation", "Gap practice"],
      ["120 min", "Independent team run", "Final assessment"],
      ["45 min", "Leadership confirmation", "Dual sign-off"],
      ["30 min", "Opening-weekend plan", "Ownership transfer"],
    ],
  },
};

const guides = {
  structure: {
    category: "START HERE",
    title: "How to use the five-day plan",
    lead: "The agenda is a sequence, not a menu. Each day prepares learners for the performance expected on the next.",
    principle: "Protect the sequence. Do not move learners into complex technical practice before they understand the complete guest journey.",
    sections: [
      ["What the plan does", "The five-day plan connects learning objectives, practice, evidence, and readiness decisions. It gives every coach the same standard while preserving room to respond to local conditions."],
      ["How to make adjustments", "Adjust time and repetition based on evidence. Do not remove an objective because the schedule is tight. Record what changed and why in the daily recap."],
      ["What counts as complete", "Exposure is not completion. A learner is ready when they can demonstrate the behavior under realistic conditions without coach prompting."],
    ],
  },
  scenarios: {
    category: "COACHING PRACTICE",
    title: "Running scenario practice",
    lead: "Scenario practice should reveal whether a learner can recognize the situation, select the process, and execute it under realistic pressure.",
    principle: "Score only observable behavior. Confidence and familiarity are useful signals, but they are not readiness evidence.",
    sections: [
      ["Brief", "State the conditions, learner role, success criteria, and any boundaries before the scenario begins."],
      ["Observe", "Let the learner work. Capture specific actions, sequence errors, unnecessary escalations, and moments of hesitation."],
      ["Debrief and repeat", "Ask the learner to diagnose the result first. Give one priority correction, then run another repetition."],
    ],
  },
  feedback: {
    category: "COACHING PRACTICE",
    title: "Giving observable feedback",
    lead: "Feedback should make the next attempt better, not simply describe the previous attempt.",
    principle: "Use action, impact, and next attempt: what happened, why it mattered, and what the learner will do differently.",
    sections: [
      ["Be specific", "Name the action and moment. Avoid labels such as good, weak, or not confident."],
      ["Prioritize", "Choose the correction with the greatest effect on safety, guest experience, or independent performance."],
      ["Verify", "Feedback is complete only after the learner demonstrates the corrected behavior."],
    ],
  },
  readiness: {
    category: "READINESS DECISIONS",
    title: "Making a readiness decision",
    lead: "Readiness is a body of evidence across competencies, scenarios, attendance, judgment, and independent performance.",
    principle: "A percentage is a signal, not the decision. Review which competencies remain open and the risk attached to each.",
    sections: [
      ["Review evidence", "Look across sign-offs, scenario scores, recap notes, and repeated process-confusion patterns."],
      ["Separate gaps", "Distinguish a knowledge gap from a performance gap, an environmental blocker, or unclear process ownership."],
      ["Name the next action", "Every unresolved gap needs an owner, next practice, decision date, and escalation boundary."],
    ],
  },
  confusion: {
    category: "ESCALATION",
    title: "Handling process confusion",
    lead: "Repeated questions are product data. They can reveal a knowledge gap, unclear process, or missing ownership.",
    principle: "Do not coach around a broken process. Capture the confusion, resolve the immediate need, and route the system issue to its owner.",
    sections: [
      ["Stabilize", "Give the learner the approved next action and prevent an improvised workaround."],
      ["Classify", "Record whether the issue came from missing knowledge, unclear guidance, conflicting sources, or incomplete ownership."],
      ["Improve", "Use recurring patterns to update the agenda, coach guide, competency, or operating process before the next opening."],
    ],
  },
};

const signoffCompetencies = {
  1: ["Welcomes the guest", "Explains the journey", "Uses recovery language", "Completes handoff"],
  2: ["Categorizes issues", "Uses approved tools", "Explains next steps", "Escalates correctly"],
  3: ["Runs opening", "Leads guest flow", "Completes recovery", "Runs closing"],
  4: ["Leads full simulation", "Protects role clarity", "Manages demand", "Coaches peers"],
  5: ["Runs independently", "Closes remaining gaps", "Owns escalation", "Meets readiness bar"],
};

const signoffState = {};

function initials(name) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2);
}

function renderRoster() {
  const list = document.getElementById("rosterList");
  list.innerHTML = roster.map((person) => `
    <div class="roster-row">
      <span class="avatar">${initials(person.name)}</span>
      <div class="roster-main">
        <strong>${person.name}</strong>
        <span>${person.role} · Fictional learner</span>
      </div>
      <div class="roster-progress">
        <div><i style="width:${person.progress}%"></i></div>
        <strong>${person.progress}%</strong>
      </div>
    </div>
  `).join("");
  document.getElementById("rosterCount").textContent = `(${roster.length} shown)`;
}

function renderAgenda(day) {
  const data = agenda[day];
  document.getElementById("agendaDayLabel").textContent = `DAY ${day} LEARNING PLAN`;
  document.getElementById("agendaTitle").textContent = data.title;
  document.getElementById("agendaSummary").textContent = data.summary;
  document.getElementById("agendaList").innerHTML = data.blocks.map((block) => `
    <article class="agenda-row">
      <span>${block[0]}</span>
      <div><strong>${block[1]}</strong><small>Fictional demonstration content</small></div>
      <b>${block[2]} →</b>
    </article>
  `).join("");
}

function renderGuide(key) {
  const guide = guides[key];
  document.getElementById("guideArticle").innerHTML = `
    <span>${guide.category}</span>
    <h2>${guide.title}</h2>
    <p class="lead">${guide.lead}</p>
    <div class="principle"><strong>COACH PRINCIPLE</strong>${guide.principle}</div>
    ${guide.sections.map(([title, text]) => `<h3>${title}</h3><p>${text}</p>`).join("")}
  `;
}

function signKey(day, personIndex, competencyIndex) {
  return `${day}-${personIndex}-${competencyIndex}`;
}

function seedSignoffs() {
  for (let day = 1; day <= 5; day += 1) {
    roster.forEach((person, personIndex) => {
      signoffCompetencies[day].forEach((competency, competencyIndex) => {
        const threshold = day < 3 ? 0.88 : day === 3 ? 0.76 : 0.42;
        signoffState[signKey(day, personIndex, competencyIndex)] =
          ((personIndex * 7 + competencyIndex * 3 + day) % 10) / 10 < threshold;
      });
    });
  }
}

function renderSignoffs(day) {
  const competencies = signoffCompetencies[day];
  document.getElementById("signoffTitle").textContent = `Day ${day} competencies`;
  document.getElementById("signoffSubtitle").textContent = agenda[day].title;
  document.getElementById("signoffHead").innerHTML =
    `<th>Learner</th>${competencies.map((competency) => `<th>${competency}</th>`).join("")}<th>Progress</th>`;

  document.getElementById("signoffBody").innerHTML = roster.map((person, personIndex) => {
    const signed = competencies.filter((competency, competencyIndex) =>
      signoffState[signKey(day, personIndex, competencyIndex)]).length;
    const percent = Math.round((signed / competencies.length) * 100);
    return `
      <tr>
        <td><strong>${person.name}</strong><small>${person.role}</small></td>
        ${competencies.map((competency, competencyIndex) => {
          const key = signKey(day, personIndex, competencyIndex);
          return `<td><button class="sign-cell ${signoffState[key] ? "signed" : ""}" data-sign-key="${key}" aria-label="Toggle ${competency} for ${person.name}">${signoffState[key] ? "✓" : "·"}</button></td>`;
        }).join("")}
        <td><strong>${percent}%</strong></td>
      </tr>
    `;
  }).join("");
  updateSignoffRate(day);
}

function updateSignoffRate(day) {
  const keys = Object.keys(signoffState).filter((key) => key.startsWith(`${day}-`));
  const signed = keys.filter((key) => signoffState[key]).length;
  const rate = Math.round((signed / keys.length) * 100);
  document.getElementById("signoffRate").textContent = `${rate}%`;
  document.getElementById("signoffRateBar").style.width = `${rate}%`;
  document.getElementById("signoffNavCount").textContent = `${rate}%`;
}

function updateReadiness() {
  const boxes = [...document.querySelectorAll("#readiness input[type='checkbox']")];
  const complete = boxes.filter((box) => box.checked).length;
  const percent = Math.round((complete / boxes.length) * 100);
  document.getElementById("readinessText").textContent = `${complete} of ${boxes.length} checks complete`;
  document.getElementById("readinessPercent").textContent = `${percent}%`;
  document.getElementById("readinessBar").style.width = `${percent}%`;
  document.getElementById("readinessNavCount").textContent = `${complete}/${boxes.length}`;
  document.querySelectorAll(".check-group").forEach((group) => {
    const groupBoxes = [...group.querySelectorAll("input[type='checkbox']")];
    group.querySelector(".check-count").textContent = `${groupBoxes.filter((box) => box.checked).length}/${groupBoxes.length}`;
  });
}

function updatePartner() {
  const boxes = [...document.querySelectorAll("#partner input[type='checkbox']")];
  const complete = boxes.filter((box) => box.checked).length;
  const count = document.getElementById("partnerCount");
  count.textContent = `${complete}/${boxes.length}`;
  count.className = `status-pill ${complete === boxes.length ? "good" : "attention"}`;
}

function updateRecap() {
  document.getElementById("previewProgress").textContent = document.getElementById("recapProgress").value;
  document.getElementById("previewRisks").textContent = document.getElementById("recapRisks").value;
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 1800);
}

function navigate(viewId) {
  document.querySelectorAll(".view").forEach((view) => view.classList.toggle("active", view.id === viewId));
  document.querySelectorAll(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.view === viewId));
  const view = document.getElementById(viewId);
  document.getElementById("breadcrumb").textContent = view.dataset.title;
  document.getElementById("sidebar").classList.remove("open");
  window.scrollTo({ top: 0, behavior: "smooth" });
  history.replaceState(null, "", `#${viewId}`);
}

document.querySelectorAll("[data-view]").forEach((button) => {
  button.addEventListener("click", () => navigate(button.dataset.view));
});

document.querySelectorAll("[data-view-jump]").forEach((button) => {
  button.addEventListener("click", () => navigate(button.dataset.viewJump));
});

document.getElementById("menuButton").addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("open");
});

document.querySelectorAll("#agendaTabs button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("#agendaTabs button").forEach((tab) => tab.classList.remove("active"));
    button.classList.add("active");
    renderAgenda(Number(button.dataset.day));
  });
});

let activeSignoffDay = 3;
document.querySelectorAll("#signoffTabs button").forEach((button) => {
  button.addEventListener("click", () => {
    activeSignoffDay = Number(button.dataset.signoffDay);
    document.querySelectorAll("#signoffTabs button").forEach((tab) => tab.classList.remove("active"));
    button.classList.add("active");
    renderSignoffs(activeSignoffDay);
  });
});

document.getElementById("signoffBody").addEventListener("click", (event) => {
  const button = event.target.closest("[data-sign-key]");
  if (!button) return;
  const key = button.dataset.signKey;
  signoffState[key] = !signoffState[key];
  renderSignoffs(activeSignoffDay);
});

document.querySelectorAll("#readiness input[type='checkbox']").forEach((box) => box.addEventListener("change", updateReadiness));
document.querySelectorAll("#partner input[type='checkbox']").forEach((box) => box.addEventListener("change", updatePartner));

document.querySelectorAll(".guide-link").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".guide-link").forEach((link) => link.classList.remove("active"));
    button.classList.add("active");
    renderGuide(button.dataset.guide);
  });
});

document.getElementById("guideSearch").addEventListener("input", (event) => {
  const query = event.target.value.toLowerCase();
  document.querySelectorAll(".guide-link").forEach((button) => {
    button.hidden = query && !button.textContent.toLowerCase().includes(query);
  });
});

document.querySelectorAll("#recap textarea").forEach((input) => input.addEventListener("input", updateRecap));
document.querySelectorAll(".quick-add button").forEach((button) => {
  button.addEventListener("click", () => {
    const field = button.dataset.add === "progress" ? "recapProgress" : "recapRisks";
    const textarea = document.getElementById(field);
    textarea.value = `${textarea.value.trim()}\n${button.dataset.text}`.trim();
    updateRecap();
  });
});

document.getElementById("copyRecap").addEventListener("click", async () => {
  const text = `NSO Daily Recap: Day 3\n\nTeam progress\n${document.getElementById("recapProgress").value}\n\nRisks and actions\n${document.getElementById("recapRisks").value}`;
  try {
    await navigator.clipboard.writeText(text);
    showToast("Fictional recap copied");
  } catch {
    showToast("Copy unavailable in this browser");
  }
});

document.getElementById("addLearner").addEventListener("click", () => {
  if (roster.some((person) => person.name === "Jamie Ellis")) {
    showToast("The fictional learner is already on the roster");
    return;
  }
  const personIndex = roster.length;
  roster.push({ name: "Jamie Ellis", role: "Experience Guide", progress: 0 });
  for (let day = 1; day <= 5; day += 1) {
    signoffCompetencies[day].forEach((competency, competencyIndex) => {
      signoffState[signKey(day, personIndex, competencyIndex)] = false;
    });
  }
  renderRoster();
  renderSignoffs(activeSignoffDay);
  showToast("Fictional learner added");
});

document.getElementById("bulkReady").addEventListener("click", () => {
  roster.forEach((person) => { person.progress = 100; });
  renderRoster();
  showToast("Demo team marked ready");
});

document.querySelectorAll(".confirm-button").forEach((button) => {
  button.addEventListener("click", () => {
    button.textContent = "✓ Confirmed in demo";
    button.classList.remove("secondary");
    button.classList.add("primary");
    showToast("Fictional confirmation recorded");
  });
});

document.getElementById("completeOpening").addEventListener("click", () => {
  document.getElementById("completionNote").textContent = "Fictional opening completed. No data was saved.";
  showToast("Opening closed in demo");
});

document.getElementById("exportDemo").addEventListener("click", () => {
  showToast("Demo export simulated");
});

seedSignoffs();
renderRoster();
renderAgenda(3);
renderGuide("structure");
renderSignoffs(3);
updateReadiness();
updatePartner();
updateRecap();

const initialView = location.hash.replace("#", "");
if (document.getElementById(initialView)?.classList.contains("view")) {
  navigate(initialView);
}
