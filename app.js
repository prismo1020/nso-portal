// ============================================================
// STATE
// ============================================================
let state = {
  opening: null,
  openingId: null,
  userRole: 'coach',
  userEmail: null,
  currentDay: 1,
  currentAgendaDay: 1,
  currentCompDay: 1,
  currentRecapDay: 1,
  currentView: 'dashboard',
  trainees: [],
  signoffs: {},
  recaps: {},
  franchiseChecks: {},
  overrides: {},
  oscReport: {},
  currentStoreProgram: null,
  leadershipTraining: null,
  leadershipParticipants: [],
  leadershipSignoffs: {},
  leadershipDailyNotes: {},
  leadershipReports: {},
  currentLeadershipDay: 1,
  mode: null
};

// ============================================================
// CONTENT EDITING
// ============================================================
const EDIT_EMAILS = ['danielle.beram1@gmail.com', 'danielle.beram@sandboxvr.com', 'tyler.franz-grunwald@sandboxvr.com', 'lex.snyder@sandboxvr.com'];

function canEdit() {
  return EDIT_EMAILS.includes(state.userEmail);
}

function getContent(type, id, field, defaultVal) {
  if (!state.overrides) return defaultVal;
  const key = type + '|' + id + '|' + field;
  return state.overrides.hasOwnProperty(key) ? state.overrides[key] : defaultVal;
}

var _agendaEditCtx = null;
var _agendaQuill = null;
var _kbEditId = null;
var _kbQuill = null;

function openAgendaEditor(dayNum, blockIdx) {
  if (!canEdit()) return;
  var block = DAYS[dayNum - 1].blocks[blockIdx];
  var contentId = 'day' + dayNum + '-block' + blockIdx;
  _agendaEditCtx = { dayNum, blockIdx, contentId, block };

  var tip = getContent('agenda', contentId, 'tip', block.tip || '');
  var say = getContent('agenda', contentId, 'say', block.say || '');
  var see = getContent('agenda', contentId, 'see', block.see || '');
  var doText = getContent('agenda', contentId, 'doText', block.doText || '');
  var objStr = getContent('agenda', contentId, 'objectives', null);
  var objectives = objStr ? JSON.parse(objStr) : block.objectives;
  var resStr = getContent('agenda', contentId, 'resources', null);
  var resources = resStr ? JSON.parse(resStr) : block.resources;

  document.getElementById('agendaEditBlockTitle').textContent = 'Editing: ' + block.title;
  document.getElementById('agendaEditSay').value = say;
  document.getElementById('agendaEditSee').value = see;
  document.getElementById('agendaEditDo').value = doText;
  document.getElementById('agendaEditObjectives').value = objectives.join('\n');
  document.getElementById('agendaEditResources').value = resources.join('\n');

  if (!_agendaQuill) {
    _agendaQuill = new Quill('#agendaEditQuill', {
      theme: 'snow',
      modules: { toolbar: [['bold','italic'],[{'header':2},{'header':3}],[{'list':'ordered'},{'list':'bullet'}],['link','clean']] }
    });
  }
  _agendaQuill.root.innerHTML = tip;
  document.getElementById('agendaEditModal').style.display = 'flex';
}

function closeAgendaEditor() {
  document.getElementById('agendaEditModal').style.display = 'none';
  _agendaEditCtx = null;
}

async function saveAgendaEdit() {
  if (!_agendaEditCtx) return;
  var { dayNum, blockIdx, contentId } = _agendaEditCtx;
  var tip = _agendaQuill ? _agendaQuill.root.innerHTML : '';
  var say = document.getElementById('agendaEditSay').value;
  var see = document.getElementById('agendaEditSee').value;
  var doText = document.getElementById('agendaEditDo').value;
  var objectives = document.getElementById('agendaEditObjectives').value.split('\n').filter(s => s.trim());
  var resources = document.getElementById('agendaEditResources').value.split('\n').filter(s => s.trim());

  state.overrides['agenda|' + contentId + '|tip'] = tip;
  state.overrides['agenda|' + contentId + '|say'] = say;
  state.overrides['agenda|' + contentId + '|see'] = see;
  state.overrides['agenda|' + contentId + '|doText'] = doText;
  state.overrides['agenda|' + contentId + '|objectives'] = JSON.stringify(objectives);
  state.overrides['agenda|' + contentId + '|resources'] = JSON.stringify(resources);

  await Promise.all([
    dbSaveOverride('agenda', contentId, 'tip', tip),
    dbSaveOverride('agenda', contentId, 'say', say),
    dbSaveOverride('agenda', contentId, 'see', see),
    dbSaveOverride('agenda', contentId, 'doText', doText),
    dbSaveOverride('agenda', contentId, 'objectives', JSON.stringify(objectives)),
    dbSaveOverride('agenda', contentId, 'resources', JSON.stringify(resources))
  ]);
  closeAgendaEditor();
  renderAgenda(dayNum);
  showToast('Block saved!', 'success');
}

function openKBEditor(id) {
  if (!canEdit()) return;
  let article = null;
  Object.values(KB).forEach(articles => { const f = articles.find(a => a.id === id); if (f) article = f; });
  if (!article) return;
  _kbEditId = id;

  document.getElementById('kbEditTitle').value = getContent('kb', id, 'title', article.title);
  document.getElementById('kbEditSubtitle').value = getContent('kb', id, 'subtitle', article.subtitle);
  // Use raw textarea — preserves all HTML including custom classes/styles that Quill would strip
  document.getElementById('kbEditContent').value = getContent('kb', id, 'content', article.content);
  document.getElementById('kbEditModal').style.display = 'flex';
}

function closeKBEditor() {
  document.getElementById('kbEditModal').style.display = 'none';
  _kbEditId = null;
}

async function saveKBEdit() {
  if (!_kbEditId) return;
  var title = document.getElementById('kbEditTitle').value;
  var subtitle = document.getElementById('kbEditSubtitle').value;
  var content = document.getElementById('kbEditContent').value;

  state.overrides['kb|' + _kbEditId + '|title'] = title;
  state.overrides['kb|' + _kbEditId + '|subtitle'] = subtitle;
  state.overrides['kb|' + _kbEditId + '|content'] = content;

  await Promise.all([
    dbSaveOverride('kb', _kbEditId, 'title', title),
    dbSaveOverride('kb', _kbEditId, 'subtitle', subtitle),
    dbSaveOverride('kb', _kbEditId, 'content', content)
  ]);
  closeKBEditor();
  loadKBArticle(_kbEditId);
  showToast('Article saved!', 'success');
}

let contextTarget = null;

// ============================================================
// DATA — AGENDAS
// ============================================================
const DAYS = [
  {
    num: 1,
    title: 'All Things Sandbox VR & the Guest Experience',
    type: 'Learning Plan',
    typeLink: 'https://app.delightree.com/chapters/view/nmm89lolo598sr5opzam7nz3',
    focus: 'Today is about orientation, immersion, and building the foundation. Your team needs to understand WHY they are here before they can learn HOW. Start with energy.',
    blocks: [
      { time: '15 min', title: 'Intros & Store Tour', objectives: ['Gain familiarity with the store layout.','Learn key Sandbox VR vocabulary.','Set the tone — excited, professional, immersive.'], tip: 'Walk the team through the store yourself first, calling out each area by its correct name (Lobby, Barracks, Holodeck). Narrate the Guest Journey as you walk. This primes their mental model before they open a single document.', say: 'Tell the team what they\'re about to do and why each area matters to the Guest.', see: 'Watch for body language — curiosity is a good sign. Note who asks questions.', doText: 'Ask each team member to name one area and its purpose.', resources: ['Sandbox VR Vocabulary (Learning Plan, pages 8–10)'] },
      { time: '30 min', title: 'Introduction to Sandbox VR', objectives: ['Describe Sandbox VR\'s history, mission, and core values.','Understand the VR experiences and how to position each one.','Connect experience knowledge to KPIs.'], tip: '<strong>Start with history.</strong> Direct trainees to Learning Plan pages 6–9. Have them read or review the section on Sandbox VR history, mission, and core values. Briefly discuss what stands out and how it connects to the guest experience.<br><br><strong>Cast the experience trailers.</strong> Cast the Sandbox VR experience trailers to the post-experience TVs and watch as a group. This is the main activity for understanding what Sandbox VR sells — do not skip it.<br><br><strong>Facilitate a group discussion.</strong> Ask: What can you tell me about each experience after watching the trailer? Which experiences seem best for first-time Guests? Which would you recommend for a birthday group? A corporate group? How would you sell a scarier experience vs. a more family-friendly one? What would you say to someone who is nervous or says they\'re not a gamer?<br><br><strong>Connect to KPIs.</strong> Briefly connect the experience conversation to Repeatability, Staff Conversion, reviews, and video sharing. Keep it practical — connect behaviors to store outcomes rather than lecturing on metrics.', say: 'Direct trainees to Learning Plan pages 6–9. Walk through the mission, history, and core values together. Then cast the experience trailers and facilitate a group discussion about each experience and how to position it for different Guest types.', see: 'Watch for trainees who light up when discussing the experiences — those are your future top sellers. Note who asks the sharpest questions about Guest types and selling.', doText: 'Trainees discuss what they\'d say to different Guest types after watching the trailers. Each trainee shares one core value they connect with personally.', resources: ['Sandbox VR History (Learning Plan, page 6)', 'Mission and Core Values (Learning Plan, page 7)', 'Sandbox VR Experiences (Learning Plan, page 11)', 'Experience Talking Points Activity (Learning Plan, page 12)', 'Store Performance & KPIs (Learning Plan, page 13)'] },
      { time: '60 min', title: 'GEG Responsibilities & the Guest Journey', objectives: ['Watch Service Essentials: Guest Journey videos.','Coach demonstrates the full Guest Journey live.','Trainees practice the check-in script and Guest Journey flow.'], tip: '<strong>Show the Guest Journey videos first.</strong> Cast each video to the full group. Trainees watch before any practice begins.<br><br><strong>Demonstrate the full Guest Journey.</strong> After the videos, the coach demonstrates the complete Guest Journey live — from lobby entrance through post-experience. Show what the flow looks like from both the Guest perspective and the Team Member perspective.<br><br><strong>Debrief after the demonstration.</strong> Ask: What did you notice? Where does the Team Member create confidence for the Guest? Where could the Guest get confused if we are not clear? What parts of the flow need to feel smooth before opening?<br><br><strong>Pair practice.</strong> Trainees pair up and practice the check-in script and Guest Journey behaviors. Coach observes, redirects, and reinforces the expected standard.', say: 'Explain each of the four touchpoints: Entrance/Check-In, Barracks, Holodeck, Post-Experience. After the demonstration, articulate what "good" looks and sounds like at each one.', see: 'Watch how trainees respond to the scripted language during pair practice — are they natural or stiff? Note it. This is early signal on who will need the most coaching on delivery.', doText: 'Pair up and practice the check-in script with each other, rotating roles. Each pair should complete at least two full rotations.', resources: ['<a href="https://app.delightree.com/chapters/view/kz3q68dxq5n5inwaw936b9n6" target="_blank" style="color:var(--trigger)">▶ Service Essentials: Guest Journey CH 1 — Introduction →</a>','<a href="https://app.delightree.com/chapters/view/rzbo5apd44j8hlqlmnj84j9j" target="_blank" style="color:var(--trigger)">▶ Service Essentials: Guest Journey CH 2 — Lobby →</a>','<a href="https://app.delightree.com/chapters/view/4qjzk9n9nb9pflqlx3knzplx" target="_blank" style="color:var(--trigger)">▶ Service Essentials: Guest Journey CH 3 — Barracks →</a>','<a href="https://app.delightree.com/chapters/view/2l97zx7x6knatlaba3x6kw26" target="_blank" style="color:var(--trigger)">▶ Service Essentials: Guest Journey CH 4 — Holodeck →</a>','<a href="https://app.delightree.com/chapters/view/7qz9kwplp6d306zomwonop6w" target="_blank" style="color:var(--trigger)">▶ Service Essentials: Guest Journey CH 5 — Post Experience →</a>','Guest Journey: Touchpoints & Scripts (Learning Plan, pages 16–20)'] },
      { time: '30 min', title: 'Guest Policies, Procedures & Guest Recovery', objectives: ['Review critical policies: late arrivals, cancellations, waivers, refunds.','Understand the Acknowledge–Empathize–Resolve recovery model.','Practice at least one Guest Recovery scenario.'], tip: '<strong>Before training this block, speak with the franchise manager.</strong> Confirm the local refund policy and how they want it trained. Franchisees may not follow the same refund policy as corporate stores — do not assume corporate policy applies. Align with the franchise manager first, then train the policy accurately for that location.<br><br><strong>What stays universal regardless of franchise policy:</strong> the Guest Recovery model — Acknowledge, Empathize, Resolve. The specific refund or compensation approach may vary by franchisee, but how the team communicates with Guests should always follow this model.<br><br>Policies only stick when trainees practice applying them to real situations. Use the 5-minute grace period and a frustrated Guest scenario as practice prompts. Make it feel real — not hypothetical.', say: 'Walk through the most common Guest challenges and the correct policy response for each — using the franchise-confirmed policy for this location.', see: 'Who handles awkward Guest scenarios naturally? Who freezes? Both are useful data — note it for coaching later.', doText: 'Role-play one delayed-Guest scenario and one tech-issue recovery. Each trainee should take a turn as the Team Member.', resources: ['Guest Policies & Procedures (Learning Plan, page 14)', 'Guest Recovery Model (Learning Plan, page 14)', 'Handling Common Guest Service Challenges (Learning Plan, page 15)'] },
      { time: '30 min', title: 'Break', objectives: ['Rest & recharge.'], tip: 'Use break time to do a quick informal check-in with the SM. How are they feeling about running the training? Note any early alignment or gaps.', say: '', see: '', doText: '', resources: [] },
      { time: '20 min', title: 'Technology Essentials: Tracking', objectives: ['Watch Tech Essentials: Tracking videos as a group.','Understand passive vs. active tracking fundamentals.','Learn tracker ball inspection standards (20% rule).'], tip: '<strong>Cast the Tech Essentials: Tracking videos to the post-experience TVs.</strong> Trainees watch as a group. Pause after key moments to validate understanding — ask 2–3 quick questions: What is the difference between prop tracking and prop pairing? What should you check first when tracking looks wrong? Why does tracker condition matter? What should you do before assuming the issue is software?<br><br>Tracking is the backbone of the entire experience. Connect the tech to the Guest — a bad calibration equals a broken experience. If trainees understand why tracker calibration matters, they won\'t treat it as a checkbox.<br><br>Keep this block focused on understanding. <strong>Preview that the hands-on tracker build happens next</strong> — this block is the why, the next block is the how.', say: 'Explain how motion capture translates physical movement into the virtual world. Cover the difference between active and passive tracking and what the 20% tracker ball damage threshold means in practice.', see: 'Look for trainees who seem genuinely curious about the technology — they often become your technical leaders on the floor.', doText: 'Inspect tracker balls as a group and practice identifying whether a ball meets the 20% damage threshold. Every trainee should handle and assess at least one ball before the group moves on.', resources: ['<a href="https://app.delightree.com/chapters/view/nm8qwxowdn3lizmdwkb392kb" target="_blank" style="color:var(--trigger)">▶ Tracking CH 1 — Active Tracking Headmount Intro →</a>','<a href="https://app.delightree.com/chapters/view/qn6q3ex3wb7mfbdwb4bna8x9" target="_blank" style="color:var(--trigger)">▶ Tracking CH 2 — Control Panel & Modes →</a>','<a href="https://app.delightree.com/chapters/view/lznqb2x884jr0wkdw6w329z5" target="_blank" style="color:var(--trigger)">▶ Tracking CH 3 — Troubleshooting and Care →</a>','<a href="https://app.delightree.com/chapters/view/kz3q66aal9baclewb2359e2q" target="_blank" style="color:var(--trigger)">▶ Tracking CH 4 — Passive Tracking Intro →</a>','<a href="https://app.delightree.com/chapters/view/aamqzz73az8btwmkr7j4zz6w" target="_blank" style="color:var(--trigger)">▶ Tracking CH 5 — Passive Tracking Props →</a>','<a href="https://app.delightree.com/chapters/view/zb43wwlaej32fl256wkn77ab" target="_blank" style="color:var(--trigger)">▶ Tracking CH 6 — Passive Limb Tracker Assembly →</a>','<a href="https://app.delightree.com/chapters/view/xxmpbbxklb9aideb7qwojbw8" target="_blank" style="color:var(--trigger)">▶ Tracking CH 7 — Passive Tracking Prop Tracker Assembly →</a>','<a href="https://app.delightree.com/chapters/view/o9ozzbz7nnxx0xkd87bxqll4" target="_blank" style="color:var(--trigger)">▶ Calibration SOP →</a>'] },
      { time: '240+ min', title: 'Tracker Build Assembly Line', objectives: ['Build all limb and prop trackers using a structured assembly line.','Every trainee builds at least one tracker from start to finish independently.','All trackers pass quality validation before being placed into service.'], tip: '<strong>How to run the line — not tracker theory. That lives in Delightree.</strong><br><br><strong>Before You Start</strong><br>Review Tech Essentials: Tracking with the group before touching supplies. The assembly line assumes trainees understand what trackers are and why build quality matters.<br><br><strong>Stage Supplies Before Briefing</strong><ul style="margin:6px 0;padding-left:20px"><li>Count and sort tracker bases, balls, pins, screws, silicone straps, and mounts by type before trainees enter.</li><li>Print or display the quantity list the Sticker Captain will use.</li><li>Lay out screwdrivers, the tracker build chart, and screw sizing reference at the Screwdriver station.</li><li>Set aside a completed sample tracker at each station as a visual reference.</li></ul><strong>Roles</strong><ul style="margin:6px 0;padding-left:20px"><li><strong>Sticker Captain (1–2 people)</strong> — Places stickers on bases. Manages the quantity list. Ensures builders repeat the same build until their count is done. Controls the pace of the whole line.</li><li><strong>Builder Team (3–5 people)</strong> — Hand-tightens pins to the correct position. Each builder repeats one tracker type. Receives pre-stickered bases, passes completed bases forward.</li><li><strong>Screwdriver Team (3–5 people)</strong> — Secures tracker balls to pins and screws bases into mounts. Limb trackers use 4x8 screws, not 4x6.</li><li><strong>Silicone Strap / Mount Team (2–4 people)</strong> — Threads silicone straps, secures weapon mounts, slides HMD mounts onto headsets. End of the line — their output is a finished tracker.</li><li><strong>Validators (SM / Leads)</strong> — Do not build. Test tightness of every tracker. Place in holodeck and confirm MoCap visibility in Vicon Evoke. Flag anything that fails for rebuild.</li></ul><strong>Preventing Bottlenecks</strong><ul style="margin:6px 0;padding-left:20px"><li>Screwdriver Team typically needs the most people — assign extra here if the line backs up.</li><li>If the Sticker Captain falls behind, the whole line stalls — give them a second person early.</li><li>If Silicone Strap/Mount Team is idle between batches, they can assist the Screwdriver Team.</li></ul><strong>Quality Control</strong><ul style="margin:6px 0;padding-left:20px"><li>Validators check every tracker — not a sample. A tracker that fails in the holodeck disrupts a guest session.</li><li>Common errors: loose pins, wrong screw size, incorrect sticker placement, silicone strap threaded backward.</li><li>If the same error appears repeatedly at one station, pause the line, address the whole station, then restart.</li></ul><strong>Debrief When Done</strong><br>"What errors came up most often? What caused them?" / "Which role was hardest? Which was easiest? Why?" / "What would you do differently if you ran this line again?"<br><br><strong>Coach Note</strong><br>Every trainee must build at least one complete tracker independently before you sign off on this competency — not just rotate through a station. The assembly line builds speed. Individual completion builds accountability. Both are required.', say: 'Walk the team through each assembly line station before building starts. Model one complete tracker build so the team knows exactly what they\'re working toward and what a passing quality check looks like.', see: 'Observe technique and confidence at each station. Anyone struggling with a step should be corrected early — mistakes that get built on top of are harder to fix. Note who picks up the process quickly and who needs more reps.', doText: 'Every trainee builds at least one complete tracker independently from start to finish. Validators check each completed tracker before it is marked done. If the team does not finish all rooms today, note what remains and continue at the start of Day 2.', resources: [] },
    ]
  },
  {
    num: 2,
    title: 'Understanding Service, Sales & Operations',
    type: 'Learning Plan',
    focus: 'Day 2 is about equipping the team to handle a full session operationally. By end of day, every trainee should be able to navigate Checkfront, demonstrate vest pairing, and understand our sales approach.',
    blocks: [
      { time: '60 min', title: 'Booking & Experience Software: Checkfront & Silica', objectives: ['Navigate Checkfront to book, check-in, and manage sessions.','Use the Silica App on the staff iPad.','Practice a complete booking workflow.'], tip: 'Software confidence comes from repetition, not explanation. Give trainees hands-on time with the system as early as possible. Pair them up so they teach each other — peer teaching drives deeper processing.', say: 'Walk through a complete booking scenario while team follows along.', see: 'Watch for hesitation on the check-in flow — this is where new GEGs lose time with guests.', doText: 'Each trainee completes a practice booking and check-in independently.', resources: ['Checkfront Procedures Checklist (Learning Plan, page 21)','SOP – Checkfront (Delightree)','<a href="https://app.delightree.com/chapters/view/qnn62o8el7a9h885pblbwmqp" target="_blank" style="color:var(--trigger)">▶ Silica CH 1 — Intro and Mobile Check-In →</a>','<a href="https://app.delightree.com/chapters/view/j44nba73ea9mtjlnoador9b7" target="_blank" style="color:var(--trigger)">▶ Silica CH 2 — Running Sessions →</a>'] },
      { time: '60 min', title: 'How to Sell Sandbox VR', objectives: ['Understand the Repeatability KPI and the three moments to sell it.','Practice back-to-back booking conversations.','Understand Staff Conversion and walk-in engagement.'], tip: 'Selling at Sandbox VR isn\'t about pushing product — it\'s about extending a great experience. Trainees who feel awkward about sales usually do when framed as "convince them to spend money." Reframe it: you are offering them more of something they\'re already about to love.', say: 'Demonstrate the three repeatability moments: check-in, mid-experience (while geared up), post-experience.', see: 'Note natural salespeople vs. those who seem hesitant. Both can be great with the right framing.', doText: 'Role-play all three repeatability moments in rotation. Everyone goes twice.', resources: ['How to Sell Sandbox VR (Learning Plan, page 13)'] },
      { time: '30 min', title: 'Technology Essentials: Holodeck Room Servers', objectives: ['Watch Technology Essentials: Holodeck Room Servers.','Understand the roles of EMU (Experience, Mocap, Video Servers).','Review basic hardware layout.'], tip: 'Connect the servers to what trainees already learned about tracking. EMU servers are what take the tracker data and turn it into the VR world. When they understand the signal flow, troubleshooting becomes intuitive instead of mysterious.', say: 'Explain what each server does in plain language — not technical specs.', see: 'Who asks the most system-level questions? Those are your tech-inclined GEGs.', doText: 'Trainees label each server type on a diagram before touching the hardware.', resources: ['<a href="https://app.delightree.com/chapters/view/6qz4kkmjj2pbuxaek6j3lqbm" target="_blank" style="color:var(--trigger)">▶ Holodeck Server Rack CH 1 — Introduction →</a>','<a href="https://app.delightree.com/chapters/view/7qz9k29par75ipw9bw7639lp" target="_blank" style="color:var(--trigger)">▶ Holodeck Server Rack CH 2 — VNC →</a>','<a href="https://app.delightree.com/chapters/view/b5mqdw47pzad1pn8wmmzaqbk" target="_blank" style="color:var(--trigger)">▶ Holodeck Server Rack CH 3 — Daily Operations and Care →</a>'] },
      { time: '30 min', title: 'Procedure Checklist: Holodeck Room Servers', objectives: ['Complete the Basic Technology Procedures Checklist.','Review cleaning & maintenance responsibilities for Holodeck Room Servers.'], tip: 'Checklists reduce cognitive load and catch errors that confidence-based working misses. Frame checklists not as bureaucracy but as the standard every Sandbox location holds itself to — the mark of a professional team.', say: 'Walk through each step before trainees attempt it.', see: 'Observe speed and accuracy. Both extremes need coaching.', doText: 'Each trainee completes the checklist solo and self-checks against the answer.', resources: ['Basic Technology Procedures Checklist (Learning Plan, page 29)'] },
      { time: '30 min', title: 'Break', objectives: ['Rest & recharge.'], tip: '', say: '', see: '', doText: '', resources: [] },
      { time: '30 min', title: 'Technology Essentials: Wireless Streaming', objectives: ['Watch Tech Essentials: Wireless Streaming.','Understand hardware and software components of wireless streaming.'], tip: '', say: 'Cover the key components: headsets, base stations, wireless access points.', see: 'Watch for anyone who looks confused — wireless streaming has the most moving parts.', doText: 'Trainees draw the wireless signal flow from headset to server on a whiteboard.', resources: ['<a href="https://app.delightree.com/chapters/view/qn6q38w5ow6a16x89xjbrn42" target="_blank" style="color:var(--trigger)">▶ Wireless CH 1 — Intro to Wireless →</a>','<a href="https://app.delightree.com/chapters/view/eo5ql8w73487u7lbmde4wbx2" target="_blank" style="color:var(--trigger)">▶ Wireless CH 2 — HTC Basics Wireless →</a>','<a href="https://app.delightree.com/chapters/view/6qz4ke8e5e5qhxaek6edjm2z" target="_blank" style="color:var(--trigger)">▶ Wireless CH 3 — Hardware and Software Infrastructure →</a>','<a href="https://app.delightree.com/chapters/view/nm8qwpjw48kjczmdwkdoe79p" target="_blank" style="color:var(--trigger)">▶ Wireless CH 4 — Wireless Daily Operations →</a>'] },
      { time: '60 min', title: 'Procedure Checklist: Wireless Streaming', objectives: ['Complete the Wireless Streaming Procedure Checklist.','Demonstrate ability to reset and reconnect wireless components.'], tip: 'This is a hands-on competency that every GEG will need to perform under guest pressure. Make sure every trainee does the full reset process at least twice before signing off.', say: 'Walk through each procedure step with explanations.', see: 'Watch for trainees who skip steps or do them out of order.', doText: 'Every trainee completes the full wireless reset procedure independently.', resources: ['Wireless Procedure Checklist (Learning Plan, page 26)'] },
      { time: '30 min', title: 'Technology Essentials: Haptic Vests', objectives: ['Watch Tech Essentials: Haptic Vests video.','Understand haptic feedback technology and vest adjustment.','Complete vest pairing & troubleshooting activity.'], tip: 'The haptic vest is what guests are most excited about. Use that. When trainees understand that a poorly fitted vest means muted haptics and a diminished guest experience, they care more about getting it right.', say: 'Demonstrate proper vest fitting: adjustment range (up to 50"), pairing process, and LED status indicators.', see: 'Watch for proper adjustment technique — vest fit affects both haptic quality and guest comfort.', doText: 'Pair, troubleshoot, and re-pair vests in groups of 3. Rotate until each person has done it twice.', resources: ['<a href="https://app.delightree.com/chapters/view/rzbo5lzdjko6ul64b95a2j5e" target="_blank" style="color:var(--trigger)">▶ Vests CH 1 — Introduction to Vests →</a>','<a href="https://app.delightree.com/chapters/view/mj8qelb9d9w3sqxw37b9lnzd" target="_blank" style="color:var(--trigger)">▶ Vests CH 2 — Vest Pairing →</a>','<a href="https://app.delightree.com/chapters/view/qn6q3lboedjoh5oz3xp2zbj8" target="_blank" style="color:var(--trigger)">▶ Vests CH 3 — Vest Operations →</a>','Quick Reference Guide - Haptic Vests'] },
      { time: '30 min', title: 'Technology Essentials: Props', objectives: ['Watch Tech Essentials: Props.','Understand prop types (Gun, Wand, Pistol) and their experience assignments.','Complete prop pairing & troubleshooting activity.'], tip: 'Props are often where new GEGs lose confidence under pressure because props don\'t always pair on the first attempt. Give trainees permission to troubleshoot — normalize the issue-solving process as part of the role.', say: 'Explain each prop type and which experiences they are used for.', see: 'Who handles prop troubleshooting calmly? Who gets frustrated? Coaching opportunity.', doText: 'Each trainee pairs all three prop types successfully and practices the re-pair process.', resources: ['<a href="https://app.delightree.com/chapters/view/o9oqp8a6o43lizwrp8l6amza" target="_blank" style="color:var(--trigger)">▶ Props CH 1 — WiFi Prop Pairing & Troubleshooting →</a>','<a href="https://app.delightree.com/chapters/view/9qxojzxldz3dtezr3jnb7dp5" target="_blank" style="color:var(--trigger)">▶ Props CH 2 — Building Props →</a>','<a href="https://app.delightree.com/chapters/view/xxx3qoqnpm45c6oqmq9j267o" target="_blank" style="color:var(--trigger)">▶ Props CH 3 — Daily Operations and Care →</a>','Procedure Checklist: Prop Pairing (Learning Plan, page 27)'] },
    ]
  },
  {
    num: 3,
    title: 'Review, Role-Play & Store Daily Procedures',
    type: 'Learning Plan',
    focus: 'Day 3 ties everything together. The shift from knowledge to execution happens here. Role-play should be the majority of the day — the more realistic the scenarios, the better.',
    blocks: [
      { time: '60 min', title: 'Opening Procedures', objectives: ['Practice completing the Opening Checklist.','Complete Room Calibration for all rooms.','Identify and correct any calibration issues independently.'], tip: 'Opening is where the day\'s operational success is set. Trainees who can execute a clean open will handle busy days with confidence. Trainees who skip steps will create downstream problems. Don\'t let shortcuts slide today.', say: 'Walk through the Opening Checklist item by item before trainees attempt it.', see: 'Watch for the instinct to rush. Speed comes with experience — completeness comes with habit.', doText: 'Each trainee leads the opening sequence for one room from start to finish.', resources: ['Opening Checklist (Delightree)','Room Calibration SOP (Delightree)','Room Calibration Checklist (Learning Plan, page 28)'] },
      { time: '30 min', title: 'T1 Ticket Workflow', objectives: ['Watch Technology Essentials: T1 Workflow.','Understand when to escalate to T1 (5-minute rule).','Practice submitting a T1 ticket.'], tip: 'The 5-minute rule exists for a reason: GEGs often try to resolve things themselves out of pride or guest embarrassment. Make it clear that fast escalation to T1 is the professional move, not an admission of failure.', say: 'Cover the 5-minute escalation rule, what info to include in a ticket, and how to communicate the delay to guests.', see: 'Look for confidence and clarity in how trainees describe a tech issue — this is what they\'ll need under real-time pressure.', doText: 'Each trainee submits a practice T1 ticket describing a hypothetical issue.', resources: ['<a href="https://app.delightree.com/chapters/view/b5mq93opkldqt5mqd4rn3b34" target="_blank" style="color:var(--trigger)">▶ Tech Essentials: T1 Communication →</a>'] },
      { time: '2+ hrs', title: 'Role-Play Block 1: Full Guest Journey', objectives: ['Practice the complete Guest Journey from check-in to post-experience.','Apply scripts naturally — not robotically.','Handle at least one recovery scenario per group.'], tip: 'Rotate groups of 3 through each station while the rest practice tech tasks. Use a rotation so no one sits idle. The goal is maximum repetition in the time available. Research shows that spaced repetition dramatically outperforms massed practice for retention (Ebbinghaus, 1885; Kornell & Bjork, 2008).', say: 'Brief the team on what a "full run" looks like. Set the standard before they start.', see: 'Observe energy, language, and guest handling. Note who excels at each touchpoint.', doText: 'Rotate groups of 3 through the full Guest Journey. Coach walks the floor and gives live feedback.', resources: [] },
      { time: '30 min', title: 'Break', objectives: ['Rest & recharge.'], tip: '', say: '', see: '', doText: '', resources: [] },
      { time: '2+ hrs', title: 'Role-Play Block 2: Scenarios & Cleaning', objectives: ['Practice additional roleplay scenarios focusing on weak areas from Block 1.','Complete cleaning & maintenance for props, vests, headsets, and limb trackers.'], tip: 'Use Block 2 to address the gaps you identified in Block 1. If someone struggled with vest pairing — put them back on vests. If the sales pitch was weak — drill repeatability. Targeted practice in the areas of weakness is more efficient than general repetition.', say: 'Debrief Block 1 before starting. Call out wins and name the specific improvements needed.', see: 'Watch for improvement from Block 1. Acknowledge it publicly — positive reinforcement accelerates learning.', doText: 'Run targeted scenarios based on Block 1 observations. Cleaning happens alongside.', resources: [] },
      { time: '60 min', title: 'Closing Procedures', objectives: ['Practice completing the Closing Checklist.','Complete store cleaning procedures.','Review restroom cleaning checklist.'], tip: 'End the day with a full close — it gives trainees the full operational picture. A team that can open and close cleanly is a team that knows what they\'re doing.', say: 'Walk through the Closing Checklist and cleaning SOPs before trainees begin.', see: 'Watch for shortcuts. Closing is when energy is lowest and shortcuts are most likely.', doText: 'Each trainee leads the closing sequence for one area.', resources: ['Closing Checklist (Delightree)','Store Cleaning SOP (Delightree)','Restroom Cleaning Checklist (Delightree)'] },
    ]
  },
  {
    num: 4,
    title: 'Full Guest Journey Roleplay Day',
    type: 'Roleplay Day',
    focus: 'Day 4 is all about pressure-testing everything from Days 1-3 through end-to-end repetition. The goal is as many full Guest Journey runs as possible. Quality over speed — but push for both.',
    blocks: [
      { time: '30 min', title: 'Day 4 Briefing & Role Assignment', objectives: ['Assign roles for the first rotation.','Set performance expectations for the day.','Review any outstanding sign-offs from Days 1-3.'], tip: 'Start with a clear brief. Who is playing Host, who is playing Barracks GEG, who is playing Holodeck GEG. Rotate every 2 runs so everyone covers every role. The SM should run the briefing today with your coaching.', say: 'Set the standard: today we\'re running full sessions as if guests are here. The goal is smooth, natural, confident.', see: 'Note the SM\'s ability to brief and motivate the team independently.', doText: 'Assign roles on the whiteboard. Teams commit to their first rotation.', resources: [] },
      { time: '3+ hrs', title: 'Rotation Block 1: Full Guest Journey Runs', objectives: ['Complete as many full end-to-end Guest Journey runs as possible.','Rotate roles every 2 runs.','Coach walks the floor and gives live micro-feedback.'], tip: 'Interleaved practice (mixing roles and scenarios) builds more robust skills than blocked practice (one person doing one role all day). Research by Kornell & Bjork (2008) confirms that interleaving feels harder but produces significantly better retention and transfer. Keep the rotations coming.', say: 'Coach provides live feedback between runs. Be specific: "Your check-in energy dropped when the group was large — that\'s when you need more not less."', see: 'Watch for the moments when training breaks down: first prop issue, first guest question off-script, first timing pressure. These are the real learning moments.', doText: 'Full rotations. Every trainee plays every role at least twice by end of the day.', resources: [] },
      { time: '45 min', title: 'Lunch Break + Debrief', objectives: ['Rest & recharge.','Informal group debrief over lunch.'], tip: 'Use the lunch debrief to call out standout performances by name. Peer recognition in a group setting is powerful. Also surface the 1-2 things the whole team needs to tighten up in the afternoon.', say: 'Keep it conversational — not lecture. Ask the team what they felt went well and what was hard.', see: 'Who gives constructive self-assessment? That\'s your future trainer.', doText: 'Team shares one thing they improved and one thing they want to fix in Block 2.', resources: [] },
      { time: '3+ hrs', title: 'Rotation Block 2: Targeted Scenario Drilling', objectives: ['Drill the specific scenarios that revealed gaps in Block 1.','Focus on: tech troubleshooting under time pressure, sales conversion moments, guest recovery.','Continue full rotations.'], tip: 'Target the hardest scenarios in the afternoon — tech issues during a session, late-arriving guests, vest sizing for someone outside the standard range, a guest who wants a refund. These edge cases are where unprepared teams fail. Your job today is to make sure they\'ve seen every edge.', say: 'Introduce each scenario with context: "A group of 5 has just finished. One guest wants to go back-to-back. How does the GEG handle it?"', see: 'Watch for confidence, not just accuracy. A trainee who knows the right answer but delivers it nervously needs more reps.', doText: 'Run targeted scenarios between full rotations. Debrief after each one.', resources: [] },
      { time: '30 min', title: 'End-of-Day Debrief & Tomorrow Prep', objectives: ['Group debrief on Day 4 progress.','Address remaining sign-offs.','Brief the team on Day 5: Friends & Family expectations.'], tip: 'Build excitement for Day 5. Frame it as the team\'s debut — real guests, real stakes, real fun. The team should feel ready and proud. If there are significant gaps, address them honestly but constructively: "You are ready. Here is what we are going to focus on tomorrow."', say: 'Cover the Day 5 format: how bookings work, the coach\'s role (observer), the expected guest experience standard.', see: 'Read the room. Is the team confident? Anxious? Adjust your messaging accordingly.', doText: 'Every team member states one thing they are confident in and one thing they will focus on tomorrow.', resources: [] },
    ]
  },
  {
    num: 5,
    title: 'Friends & Family Day',
    type: 'Live Rehearsal',
    focus: 'Day 5 is the real thing — with a safety net. Friends and family of team members experience the store as real guests. The coach shifts from trainer to observer. Your job today is to watch, fill gaps silently, and document everything.',
    blocks: [
      { time: '45 min', title: 'Pre-Opening: Final Prep & Team Huddle', objectives: ['Complete the full Opening Checklist — every room.','Calibrate all rooms.','Team huddle: energy, expectations, roles assigned.'], tip: 'Let the SM and ASM run this prep with minimal intervention. Today is their show. Step back. If something is missed, give the team a chance to catch it before you step in. The best coaching today is restraint.', say: 'Coach keeps the huddle brief: "You are ready. Run it like guests are the most important people in the building — because they are."', see: 'Watch the SM lead. Is the team responding to them? Is the SM projecting confidence?', doText: 'SM leads the full pre-open briefing. Coach observes and takes notes.', resources: ['Opening Checklist (Delightree)','Room Calibration SOP (Delightree)'] },
      { time: '5+ hrs', title: 'Friends & Family Sessions — Live Operations', objectives: ['Run all booked F&F sessions as full production.','Apply the complete Guest Journey for every group.','Maintain all service standards — no "it\'s okay, they\'re family" exceptions.'], tip: 'Friends and family guests give GEGs the dual benefit of a real audience with a forgiving one. But don\'t let the team drop standards because guests are familiar. Real repetitions under real conditions consolidate skills more than any amount of practice. The science is clear: stress inoculation — performing under mild real-world pressure — is the most powerful way to prepare for the actual job (Driskell & Johnston, 1998). Stand back and let them run it.', say: 'Coach is silent unless there is a safety issue or operational failure. Observation notes only.', see: 'Watch for: service consistency across all sessions, SM managing the floor, GEGs recovering from unexpected moments, energy level in hour 4 vs. hour 1.', doText: 'GEGs run every session independently. Coach observes and takes detailed notes.', resources: [] },
      { time: '30 min', title: 'Mid-Day Coaching Pause (Between Sessions)', objectives: ['Quick group check-in.','Address any critical issues observed in morning sessions.','Maintain energy and morale.'], tip: 'If you saw something that needs fixing, fix it now — between sessions. Don\'t wait for the end-of-day debrief. A 5-minute correction mid-day applied to the afternoon sessions is worth more than a 30-minute debrief after the fact.', say: 'Name one thing the team is doing exceptionally well. Then name one thing to tighten. Keep it short.', see: 'Who is maintaining their energy? Who is starting to coast? Coach accordingly.', doText: 'Team states one adjustment they will make in afternoon sessions.', resources: [] },
      { time: '60 min', title: 'Closing & Final NSO Debrief', objectives: ['Complete full Closing Checklist.','Final group debrief: what the team accomplished over 5 days.','Sign off any remaining competencies.','Complete today\'s recap.'], tip: 'This debrief matters. Research on training closure (Kirkpatrick, 1959) shows that learners who explicitly reflect on their growth retain and apply more. Ask each person what they know today that they didn\'t on Day 1. Celebrate specific wins by name. Then document everything in the recap before you leave.', say: 'Tell the team what you saw. Be specific and genuine. Avoid empty praise — instead, note actual observed behaviors: "On Day 3 you struggled with the vest pairing. Today you did it in under 2 minutes three times in a row. That is what growth looks like."', see: 'Watch the SM in this closing moment — their ability to celebrate the team is a leadership signal.', doText: 'Each trainee reflects on one growth moment from the week. SM closes the 5-day training officially.', resources: ['Closing Checklist (Delightree)','Store Cleaning SOP (Delightree)'] },
    ]
  }
];

// ============================================================
// COMPETENCIES DATA
// ============================================================
const COMPETENCIES = [
  // Day 1 — Guest Experience & Orientation
  { day: 1, id: 'c1-1', name: 'Names all store areas correctly' },
  { day: 1, id: 'c1-2', name: 'Recites Mission & Core Values' },
  { day: 1, id: 'c1-3', name: 'Delivers Guest Journey intro script' },
  { day: 1, id: 'c1-4', name: 'Applies Guest Recovery model (A-E-R)' },
  { day: 1, id: 'c1-5', name: 'Builds limb tracker independently' },

  // Day 2 — Service, Sales, Tech & Equipment Care
  { day: 2, id: 'c2-1', name: 'Completes Checkfront booking end-to-end' },
  { day: 2, id: 'c2-2', name: 'Delivers repeatability pitch ×3' },
  { day: 2, id: 'c2-3', name: 'Pairs haptic vest independently' },
  { day: 2, id: 'c2-4', name: 'Pairs all prop types (Gun, Wand, Pistol)' },

  // Day 3 — Role-Play, Ops & Facility Standards
  { day: 3, id: 'c3-1', name: 'Leads opening procedures independently' },
  { day: 3, id: 'c3-2', name: 'Submits T1 ticket with correct detail' },
  { day: 3, id: 'c3-3', name: 'Runs full Guest Journey without prompting' },
  { day: 3, id: 'c3-4', name: 'Tracks up a full group correctly' },
  { day: 3, id: 'c3-5', name: 'Leads closing procedures independently' },

  // Day 4 — Full Roleplay & Leadership Habits
  { day: 4, id: 'c4-1', name: 'Performs all roles in Guest Journey rotation' },
  { day: 4, id: 'c4-2', name: 'Handles live tech issue without coach support' },
  { day: 4, id: 'c4-5', name: 'SM/ASM describes labor decisions based on bookings', smOnly: true },

  // Day 5 — Friends & Family & Operational Readiness
  { day: 5, id: 'c5-1', name: 'Runs full F&F session without coaching' },
  { day: 5, id: 'c5-2', name: 'Maintains guest experience standard for 5+ hrs' },
  { day: 5, id: 'c5-3', name: 'SM/ASM reviews 14-day bookings & flags risk days', smOnly: true },
];

// ============================================================
// LEADERSHIP TRAINING DATA
// Source: Franchise Manager Learning Plan 05.21.26
// ============================================================
const LEADERSHIP_ROLES = ['Owner', 'SM', 'ASM', 'Events Manager', 'Custom'];

const LEADERSHIP_AGENDA = [
  { day: 1, title: 'Sandbox VR Overview, Guest Experience, and Trackers', focus: 'Leaders learn the same Guest Experience Guide foundation they will later need to coach in their own store.', blocks: [
    { time: '15 mins', title: 'Intros & Store Tour', objectives: ['Gain familiarity with the store layout.', 'Learn Sandbox VR vocabulary and key operational terms.'] },
    { time: '30 mins', title: 'Introduction to Sandbox VR', objectives: ['Describe Sandbox VR history, mission, and core values.', 'Review experiences, KPIs, and what drives the business.'] },
    { time: '60 mins', title: 'GEG Responsibilities & Guest Journey', objectives: ['Walk through Guest Journey scripts and touchpoints.'] },
    { time: '30 mins', title: 'Guest Policies, Procedures & Recovery', objectives: ['Review critical guest policies.', 'Practice the Acknowledge, Empathize, Resolve recovery model.'] },
    { time: '20 mins', title: 'Technology Essentials: Tracking', objectives: ['Discuss passive and active tracking fundamentals.'] },
    { time: '240-300 mins', title: 'Tracker Procedure Checklist & Build', objectives: ['Build trackers as a group and validate visibility.'] }
  ]},
  { day: 2, title: 'Service, Sales, and Operations Essentials', focus: 'Leaders build fluency in booking software, sales moments, hardware basics, and daily technology procedures.', blocks: [
    { time: '60 mins', title: 'Booking & Experience Software: Checkfront and Silica', objectives: ['Practice booking, check-in, and session management workflows.'] },
    { time: '60 mins', title: 'How to Sell Sandbox VR', objectives: ['Practice selling experiences and back-to-backs.', 'Connect repeatability and conversion to store goals.'] },
    { time: '30 mins', title: 'Technology Essentials: Holodeck Room Servers', objectives: ['Review EMV server basics and room hardware layout.'] },
    { time: '30 mins', title: 'Holodeck Room Server Procedures', objectives: ['Complete basic technology procedures.'] },
    { time: '30 mins', title: 'Technology Essentials: Wireless Streaming', objectives: ['Review wireless hardware and software infrastructure.'] },
    { time: '60 mins', title: 'Wireless Streaming Procedure Checklist', objectives: ['Complete wireless procedures and demonstrate reset/reconnect confidence.'] },
    { time: '30 mins', title: 'Technology Essentials: Haptic Vests', objectives: ['Discuss haptic feedback basics and vest handling.'] },
    { time: '30 mins', title: 'Procedure Checklist: Haptic Vests', objectives: ['Complete vest pairing and troubleshooting activity.'] },
    { time: '30 mins', title: 'Technology Essentials: Props', objectives: ['Discuss prop technology basics and common troubleshooting.'] },
    { time: '30 mins', title: 'Procedure Checklist: Props', objectives: ['Complete prop pairing and troubleshooting activity.'] }
  ]},
  { day: 3, title: 'Technology, Role-play, and Store Operations', focus: 'Leaders practice store opening/closing, T1 escalation, role-play, shadowing, and technical operating standards.', blocks: [
    { time: '60 mins', title: 'Opening Procedures', objectives: ['Practice the Opening Checklist.', 'Practice room calibration.'] },
    { time: '30 mins', title: 'T1 Ticket Workflow', objectives: ['Practice submitting T1 tickets with useful detail.'] },
    { time: '2 hours+', title: 'Review, Role-play & Shadow', objectives: ['Practice the GEG role with scenarios and shadowing.'] },
    { time: '2 hours+', title: 'Review, Role-play & Shadow Continued', objectives: ['Repeat weak scenarios and build confidence through live practice.'] },
    { time: '60 mins', title: 'Cleaning & Maintenance and Closing Procedures', objectives: ['Review store cleaning procedures.', 'Practice completing the Closing Checklist.'] }
  ]},
  { day: 4, title: 'Manager Operations', focus: 'Leaders shift from task execution to manager judgment: handoffs, cleaning standards, audio checks, shadowing, and operating decisions.', blocks: [
    { time: '30 mins', title: 'Manager Shift Change', objectives: ['Practice shift change and handover procedures.'] },
    { time: '60 mins', title: 'Store Cleaning Procedures', objectives: ['Review cleaning procedures, chemicals, supplies, and standards.'] },
    { time: '30 mins', title: 'Technology Essentials: Audio Checker', objectives: ['Practice the standard audio checker procedure.'] },
    { time: '4.5 hours', title: 'Store Manager Shadowing', objectives: ['Shadow a seasoned manager or trainer.', 'Focus on store operations, technology, guest recovery, coaching, and staffing decisions.'] }
  ]},
  { day: 5, title: 'Reverse Shadowing and Final Certification', focus: 'Leaders demonstrate readiness while the trainer observes, documents follow-ups, and completes final certification.', blocks: [
    { time: '30 mins', title: 'Manager Shift Change', objectives: ['Practice shift change procedures with trainer observation.'] },
    { time: '90 mins', title: 'Work as a Guest Experience Guide', objectives: ['Run sessions as a GEG while the trainer shadows.'] },
    { time: '4 hours', title: 'Store Manager Reverse Shadowing', objectives: ['Work as Manager on Duty while trainer shadows and documents readiness.'] },
    { time: '60 mins', title: 'Final Certification', objectives: ['Complete final certification with trainer or manager.', 'Document any exceptions or follow-ups.'] }
  ]}
];

const LEADERSHIP_COMPETENCIES = [
  { day: 1, id: 'lt-orientation-brand',    category: 'Orientation',        name: 'Explains brand, store overview, history, mission, values, and vocabulary' },
  { day: 1, id: 'lt-policies-recovery',    category: 'Guest Policies',     name: 'Explains guest requirements, waivers, cancel/reschedule basics, and service recovery' },
  { day: 1, id: 'lt-journey-touchpoints',  category: 'Guest Journey',      name: 'Describes and coaches entrance, check-in, barracks, holodeck, and post-experience touchpoints' },
  { day: 1, id: 'lt-tracker-build',        category: 'Technical Training', name: 'Builds, repairs, identifies, and validates trackers in Vicon' },
  { day: 2, id: 'lt-sales-repeatability',  category: 'Sales',              name: 'Coaches repeatability, conversion, phone inquiries, walk-by traffic, tours, and value framing' },
  { day: 2, id: 'lt-checkfront-basic',     category: 'Booking & Software', name: 'Performs daily manifest, lookup, check-in, payment, availability, booking, reschedule, cancel, and refund basics' },
  { day: 2, id: 'lt-checkfront-advanced',  category: 'Booking & Software', name: 'Performs gift voucher, split payment, booking state changes, and key sales/refund/discount reports' },
  { day: 2, id: 'lt-control-before',       category: 'Control Center',     name: 'Runs pre-experience Control Center steps including barracks assignment, waivers, photos, and session setup' },
  { day: 2, id: 'lt-control-during',       category: 'Control Center',     name: 'Runs in-experience Control Center steps including launch, tutorial, weapons, mics, heroic selfie, and guest controls' },
  { day: 2, id: 'lt-control-after',        category: 'Control Center',     name: 'Runs post-experience Control Center steps including scores, videos, QR codes, and trailer reset' },
  { day: 3, id: 'lt-tech-gear',            category: 'Technology Basics',  name: 'Explains guest-worn gear, haptic vests, body trackers, active tracking, and props' },
  { day: 3, id: 'lt-tech-room',            category: 'Technology Basics',  name: 'Explains MoCap cameras, webcam, SPCs, APs, room rack, EMV servers, KVM, dongles, and Raspberry Pi' },
  { day: 3, id: 'lt-wireless-procedure',   category: 'Technical Training', name: 'Completes wireless headset procedure including power, IPD, serial/IP, battery swap, menus, ATH setup, and Vicon check' },
  { day: 3, id: 'lt-vest-procedure',       category: 'Technical Training', name: 'Completes haptic vest procedure including power, battery, VirtualHere pairing, troubleshooting, cleaning, and spare handling' },
  { day: 3, id: 'lt-prop-procedure',       category: 'Technical Training', name: 'Completes prop procedure including pairing, troubleshooting, cleaning, storage, and replacement' },
  { day: 3, id: 'lt-room-calibration',     category: 'Technical Training', name: 'Independently calibrates a room and adjusts T-Wand battery/brightness as needed' },
  { day: 3, id: 'lt-server-procedures',    category: 'Technical Training', name: 'Performs server/SPC/VNC procedures including soft reboots, mic/webcam checks, Vicon validation, and SteamVR checks' },
  { day: 4, id: 'lt-guest-complaints',     category: 'Shadowing',          name: 'Resolves guest complaints involving delays, technical issues, refunds, rescheduling, cancellation, and VIP requests' },
  { day: 4, id: 'lt-team-coaching',        category: 'Shadowing',          name: 'Coaches team greetings, rules, upsells, and Tier 1 Slack interactions across all touchpoints' },
  { day: 4, id: 'lt-operations-decisions', category: 'Shadowing',          name: 'Combines public sessions, assesses staffing and labor, and manages downtime productively' },
  { day: 5, id: 'lt-reverse-shadow-geg',     category: 'Reverse Shadowing', name: 'Runs sessions end-to-end as a GEG while shadowed' },
  { day: 5, id: 'lt-reverse-shadow-manager', category: 'Reverse Shadowing', name: 'Works as Manager on Duty while trainer shadows and documents readiness' },
  { day: 5, id: 'lt-final-certification',    category: 'Final Sign-Off',    name: 'Completes See, Say, Do, Review certification with exceptions or follow-ups documented' }
];

// ============================================================
// KNOWLEDGE BASE DATA
// ============================================================
const KB = {
  'Start Here': [
    {
      id: 'start-learning-plan',
      title: 'How to Use the NSO GEG Learning Plan',
      category: 'Start Here',
      eyebrow: 'START HERE',
      subtitle: 'The Learning Plan is the source of truth. This is how to use it.',
      content: `<h3>What the Learning Plan Is</h3>
<p>The NSO GEG Learning Plan is your primary agenda for the 3-day training program. It tells you what gets trained, in what order, how long each block takes, and which Delightree resources trainees need to complete. Follow it. Do not improvise the structure unless real store conditions force you to adjust.</p>
<div class="science-callout"><div class="science-callout-label">Coach Principle</div><div class="science-callout-text">The Learning Plan exists because sequence matters. Trainees who learn tracking before they understand the Guest Journey have the wrong mental model. Do not skip blocks or reorder the day unless the store is genuinely not ready for a specific activity.</div></div>
<h3>Where It Lives</h3>
<ul>
<li><a href="https://app.delightree.com/chapters/view/nmm89lolo598sr5opzam7nz3" target="_blank" style="color:var(--trigger)">Open the NSO GEG Learning Plan on Delightree →</a></li>
<li>The full Learning Plan is printed and should be in your coach kit before Day 1.</li>
<li>All referenced Delightree resources are linked in the <strong>Delightree Resource Links</strong> article in this Knowledge Base.</li>
</ul>
<h3>How to Follow the Day-by-Day Structure</h3>
<ul>
<li>Review the full plan the evening before each training day.</li>
<li>Know which blocks are <strong>learning-plan driven</strong> (video + discussion) vs. <strong>hands-on practice</strong> (group stations).</li>
<li>For each block: open the Delightree resource first, then facilitate — do not read from the plan out loud.</li>
<li>Keep time. If a block runs long, identify what gets shortened — never skip a required completion item.</li>
<li>Completion items (eLearnings marked required in Delightree) must be done by every trainee before end of day.</li>
</ul>
<h3>Required Completion vs. Reference Resources</h3>
<ul>
<li><strong>Required:</strong> Assigned Delightree eLearnings that trainees must complete and reach 100% on.</li>
<li><strong>Reference:</strong> SOPs, checklists, and guides trainees can revisit after training — not gated.</li>
<li>Coach tracks required completion via the Tracking tab in Delightree. If access is missing, contact L&amp;D immediately.</li>
</ul>
<h3>When to Adjust</h3>
<ul>
<li>Store not physically ready (e.g. trackers not received): reschedule the hands-on block and fill with a group eLearning or role-play.</li>
<li>Tech issue that cannot be resolved quickly: do not lose the day. Pivot to a non-tech block and schedule a make-up.</li>
<li>Trainee access issue in Delightree: continue group learning, flag to L&amp;D, ensure the individual completes solo before end of day.</li>
</ul>
<div class="science-callout"><div class="science-callout-label">What You Should Not Do</div><div class="science-callout-text">Do not add your own content blocks that are not in the plan. Do not reorder the three days. Do not tell trainees the Learning Plan is optional. The plan reflects months of instructional design work — deviations compound across the opening program.</div></div>`
    }
  /* Delightree Resource Links moved to Resources page */
  /* {
      id: 'start-delightree-links',
      title: 'Delightree Resource Links',
      category: 'Start Here',
      eyebrow: 'START HERE',
      subtitle: 'Every resource coaches and trainees need, in one place.',
      content: `<h3>How to Use This Page</h3>
<p>These are the Delightree resources referenced in the NSO GEG Learning Plan. Open the relevant link before each training block. Where completion tracking is required, make sure every trainee is logged into their own Delightree account.</p>
<p><a href="https://app.delightree.com/chapters/view/nmm89lolo598sr5opzam7nz3" target="_blank" style="color:var(--trigger);font-weight:600">→ Open the NSO GEG Learning Plan</a></p>
<h3>Brand &amp; Guest Experience</h3>
<ul>
<li><a href="http://sandboxvr.com" target="_blank" style="color:var(--trigger)">Sandbox VR Website →</a> — Brand story, experiences, and context for the Day 1 intro block.</li>
<li><a href="https://app.delightree.com/folders/lznpb993j5p5il58l625pde9" target="_blank" style="color:var(--trigger)">Service Essentials: Guest Journey →</a> — Full Guest Journey eLearning. Required Day 1 completion.</li>
</ul>
<h3>Technology</h3>
<ul>
<li><a href="https://app.delightree.com/folders/mj8nedo6jlz7s2q2eoxz378e/lznpb9bl5kmz149zr93xpwl2" target="_blank" style="color:var(--trigger)">Tech Essentials: Tracking →</a> — Tracker theory, build specs, 20% rule. Watch before the tracker build block.</li>
<li><a href="https://app.delightree.com/chapters/view/o9ozzbz7nnxx0xkd87bxqll4" target="_blank" style="color:var(--trigger)">Calibration SOP →</a> — Step-by-step room calibration. Required reference for Day 3 opening procedures.</li>
<li><a href="https://app.delightree.com/folders/mj8nedo6jlz7s2q2eoxz378e/j4ne2bb97929086m7p9b8ee6" target="_blank" style="color:var(--trigger)">Technology Essentials: Holodeck Room Servers →</a> — EMU server overview. Day 2 block.</li>
<li><a href="https://app.delightree.com/folders/mj8nedo6jlz7s2q2eoxz378e/mj8nlao797aos2pnwaze72o2" target="_blank" style="color:var(--trigger)">Tech Essentials: Wireless Streaming →</a> — Wireless streaming hardware and reset procedures. Day 2 block.</li>
<li><a href="https://app.delightree.com/folders/mj8nedo6jlz7s2q2eoxz378e/6qzp38pwwr9jt7d25doj76pn" target="_blank" style="color:var(--trigger)">Tech Essentials: Haptic Feedback Vests →</a> — Vest pairing, LED states, fitting. Day 2 block.</li>
<li><a href="https://app.delightree.com/chapters/view/2l9eep69x5jj0ezo58l8zx6m" target="_blank" style="color:var(--trigger)">Quick Reference Guide: Haptic Feedback Vests →</a> — One-page quick reference for vest operations.</li>
<li><a href="https://app.delightree.com/folders/mj8nedo6jlz7s2q2eoxz378e/4qjepln3zkom1akjnk6354ol" target="_blank" style="color:var(--trigger)">Tech Essentials: Props →</a> — Prop types, pairing, troubleshooting. Day 2 block.</li>
<li><a href="https://app.delightree.com/folders/mj8nedo6jlz7s2q2eoxz378e/b5mzxb8z8bazcazar9252zpm" target="_blank" style="color:var(--trigger)">Technology Essentials: T1 Workflow →</a> — Escalation process and ticket submission. Day 3 block.</li>
</ul>
<h3>Systems &amp; Software</h3>
<ul>
<li><a href="https://app.delightree.com/chapters/view/5qqrqm2ko4ansm272keoq6wx" target="_blank" style="color:var(--trigger)">SOP: Checkfront →</a> — Booking management, check-in flow, daily manifest. Day 2 block.</li>
</ul>
<h3>Store Operations</h3>
<ul>
<li><a href="https://app.delightree.com/chapters/view/qn6mmw3r88bbcbnkxl7lmw7p" target="_blank" style="color:var(--trigger)">Opening Checklist →</a> — Full opening procedure checklist. Day 3 block.</li>
<li><a href="https://app.delightree.com/chapters/view/zb4jjqwwm4e60zqd8lpl362r" target="_blank" style="color:var(--trigger)">Closing Checklist →</a> — Full closing procedure checklist. Day 3 block.</li>
<li><a href="https://app.delightree.com/chapters/view/9qxrrw548blphl34935lz7lm" target="_blank" style="color:var(--trigger)">Store Cleaning SOP →</a> — Daily cleaning standards and responsibilities.</li>
<li><a href="https://app.delightree.com/chapters/view/pzxaaen5x6d4u6xj5838bpnd" target="_blank" style="color:var(--trigger)">Restroom Cleaning Checklist →</a> — Restroom cleaning standards.</li>
</ul>`
    }
  } */
  ],
  'Daily Facilitation': [
    {
      id: 'daily-day1',
      title: 'Day 1 Facilitation Guide',
      category: 'Daily Facilitation',
      eyebrow: 'DAILY FACILITATION',
      subtitle: 'All Things Sandbox VR, the Guest Experience, and Building Trackers.',
      content: `<h3>Day 1 Purpose</h3>
<p>Day 1 builds the foundation. Trainees need to understand <em>why</em> they are here, <em>what</em> Sandbox VR is, and <em>who</em> they are serving before they learn how. End the day with every trainee having built at least one tracker from start to finish.</p>
<h3>Agenda at a Glance</h3>
<ul>
<li><strong>15 min</strong> — Intros &amp; Store Tour</li>
<li><strong>30 min</strong> — Introduction to Sandbox VR</li>
<li><strong>60 min</strong> — GEG Responsibilities &amp; Guest Journey (video + debrief)</li>
<li><strong>30 min</strong> — Guest Policies, Procedures &amp; Recovery</li>
<li><strong>30 min</strong> — Break</li>
<li><strong>20 min</strong> — Tech Essentials: Tracking (video)</li>
<li><strong>240+ min</strong> — Build All Store Trackers (Assembly Line)</li>
</ul>
<h3>Block-by-Block Coaching Notes</h3>
<h4 style="font-size:13px;font-weight:700;color:var(--hb);margin:16px 0 4px">Intros &amp; Store Tour</h4>
<ul>
<li>Walk the store yourself first. Name every area by its correct term: Lobby, Barracks, Holodeck.</li>
<li>Narrate the Guest Journey as you walk — plant the mental model early.</li>
<li>Watch body language. Who is curious? Who is disengaged? That data is useful on Day 4.</li>
</ul>
<h4 style="font-size:13px;font-weight:700;color:var(--hb);margin:16px 0 4px">Introduction to Sandbox VR</h4>
<ul>
<li>Tell the story — do not read slides. The Hong Kong origin, the celebrity investors, the word-of-mouth growth. Make them feel like they are joining something.</li>
<li>Ask each trainee to name one Core Value they connect with. Write them on the whiteboard. Return to this on Day 5.</li>
</ul>
<h4 style="font-size:13px;font-weight:700;color:var(--hb);margin:16px 0 4px">GEG Responsibilities &amp; Guest Journey</h4>
<ul>
<li>Show the <a href="https://app.delightree.com/folders/lznpb993j5p5il58l625pde9" target="_blank" style="color:var(--trigger)">Service Essentials: Guest Journey →</a> video first. Then debrief. Do not talk over the video.</li>
<li>After the video: "What stood out? What would be hardest to do under pressure?"</li>
<li>Pair trainees to practice the check-in script. Give feedback in real time. Rotate partners.</li>
<li>Confirm all trainees mark this complete in their Delightree accounts before end of day.</li>
</ul>
<h4 style="font-size:13px;font-weight:700;color:var(--hb);margin:16px 0 4px">Guest Policies &amp; Recovery</h4>
<ul>
<li>Do not lecture the policy list. Present a scenario and ask how they would handle it.</li>
<li>Cover: late arrivals, the 5-minute grace, rebooking fee, waivers, refunds.</li>
<li>Run the Acknowledge–Empathize–Resolve model through at least one real-feeling scenario.</li>
</ul>
<h4 style="font-size:13px;font-weight:700;color:var(--hb);margin:16px 0 4px">Tech Essentials: Tracking</h4>
<ul>
<li>Show the <a href="https://app.delightree.com/folders/mj8nedo6jlz7s2q2eoxz378e/lznpb9bl5kmz149zr93xpwl2" target="_blank" style="color:var(--trigger)">Tech Essentials: Tracking →</a> video. Pause at the 20% rule to physically demonstrate with a tracker ball.</li>
<li>Do not over-explain passive tracking theory — the build block that follows teaches it through doing.</li>
</ul>
<h4 style="font-size:13px;font-weight:700;color:var(--hb);margin:16px 0 4px">Build All Store Trackers (Assembly Line)</h4>
<ul>
<li>Brief roles before touching anything. See the <strong>Tracker Building Assembly Line</strong> article for full facilitation steps.</li>
<li>Every trainee must build at least one complete tracker independently before you sign off on that competency.</li>
<li>Use Validators (SM/Lead) to quality-check and confirm MoCap visibility in Vicon Evoke.</li>
</ul>
<div class="science-callout"><div class="science-callout-label">End of Day 1 Check</div><div class="science-callout-text">Before closing: confirm all trainees have completed the Guest Journey eLearning in Delightree. Trackers should be fully built, validated, and confirmed in MoCap. Note any trainee who seemed disengaged or struggled — follow up at the start of Day 2.</div></div>`
    },
    {
      id: 'daily-day2',
      title: 'Day 2 Facilitation Guide',
      category: 'Daily Facilitation',
      eyebrow: 'DAILY FACILITATION',
      subtitle: 'Infrastructure, hardware, and technology — from Checkfront to Props.',
      content: `<h3>Day 2 Purpose</h3>
<p>Day 2 is technology-heavy. By end of day, every trainee should be able to book a session in Checkfront, pair a vest, pair props, reset wireless streaming, and navigate holodeck room servers without prompting. Speed comes later — confidence comes today.</p>
<h3>Agenda at a Glance</h3>
<ul>
<li><strong>60 min</strong> — Checkfront &amp; Silica (software practice)</li>
<li><strong>60 min</strong> — How to Sell Sandbox VR (Repeatability)</li>
<li><strong>30 min</strong> — Tech Essentials: Holodeck Room Servers (video)</li>
<li><strong>30 min</strong> — Procedure Checklist: Holodeck Room Servers</li>
<li><strong>30 min</strong> — Break</li>
<li><strong>30 min</strong> — Tech Essentials: Wireless Streaming (video)</li>
<li><strong>60 min</strong> — Procedure Checklist: Wireless Streaming (hands-on)</li>
<li><strong>30 min</strong> — Tech Essentials: Haptic Vests (video + pairing practice)</li>
<li><strong>30 min</strong> — Tech Essentials: Props (video + pairing practice)</li>
</ul>
<h3>Block-by-Block Coaching Notes</h3>
<h4 style="font-size:13px;font-weight:700;color:var(--hb);margin:16px 0 4px">Checkfront &amp; Silica</h4>
<ul>
<li>Confidence comes from repetition, not explanation. Get trainees into the software immediately.</li>
<li>Each trainee completes a full practice booking and check-in in Checkfront independently. Watch — do not coach until they finish their attempt.</li>
<li>Silica: walk through session setup, health check colors, and QR code display as a group first, then trainees reproduce it solo.</li>
<li>Reference: <a href="https://app.delightree.com/chapters/view/5qqrqm2ko4ansm272keoq6wx" target="_blank" style="color:var(--trigger)">SOP: Checkfront →</a></li>
</ul>
<h4 style="font-size:13px;font-weight:700;color:var(--hb);margin:16px 0 4px">How to Sell Sandbox VR (Repeatability)</h4>
<ul>
<li>Reframe it before you start: this is not sales, it is offering more of something they are about to love.</li>
<li>Demonstrate all three repeatability moments yourself first: check-in, barracks gear-up, post-experience.</li>
<li>Role-play in rotation. Every trainee goes twice. Give live feedback after each attempt — specific, not general.</li>
</ul>
<h4 style="font-size:13px;font-weight:700;color:var(--hb);margin:16px 0 4px">Holodeck Room Servers</h4>
<ul>
<li>Show <a href="https://app.delightree.com/folders/mj8nedo6jlz7s2q2eoxz378e/j4ne2bb97929086m7p9b8ee6" target="_blank" style="color:var(--trigger)">Technology Essentials: Holodeck Room Servers →</a></li>
<li>Connect server roles to tracker data from Day 1 — EMU takes that data and turns it into the virtual world.</li>
<li>After the video: walk to the server room. Have trainees label each server type before you confirm answers.</li>
</ul>
<h4 style="font-size:13px;font-weight:700;color:var(--hb);margin:16px 0 4px">Wireless Streaming</h4>
<ul>
<li>Show <a href="https://app.delightree.com/folders/mj8nedo6jlz7s2q2eoxz378e/mj8nlao797aos2pnwaze72o2" target="_blank" style="color:var(--trigger)">Tech Essentials: Wireless Streaming →</a></li>
<li>Have trainees draw the wireless signal flow on a whiteboard before touching hardware.</li>
<li>Every trainee completes the full wireless reset procedure independently — at least twice.</li>
</ul>
<h4 style="font-size:13px;font-weight:700;color:var(--hb);margin:16px 0 4px">Haptic Vests</h4>
<ul>
<li>Show <a href="https://app.delightree.com/folders/mj8nedo6jlz7s2q2eoxz378e/6qzp38pwwr9jt7d25doj76pn" target="_blank" style="color:var(--trigger)">Tech Essentials: Haptic Feedback Vests →</a></li>
<li>Vest pairing under time pressure is where new GEGs lose composure. Drill it until it is automatic.</li>
<li>Stations of 3: one pairs, one checks LED state and lock settings, one calls out steps. Rotate.</li>
</ul>
<h4 style="font-size:13px;font-weight:700;color:var(--hb);margin:16px 0 4px">Props</h4>
<ul>
<li>Show <a href="https://app.delightree.com/folders/mj8nedo6jlz7s2q2eoxz378e/4qjepln3zkom1akjnk6354ol" target="_blank" style="color:var(--trigger)">Tech Essentials: Props →</a></li>
<li>Normalize troubleshooting: props do not always pair on the first attempt. That is expected — stay calm.</li>
<li>Each trainee must pair all three prop types and complete the re-pair process.</li>
</ul>
<div class="science-callout"><div class="science-callout-label">End of Day 2 Check</div><div class="science-callout-text">Before closing: every trainee should be able to complete a Checkfront booking, pair a vest, pair props, and reset wireless streaming without prompting. If anyone cannot do all four, assign a catch-up station before Day 3 starts.</div></div>`
    },
    {
      id: 'daily-day3',
      title: 'Day 3 Facilitation Guide',
      category: 'Daily Facilitation',
      eyebrow: 'DAILY FACILITATION',
      subtitle: 'Role-play, review, and store operations — where knowledge becomes execution.',
      content: `<h3>Day 3 Purpose</h3>
<p>Day 3 is where training converts to performance. Trainees stop learning new content and start running the store. Your job shifts from instructor to coach: walk the floor, give live feedback, and let the SM run more of the day independently.</p>
<h3>Agenda at a Glance</h3>
<ul>
<li><strong>60 min</strong> — Opening Procedures (full open)</li>
<li><strong>30 min</strong> — T1 Ticket Workflow</li>
<li><strong>2+ hrs</strong> — Role-Play Block 1: Full Guest Journey</li>
<li><strong>30 min</strong> — Break</li>
<li><strong>2+ hrs</strong> — Role-Play Block 2: Scenarios &amp; Cleaning</li>
<li><strong>60 min</strong> — Closing Procedures</li>
</ul>
<h3>Block-by-Block Coaching Notes</h3>
<h4 style="font-size:13px;font-weight:700;color:var(--hb);margin:16px 0 4px">Opening Procedures</h4>
<ul>
<li>Walk through the <a href="https://app.delightree.com/chapters/view/qn6mmw3r88bbcbnkxl7lmw7p" target="_blank" style="color:var(--trigger)">Opening Checklist →</a> item by item before trainees attempt it.</li>
<li>Each trainee leads the opening sequence for one room from start to finish. Do not step in unless safety is at risk.</li>
<li>Watch for the instinct to rush. Speed comes with experience — completeness comes with habit.</li>
</ul>
<h4 style="font-size:13px;font-weight:700;color:var(--hb);margin:16px 0 4px">T1 Ticket Workflow</h4>
<ul>
<li>Show <a href="https://app.delightree.com/folders/mj8nedo6jlz7s2q2eoxz378e/b5mzxb8z8bazcazar9252zpm" target="_blank" style="color:var(--trigger)">Technology Essentials: T1 Workflow →</a></li>
<li>The 5-minute rule: escalating fast is the professional move, not an admission of failure.</li>
<li>Each trainee submits a practice T1 ticket for a hypothetical issue. Check for: correct info, appropriate tone, timing relative to the 5-minute rule.</li>
</ul>
<h4 style="font-size:13px;font-weight:700;color:var(--hb);margin:16px 0 4px">Role-Play Block 1</h4>
<ul>
<li>Rotate groups of 3 through each station: Host, Barracks GEG, Holodeck GEG.</li>
<li>Coach walks the floor. Give live micro-feedback between runs — not during.</li>
<li>Include at least one recovery scenario per group before the break.</li>
<li>Note: who excels at each touchpoint? Who freezes? Who leads others?</li>
</ul>
<h4 style="font-size:13px;font-weight:700;color:var(--hb);margin:16px 0 4px">Role-Play Block 2</h4>
<ul>
<li>Debrief Block 1 before starting. Call out wins by name. Name specific improvements needed — not general feedback like "be more confident."</li>
<li>Use Block 2 to address gaps from Block 1. Weak vest pairing? Drill vests. Stiff recovery? Run recovery scenarios.</li>
<li>Cleaning and maintenance run alongside role-play — not after.</li>
</ul>
<h4 style="font-size:13px;font-weight:700;color:var(--hb);margin:16px 0 4px">Closing Procedures</h4>
<ul>
<li>Walk through the <a href="https://app.delightree.com/chapters/view/zb4jjqwwm4e60zqd8lpl362r" target="_blank" style="color:var(--trigger)">Closing Checklist →</a> and <a href="https://app.delightree.com/chapters/view/9qxrrw548blphl34935lz7lm" target="_blank" style="color:var(--trigger)">Store Cleaning SOP →</a> before trainees begin.</li>
<li>End with a full close. A team that can open and close cleanly knows what they are doing.</li>
<li>Watch for shortcuts at closing — energy is lowest and this is when habits form.</li>
</ul>
<div class="science-callout"><div class="science-callout-label">End of Day 3 Check</div><div class="science-callout-text">Before leaving: every trainee should have completed a full open and a full close independently. All Delightree completions should be at 100%. Document anyone with outstanding items — Day 4 starts with role-play pressure, and gaps compound fast.</div></div>`
    },
    {
      id: 'daily-recap-check',
      title: 'Daily Recap and Completion Check',
      category: 'Daily Facilitation',
      eyebrow: 'DAILY FACILITATION',
      subtitle: 'How to close each training day correctly.',
      content: `<h3>Why the Daily Recap Matters</h3>
<p>A strong daily recap locks in the day's learning, surfaces what did not land, and sets up the next day. It is your quality control checkpoint. If something was not completed today, it does not become easier to complete tomorrow — it becomes a liability under pressure.</p>
<h3>Closing Checklist — Run This Every Day</h3>
<ol style="padding-left:18px;margin-bottom:12px;font-size:13.5px;color:var(--text-secondary);line-height:1.8">
<li>Ask each group: "What did you practice today? What felt solid? What felt shaky?"</li>
<li>Open Delightree Tracking tab. Check every trainee's completion status for the day's required items.</li>
<li>Anyone below 100% on a required eLearning: assign catch-up time before the next block or first thing tomorrow.</li>
<li>Document any trainee concerns in the portal Daily Recap section.</li>
<li>Escalate missing Delightree access or completion tracking issues to L&amp;D — do not wait.</li>
<li>Preview tomorrow's learning blocks with the team. Tell them what to expect, not what to memorize.</li>
</ol>
<h3>If Completion Tracking Is Not Visible</h3>
<ul>
<li>Contact L&amp;D for access or reporting support before end of day.</li>
<li>Have trainees self-report and screenshot their completion screens in the meantime.</li>
<li>Do not assume completion without evidence.</li>
</ul>
<h3>The Business Connection</h3>
<p>Strong training execution directly protects store performance. This is operational, not abstract.</p>
<ul>
<li><strong>Guest experience</strong> — Trainees who are not confident cause longer gear-up times, awkward interactions, and lower post-experience scores.</li>
<li><strong>Session timing</strong> — Incomplete tech training causes avoidable delays that cascade through the day's bookings.</li>
<li><strong>Repeatability</strong> — A team not trained on the rebooking conversation misses revenue at the most natural moment in the guest journey.</li>
<li><strong>Tech escalations</strong> — Teams not trained on T1 workflow either under-escalate (keeping guests waiting) or over-escalate (unnecessary tickets).</li>
<li><strong>Opening readiness</strong> — The store's first real guest day reflects everything your training program did and did not do. That is the measure.</li>
</ul>`
    }
  ],
  'Group Learning Methods': [
    {
      id: 'method-elearning',
      title: 'Facilitating Group eLearning in Delightree',
      category: 'Group Learning Methods',
      eyebrow: 'GROUP LEARNING',
      subtitle: 'Watch together. Complete individually. Confirm every time.',
      content: `<h3>The Core Rule</h3>
<p>Group viewing and individual completion are not the same thing. Trainees can watch a video together — but each trainee must log into their own Delightree account and reach 100% completion individually. There are no shortcuts here.</p>
<h3>How to Run a Group eLearning Block</h3>
<ol style="padding-left:18px;margin-bottom:12px;font-size:13.5px;color:var(--text-secondary);line-height:1.8">
<li>Open the Delightree learning item on a shared screen or cast to the post-experience TV.</li>
<li>Have every trainee log into their own Delightree account on their device before you start.</li>
<li>Watch the video together. Pause after key moments — gear changes, policy steps, tech procedures — for discussion or live demonstration.</li>
<li>After the video: give trainees 3–5 minutes to individually complete required items in their Delightree account.</li>
<li>Check the Training or Tracking tab to confirm every trainee has reached 100% on required eLearning.</li>
<li>If you cannot see completion tracking, reach out to L&amp;D for access or reporting support immediately.</li>
<li>If a trainee is missing access, notify L&amp;D immediately. Do not close the day without resolving it.</li>
</ol>
<h3>When to Pause the Video</h3>
<ul>
<li>After a step that requires a physical demonstration (e.g. tracker ball inspection).</li>
<li>After a policy or procedure that needs to be discussed in context of this specific store.</li>
<li>When trainees have stopped watching — pause, ask a question, re-engage before continuing.</li>
</ul>
<h3>If a Trainee Cannot Access the Assignment</h3>
<ul>
<li>Have them continue as a group observer and note the issue.</li>
<li>Notify L&amp;D immediately with the trainee's name and the specific assignment.</li>
<li>The trainee must complete the item individually before end of that training day.</li>
</ul>`
    },
    {
      id: 'method-casting',
      title: 'Casting Learning Videos to Post-Experience TVs',
      category: 'Group Learning Methods',
      eyebrow: 'GROUP LEARNING',
      subtitle: 'Use the room. Set up for group viewing without disrupting operations.',
      content: `<h3>When to Use the Post-Experience TVs</h3>
<ul>
<li>For any Delightree eLearning video that benefits from group viewing — tech essentials, guest journey, T1 workflow.</li>
<li>When the group is too large to huddle around a single iPad.</li>
<li>When you want the debrief to happen as a team, not in small clusters.</li>
</ul>
<h3>Setup Steps</h3>
<ol style="padding-left:18px;margin-bottom:12px;font-size:13.5px;color:var(--text-secondary);line-height:1.8">
<li>Confirm the store is not in live Guest operations before using post-experience TVs for training.</li>
<li>Connect your device to the TV using the available input (HDMI, casting, or screen mirroring — varies by store).</li>
<li>Open the Delightree video and verify audio and video before bringing the group in.</li>
<li>Seat trainees so everyone has a clear sightline to the screen.</li>
<li>Remind trainees to have their own Delightree accounts open if completion tracking is required.</li>
</ol>
<h3>Important Reminders</h3>
<ul>
<li>Verify audio and video before the group is assembled — dead audio wastes the block.</li>
<li>If completion tracking is required, trainees must still log in individually on their own devices after watching.</li>
<li>Do not use post-experience TVs while Guests are in the building without manager approval.</li>
</ul>
<div class="science-callout"><div class="science-callout-label">If Tech Fails</div><div class="science-callout-text">If the TV, display, or casting is not working, do not spend more than 5 minutes troubleshooting. Switch to small-group iPad viewing or individual devices and continue. Do not lose the learning block chasing a display issue.</div></div>`
    },
    {
      id: 'method-stations',
      title: 'Facilitating Hands-On Practice Stations',
      category: 'Group Learning Methods',
      eyebrow: 'GROUP LEARNING',
      subtitle: 'Groups of 3–4. Rotate. Validate every person.',
      content: `<h3>The Station Model</h3>
<p>Hands-on skills are not learned by watching. Split trainees into groups of 3–4, assign each group a station, and rotate them through. Every trainee should demonstrate every skill before you sign off on it.</p>
<h3>How to Run Stations</h3>
<ol style="padding-left:18px;margin-bottom:12px;font-size:13.5px;color:var(--text-secondary);line-height:1.8">
<li>Assign groups before the block starts — do not let trainees self-organize.</li>
<li>At each station: one trainee is the <strong>Doer</strong>, one is the <strong>Checker</strong>, one is the <strong>Explainer</strong>.</li>
<li>The Doer performs the task. The Checker watches for errors. The Explainer narrates what is happening and why.</li>
<li>Rotate roles within the group until every person has been the Doer at least once.</li>
<li>Rotate groups through stations on a timed cycle — do not wait for the slowest group to finish.</li>
<li>Coach circulates. Do a table touch at every station each rotation.</li>
</ol>
<h3>Suggested Stations</h3>
<ul>
<li>Tracker building</li>
<li>Prop pairing and troubleshooting</li>
<li>Vest pairing and LED state identification</li>
<li>HTC headset gesture navigation</li>
<li>Entering and quitting Kiosk Mode</li>
<li>Calibration practice</li>
<li>Checkfront booking and check-in flow</li>
<li>Silica session setup</li>
<li>T1 ticket submission practice</li>
<li>Full gear-up / gear-down role play</li>
</ul>
<h3>What Coaches Do While Stations Run</h3>
<ul>
<li>Circulate constantly — do not stay at one station.</li>
<li>Ask validation questions at each stop. See <strong>Coach Table Touches and Validation Questions</strong> for scripts.</li>
<li>Note anyone who cannot complete the task without prompting — they need individual follow-up.</li>
<li>Do not re-lecture the full SOP unless the entire group is missing the same concept. Individual errors get individual coaching.</li>
</ul>
<div class="science-callout"><div class="science-callout-label">Training Science</div><div class="science-callout-text">Interleaved practice — rotating trainees through different tasks rather than drilling one skill all day — feels harder but produces significantly better long-term retention and transfer. Do not be alarmed when trainees seem slower mid-rotation. The struggle is the learning.</div></div>`
    },
    {
      id: 'method-validation',
      title: 'Coach Table Touches and Validation Questions',
      category: 'Group Learning Methods',
      eyebrow: 'GROUP LEARNING',
      subtitle: 'What to watch, what to ask, and what a ready trainee looks like.',
      content: `<h3>How to Use This Article</h3>
<p>Use these questions while circulating during practice stations or role-play. A good answer tells you the trainee has internalized the concept. A shaky answer tells you where to spend the next coaching minute.</p>
<h3>Guest Journey</h3>
<ul>
<li>"What should happen in the first 5 minutes after Guests arrive?"</li>
<li>"Where does timing usually break down during gear-up?"</li>
<li>"What do you say if a Guest needs help during the experience?"</li>
<li>"How do you make the post-experience feel intentional instead of rushed?"</li>
</ul>
<p><strong>Ready when:</strong> Trainee can describe all four touchpoints and name a specific action at each. Stumbling on post-experience is common — that is where most coaching time is needed.</p>
<h3>Repeatability</h3>
<ul>
<li>"What are the three moments to offer a repeat experience?"</li>
<li>"How would you offer it without sounding pushy?"</li>
<li>"What would you say to a group that loved it but seems ready to leave?"</li>
</ul>
<p><strong>Ready when:</strong> Trainee can demonstrate the re-booking conversation naturally at any of the three moments without it sounding scripted.</p>
<h3>Trackers</h3>
<ul>
<li>"How do you know this tracker is built correctly?"</li>
<li>"What are you checking before it goes into use?"</li>
<li>"What do you do if a tracker looks wrong in the experience?"</li>
<li>"When do you escalate versus inspect first?"</li>
</ul>
<p><strong>Ready when:</strong> Trainee physically inspects the tracker (ball condition, pin count, tightness) without being asked, and can describe troubleshooting order correctly.</p>
<h3>Haptic Vests</h3>
<ul>
<li>"What does solid blue mean?"</li>
<li>"What does flashing blue mean?"</li>
<li>"How do you confirm lock settings are correct?"</li>
<li>"What cleaning step can damage the vest if done incorrectly?"</li>
</ul>
<p><strong>Ready when:</strong> Trainee can pair a vest without notes, and correctly identify LED states on demand.</p>
<h3>Props</h3>
<ul>
<li>"What is the difference between prop pairing and prop tracking?"</li>
<li>"What should happen when you pull the trigger after assigning the room?"</li>
<li>"What do you do immediately after a prop swap?"</li>
</ul>
<p><strong>Ready when:</strong> Trainee can pair all three prop types and complete a re-pair without hesitation.</p>
<h3>HTC / Kiosk Mode</h3>
<ul>
<li>"Show me how to navigate using gestures."</li>
<li>"Show me how to quit Kiosk Mode."</li>
<li>"Show me how to re-enter Kiosk Mode."</li>
<li>"What should you avoid pressing or changing?"</li>
</ul>
<p><strong>Ready when:</strong> Trainee demonstrates gesture navigation fluently and can enter/exit Kiosk Mode without prompting.</p>
<h3>Calibration</h3>
<ul>
<li>"What order do the calibration steps happen in?"</li>
<li>"When should strobes be on versus off?"</li>
<li>"What calibration number is acceptable?"</li>
<li>"What do you do if one camera is above the threshold?"</li>
</ul>
<p><strong>Ready when:</strong> Trainee can complete the full calibration sequence for one room independently.</p>
<h3>Checkfront</h3>
<ul>
<li>"How do you find today's bookings?"</li>
<li>"How do you confirm the balance is paid?"</li>
<li>"How do you check whether waivers are complete?"</li>
<li>"How do you handle a walk-in?"</li>
</ul>
<p><strong>Ready when:</strong> Trainee completes a full booking and check-in workflow without asking for help.</p>
<h3>Silica</h3>
<ul>
<li>"How do you create a session?"</li>
<li>"What do the health check colors mean?"</li>
<li>"Where does the QR code display?"</li>
<li>"What do you do if a player status stays red, orange, or yellow?"</li>
</ul>
<p><strong>Ready when:</strong> Trainee can create and launch a session in Silica without prompting.</p>
<h3>T1 Workflow</h3>
<ul>
<li>"When do you stop troubleshooting and escalate?"</li>
<li>"What information does T1 need in the ticket?"</li>
<li>"What should you tell Guests while you are waiting?"</li>
<li>"Where should follow-up communication happen?"</li>
</ul>
<p><strong>Ready when:</strong> Trainee states the 5-minute rule correctly and can write a clear, complete T1 ticket from a hypothetical scenario.</p>`
    }
  ],
  'NSO Training Activities': [
    {
      id: 'nso-assembly-line',
      title: 'Tracker Building Assembly Line',
      category: 'NSO Training Activities',
      eyebrow: 'NSO TRAINING',
      subtitle: 'How to run the line — not tracker theory. That lives in Delightree.',
      content: `<h3>Before You Start</h3>
<p>Review <a href="https://app.delightree.com/folders/mj8nedo6jlz7s2q2eoxz378e/lznpb9bl5kmz149zr93xpwl2" target="_blank" style="color:var(--trigger)">Tech Essentials: Tracking →</a> with the group before touching supplies. The assembly line assumes trainees understand what trackers are and why build quality matters.</p>
<h3>Stage Supplies Before Briefing</h3>
<ul>
<li>Count and sort tracker bases, balls, pins, screws, silicone straps, and mounts by type before trainees enter.</li>
<li>Print or display the quantity list the Sticker Captain will use.</li>
<li>Lay out screwdrivers, the tracker build chart, and screw sizing reference at the Screwdriver station.</li>
<li>Set aside a completed sample tracker at each station as a visual reference.</li>
</ul>
<h3>Roles</h3>
<ul>
<li><strong>Sticker Captain (1–2 people)</strong> — Places stickers on bases. Manages the quantity list. Ensures builders repeat the same build until their count is done. Controls the pace of the whole line.</li>
<li><strong>Builder Team (3–5 people)</strong> — Hand-tightens pins to the correct position. Each builder repeats one tracker type. Receives pre-stickered bases, passes completed bases forward.</li>
<li><strong>Screwdriver Team (3–5 people)</strong> — Secures tracker balls to pins and screws bases into mounts. Limb trackers use 4x8 screws, not 4x6.</li>
<li><strong>Silicone Strap / Mount Team (2–4 people)</strong> — Threads silicone straps, secures weapon mounts, slides HMD mounts onto headsets. End of the line — their output is a finished tracker.</li>
<li><strong>Validators (SM / Leads)</strong> — Do not build. Test tightness of every tracker. Place in holodeck and confirm MoCap visibility in Vicon Evoke. Flag anything that fails for rebuild.</li>
</ul>
<h3>Preventing Bottlenecks</h3>
<ul>
<li>Screwdriver Team typically needs the most people — assign extra here if the line backs up.</li>
<li>If the Sticker Captain falls behind, the whole line stalls — give them a second person early.</li>
<li>If Silicone Strap/Mount Team is idle between batches, they can assist the Screwdriver Team.</li>
</ul>
<h3>Quality Control</h3>
<ul>
<li>Validators check every tracker — not a sample. A tracker that fails in the holodeck disrupts a guest session.</li>
<li>Common errors: loose pins, wrong screw size, incorrect sticker placement, silicone strap threaded backward.</li>
<li>If the same error appears repeatedly at one station, pause the line, address the whole station, then restart.</li>
</ul>
<h3>Debrief When Done</h3>
<ul>
<li>"What errors came up most often? What caused them?"</li>
<li>"Which role was hardest? Which was easiest? Why?"</li>
<li>"What would you do differently if you ran this line again?"</li>
</ul>
<div class="science-callout"><div class="science-callout-label">Coach Note</div><div class="science-callout-text">Every trainee must build at least one complete tracker independently before you sign off on this competency — not just rotate through a station. The assembly line builds speed. Individual completion builds accountability. Both are required.</div></div>`
    }
  ]
  /* Reference category (Source Links) moved to Resources page */
  /* 'Reference': [
    {
      id: 'ref-guest',
      title: 'Guest Journey, Sales &amp; Policies: Source Links',
      category: 'Reference',
      eyebrow: 'REFERENCE ONLY',
      subtitle: 'Procedural detail lives in Delightree and the Learning Plan. Link out — do not duplicate.',
      content: `<h3>Guest Journey</h3>
<p>The full Guest Journey curriculum — touchpoints, scripts, role responsibilities, and Guest Recovery model — lives in Delightree. Use the portal's Day 1 Facilitation Guide to run the block. Use this link for the source material.</p>
<ul>
<li><a href="https://app.delightree.com/folders/lznpb993j5p5il58l625pde9" target="_blank" style="color:var(--trigger)">Service Essentials: Guest Journey →</a></li>
<li><a href="http://sandboxvr.com" target="_blank" style="color:var(--trigger)">Sandbox VR Website →</a> — Brand story and experience overview.</li>
</ul>
<h3>Sales &amp; KPIs</h3>
<p>Repeatability and KPI content is covered in the Day 2 sales block. Facilitation notes are in the Day 2 Facilitation Guide. There is no separate source link — the script lives in the Learning Plan.</p>
<h3>Policies &amp; Procedures</h3>
<p>Guest policies (late arrivals, waivers, cancellations, refunds, grace period) are covered in Day 1. The standard reference is Learning Plan pages 14–20. Facilitate using scenarios, not by reading the list.</p>`
    },
    {
      id: 'ref-tech',
      title: 'Technology: Source Links',
      category: 'Reference',
      eyebrow: 'REFERENCE ONLY',
      subtitle: 'Detailed tech SOPs live in Delightree. Link out — do not duplicate.',
      content: `<h3>Tracking</h3>
<ul>
<li><a href="https://app.delightree.com/folders/mj8nedo6jlz7s2q2eoxz378e/lznpb9bl5kmz149zr93xpwl2" target="_blank" style="color:var(--trigger)">Tech Essentials: Tracking →</a> — Build specs, 20% rule, asset numbers, troubleshooting order.</li>
<li><a href="https://app.delightree.com/chapters/view/o9ozzbz7nnxx0xkd87bxqll4" target="_blank" style="color:var(--trigger)">Calibration SOP →</a></li>
</ul>
<h3>Vests &amp; Props</h3>
<ul>
<li><a href="https://app.delightree.com/folders/mj8nedo6jlz7s2q2eoxz378e/6qzp38pwwr9jt7d25doj76pn" target="_blank" style="color:var(--trigger)">Tech Essentials: Haptic Feedback Vests →</a></li>
<li><a href="https://app.delightree.com/chapters/view/2l9eep69x5jj0ezo58l8zx6m" target="_blank" style="color:var(--trigger)">Quick Reference Guide: Haptic Feedback Vests →</a></li>
<li><a href="https://app.delightree.com/folders/mj8nedo6jlz7s2q2eoxz378e/4qjepln3zkom1akjnk6354ol" target="_blank" style="color:var(--trigger)">Tech Essentials: Props →</a></li>
</ul>
<h3>Infrastructure</h3>
<ul>
<li><a href="https://app.delightree.com/folders/mj8nedo6jlz7s2q2eoxz378e/j4ne2bb97929086m7p9b8ee6" target="_blank" style="color:var(--trigger)">Technology Essentials: Holodeck Room Servers →</a></li>
<li><a href="https://app.delightree.com/folders/mj8nedo6jlz7s2q2eoxz378e/mj8nlao797aos2pnwaze72o2" target="_blank" style="color:var(--trigger)">Tech Essentials: Wireless Streaming →</a></li>
<li><a href="https://app.delightree.com/folders/mj8nedo6jlz7s2q2eoxz378e/b5mzxb8z8bazcazar9252zpm" target="_blank" style="color:var(--trigger)">Technology Essentials: T1 Workflow →</a></li>
</ul>`
    },
    {
      id: 'ref-systems',
      title: 'Systems &amp; Operations: Source Links',
      category: 'Reference',
      eyebrow: 'REFERENCE ONLY',
      subtitle: 'Systems and operations SOPs live in Delightree.',
      content: `<h3>Software</h3>
<ul>
<li><a href="https://app.delightree.com/chapters/view/5qqrqm2ko4ansm272keoq6wx" target="_blank" style="color:var(--trigger)">SOP: Checkfront →</a> — Bookings, check-in, walk-ins, daily manifest.</li>
</ul>
<h3>Store Operations</h3>
<ul>
<li><a href="https://app.delightree.com/chapters/view/qn6mmw3r88bbcbnkxl7lmw7p" target="_blank" style="color:var(--trigger)">Opening Checklist →</a></li>
<li><a href="https://app.delightree.com/chapters/view/zb4jjqwwm4e60zqd8lpl362r" target="_blank" style="color:var(--trigger)">Closing Checklist →</a></li>
<li><a href="https://app.delightree.com/chapters/view/9qxrrw548blphl34935lz7lm" target="_blank" style="color:var(--trigger)">Store Cleaning SOP →</a></li>
<li><a href="https://app.delightree.com/chapters/view/pzxaaen5x6d4u6xj5838bpnd" target="_blank" style="color:var(--trigger)">Restroom Cleaning Checklist →</a></li>
</ul>`
    }
  ] */
};

// ============================================================
// NAVIGATION
// ============================================================
function navigate(view) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const el = document.getElementById('view-' + view);
  if (el) el.classList.add('active');

  const titles = {
    dashboard: 'Dashboard',
    team: 'Team Roster',
    schedule: 'Daily Agenda',
    competencies: 'Competency Tracker',
    recap: 'Daily Recap',
    knowledge: 'Facilitation Guidance',
    franchise: 'Day 0 Checks',
    franchisee: 'Day 4 – Franchise Partner Review',
    leadership: 'Leadership Lens',
    admin: 'All Openings',
    scorecards: 'Store Scorecards',
    videos: 'Training Videos',
    osc: 'Post-Opening OSC Report',
    resources: 'Resources',
    programs: 'Program Launcher',
    'leadership-training': 'Leadership Training'
  };
  document.getElementById('topbarTitle').textContent = titles[view] || view;
  state.currentView = view;

  const navIdMap = {
    dashboard: 'nav-dashboard',
    team: 'nav-roster',
    schedule: 'nav-schedule',
    competencies: 'nav-competencies',
    recap: 'nav-recap',
    knowledge: 'nav-kb',
    franchise: 'nav-franchise',
    franchisee: 'nav-franchisee',
    leadership: 'nav-leadership',
    admin: 'nav-admin',
    videos: 'nav-videos',
    osc: 'nav-osc',
    resources: 'nav-resources',
    programs: 'nav-programs',
    scorecards: 'nav-scorecards',
    'leadership-training': 'nav-leadership-training'
  };
  const navEl = document.getElementById(navIdMap[view]);
  if (navEl) navEl.classList.add('active');

  if (view === 'schedule') renderAgenda(state.currentAgendaDay);
  if (view === 'competencies') renderCompetencyTable(state.currentCompDay);
  if (view === 'knowledge') renderKBNav();
  if (view === 'team') renderTeamRoster();
  if (view === 'recap') loadRecapFields(state.currentRecapDay);
  if (view === 'franchise') renderFranchiseChecks();
  if (view === 'franchisee') renderFranchisePartnerReview();
  if (view === 'leadership') renderLeadershipLens();
  if (view === 'admin') renderAdminPage();
  if (view === 'scorecards') renderScorecards();
  if (view === 'videos') renderVideosPage();
  if (view === 'osc') loadOSCReportFields();
  if (view === 'resources') renderResourcesPage();
  if (view === 'leadership-training') renderLeadershipTrainingPage();

  // Update browser history so Back button works inside the portal
  if (history.state?.view !== view) {
    history.pushState({ view }, '', '#' + view);
  }

  // Close mobile sidebar when navigating
  closeSidebar();
}

// ============================================================
// MOBILE SIDEBAR TOGGLE
// ============================================================
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.querySelector('.sidebar-overlay');
  const isOpen = sidebar.classList.contains('open');
  if (isOpen) {
    closeSidebar();
  } else {
    sidebar.classList.add('open');
    overlay.classList.add('open');
  }
}

function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.querySelector('.sidebar-overlay');
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
}

// ============================================================
// DAY SELECTION
// ============================================================
function selectDay(day) {
  state.currentDay = day;
  document.querySelectorAll('.day-card[id^="daycard-"]').forEach((c, i) => {
    c.classList.remove('active');
  });
  const dc = document.getElementById('daycard-' + day);
  if (dc) dc.classList.add('active');

  updateDayPips();
  updateDashboardFocus();
  updateTopbarDayLabel();
  dbUpdateCurrentDay(); // persist to Supabase
}

function advanceDay(delta) {
  const newDay = Math.min(5, Math.max(1, state.currentDay + delta));
  if (newDay !== state.currentDay) selectDay(newDay);
}

function selectDayAgenda(day) {
  state.currentAgendaDay = day;
  document.querySelectorAll('.day-card[id^="agendacard-"]').forEach(c => c.classList.remove('active'));
  const ac = document.getElementById('agendacard-' + day);
  if (ac) ac.classList.add('active');
  renderAgenda(day);
}

function updateTopbarDayLabel() {
  const dayNames = ['', 'Day 1 — Fri', 'Day 2 — Sat', 'Day 3 — Sun', 'Day 4 — Mon', 'Day 5 — Tue'];
  const el = document.getElementById('topbarDayLabel');
  if (el) el.textContent = state.opening ? dayNames[state.currentDay] : '';
}

function updateDayPips() {
  document.querySelectorAll('.day-pip').forEach((pip, i) => {
    const d = i + 1;
    pip.classList.remove('completed', 'active');
    if (d < state.currentDay) pip.classList.add('completed');
    else if (d === state.currentDay) pip.classList.add('active');
  });
}

// ============================================================
// AGENDA RENDERING
// ============================================================
function renderAgenda(dayNum) {
  var day = DAYS[dayNum - 1];
  var container = document.getElementById('agendaContent');
  if (!container) return;

  var badgeColor = day.type === 'Learning Plan' ? 'blue' : day.type === 'Roleplay Day' ? 'amber' : 'green';
  var html = '<div class="card mb-20"><div class="card-header"><div>' +
    '<div class="card-title">Day ' + day.num + ': ' + day.title + '</div>' +
    '<div class="card-subtitle">' + day.type + ' &middot; ' + day.focus + '</div>' +
    '</div><span class="badge badge-' + badgeColor + '">' + (day.typeLink ? '<a href="' + day.typeLink + '" target="_blank" style="color:inherit;text-decoration:none">' + day.type + ' ↗</a>' : day.type) + '</span></div></div>';

  day.blocks.forEach(function(block, idx) {
    var blockId = 'block-' + dayNum + '-' + idx;
    var contentId = 'day' + dayNum + '-block' + idx;

    if (block.title === 'Break') {
      html += '<div style="display:flex;align-items:center;gap:14px;padding:12px 16px;margin-bottom:12px;background:var(--surface);border-radius:var(--radius-md);border:1px solid var(--border-light)">' +
        '<span class="agenda-time-pill">' + block.time + '</span>' +
        '<span style="font-size:13px;font-weight:600;color:var(--text-muted)">&mdash; Break &mdash;</span></div>';
      return;
    }

    var objStr = getContent('agenda', contentId, 'objectives', null);
    var objectives = objStr ? JSON.parse(objStr) : block.objectives;
    var resStr = getContent('agenda', contentId, 'resources', null);
    var resources = resStr ? JSON.parse(resStr) : block.resources;
    var tip = getContent('agenda', contentId, 'tip', block.tip);
    var say = getContent('agenda', contentId, 'say', block.say);
    var see = getContent('agenda', contentId, 'see', block.see);
    var doText = getContent('agenda', contentId, 'doText', block.doText);

    var objCount = objectives.length;
    var objsHtml = objectives.map(function(o) {
      return '<div class="objective-item"><div class="objective-dot"></div><span>' + o + '</span></div>';
    }).join('');

    var resHtml = '';
    if (resources.length > 0) {
      resHtml = '<div style="margin-bottom:16px"><div class="objectives-label">Resources</div>' +
        resources.map(function(r) {
          return '<div class="objective-item"><div class="objective-dot" style="background:var(--warp)"></div><span style="color:var(--borg)">' + r + '</span></div>';
        }).join('') + '</div>';
    }

    var editBtn = canEdit() ? '<button onclick="event.stopPropagation();openAgendaEditor(' + dayNum + ',' + idx + ')" style="margin-left:auto;font-size:10px;font-weight:600;padding:3px 10px;border-radius:20px;border:1px solid var(--trigger);color:var(--trigger);background:transparent;cursor:pointer;white-space:nowrap">✏ Edit</button>' : '';

    var coachHtml = '';
    if (tip) {
      coachHtml = '<div class="coach-tip"><div class="coach-tip-label">Coach Guidance</div>' +
        '<div class="coach-tip-text">' + tip + '</div></div>' +
        '<div class="say-see-do">' +
        '<div class="ssd-block"><div class="ssd-label say">SAY</div><div class="ssd-text">' + (say || '') + '</div></div>' +
        '<div class="ssd-block"><div class="ssd-label see">SEE</div><div class="ssd-text">' + (see || '') + '</div></div>' +
        '<div class="ssd-block"><div class="ssd-label do">DO</div><div class="ssd-text">' + (doText || '') + '</div></div>' +
        '</div>';
    }

    html += '<div class="agenda-block">' +
      '<div class="agenda-block-header" id="header-' + blockId + '" onclick="toggleAgendaBlock(\'' + blockId + '\')" style="display:flex;align-items:center;gap:10px">' +
      '<span class="agenda-time-pill">' + block.time + '</span>' +
      '<span class="agenda-block-title">' + block.title + '</span>' +
      '<span class="agenda-block-duration">' + objCount + ' objective' + (objCount !== 1 ? 's' : '') + '</span>' +
      editBtn +
      '<svg class="agenda-block-chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 6l4 4 4-4"/></svg>' +
      '</div>' +
      '<div class="agenda-block-body" id="body-' + blockId + '">' +
      '<div class="objectives-list"><div class="objectives-label">Learning Objectives</div>' + objsHtml + '</div>' +
      resHtml +
      coachHtml +
      '</div></div>';
  });

  container.innerHTML = html;
}

function toggleAgendaBlock(blockId) {
  const header = document.getElementById('header-' + blockId);
  const body = document.getElementById('body-' + blockId);
  const isOpen = body.classList.contains('open');
  body.classList.toggle('open', !isOpen);
  header.classList.toggle('expanded', !isOpen);
}

// ============================================================
// COMPETENCY TRACKER
// ============================================================
function selectCompDay(day) {
  state.currentCompDay = day;
  document.querySelectorAll('#competencyDayTabs .tab').forEach((t, i) => {
    t.classList.toggle('active', i === day - 1);
  });

  const descs = [
    'Guest Experience & Orientation',
    'Service, Sales & Technology',
    'Role-Play & Store Operations',
    'Full Guest Journey Roleplay',
    'Friends & Family Day'
  ];
  document.getElementById('compDayTitle').textContent = 'Day ' + day + ' Competencies';
  document.getElementById('compDayDesc').textContent = descs[day - 1];
  renderCompetencyTable(day);
}

function renderCompetencyTable(day) {
  const comps = COMPETENCIES.filter(c => c.day === day);
  const container = document.getElementById('competencyTableWrap');
  if (!container) return;

  if (state.trainees.length === 0) {
    container.innerHTML = `<div class="empty-state"><svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="20" cy="14" r="7"/><path d="M6 36a14 14 0 0128 0"/></svg><div style="font-weight:600;color:var(--text-secondary)">Add trainees first</div><div style="font-size:12px">Go to Team Roster to add your team</div><button class="btn btn-primary" style="margin-top:12px" onclick="navigate('team')">Add Trainees</button></div>`;
    updateCompProgress(day);
    return;
  }

  let html = `<table class="roster-table">
    <thead>
      <tr>
        <th style="width:160px">Trainee</th>
        <th style="width:80px">Role</th>
        <th style="width:90px;text-align:center">Attendance
  <button onclick="markAllAttendance(${day})" style="display:block;margin:4px auto 0;font-size:10px;font-weight:600;padding:2px 6px;border-radius:10px;border:1px solid var(--border);background:transparent;color:var(--text-muted);cursor:pointer;white-space:nowrap" title="Mark all trainees present for Day ${day}">✓ All</button>
</th>
        ${comps.map(c => `<th class="competency-col">
  <div>${c.name}</div>
  <div style="display:flex;gap:4px;justify-content:center;margin-top:4px">
    <button onclick="markCompAllDemonstrated('${c.id}', ${day})" style="font-size:10px;font-weight:600;padding:2px 6px;border-radius:10px;border:1px solid var(--border);background:transparent;color:var(--text-muted);cursor:pointer;white-space:nowrap" title="Mark all as demonstrated">✓ All</button>
    <button onclick="clearCompSignoffs('${c.id}', ${day})" style="font-size:10px;font-weight:600;padding:2px 6px;border-radius:10px;border:1px solid var(--danger);background:transparent;color:var(--danger);cursor:pointer;white-space:nowrap" title="Clear all sign-offs for this competency">✕</button>
  </div>
</th>`).join('')}
        <th style="text-align:center;width:80px">Progress</th>
      </tr>
    </thead>
    <tbody>`;

  state.trainees.forEach(trainee => {
    const isLeader = trainee.role === 'SM' || trainee.role === 'ASM';
    const traineeComps = comps.map(c => {
      // Leadership-only comps are N/A for GEG trainees
      if (c.smOnly && !isLeader) {
        return `<td class="competency-cell">
          <span style="font-size:10px;font-weight:600;color:var(--text-muted);letter-spacing:0.05em">N/A</span>
        </td>`;
      }
      const key = trainee.id + '_' + c.id;
      const status = state.signoffs[key] || 'pending';
      const icons = { pending: '', signed: '✓', 'needs-work': '~', 'not-met': '✕' };
      return `<td class="competency-cell">
        <button class="signoff-btn ${status !== 'pending' ? status : ''}"
          onclick="openContextMenu(event, '${trainee.id}', '${c.id}')">${icons[status]}</button>
      </td>`;
    });

    // Exclude smOnly comps from GEG progress (they're N/A)
    const applicableComps = comps.filter(c => !c.smOnly || isLeader);
    const signedCount = applicableComps.filter(c => state.signoffs[trainee.id + '_' + c.id] === 'signed').length;
    const pct = applicableComps.length > 0 ? Math.round((signedCount / applicableComps.length) * 100) : 0;

    html += `<tr>
      <td><div class="trainee-name">${trainee.name}</div></td>
      <td><span class="badge badge-gray" style="font-size:10px">${trainee.role}</span></td>
      <td style="text-align:center">
        <div style="display:flex;gap:4px;justify-content:center">
          <button onclick="toggleAttendance('${trainee.id}', ${day}, 'signed')"
            style="font-size:11px;font-weight:700;padding:3px 8px;border-radius:20px;border:1px solid ${state.signoffs[trainee.id + '_attendance-d' + day] === 'signed' ? 'var(--success)' : 'var(--border)'};background:${state.signoffs[trainee.id + '_attendance-d' + day] === 'signed' ? 'var(--success)' : 'transparent'};color:${state.signoffs[trainee.id + '_attendance-d' + day] === 'signed' ? '#fff' : 'var(--text-muted)'};cursor:pointer;transition:all 0.15s">Y</button>
          <button onclick="toggleAttendance('${trainee.id}', ${day}, 'not-met')"
            style="font-size:11px;font-weight:700;padding:3px 8px;border-radius:20px;border:1px solid ${state.signoffs[trainee.id + '_attendance-d' + day] === 'not-met' ? 'var(--danger)' : 'var(--border)'};background:${state.signoffs[trainee.id + '_attendance-d' + day] === 'not-met' ? 'var(--danger)' : 'transparent'};color:${state.signoffs[trainee.id + '_attendance-d' + day] === 'not-met' ? '#fff' : 'var(--text-muted)'};cursor:pointer;transition:all 0.15s">N</button>
        </div>
      </td>
      ${traineeComps.join('')}
      <td style="text-align:center">
        <div style="font-size:11px;font-weight:600;color:${pct === 100 ? 'var(--success)' : 'var(--text-secondary)'}; margin-bottom:4px">${pct}%</div>
        <div class="progress-bar-wrap" style="width:60px;margin:0 auto">
          <div class="progress-bar-fill ${pct === 100 ? 'green' : 'blue'}" style="width:${pct}%"></div>
        </div>
        <div style="display:flex;gap:4px;justify-content:center;margin-top:6px">
          <button onclick="markTraineeAllDemonstrated('${trainee.id}', ${day})" style="font-size:10px;font-weight:600;padding:2px 7px;border-radius:10px;border:1px solid var(--border);background:transparent;color:var(--text-muted);cursor:pointer;white-space:nowrap" title="Mark all as demonstrated">✓ All</button>
          <button onclick="clearTraineeSignoffs('${trainee.id}')" style="font-size:10px;font-weight:600;padding:2px 7px;border-radius:10px;border:1px solid var(--danger);background:transparent;color:var(--danger);cursor:pointer;white-space:nowrap" title="Clear all sign-offs for this trainee">✕</button>
        </div>
      </td>
    </tr>`;
  });

  html += '</tbody></table>';
  container.innerHTML = html;
  updateCompProgress(day);
}

function markAllAttendance(day) {
  state.trainees.forEach(function(trainee) {
    const key = trainee.id + '_attendance-d' + day;
    state.signoffs[key] = 'signed';
    dbSaveSignoff(trainee.id, 'attendance-d' + day, 'signed');
  });
  renderCompetencyTable(day);
}

function toggleAttendance(traineeId, day, newStatus) {
  const key = traineeId + '_attendance-d' + day;
  const current = state.signoffs[key];
  // Clicking the same button again clears it
  if (current === newStatus) {
    delete state.signoffs[key];
    dbSaveSignoff(traineeId, 'attendance-d' + day, 'pending');
  } else {
    state.signoffs[key] = newStatus;
    dbSaveSignoff(traineeId, 'attendance-d' + day, newStatus);
  }
  renderCompetencyTable(day);
}

function markCompAllDemonstrated(compId, day) {
  if (!confirm('Mark ALL trainees as Demonstrated for this competency?')) return;
  state.trainees.forEach(function(trainee) {
    var isLeader = trainee.role === 'SM' || trainee.role === 'ASM';
    var comp = COMPETENCIES.find(function(c){ return c.id === compId; });
    if (comp && comp.smOnly && !isLeader) return; // skip N/A cells
    var key = trainee.id + '_' + compId;
    state.signoffs[key] = 'signed';
    dbSaveSignoff(trainee.id, compId, 'signed');
  });
  renderCompetencyTable(day);
  updateDashboardStats();
  showToast('All trainees marked as Demonstrated', 'success');
}

function markTraineeAllDemonstrated(traineeId, day) {
  if (!confirm('Mark ALL competencies as Demonstrated for this trainee today?')) return;
  var trainee = state.trainees.find(function(t){ return t.id === traineeId; });
  var isLeader = trainee && (trainee.role === 'SM' || trainee.role === 'ASM');
  var dayComps = COMPETENCIES.filter(function(c){ return c.day === day; });
  dayComps.forEach(function(comp) {
    if (comp.smOnly && !isLeader) return; // skip N/A cells
    var key = traineeId + '_' + comp.id;
    state.signoffs[key] = 'signed';
    dbSaveSignoff(traineeId, comp.id, 'signed');
  });
  renderCompetencyTable(day);
  updateDashboardStats();
  showToast('All competencies marked as Demonstrated', 'success');
}

// ─── CLEAR FUNCTIONS ────────────────────────────────────────────────────────

async function clearRecapDay() {
  var day = state.currentRecapDay;
  if (!confirm('Clear all recap fields for Day ' + day + '? This cannot be undone.')) return;
  state.recaps[day] = {};
  loadRecapFields(day); // resets all form fields and preview
  const err = await dbSaveRecap(day);
  if (err) { showToast('Clear failed: ' + (err.message || 'DB error'), 'error'); return; }
  showToast('Day ' + day + ' recap cleared.', 'info');
}

async function clearTraineeSignoffs(traineeId) {
  var day = state.currentCompDay;
  var trainee = state.trainees.find(function(t){ return t.id === traineeId; });
  var name = trainee ? trainee.name : 'this trainee';
  if (!confirm('Clear all Day ' + day + ' sign-offs for ' + name + '?')) return;
  var dayComps = COMPETENCIES.filter(function(c){ return c.day === day; });
  // Clear from state
  dayComps.forEach(function(c){ delete state.signoffs[traineeId + '_' + c.id]; });
  delete state.signoffs[traineeId + '_attendance-d' + day];
  // Clear from DB in parallel
  var promises = dayComps.map(function(c){ return dbSaveSignoff(traineeId, c.id, 'pending'); });
  promises.push(dbSaveSignoff(traineeId, 'attendance-d' + day, 'pending'));
  await Promise.all(promises);
  renderCompetencyTable(day);
  updateDashboardStats();
  showToast(name + '\'s sign-offs cleared.', 'info');
}

async function clearCompSignoffs(compId, day) {
  var comp = COMPETENCIES.find(function(c){ return c.id === compId; });
  var compName = comp ? comp.name : compId;
  if (!confirm('Clear "' + compName + '" sign-offs for all trainees?')) return;
  // Clear from state
  state.trainees.forEach(function(t){ delete state.signoffs[t.id + '_' + compId]; });
  // Clear from DB in parallel
  await Promise.all(state.trainees.map(function(t){ return dbSaveSignoff(t.id, compId, 'pending'); }));
  renderCompetencyTable(day);
  updateDashboardStats();
  showToast('"' + compName + '" sign-offs cleared.', 'info');
}

function updateCompProgress(day) {
  const comps = COMPETENCIES.filter(c => c.day === day);
  // Count only applicable sign-offs (exclude N/A cells for GEG trainees)
  let total = 0;
  let signed = 0;
  state.trainees.forEach(trainee => {
    const isLeader = trainee.role === 'SM' || trainee.role === 'ASM';
    comps.forEach(c => {
      if (c.smOnly && !isLeader) return; // N/A — skip
      total++;
      if (state.signoffs[trainee.id + '_' + c.id] === 'signed') signed++;
    });
  });

  document.getElementById('compSignedCount').textContent = signed;
  document.getElementById('compTotalCount').textContent = total;
  const pct = total > 0 ? Math.round((signed / total) * 100) : 0;
  document.getElementById('compProgressBar').style.width = pct + '%';

  // Update all signoffs badge
  const allTotal = COMPETENCIES.length * state.trainees.length;
  const allSigned = Object.entries(state.signoffs).filter(([k, v]) => v === 'signed' && !k.includes('_attendance-')).length;
  document.getElementById('navSignoffBadge').textContent = allSigned;
  document.getElementById('statSignoffs').textContent = allSigned;
  document.getElementById('statSignoffsDetail').textContent = `of ${allTotal} total`;
}

function openContextMenu(e, traineeId, compId) {
  e.stopPropagation();
  contextTarget = { traineeId, compId };
  const menu = document.getElementById('contextMenu');
  menu.classList.add('open');
  menu.style.top = (e.clientY + 8) + 'px';
  menu.style.left = (e.clientX - 40) + 'px';
}

function setSignoff(status) {
  if (!contextTarget) return;
  const key = contextTarget.traineeId + '_' + contextTarget.compId;
  if (status === 'pending') delete state.signoffs[key];
  else state.signoffs[key] = status;
  document.getElementById('contextMenu').classList.remove('open');
  const { traineeId, compId } = contextTarget;
  contextTarget = null;
  renderCompetencyTable(state.currentCompDay);
  updateDashboardStats();
  dbSaveSignoff(traineeId, compId, status);
  showToast(status === 'signed' ? 'Competency signed off!' : status === 'pending' ? 'Sign-off cleared' : 'Status updated', status === 'signed' ? 'success' : 'info');
}

document.addEventListener('click', () => {
  document.getElementById('contextMenu').classList.remove('open');
});

// ============================================================
// RECAP
// ============================================================
function selectRecapDay(day) {
  state.currentRecapDay = day;
  document.querySelectorAll('#recapDayTabs .tab').forEach((t, i) => t.classList.toggle('active', i === day - 1));
  document.getElementById('saveBtnDay').textContent = day;
  loadRecapFields(day);
}

// All textarea field IDs (strip 'recap-' prefix to get state key)
const RECAP_TEXT_FIELDS = [
  'building-permits','building-construction','building-problem','building-actions',
  'tech-mscap','tech-tickets','tech-unusual','tech-problem','tech-actions',
  'ld-progress','ld-delays','ld-problem','ld-actions',
  'team-progress','team-successes','team-opportunities','team-values','sm-execution','team-problem','team-actions',
  'supplies-missing','supplies-problem','supplies-actions',
  'additional'
];
const RECAP_PROBLEM_SECTIONS = ['building','tech','ld','team','supplies'];
const RECAP_FIELD_LABELS = {
  'tech-mscap': 'MoCap'
};

function loadRecapFields(day) {
  const r = state.recaps[day] || {};
  RECAP_TEXT_FIELDS.forEach(function(field) {
    var el = document.getElementById('recap-' + field);
    if (el) el.value = r[field] || '';
  });
  RECAP_PROBLEM_SECTIONS.forEach(function(section) {
    var priority = r[section + '-priority'] || '';
    setPriorityBtns(section, priority);
    var hasProblem = r[section + '-problem'] || r[section + '-priority'] || r[section + '-actions'];
    var body = document.getElementById('problem-body-' + section);
    var toggle = document.getElementById('problem-toggle-' + section);
    if (body) body.style.display = hasProblem ? '' : 'none';
    if (toggle) toggle.classList.toggle('open', !!hasProblem);
  });
  updateRecapPreview();
}

function toggleProblem(section) {
  var body = document.getElementById('problem-body-' + section);
  var toggle = document.getElementById('problem-toggle-' + section);
  if (!body) return;
  var isOpen = body.style.display !== 'none';
  body.style.display = isOpen ? 'none' : '';
  if (toggle) toggle.classList.toggle('open', !isOpen);
}

function setRecapPriority(section, level) {
  var day = state.currentRecapDay;
  if (!state.recaps[day]) state.recaps[day] = {};
  state.recaps[day][section + '-priority'] = level;
  setPriorityBtns(section, level);
  updateRecapPreview();
}

function setPriorityBtns(section, active) {
  var container = document.getElementById('priority-btns-' + section);
  if (!container) return;
  container.querySelectorAll('.recap-priority-btn').forEach(function(btn) {
    btn.classList.toggle('active', btn.textContent.trim() === active);
  });
}

function appendChip(fieldId, text) {
  var el = document.getElementById(fieldId);
  if (!el) return;
  if (el.value && !el.value.endsWith('\n') && el.value.trim()) el.value += '\n';
  el.value += text;
  updateRecapPreview();
}

function updateRecapPreview() {
  var day = state.currentRecapDay;
  var r = state.recaps[day] || {};
  var get = function(field) {
    var el = document.getElementById('recap-' + field);
    return el ? el.value.trim() : (r[field] || '');
  };
  var store = (state.opening && state.opening.store) ? state.opening.store : '[Store]';
  var coach = (state.opening && state.opening.coach) ? state.opening.coach : '[Coach]';
  var dayTitles = ['Guest Experience','Service & Tech','Role-Play & Ops','Full Roleplay','Friends & Family','Opening Weekend — Friday','Opening Weekend — Saturday','Opening Weekend — Sunday'];
  var lines = [];
  lines.push('*NSO Daily Recap — Day ' + day + ': ' + (dayTitles[day-1] || '') + '*');
  lines.push('*' + store + '*  |  OSC: ' + coach);
  lines.push('─'.repeat(36));
  lines.push('');

  function addSection(emoji, title, fields, section) {
    var body = [];
    fields.forEach(function(f) {
      var val = get(f);
      if (!val) return;
      var label = RECAP_FIELD_LABELS[f];
      if (!label) {
        label = f.split('-').slice(section ? 1 : 0).join(' ');
        label = label.charAt(0).toUpperCase() + label.slice(1).replace(/-/g, ' ');
      }
      // Split multi-line values (from multiple chip clicks) into individual bullets
      var fieldLines = val.split('\n').map(function(l){ return l.trim(); }).filter(Boolean);
      if (fieldLines.length === 1) {
        body.push('• *' + label + ':* ' + fieldLines[0]);
      } else {
        // Multiple items — each chip gets its own bullet, label becomes header
        body.push('• *' + label + ':*');
        fieldLines.forEach(function(l){ body.push('  · ' + l); });
      }
    });
    var prob = section && get(section + '-problem');
    if (!body.length && !prob) return;
    lines.push(emoji + '  *' + title + '*');
    body.forEach(function(l){ lines.push(l); });
    if (prob) {
      var pri = r[section + '-priority'] ? ' [' + r[section + '-priority'] + ']' : '';
      lines.push('⚠ *Problem Identified' + pri + ':* ' + prob);
      var act = get(section + '-actions');
      if (act) lines.push('    → ' + act);
    }
    lines.push('');
  }

  addSection('🏗','Building',['building-permits','building-construction'],'building');
  addSection('🔧','Tech',['tech-mscap','tech-tickets','tech-unusual'],'tech');
  addSection('📚','L&D',['ld-progress','ld-delays'],'ld');
  addSection('🎯','Team & Leadership',['team-progress','team-successes','team-opportunities','team-values','sm-execution'],'team');
  addSection('📦','Supplies',['supplies-missing'],'supplies');

  var photos = get('photos');
  if (photos) { lines.push('📷  *Store Photos*'); lines.push(photos); lines.push(''); }
  var additional = get('additional');
  if (additional) { lines.push('💬  *Additional*'); lines.push(additional); lines.push(''); }

  var preview = document.getElementById('recapPreview');
  if (preview) {
    var content = lines.join('\n').trim();
    var empty = lines.slice(4).join('').trim() === '';
    if (empty) {
      preview.dataset.plaintext = '';
      preview.innerHTML = '<span class="recap-placeholder">Start filling in the fields to see your formatted recap appear here...</span>';
    } else {
      preview.dataset.plaintext = content;
      preview.innerHTML = renderSlackHTML(content);
    }
    // Update sender name from opening coach
    var nameEl = document.getElementById('slackSenderName');
    var timeEl = document.getElementById('slackSenderTime');
    if (nameEl && state.opening && state.opening.coach) nameEl.textContent = state.opening.coach;
    if (timeEl) {
      var now = new Date();
      timeEl.textContent = 'Today at ' + now.toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'});
    }
  }

  // Ticket count warning: show if tech issues logged but tickets field is empty
  var hasTechIssue = (get('tech-mscap') + get('tech-unusual')).trim().length > 0;
  var hasTickets = get('tech-tickets').trim().length > 0;
  var ticketsWarning = document.getElementById('tickets-warning');
  var ticketsEl = document.getElementById('recap-tech-tickets');
  if (ticketsWarning) ticketsWarning.style.display = (hasTechIssue && !hasTickets) ? '' : 'none';
  if (ticketsEl) {
    ticketsEl.style.borderColor = (hasTechIssue && !hasTickets) ? 'var(--warning)' : '';
    ticketsEl.style.background  = (hasTechIssue && !hasTickets) ? 'var(--warning-light)' : '';
  }
}

function renderSlackHTML(text) {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
    .replace(/─+/g, '<span class="slack-recap-divider">────────────────────────────────────</span>')
    .replace(/\n/g, '<br>');
}

async function saveRecap() {
  var day = state.currentRecapDay;
  if (!state.recaps[day]) state.recaps[day] = {};
  RECAP_TEXT_FIELDS.forEach(function(field) {
    var el = document.getElementById('recap-' + field);
    if (el) state.recaps[day][field] = el.value;
  });
  // Priority values already written to state by setRecapPriority()
  const err = await dbSaveRecap(day);
  if (err) { showToast('Save failed: ' + (err.message || 'DB error'), 'error'); return; }
  showToast('Day ' + day + ' recap saved!', 'success');
  updateRecapStatusCard();
}

async function copyRecap() {
  var text = (document.getElementById('recapPreview').dataset.plaintext || '').trim();
  if (!text) { showToast('Nothing to copy yet.', 'info'); return; }
  // Write both HTML (bold tags) and plain text so Slack desktop renders bold correctly
  var htmlVersion = '<meta charset="utf-8">' + text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')  // escape first
    .replace(/\*(.*?)\*/g, '<b>$1</b>')   // *bold* → <b>bold</b>
    .replace(/\n/g, '<br>');
  try {
    var item = new ClipboardItem({
      'text/html':  new Blob([htmlVersion], { type: 'text/html' }),
      'text/plain': new Blob([text],        { type: 'text/plain' })
    });
    await navigator.clipboard.write([item]);
    showToast('Copied — paste into Slack!', 'success');
  } catch(e) {
    // Fallback for browsers that don't support ClipboardItem
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copied — paste into Slack!', 'success');
    } catch(e2) {
      showToast('Copy failed — try selecting the text manually.', 'error');
    }
  }
}

function exportSignoffs() {
  let csv = 'Trainee,Role,' + COMPETENCIES.map(c => `Day${c.day}: ${c.name}`).join(',') + '\n';
  state.trainees.forEach(t => {
    const row = [t.name, t.role, ...COMPETENCIES.map(c => state.signoffs[t.id + '_' + c.id] || 'pending')];
    csv += row.map(r => `"${r}"`).join(',') + '\n';
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'signoffs.csv'; a.click();
  showToast('Sign-offs exported!', 'success');
}

// ============================================================
// KNOWLEDGE BASE
// ============================================================
function renderKBNav(filter) {
  const nav = document.getElementById('kbNav');
  if (!nav) return;
  let html = '';
  Object.entries(KB).forEach(([cat, articles]) => {
    const filtered = filter ? articles.filter(a => a.title.toLowerCase().includes(filter.toLowerCase())) : articles;
    if (filtered.length === 0) return;
    html += `<div class="kb-category"><div class="kb-category-header">${cat}</div>`;
    filtered.forEach(a => {
      html += `<button class="kb-article-link ${a.id === (window._activeKBArticle || '') ? 'active' : ''}" onclick="loadKBArticle('${a.id}')"><div class="kb-dot"></div>${a.title}</button>`;
    });
    html += '</div>';
  });
  nav.innerHTML = html;
}

function loadKBArticle(id) {
  let article = null;
  Object.values(KB).forEach(articles => {
    const found = articles.find(a => a.id === id);
    if (found) article = found;
  });
  if (!article) return;
  window._activeKBArticle = id;
  renderKBNav();

  var title   = getContent('kb', id, 'title',   article.title);
  var subtitle = getContent('kb', id, 'subtitle', article.subtitle);
  var body    = getContent('kb', id, 'content',  article.content);
  var editBtn = canEdit() ? `<button onclick="openKBEditor('${id}')" style="display:inline-flex;align-items:center;gap:6px;margin-top:10px;font-size:12px;font-weight:600;padding:5px 14px;border-radius:20px;border:1px solid var(--trigger);color:var(--trigger);background:transparent;cursor:pointer">✏ Edit Article</button>` : '';

  const content = document.getElementById('kbContent');
  content.innerHTML = `
    <div class="kb-article-eyebrow">${article.eyebrow}</div>
    <div class="kb-article-title">${title}</div>
    <div class="kb-article-subtitle">${subtitle}</div>
    ${editBtn}
    <hr class="divider">
    <div class="kb-article-body">${body}</div>
  `;
}

function searchKB(val) {
  renderKBNav(val);
}

// ============================================================
// TEAM ROSTER
// ============================================================
function renderTeamRoster() {
  const body = document.getElementById('traineeListBody');
  const count = document.getElementById('traineeCount');
  if (!body) return;
  count.textContent = state.trainees.length;

  if (state.trainees.length === 0) {
    body.innerHTML = `<div class="empty-state"><svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="20" cy="14" r="7"/><path d="M6 36a14 14 0 0128 0"/></svg><div style="font-weight:600;color:var(--text-secondary);margin-bottom:4px">No trainees yet</div><div style="font-size:12px">Add your team to start tracking competencies</div><button class="btn btn-primary" style="margin-top:12px" onclick="openAddTraineeModal()">Add First Trainee</button></div>`;
    return;
  }

  const roleColors = { 'GEG': 'badge-gray', 'Lead GEG': 'badge-blue', 'ASM': 'badge-amber', 'SM': 'badge-dark' };

  body.innerHTML = state.trainees.map(t => {
    const isLeader = t.role === 'SM' || t.role === 'ASM';
    const applicableComps = COMPETENCIES.filter(c => !c.smOnly || isLeader);
    const totalComps = applicableComps.length;
    const signedComps = applicableComps.filter(c => state.signoffs[t.id + '_' + c.id] === 'signed').length;
    const pct = totalComps > 0 ? Math.round((signedComps / totalComps) * 100) : 0;
    const notesSafe = (t.notes || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    return `<div style="padding:14px 0;border-bottom:1px solid var(--border-light)">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:36px;height:36px;border-radius:50%;background:var(--trigger-light);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;color:var(--trigger)">${t.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}</div>
          <div>
            <div style="font-weight:600;font-size:14px">${t.name}</div>
            <select onchange="editTraineeRole('${t.id}', this.value)" style="font-size:11px;color:var(--text-secondary);border:none;background:transparent;cursor:pointer;padding:0;font-family:var(--font);margin-top:2px">
              <option value="GEG" ${t.role==='GEG'?'selected':''}>GEG</option>
              <option value="Lead GEG" ${t.role==='Lead GEG'?'selected':''}>Lead GEG</option>
              <option value="ASM" ${t.role==='ASM'?'selected':''}>ASM</option>
              <option value="SM" ${t.role==='SM'?'selected':''}>SM</option>
            </select>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:16px">
          <div style="text-align:right">
            <div style="font-size:11px;color:var(--text-muted)">Sign-offs</div>
            <div style="font-size:14px;font-weight:700;color:${pct === 100 ? 'var(--success)' : 'var(--hb)'}">${signedComps}/${totalComps}</div>
          </div>
          <div style="width:80px">
            <div class="progress-bar-wrap">
              <div class="progress-bar-fill ${pct === 100 ? 'green' : 'blue'}" style="width:${pct}%"></div>
            </div>
          </div>
          <button onclick="removeTrainee('${t.id}')" style="color:var(--text-muted);background:transparent;border:none;cursor:pointer;font-size:13px;padding:4px 8px;border-radius:4px;transition:all 0.1s" onmouseover="this.style.background='var(--danger-light)';this.style.color='var(--danger)'" onmouseout="this.style.background='transparent';this.style.color='var(--text-muted)'">Remove</button>
        </div>
      </div>
      <div style="margin-top:8px;padding-left:48px">
        <textarea id="notes-${t.id}" placeholder="Coach notes — visible to all coaches on this opening" rows="1"
          style="width:100%;font-size:12px;color:var(--text-secondary);border:1px solid transparent;border-radius:6px;padding:6px 8px;resize:none;font-family:var(--font);line-height:1.5;background:var(--surface);transition:border-color 0.15s;overflow:hidden"
          onfocus="this.style.borderColor='var(--border)';this.style.minHeight='56px'"
          onblur="this.style.borderColor='transparent';this.style.minHeight='';saveTraineeNotes('${t.id}',this.value)"
        >${notesSafe}</textarea>
      </div>
    </div>`;
  }).join('') + `<div style="padding-top:14px;display:flex;gap:8px">
    <button class="btn btn-secondary" onclick="openAddTraineeModal()">+ Add Another</button>
    <button class="btn btn-ghost" onclick="openAddTraineeModal();setTimeout(()=>switchAddTab('bulk'),50)">Bulk Add</button>
  </div>`;
}

function saveTraineeNotes(id, value) {
  const t = state.trainees.find(t => t.id === id);
  if (!t) return;
  if (t.notes === value) return;
  t.notes = value;
  dbSaveTrainee(t);
}

function editTraineeRole(id, newRole) {
  const t = state.trainees.find(t => t.id === id);
  if (t) { t.role = newRole; renderTeamRoster(); updateDashboardStats(); dbSaveTrainee(t); }
}

function removeTrainee(id) {
  state.trainees = state.trainees.filter(t => t.id !== id);
  dbDeleteTrainee(id);
  renderTeamRoster();
  updateDashboardStats();
  showToast('Trainee removed', 'info');
}

// ============================================================
// DASHBOARD
// ============================================================
function updateDashboardStats() {
  document.getElementById('statDay').textContent = state.opening ? state.currentDay : '—';
  const dayLabels = ['', 'Day 1 — Fri', 'Day 2 — Sat', 'Day 3 — Sun', 'Day 4 — Mon', 'Day 5 — Tue'];
  document.getElementById('statDayLabel').textContent = state.opening ? DAYS[state.currentDay - 1].type : 'Not started';
  document.getElementById('statTrainees').textContent = state.trainees.length;
  document.getElementById('statDaysLeft').textContent = state.opening ? (5 - state.currentDay + 1) : 5;

  const allSigned = Object.entries(state.signoffs).filter(([k, v]) => v === 'signed' && !k.includes('_attendance-')).length;
  // Exclude N/A cells (smOnly comps for non-SM/ASM trainees) from the total
  let allTotal = 0;
  state.trainees.forEach(trainee => {
    const isLeader = trainee.role === 'SM' || trainee.role === 'ASM';
    COMPETENCIES.forEach(c => { if (!c.smOnly || isLeader) allTotal++; });
  });
  document.getElementById('statSignoffs').textContent = allSigned;
  document.getElementById('statSignoffsDetail').textContent = `of ${allTotal} total`;
  document.getElementById('navSignoffBadge').textContent = allSigned;

  updateDashboardFocus();
  updateRecapStatusCard();
}

function updateDashboardFocus() {
  if (!state.opening) return;
  const day = DAYS[state.currentDay - 1];

  // Update page subtitle to reflect current day
  const subtitleEl = document.getElementById('dashSubtitle');
  if (subtitleEl) subtitleEl.textContent = `${state.opening.store} — Day ${state.currentDay} of 5. You've got this.`;

  // Update the day advancer control
  const advancer = document.getElementById('dayAdvancer');
  if (advancer) {
    advancer.style.display = 'flex';
    document.getElementById('dayAdvancerLabel').textContent = `Day ${state.currentDay}`;
    document.getElementById('dayAdvancerSub').textContent = `of 5 training days`;
    document.getElementById('dayPrevBtn').disabled = state.currentDay <= 1;
    document.getElementById('dayNextBtn').disabled = state.currentDay >= 5;
  }

  document.getElementById('todayFocusLabel').textContent = `Day ${state.currentDay}: ${day.title}`;
  document.getElementById('todayFocusContent').innerHTML = `
    <span class="badge badge-${day.type === 'Learning Plan' ? 'blue' : day.type === 'Roleplay Day' ? 'amber' : 'green'}" style="margin-bottom:10px;display:inline-flex">${day.type}</span>
    <p style="font-size:13px;color:var(--text-secondary);line-height:1.6;margin:0">${day.focus}</p>
    <button class="btn btn-ghost" style="margin-top:12px;font-size:12px;padding:6px 12px" onclick="selectDayAgenda(${state.currentDay});navigate('schedule')">View Full Agenda →</button>
  `;

  // Pending signoffs card
  const pendingComps = COMPETENCIES.filter(c => c.day === state.currentDay);
  const pending = [];
  state.trainees.forEach(t => {
    const isLeader = t.role === 'SM' || t.role === 'ASM';
    pendingComps.forEach(c => {
      if (c.smOnly && !isLeader) return; // N/A for GEG trainees — skip
      if (!state.signoffs[t.id + '_' + c.id]) {
        pending.push({ trainee: t.name, comp: c.name });
      }
    });
  });

  if (pending.length === 0) {
    document.getElementById('pendingSignoffsContent').innerHTML = `<div style="display:flex;align-items:center;gap:8px;color:var(--success);font-size:13px">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M5 8l2 2 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      All Day ${state.currentDay} competencies signed off!
    </div>`;
  } else {
    const shown = pending.slice(0, 4);
    document.getElementById('pendingSignoffsContent').innerHTML = shown.map(p =>
      `<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid var(--border-light)">
        <span style="font-size:12px;font-weight:600">${p.trainee}</span>
        <span style="font-size:12px;color:var(--text-secondary)">${p.comp}</span>
      </div>`
    ).join('') + (pending.length > 4 ? `<div style="font-size:12px;color:var(--text-muted);margin-top:8px">+${pending.length - 4} more</div>` : '');
  }
}

function updateRecapStatusCard() {
  const container = document.getElementById('recapStatusContent');
  if (!container) return;
  const dayNames = {1:'Day 1',2:'Day 2',3:'Day 3',4:'Day 4',5:'Day 5',6:'Fri Open',7:'Sat Open',8:'Sun Open'};
  const html = [1,2,3,4,5,6,7,8].map(d => {
    const r = state.recaps[d];
    const complete = r && Object.values(r).some(v => v && String(v).trim().length > 0);
    return `<div style="display:flex;align-items:center;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--border-light)">
      <span style="font-size:13px;font-weight:500">${dayNames[d]}</span>
      <span class="badge ${complete ? 'badge-green' : 'badge-gray'}">${complete ? 'Complete' : 'Pending'}</span>
    </div>`;
  }).join('');
  container.innerHTML = html;
}

// ============================================================
// AUTH
// ============================================================
async function initApp() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    await onSignedIn(session);
  } else {
    showLoginScreen();
  }

  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN') {
      await onSignedIn(session);
    } else if (event === 'SIGNED_OUT') {
      Object.assign(state, {
        opening: null, openingId: null, userRole: 'coach', userEmail: null,
        currentDay: 1, trainees: [], signoffs: {}, recaps: {}, franchiseChecks: {},
        mode: null
      });
      sessionStorage.removeItem('portalMode');
      document.getElementById('modeSelectorOverlay').style.display = 'none';
      showLoginScreen();
    }
  });
}

async function onSignedIn(session) {
  document.getElementById('loginOverlay').style.display = 'none';
  hideLoadBanner();

  // If already signed in this session with a chosen mode, skip the selector
  if (state.mode) return;

  const loaded = await dbLoadState(session?.user);
  if (loaded === 'no-user') {
    setTimeout(async () => {
      const retry = await dbLoadState();
      if (retry === 'no-user') { showLoadBanner(); return; }
      document.getElementById('userEmail').textContent = state.userEmail || '';
      document.getElementById('nav-admin').style.display = 'flex';
      document.getElementById('nav-scorecards').style.display = 'flex';
      renderOpeningSwitcherList();
      const saved = sessionStorage.getItem('portalMode');
      if (saved) { selectMode(saved); } else { showModeSelector(); }
    }, 1500);
    return;
  }

  document.getElementById('userEmail').textContent = state.userEmail || '';
  document.getElementById('nav-admin').style.display = 'flex';
  document.getElementById('nav-scorecards').style.display = 'flex';
  renderOpeningSwitcherList();
  const saved = sessionStorage.getItem('portalMode');
  if (saved) { selectMode(saved); } else { showModeSelector(); }
}

function showModeSelector() {
  state.mode = null;
  sessionStorage.removeItem('portalMode');

  const nsoEl = document.getElementById('mode-nso-location');
  const ltEl  = document.getElementById('mode-lt-location');
  if (nsoEl) nsoEl.textContent = state.opening?.store || 'Grand Opening NSO';
  if (ltEl)  ltEl.textContent  = state.currentStoreProgram?.franchise_store_name || 'Leadership Training';

  document.getElementById('modeSelectorOverlay').style.display = 'flex';
}

function selectMode(mode) {
  state.mode = mode;
  sessionStorage.setItem('portalMode', mode);
  document.getElementById('modeSelectorOverlay').style.display = 'none';

  // Show the right sidebar groups
  const nsoGroup  = document.getElementById('nav-nso-group');
  const ltGroup   = document.getElementById('nav-leadership-group');
  const nsoFooter = document.getElementById('sidebar-footer-nso');
  if (nsoGroup)  nsoGroup.style.display  = mode === 'nso'        ? '' : 'none';
  if (ltGroup)   ltGroup.style.display   = mode === 'leadership' ? '' : 'none';
  if (nsoFooter) nsoFooter.style.display = mode === 'nso'        ? '' : 'none';

  // Update topbar branding
  const topbarSub = document.getElementById('portalSubtitle');
  if (topbarSub) topbarSub.textContent = mode === 'leadership' ? 'Leadership Training' : 'Opening Support Coach';

  if (mode === 'nso') {
    refreshAfterLoad();
  } else {
    navigate('leadership-training');
  }
}

function showLoadBanner() {
  let banner = document.getElementById('loadRetryBanner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'loadRetryBanner';
    banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9999;background:#f59e0b;color:#fff;text-align:center;padding:10px 16px;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:12px;';
    banner.innerHTML = '⚠️ Data didn\'t load — <button onclick="retryLoad()" style="background:#fff;color:#92400e;border:none;border-radius:4px;padding:4px 12px;font-size:13px;font-weight:700;cursor:pointer;">Reload now</button>';
    document.body.prepend(banner);
  }
  banner.style.display = 'flex';
}

function hideLoadBanner() {
  const banner = document.getElementById('loadRetryBanner');
  if (banner) banner.style.display = 'none';
}

async function retryLoad() {
  hideLoadBanner();
  const loaded = await dbLoadState();
  if (loaded === true) {
    refreshAfterLoad();
    document.getElementById('userEmail').textContent = state.userEmail || '';
    renderOpeningSwitcherList();
  } else if (loaded === 'no-user') {
    showLoadBanner();
  }
  // 'no-opening' means auth worked fine, user just has no opening yet — no banner needed
}

function showLoginScreen() {
  document.getElementById('loginOverlay').style.display = 'flex';
  document.getElementById('loginError').style.display = 'none';
  document.getElementById('signupError').style.display = 'none';
}

function showLoginTab(tab) {
  document.getElementById('paneSignIn').style.display = tab === 'signin' ? 'block' : 'none';
  document.getElementById('paneSignUp').style.display = tab === 'signup' ? 'block' : 'none';
  document.getElementById('tabSignIn').classList.toggle('active', tab === 'signin');
  document.getElementById('tabSignUp').classList.toggle('active', tab === 'signup');
}

async function signIn() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('loginError');
  const btn = document.getElementById('signInBtn');
  console.log('[signIn] email:', email, '| password length:', password.length);
  errEl.style.display = 'none';
  if (!email || !password) { errEl.textContent = 'Please enter your email and password.'; errEl.style.display = 'block'; return; }
  btn.textContent = 'Signing in…'; btn.disabled = true;
  try {
    const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('Request timed out — check your connection and try again.')), 12000));
    const { error } = await Promise.race([
      supabase.auth.signInWithPassword({ email, password }),
      timeout
    ]);
    console.log('[signIn] result error:', error);
    if (error) { errEl.textContent = error.message; errEl.style.display = 'block'; }
  } catch (e) {
    console.log('[signIn] caught exception:', e.message);
    errEl.textContent = e.message || 'Connection error. Try again.';
    errEl.style.display = 'block';
  } finally {
    btn.textContent = 'Sign In'; btn.disabled = false;
  }
}

async function signUp() {
  const name = document.getElementById('loginName').value.trim();
  const email = document.getElementById('loginEmailSignUp').value.trim();
  const password = document.getElementById('loginPasswordSignUp').value;
  const errEl = document.getElementById('signupError');
  const btn = document.getElementById('signUpBtn');
  errEl.style.color = 'var(--danger)';
  errEl.style.display = 'none';
  if (!name) { errEl.textContent = 'Please enter your name.'; errEl.style.display = 'block'; return; }
  if (!email) { errEl.textContent = 'Please enter your email.'; errEl.style.display = 'block'; return; }
  if (password.length < 6) { errEl.textContent = 'Password must be at least 6 characters.'; errEl.style.display = 'block'; return; }
  btn.textContent = 'Creating account…'; btn.disabled = true;
  try {
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
    if (error) {
      errEl.textContent = error.message;
      errEl.style.display = 'block';
    } else {
      errEl.style.color = 'var(--success)';
      errEl.textContent = '✓ Account created! You can sign in now.';
      errEl.style.display = 'block';
    }
  } catch (e) {
    errEl.textContent = 'Connection error: ' + e.message;
    errEl.style.display = 'block';
  } finally {
    btn.textContent = 'Create Account'; btn.disabled = false;
  }
}

async function signOut() {
  await supabase.auth.signOut();
}

function refreshAfterLoad() {
  if (!state.opening) return;
  document.getElementById('sidebarStoreName').textContent = state.opening.store;
  document.getElementById('dashTitle').textContent = `Welcome back, ${state.opening.coach}.`;
  if (state.opening.date) {
    const start = new Date(state.opening.date);
    const end = new Date(start); end.setDate(end.getDate() + 4);
    const fmt = d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    document.getElementById('sidebarDates').textContent = `${fmt(start)} – ${fmt(end)}`;
  }
  document.getElementById('dashSetupPrompt').style.display = 'none';
  selectDay(state.currentDay);
  updateDayPips();
  updateDashboardStats();
  updateTopbarDayLabel();
}

function saveState() { /* no-op — replaced by targeted db calls */ }

// ============================================================
// SETUP MODAL
// ============================================================
function openSetupModal(forceNew = false) {
  // When forceNew is true, we always create a brand-new opening.
  // Otherwise, pre-populate with current opening data for editing.
  document.getElementById('setupModal').classList.add('open');
  const today = new Date().toISOString().split('T')[0];
  const isNew = forceNew || !state.openingId;
  document.getElementById('setup-modal-mode').textContent = isNew ? 'Start New Opening' : 'Edit Current Opening';
  document.getElementById('setup-store').value = isNew ? '' : (state.opening?.store || '');
  document.getElementById('setup-coach').value = isNew ? '' : (state.opening?.coach || '');
  document.getElementById('setup-date').value = isNew ? today : (state.opening?.date || today);
  document.getElementById('setup-day').value = isNew ? 1 : (state.currentDay || 1);
  document.getElementById('setup-new-flag').value = isNew ? 'new' : 'edit';
  if (!isNew && state.openingId) {
    document.getElementById('setup-new-hint').style.display = 'block';
  } else {
    document.getElementById('setup-new-hint').style.display = 'none';
  }
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

function saveSetup() {
  const store = document.getElementById('setup-store').value.trim();
  const coach = document.getElementById('setup-coach').value.trim();
  const date = document.getElementById('setup-date').value;
  const day = parseInt(document.getElementById('setup-day').value);
  const isNew = document.getElementById('setup-new-flag').value === 'new';

  if (!store || !coach) { showToast('Please fill in store name and coach name', 'info'); return; }

  if (isNew) {
    // Clear all state to start fresh opening
    state.openingId = null;
    state.trainees = [];
    state.signoffs = {};
    state.recaps = {};
    state.franchiseChecks = {};
  }

  state.opening = { store, coach, date };
  state.currentDay = day;

  document.getElementById('sidebarStoreName').textContent = store;
  document.getElementById('dashTitle').textContent = `Welcome back, ${coach}.`;

  if (date) {
    const start = new Date(date);
    const end = new Date(start);
    end.setDate(end.getDate() + 4);
    const fmt = d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    document.getElementById('sidebarDates').textContent = `${fmt(start)} – ${fmt(end)}`;
  }

  selectDay(day);
  updateDayPips();
  updateDashboardStats();
  updateTopbarDayLabel();
  closeModal('setupModal');
  document.getElementById('dashSetupPrompt').style.display = 'none';
  dbSaveOpening().then(() => {
    showToast(`${isNew ? 'New opening started' : 'Opening updated'}: ${store}!`, 'success');
    renderOpeningSwitcherList();
  });
  if (isNew) renderTeamRoster();
}

// ============================================================
// ADD TRAINEE (single + bulk)
// ============================================================
function switchAddTab(tab) {
  document.getElementById('addPane-single').style.display = tab === 'single' ? 'block' : 'none';
  document.getElementById('addPane-bulk').style.display = tab === 'bulk' ? 'block' : 'none';
  document.getElementById('addTab-single').classList.toggle('active', tab === 'single');
  document.getElementById('addTab-bulk').classList.toggle('active', tab === 'bulk');
}

function openAddTraineeModal() {
  document.getElementById('addTraineeModal').classList.add('open');
  document.getElementById('trainee-name').value = '';
  document.getElementById('bulk-names').value = '';
  switchAddTab('single');
}

function addTrainee() {
  const name = document.getElementById('trainee-name').value.trim();
  const role = document.getElementById('trainee-role').value;
  if (!name) { showToast('Please enter a name', 'info'); return; }
  if (state.trainees.length >= 25) { showToast('Maximum 25 trainees per opening', 'info'); return; }

  const trainee = { id: crypto.randomUUID(), name, role };
  state.trainees.push(trainee);
  document.getElementById('trainee-name').value = '';
  renderTeamRoster();
  updateDashboardStats();
  dbSaveTrainee(trainee);
  showToast(`${name} added!`, 'success');
  // Keep modal open so coach can keep adding
}

function bulkAddTrainees() {
  const raw = document.getElementById('bulk-names').value.trim();
  const role = document.getElementById('bulk-role').value;
  if (!raw) { showToast('Please enter at least one name', 'info'); return; }

  const names = raw.split('\n').map(n => n.trim()).filter(n => n.length > 0);
  const available = 25 - state.trainees.length;
  if (names.length > available) {
    showToast(`Only ${available} spots left. First ${available} names will be added.`, 'info');
  }
  const toAdd = names.slice(0, available);
  const newTrainees = toAdd.map(name => ({ id: crypto.randomUUID(), name, role }));
  newTrainees.forEach(t => state.trainees.push(t));

  closeModal('addTraineeModal');
  renderTeamRoster();
  updateDashboardStats();
  Promise.all(newTrainees.map(t => dbSaveTrainee(t)));
  showToast(`${toAdd.length} trainees added!`, 'success');
}

function removeTrainee(id) {
  state.trainees = state.trainees.filter(t => t.id !== id);
  renderTeamRoster();
  updateDashboardStats();
  dbDeleteTrainee(id);
  showToast('Trainee removed', 'info');
}

function editTraineeRole(id, newRole) {
  const t = state.trainees.find(t => t.id === id);
  if (t) { t.role = newRole; renderTeamRoster(); dbSaveTrainee(t); }
}

// ============================================================
// ARTICLE DRAWER
// ============================================================
function openDrawer(articleId) {
  let article = null;
  Object.values(KB).forEach(articles => {
    const found = articles.find(a => a.id === articleId);
    if (found) article = found;
  });
  if (!article) return;

  document.getElementById('drawerArticleEyebrow').textContent = article.eyebrow;
  document.getElementById('drawerArticleTitle').textContent = article.title;
  document.getElementById('drawerArticleSubtitle').textContent = article.subtitle;
  document.getElementById('drawerArticleBody').innerHTML = article.content;
  document.getElementById('articleDrawer').style.right = '0';
  document.getElementById('drawerOverlay').style.display = 'block';
}

function closeDrawer() {
  document.getElementById('articleDrawer').style.right = '-520px';
  document.getElementById('drawerOverlay').style.display = 'none';
}

// ============================================================
// ADMIN PAGE — CREATE USER
// ============================================================
function checkAdminPw() {
  // Legacy stub — admin access is now role-based via Supabase
  renderAdminPage();
}

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let pw = '';
  for (let i = 0; i < 12; i++) pw += chars[Math.floor(Math.random() * chars.length)];
  document.getElementById('newUserPassword').value = pw;
}

async function createUserLogin() {
  const name  = (document.getElementById('newUserName').value || '').trim();
  const email = (document.getElementById('newUserEmail').value || '').trim();
  const pw    = (document.getElementById('newUserPassword').value || '').trim();
  const role  = document.getElementById('newUserRole').value;

  const errEl = document.getElementById('createUserError');
  const okEl  = document.getElementById('createUserSuccess');
  const btn   = document.getElementById('createUserBtn');
  errEl.style.display = 'none';
  okEl.style.display  = 'none';

  if (!name || !email || !pw) { errEl.textContent = 'Please fill in all fields.'; errEl.style.display = 'block'; return; }
  if (pw.length < 8) { errEl.textContent = 'Password must be at least 8 characters.'; errEl.style.display = 'block'; return; }

  btn.disabled = true;
  btn.textContent = 'Creating…';

  // Use a secondary client that doesn't persist session so the admin stays logged in
  const tempClient = window._supabaseSDK.createClient(
    'https://uvbkiudfemyesizvecos.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2YmtpdWRmZW15ZXNpenZlY29zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MjY3MzksImV4cCI6MjA5NDIwMjczOX0._6-wR9OZ-hUFyo0rQ_wig8C65miqpmpclAcz0cxjqu4',
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const { data, error } = await tempClient.auth.signUp({
    email,
    password: pw,
    options: { data: { full_name: name } }
  });

  btn.disabled = false;
  btn.textContent = 'Create Login';

  if (error) {
    errEl.textContent = error.message;
    errEl.style.display = 'block';
    return;
  }

  // Try to update the profile role (requires admin update RLS policy)
  if (data.user) {
    await supabase.from('profiles').update({ role, full_name: name }).eq('id', data.user.id);
  }

  let msg = `Email: ${email}<br>Password: ${pw}<br>Role: ${role}`;
  if (role === 'admin') {
    msg += `<br><br><strong>To confirm admin access, run this in Supabase → SQL Editor:</strong><br><code style="font-size:11px;background:rgba(0,0,0,0.06);padding:3px 6px;border-radius:4px;display:inline-block;margin-top:4px">UPDATE public.profiles SET role = 'admin' WHERE email = '${email}';</code>`;
  }
  document.getElementById('createUserSuccessMsg').innerHTML = msg;
  okEl.style.display = 'block';

  // Clear form
  document.getElementById('newUserName').value = '';
  document.getElementById('newUserEmail').value = '';
  document.getElementById('newUserPassword').value = '';
  document.getElementById('newUserRole').value = 'coach';
}

async function renderAdminPage() {
  var container = document.getElementById('adminOpeningsList');
  document.getElementById('adminLock').style.display = 'none';
  document.getElementById('adminContent').style.display = 'block';
  container.innerHTML = '<div style="padding:24px;color:var(--text-muted);font-size:13px">Loading…</div>';

  // Re-fetch role fresh from DB on every admin page visit (avoids stale state.userRole)
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (profile && profile.role) state.userRole = profile.role;
    }
  } catch(e) { /* keep existing state.userRole */ }

  container.innerHTML = '<div style="padding:24px;color:var(--text-muted);font-size:13px">Loading all openings…</div>';
  var allOpenings = await dbLoadAllOpenings();

  if (allOpenings.length === 0) {
    container.innerHTML = '<div style="padding:48px 0;text-align:center"><div style="font-size:32px;margin-bottom:12px">📭</div><div style="font-size:15px;font-weight:700;color:var(--hb);margin-bottom:6px">No openings yet</div><div style="font-size:13px;color:var(--text-muted)">Once coaches start opening programs, they\'ll appear here.</div><div style="font-size:12px;color:var(--text-muted);margin-top:8px">If you expected to see data, check the Supabase → Table Editor → openings table to confirm rows exist.</div></div>';
    return;
  }

  var html = '';
  allOpenings.forEach(function(o) {
    var trainees = o.trainees || [];
    var signoffs = o.signoffs || [];
    var recaps = o.recaps || [];
    var franchiseChecks = o.franchise_checks || [];
    var allSigned = signoffs.filter(function(s){ return s.status === 'signed' && !s.competency_id.startsWith('attendance-'); }).length;
    var allTotal = 0;
    trainees.forEach(function(t) {
      var isLeader = t.role === 'SM' || t.role === 'ASM';
      COMPETENCIES.forEach(function(c) { if (!c.smOnly || isLeader) allTotal++; });
    });
    var pct = allTotal > 0 ? Math.round((allSigned / allTotal) * 100) : 0;
    var recapCount = recaps.filter(function(r){ return r.recap_data && Object.values(r.recap_data).some(function(v){ return v; }); }).length;
    var openingId = 'admin-' + o.id.replace(/[^a-z0-9]/gi, '_');
    var opening = { store: o.store_name, coach: o.coach_name || (o.profiles && o.profiles.full_name) || '—', date: o.start_date };
    var pctBadge = pct === 100 ? 'badge-green' : 'badge-gray';
    var recapBadge = recapCount >= 8 ? 'badge-green' : 'badge-amber';

    // Safe store name for use inside onclick attributes (no quote issues)
    var safeId = o.id;
    var safeStore = (o.store_name || 'Unknown Store').replace(/'/g, '&#39;');
    var safeCoach = (o.coach_name || opening.coach || '').replace(/'/g, '&#39;');

    html += '<div class="card mb-20">';
    // Clickable header — toggle only
    html += '<div class="card-header" style="cursor:pointer" onclick="toggleAdminOpening(\'' + openingId + '\')">';
    html += '<div style="flex:1">';
    html += '<div class="card-title">' + (opening.store || 'Unknown Store') + '</div>';
    html += '<div class="card-subtitle">Coach: ' + (opening.coach || '—') + ' · Start: ' + (opening.date || '—') + ' · Day ' + (o.current_day || '?') + ' of 5</div>';
    html += '</div>';
    html += '<div style="display:flex;gap:16px;align-items:center">';
    html += '<span class="badge badge-blue">' + trainees.length + ' trainees</span>';
    html += '<span class="badge ' + pctBadge + '">' + pct + '% signed off</span>';
    html += '<span class="badge ' + recapBadge + '">' + recapCount + '/8 recaps</span>';
    html += '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" id="chevron-' + openingId + '" style="transition:transform 0.2s"><path d="M2 5l5 5 5-5"/></svg>';
    html += '</div>';
    html += '</div>'; // end card-header
    // Action buttons — outside the clickable header
    html += '<div style="display:flex;gap:8px;padding:8px 16px 10px;background:var(--surface);border-top:1px solid var(--border-light);flex-wrap:wrap">';
    html += '<button class="btn btn-ghost" style="font-size:12px;padding:5px 12px;gap:6px" onclick="exportOpeningCSV(\'' + safeId + '\', \'' + safeStore + '\')"><svg xmlns=\'http://www.w3.org/2000/svg\' width=\'13\' height=\'13\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'><path d=\'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\'/><polyline points=\'7 10 12 15 17 10\'/><line x1=\'12\' y1=\'15\' x2=\'12\' y2=\'3\'/></svg> Export CSV</button>';
    html += '<button class="btn btn-ghost" style="font-size:12px;padding:5px 12px;gap:6px" onclick="openRenameModal(\'' + safeId + '\', \'' + safeStore + '\', \'' + safeCoach + '\')"><svg xmlns=\'http://www.w3.org/2000/svg\' width=\'13\' height=\'13\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'><path d=\'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7\'/><path d=\'M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z\'/></svg> Rename</button>';
    html += '<button class="btn" style="font-size:12px;padding:5px 12px;gap:6px;background:transparent;border:1px solid var(--danger);color:var(--danger)" onclick="confirmDeleteOpening(\'' + safeId + '\', \'' + safeStore + '\')"><svg xmlns=\'http://www.w3.org/2000/svg\' width=\'13\' height=\'13\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'><polyline points=\'3 6 5 6 21 6\'/><path d=\'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2\'/></svg> Delete</button>';
    html += '</div>';
    // Collapsible detail
    html += '<div id="' + openingId + '" style="display:none">';
    html += '<div style="padding:20px;border-top:1px solid var(--border-light)">';

    // Franchise checks
    if (franchiseChecks.length > 0) {
      html += '<div style="margin-bottom:20px">';
      html += '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted);margin-bottom:10px">Franchise Verifications</div>';
      franchiseChecks.forEach(function(fc) {
        var bg = fc.checked ? 'var(--success-light)' : 'var(--warning-light)';
        var col = fc.checked ? '#0D7A4E' : 'var(--warning)';
        html += '<div style="display:flex;align-items:center;gap:8px;padding:5px 0;font-size:13px">';
        html += '<div style="width:16px;height:16px;border-radius:50%;background:' + bg + ';display:flex;align-items:center;justify-content:center;font-size:10px;color:' + col + '">' + (fc.checked ? '&#10003;' : '!') + '</div>';
        html += '<span style="color:var(--text-secondary)">' + fc.check_key + '</span></div>';
      });
      html += '</div>';
    }

    // Roster
    html += '<div style="margin-bottom:20px">';
    html += '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted);margin-bottom:10px">Team Roster &amp; Sign-offs</div>';
    if (trainees.length === 0) {
      html += '<div style="font-size:13px;color:var(--text-muted)">No trainees added.</div>';
    } else {
      html += '<table style="width:100%;border-collapse:collapse;font-size:12.5px"><thead><tr style="background:var(--surface)">';
      html += '<th style="text-align:left;padding:8px 10px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted);border-bottom:1px solid var(--border-light)">Name</th>';
      html += '<th style="text-align:left;padding:8px 10px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted);border-bottom:1px solid var(--border-light)">Role</th>';
      html += '<th style="text-align:center;padding:8px 10px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted);border-bottom:1px solid var(--border-light)">Signed Off</th>';
      html += '<th style="text-align:center;padding:8px 10px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted);border-bottom:1px solid var(--border-light)">Progress</th>';
      html += '</tr></thead><tbody>';
      trainees.forEach(function(t) {
        var tc = signoffs.filter(function(s){ return s.trainee_id === t.id && s.status === 'signed'; }).length;
        var tp = Math.round((tc / COMPETENCIES.length) * 100);
        var barColor = tp === 100 ? 'var(--success)' : 'var(--trigger)';
        html += '<tr>';
        html += '<td style="padding:8px 10px;border-bottom:1px solid var(--border-light)">' + t.name + '</td>';
        html += '<td style="padding:8px 10px;border-bottom:1px solid var(--border-light)"><span class="badge badge-gray" style="font-size:10px">' + t.role + '</span></td>';
        html += '<td style="text-align:center;padding:8px 10px;border-bottom:1px solid var(--border-light)">' + tc + '/' + COMPETENCIES.length + '</td>';
        html += '<td style="text-align:center;padding:8px 10px;border-bottom:1px solid var(--border-light)"><div style="display:flex;align-items:center;gap:6px;justify-content:center"><div style="width:60px;height:4px;background:var(--border-light);border-radius:2px"><div style="height:100%;width:' + tp + '%;background:' + barColor + ';border-radius:2px"></div></div><span style="font-size:11px;color:var(--text-muted)">' + tp + '%</span></div></td>';
        html += '</tr>';
      });
      html += '</tbody></table>';
    }
    html += '</div>';

    // Recaps
    html += '<div>';
    html += '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted);margin-bottom:10px">Daily Recaps</div>';
    var dayLabels = {1:'Day 1',2:'Day 2',3:'Day 3',4:'Day 4',5:'Day 5',6:'Fri Open',7:'Sat Open',8:'Sun Open'};
    [1,2,3,4,5,6,7,8].forEach(function(d) {
      var r = recaps.find(function(x){ return x.day_num === d; });
      var rd = r && r.recap_data;
      var hasContent = rd && Object.values(rd).some(function(v){ return v; });
      var badge = hasContent ? 'badge-green' : 'badge-gray';
      var label = hasContent ? 'Complete' : 'Pending';
      html += '<div style="padding:10px 0;border-bottom:1px solid var(--border-light)">';
      html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:' + (hasContent ? '8px' : '0') + '">';
      html += '<span style="font-size:13px;font-weight:600">' + (dayLabels[d] || 'Day ' + d) + '</span>';
      html += '<span class="badge ' + badge + '">' + label + '</span>';
      html += '</div>';
      if (hasContent) {
        var ldSnippet = (rd['ld-progress'] || rd['ld-delays'] || '').trim();
        var teamSnippet = (rd['sm-execution'] || rd['team-progress'] || rd['team-successes'] || '').trim();
        if (ldSnippet) html += '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:4px"><strong>L&amp;D:</strong> ' + ldSnippet.substring(0, 120) + (ldSnippet.length > 120 ? '…' : '') + '</div>';
        if (teamSnippet) html += '<div style="font-size:12px;color:var(--text-secondary)"><strong>Team:</strong> ' + teamSnippet.substring(0, 100) + (teamSnippet.length > 100 ? '…' : '') + '</div>';
      }
      html += '</div>';
    });
    html += '</div>';

    html += '</div></div></div>';
  });

  container.innerHTML = html;

  renderUserManagement();
  renderAdminLeadershipSection();
}

async function renderAdminLeadershipSection() {
  var container = document.getElementById('adminLeadershipProgramsList');
  if (!container) return;
  container.innerHTML = '<div style="padding:12px 0;color:var(--text-muted);font-size:13px">Loading leadership trainings…</div>';

  const { data, error } = await dbLoadAllLeadershipTrainingsForAdmin();
  if (error || !data || data.length === 0) {
    container.innerHTML = '<div style="padding:12px 0;color:var(--text-muted);font-size:13px">' + (error ? 'Error loading trainings.' : 'No leadership trainings yet.') + '</div>';
    return;
  }

  var html = '';
  data.forEach(function(t) {
    var sp = t.store_program || {};
    var participants = t.participants || [];
    var signoffs = t.signoffs || [];
    var reports = t.readiness_reports || [];
    var totalPossible = participants.length * LEADERSHIP_COMPETENCIES.length;
    var totalSigned = signoffs.length;
    var pct = totalPossible > 0 ? Math.round((totalSigned / totalPossible) * 100) : 0;
    var readyCount = reports.filter(function(r){ return r.readiness_status === 'ready'; }).length;
    var dayNames = {1:'Day 1',2:'Day 2',3:'Day 3',4:'Day 4',5:'Day 5'};

    html += '<div class="card mb-20" style="border-left:3px solid var(--trigger)">';
    html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;cursor:pointer" onclick="toggleAdminOpening(\'lt-' + t.id + '\')">';
    html += '<div><div style="font-size:14px;font-weight:700;color:var(--hb)">' + (sp.franchise_store_name || 'Unknown Store') + '</div>';
    html += '<div style="font-size:12px;color:var(--text-muted);margin-top:2px">Trainer: ' + t.trainer_name + ' &nbsp;·&nbsp; Start: ' + (t.start_date || '—') + ' &nbsp;·&nbsp; ' + (dayNames[t.current_day] || 'Day 1') + ' of 5</div></div>';
    html += '<div style="display:flex;align-items:center;gap:8px">';
    html += '<span class="badge badge-blue">' + participants.length + ' leaders</span>';
    html += '<span class="badge ' + (pct >= 100 ? 'badge-green' : 'badge-amber') + '">' + pct + '% signed off</span>';
    if (readyCount > 0) html += '<span class="badge badge-green">' + readyCount + '/' + participants.length + ' ready</span>';
    html += '<svg style="flex-shrink:0;color:var(--text-muted)" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 6l4 4 4-4"/></svg></div></div>';

    html += '<div id="lt-' + t.id + '" style="display:none;padding:0 16px 14px">';
    // Participant list
    if (participants.length > 0) {
      html += '<div style="margin-bottom:12px">';
      participants.forEach(function(p) {
        var pSigned = signoffs.filter(function(s){ return s.participant_id === p.id; }).length;
        var pTotal = LEADERSHIP_COMPETENCIES.length;
        var pPct = Math.round((pSigned / pTotal) * 100);
        var rep = reports.find(function(r){ return r.participant_id === p.id; });
        var statusBadge = rep && rep.readiness_status ? (' <span class="badge ' + (rep.readiness_status === 'ready' ? 'badge-green' : rep.readiness_status === 'ready_with_support' ? 'badge-amber' : 'badge-gray') + '" style="font-size:10px">' + (rep.readiness_status === 'ready' ? 'Ready' : rep.readiness_status === 'ready_with_support' ? 'Ready w/ Support' : 'Needs Training') + '</span>') : '';
        html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border-light);font-size:13px">';
        html += '<span style="font-weight:500">' + p.name + ' <span style="color:var(--text-muted);font-size:11px">' + (p.role === 'Custom' && p.custom_role ? p.custom_role : p.role) + '</span>' + statusBadge + '</span>';
        html += '<span style="color:var(--text-muted)">' + pSigned + '/' + pTotal + ' (' + pPct + '%)</span>';
        html += '</div>';
      });
      html += '</div>';
    }
    html += '<div style="display:flex;gap:8px">';
    html += '<button class="btn btn-secondary" style="font-size:12px" onclick="exportLeadershipCSV(\'' + t.id + '\',\'' + (sp.franchise_store_name || 'leadership').replace(/'/g,'') + '\')">Export CSV</button>';
    html += '<button class="btn btn-secondary" style="font-size:12px;color:var(--danger);border-color:var(--danger)" onclick="confirmDeleteLeadershipTraining(\'' + t.id + '\',\'' + (sp.franchise_store_name || 'Training').replace(/'/g,'') + '\')">Delete</button>';
    html += '</div>';
    html += '</div></div>';
  });
  container.innerHTML = html;
}

function openRenameModal(openingId, storeName, coachName) {
  document.getElementById('renameOpeningId').value = openingId;
  document.getElementById('renameStoreName').value = storeName;
  document.getElementById('renameCoachName').value = coachName;
  document.getElementById('renameModal').classList.add('open');
}

async function saveRename() {
  var openingId = document.getElementById('renameOpeningId').value;
  var storeName = document.getElementById('renameStoreName').value.trim();
  var coachName = document.getElementById('renameCoachName').value.trim();
  if (!storeName) { showToast('Store name cannot be empty', 'info'); return; }
  const { error } = await supabase.from('openings').update({ store_name: storeName, coach_name: coachName }).eq('id', openingId);
  if (error) { showToast('Error saving: ' + error.message, 'error'); return; }
  closeModal('renameModal');
  showToast('Opening updated', 'success');
  renderAdminPage();
}

function confirmDeleteLeadershipTraining(trainingId, storeName) {
  if (!confirm('Permanently delete the leadership training for "' + storeName + '"?\n\nThis will delete all participants, sign-offs, notes, and readiness reports. This cannot be undone.')) return;
  dbDeleteLeadershipTraining(trainingId).then(function(err) {
    if (err) { showToast('Delete failed: ' + (err.message || 'DB error'), 'error'); return; }
    showToast('Leadership training deleted.', 'success');
    renderAdminLeadershipSection();
  });
}

function confirmDeleteOpening(openingId, storeName) {
  if (!confirm('Permanently delete "' + storeName + '"?\n\nThis will delete all trainees, sign-offs, recaps, and franchise checks for this opening. This cannot be undone.')) return;
  dbDeleteOpening(openingId).then(function(err) {
    if (err) { showToast('Error deleting opening: ' + err.message, 'error'); return; }
    showToast('"' + storeName + '" deleted.', 'success');
    renderAdminPage();
  });
}

// ============================================================
// OSC CLOSING REPORT
// ============================================================
var _oscTeamRating = 0;
var _oscSMRating = 0;
var _oscASMRating = 0;
var _oscFORating = 0;

function setOSCRating(type, val) {
  var map = {
    team: { stateVar: '_oscTeamRating', btnId: 'osc-team-rating-btns' },
    sm:   { stateVar: '_oscSMRating',   btnId: 'osc-sm-rating-btns'   },
    asm:  { stateVar: '_oscASMRating',  btnId: 'osc-asm-rating-btns'  },
    fo:   { stateVar: '_oscFORating',   btnId: 'osc-fo-rating-btns'   }
  };
  if (type === 'team')  _oscTeamRating = val;
  if (type === 'sm')    _oscSMRating   = val;
  if (type === 'asm')   _oscASMRating  = val;
  if (type === 'fo')    _oscFORating   = val;
  var entry = map[type];
  if (!entry) return;
  document.querySelectorAll('#' + entry.btnId + ' .osc-rating-btn').forEach(function(b, i) {
    b.classList.toggle('active', i + 1 === val);
  });
}

function toggleTSName() {
  var v = document.getElementById('osc-ts-present').value;
  var row = document.getElementById('osc-ts-name-row');
  if (row) row.style.display = v === 'Yes' ? '' : 'none';
}

function loadOSCReportFields() {
  var r = state.oscReport || {};
  var get = function(id) { return document.getElementById(id); };
  if (!get('osc-ff-headcount')) return;
  get('osc-ff-headcount').value       = r.ff_headcount != null ? r.ff_headcount : '';
  get('osc-weekend-bookings').value    = r.weekend_bookings != null ? r.weekend_bookings : '';
  get('osc-t1-count').value           = r.t1_ticket_count != null ? r.t1_ticket_count : '';
  get('osc-team-resolvable').value    = r.team_resolvable || '';
  get('osc-biz-impact').value         = r.biz_impact_notes || '';
  get('osc-deployed-by').value        = r.deployed_by || '';
  get('osc-deployment-rating').value  = r.deployment_rating || '';
  get('osc-deployment-notes').value   = r.deployment_notes || '';
  get('osc-ts-present').value         = r.tech_specialist === true ? 'Yes' : (r.tech_specialist === false ? 'No' : '');
  toggleTSName();
  get('osc-ts-name').value            = r.tech_specialist_name || '';
  get('osc-ts-notes').value           = r.tech_specialist_notes || '';
  get('osc-team-notes').value         = r.team_notes || '';
  get('osc-sm-notes').value           = r.sm_notes || '';
  get('osc-asm-notes').value          = r.asm_notes || '';
  get('osc-fo-notes').value           = r.fo_notes  || '';
  _oscTeamRating = 0; _oscSMRating = 0; _oscASMRating = 0; _oscFORating = 0;
  setOSCRating('team', r.team_rating || 0);
  setOSCRating('sm',   r.sm_rating   || 0);
  setOSCRating('asm',  r.asm_rating  || 0);
  setOSCRating('fo',   r.fo_rating   || 0);
}

async function saveOSCReport() {
  if (!state.openingId) { showToast('No opening loaded. Set up an opening first.', 'error'); return; }
  var numberOrNull = function(id) {
    var value = document.getElementById(id).value;
    return value === '' ? null : parseInt(value, 10);
  };
  var tsPresent = document.getElementById('osc-ts-present').value;
  var r = {
    ff_headcount:          numberOrNull('osc-ff-headcount'),
    weekend_bookings:      numberOrNull('osc-weekend-bookings'),
    t1_ticket_count:       numberOrNull('osc-t1-count'),
    team_resolvable:       document.getElementById('osc-team-resolvable').value            || null,
    biz_impact_notes:      document.getElementById('osc-biz-impact').value                 || null,
    deployed_by:           document.getElementById('osc-deployed-by').value                || null,
    deployment_rating:     document.getElementById('osc-deployment-rating').value          || null,
    deployment_notes:      document.getElementById('osc-deployment-notes').value           || null,
    tech_specialist:       tsPresent === '' ? null : tsPresent === 'Yes',
    tech_specialist_name:  document.getElementById('osc-ts-name').value                   || null,
    tech_specialist_notes: document.getElementById('osc-ts-notes').value                  || null,
    team_rating:           _oscTeamRating || null,
    team_notes:            document.getElementById('osc-team-notes').value                 || null,
    sm_rating:             _oscSMRating   || null,
    sm_notes:              document.getElementById('osc-sm-notes').value                   || null,
    asm_rating:            _oscASMRating  || null,
    asm_notes:             document.getElementById('osc-asm-notes').value                  || null,
    fo_rating:             _oscFORating   || null,
    fo_notes:              document.getElementById('osc-fo-notes').value                   || null
  };
  state.oscReport = r;
  const err = await dbSaveOSCReport(r);
  if (err) { showToast('Save failed: ' + (err.message || 'DB error'), 'error'); return; }
  showToast('Closing report saved!', 'success');
}

async function exportLeadershipCSV(trainingId, storeName) {
  showToast('Preparing leadership export…', 'info');
  const { data: rows, error } = await dbLoadAllLeadershipTrainingsForAdmin();
  if (error) { showToast('Export failed.', 'error'); return; }
  const t = (rows || []).find(function(r){ return r.id === trainingId; });
  if (!t) { showToast('Training not found.', 'error'); return; }

  var esc = function(v){ return '"' + String(v || '').replace(/"/g, '""') + '"'; };
  var sp = t.store_program || {};
  var participants = t.participants || [];
  var signoffs = t.signoffs || [];
  var reports = t.readiness_reports || [];
  var csvRows = [];

  csvRows.push(['LEADERSHIP TRAINING', '', '']);
  csvRows.push(['Franchise Store', esc(sp.franchise_store_name), '']);
  csvRows.push(['Training Store', esc(sp.certified_training_store_name), '']);
  csvRows.push(['Franchise Owner', esc(sp.franchise_owner_name), '']);
  csvRows.push(['Trainer', esc(t.trainer_name), '']);
  csvRows.push(['Start Date', esc(t.start_date), '']);
  csvRows.push(['Current Day', t.current_day, '']);
  csvRows.push(['', '', '']);

  csvRows.push(['PARTICIPANT ROSTER', '', '']);
  csvRows.push(['Name', 'Role', 'Signed Off', 'Progress %']);
  participants.forEach(function(p) {
    var signed = signoffs.filter(function(s){ return s.participant_id === p.id; }).length;
    var total = LEADERSHIP_COMPETENCIES.length;
    csvRows.push([esc(p.name), esc(p.role === 'Custom' && p.custom_role ? p.custom_role : p.role), signed + '/' + total, Math.round((signed/total)*100) + '%']);
  });
  csvRows.push(['', '']);

  csvRows.push(['SIGN-OFF MATRIX', '']);
  csvRows.push(['Participant', 'Role'].concat(LEADERSHIP_COMPETENCIES.map(function(c){ return esc(c.name); })));
  participants.forEach(function(p) {
    var row = [esc(p.name), esc(p.role === 'Custom' && p.custom_role ? p.custom_role : p.role)];
    LEADERSHIP_COMPETENCIES.forEach(function(c) {
      var s = signoffs.find(function(x){ return x.participant_id === p.id && x.competency_id === c.id; });
      row.push(s ? 'Signed' : 'Not Completed');
    });
    csvRows.push(row);
  });
  csvRows.push(['', '']);

  csvRows.push(['READINESS REPORTS', '']);
  csvRows.push(['Participant', 'Readiness Status', 'Rating (1-4)', 'Strengths', 'Risks', 'Follow-Ups', 'Final Notes']);
  var statusLabels = { ready: 'Ready', ready_with_support: 'Ready with Support', needs_additional_training: 'Needs Additional Training' };
  participants.forEach(function(p) {
    var r = reports.find(function(x){ return x.participant_id === p.id; }) || {};
    csvRows.push([esc(p.name), esc(statusLabels[r.readiness_status] || ''), r.rating_1_to_4 || '', esc(r.strengths), esc(r.risks), esc(r.follow_ups), esc(r.final_notes)]);
  });

  var csv = csvRows.map(function(r){ return r.join(','); }).join('\r\n');
  var blob = new Blob([csv], { type: 'text/csv' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = (storeName || 'leadership').replace(/[^a-z0-9]/gi, '-').toLowerCase() + '-leadership-export.csv';
  a.click();
  URL.revokeObjectURL(url);
  showToast('Leadership export downloaded!', 'success');
}

async function exportOpeningCSV(openingId, storeName) {
  showToast('Preparing export…', 'info');
  // Load full opening data
  const [{ data: opening }, { data: trainees }, { data: signoffs }, { data: recaps }, { data: fchecks }, { data: oscReport }] = await Promise.all([
    supabase.from('openings').select('*').eq('id', openingId).single(),
    supabase.from('trainees').select('*').eq('opening_id', openingId).order('created_at'),
    supabase.from('signoffs').select('*').eq('opening_id', openingId),
    supabase.from('recaps').select('*').eq('opening_id', openingId).order('day_num'),
    supabase.from('franchise_checks').select('*').eq('opening_id', openingId),
    supabase.from('osc_reports').select('*').eq('opening_id', openingId).order('updated_at', { ascending: false }).limit(1)
  ]);
  const closingReport = (oscReport && oscReport[0]) || null;

  var rows = [];
  var esc = function(v) { return '"' + String(v || '').replace(/"/g, '""') + '"'; };

  // Opening info
  rows.push(['OPENING INFORMATION', '', '']);
  rows.push(['Store Name', esc(opening.store_name), '']);
  rows.push(['Coach', esc(opening.coach_name), '']);
  rows.push(['Start Date', esc(opening.start_date), '']);
  rows.push(['Current Day', esc(opening.current_day), '']);
  rows.push(['Status', esc(opening.status), '']);
  rows.push(['', '', '']);

  // Roster
  rows.push(['TEAM ROSTER', '', '']);
  rows.push(['Name', 'Role', 'Signed Off', 'Progress %']);
  (trainees || []).forEach(function(t) {
    var isLeader = t.role === 'SM' || t.role === 'ASM';
    var applicable = COMPETENCIES.filter(function(c) { return !c.smOnly || isLeader; });
    var applicableIds = applicable.map(function(c) { return c.id; });
    var tSigned = (signoffs || []).filter(function(s) {
      return s.trainee_id === t.id && s.status === 'signed' && !s.competency_id.startsWith('attendance-') && applicableIds.indexOf(s.competency_id) !== -1;
    }).length;
    var total = applicable.length;
    rows.push([esc(t.name), esc(t.role), tSigned + '/' + total, Math.round((tSigned/total)*100) + '%']);
  });
  rows.push(['', '', '']);

  // Attendance (training days only — opening weekend days are not tracked)
  rows.push(['ATTENDANCE', 'Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5']);
  (trainees || []).forEach(function(t) {
    var atRow = [esc(t.name)];
    [1,2,3,4,5].forEach(function(d) {
      var rec = (signoffs || []).find(function(s){ return s.trainee_id === t.id && s.competency_id === 'attendance-d' + d; });
      atRow.push(rec ? (rec.status === 'signed' ? 'Present' : 'Absent') : 'Not recorded');
    });
    rows.push(atRow);
  });
  rows.push(['', '', '']);

  // Sign-off matrix
  rows.push(['SIGN-OFF MATRIX', '']);
  var compHeaders = ['Trainee', 'Role'].concat(COMPETENCIES.map(function(c){ return esc(c.name); }));
  rows.push(compHeaders);
  (trainees || []).forEach(function(t) {
    var isLeaderT = t.role === 'SM' || t.role === 'ASM';
    var row = [esc(t.name), esc(t.role)];
    COMPETENCIES.forEach(function(c) {
      if (c.smOnly && !isLeaderT) { row.push('N/A'); return; }
      var s = (signoffs || []).find(function(x){ return x.trainee_id === t.id && x.competency_id === c.id; });
      row.push(s && s.status === 'signed' ? 'Signed' : 'Not Completed');
    });
    rows.push(row);
  });
  rows.push(['', '']);

  // Recaps
  var recapDayNames = {1:'Day 1',2:'Day 2',3:'Day 3',4:'Day 4',5:'Day 5',6:'Fri Open',7:'Sat Open',8:'Sun Open'};
  rows.push(['DAILY RECAPS', '']);
  rows.push(['Day', 'Building', 'Tech / MoCap', 'Tech Tickets', 'L&D Progress', 'L&D Delays', 'Team Progress', 'Team Successes', 'Team Opportunities', 'SM Execution', 'Problems Noted', 'Actions']);
  [1,2,3,4,5,6,7,8].forEach(function(d) {
    var r = (recaps || []).find(function(x){ return x.day_num === d; });
    var rd = (r && r.recap_data) || {};
    var problems = ['building','tech','ld','team','supplies'].map(function(s){ return rd[s+'-problem']; }).filter(Boolean).join(' | ');
    var actions  = ['building','tech','ld','team','supplies'].map(function(s){ return rd[s+'-actions']; }).filter(Boolean).join(' | ');
    rows.push([
      recapDayNames[d],
      esc((rd['building-permits'] || '') + (rd['building-construction'] ? ' | ' + rd['building-construction'] : '')),
      esc(rd['tech-mscap']),
      esc(rd['tech-tickets']),
      esc(rd['ld-progress']),
      esc(rd['ld-delays']),
      esc(rd['team-progress']),
      esc(rd['team-successes']),
      esc(rd['team-opportunities']),
      esc(rd['sm-execution']),
      esc(problems),
      esc(actions)
    ]);
  });
  rows.push(['', '']);

  // Day 0 Checks
  rows.push(['DAY 0 READINESS CHECKS', '']);
  rows.push(['Group', 'Check', 'Status']);
  var fcMap = {};
  (fchecks || []).forEach(function(fc){ fcMap[fc.check_key] = fc.checked; });
  FRANCHISE_CHECK_GROUPS.forEach(function(grp) {
    grp.checks.forEach(function(c) {
      rows.push([esc(grp.group), esc(c.label), fcMap[c.key] ? 'Complete' : 'Incomplete']);
    });
  });
  rows.push(['', '']);

  // OSC Report
  rows.push(['POST-OPENING OSC REPORT', '']);
  if (closingReport) {
    rows.push(['Field', 'Value']);
    rows.push(['F&F Headcount', esc(closingReport.ff_headcount)]);
    rows.push(['Weekend Bookings', esc(closingReport.weekend_bookings)]);
    rows.push(['T1 Ticket Count', esc(closingReport.t1_ticket_count)]);
    rows.push(['Team-Resolvable Issues', esc(closingReport.team_resolvable)]);
    rows.push(['Business Impact Notes', esc(closingReport.biz_impact_notes)]);
    rows.push(['Deployment Lead', esc(closingReport.deployed_by)]);
    rows.push(['Deployment Rating', esc(closingReport.deployment_rating)]);
    rows.push(['Deployment Notes', esc(closingReport.deployment_notes)]);
    rows.push(['Tech Specialist On-Site', closingReport.tech_specialist ? 'Yes' : 'No']);
    rows.push(['Tech Specialist Name', esc(closingReport.tech_specialist_name)]);
    rows.push(['Tech Specialist Notes', esc(closingReport.tech_specialist_notes)]);
    rows.push(['Team Rating', esc(closingReport.team_rating)]);
    rows.push(['Team Notes', esc(closingReport.team_notes)]);
    rows.push(['SM Rating', esc(closingReport.sm_rating)]);
    rows.push(['SM Notes', esc(closingReport.sm_notes)]);
    rows.push(['ASM Rating', esc(closingReport.asm_rating)]);
    rows.push(['ASM Notes', esc(closingReport.asm_notes)]);
    rows.push(['FO Rating', esc(closingReport.fo_rating)]);
    rows.push(['FO Notes', esc(closingReport.fo_notes)]);
  } else {
    rows.push(['OSC report not yet completed', '']);
  }

  var csv = rows.map(function(r){ return r.join(','); }).join('\r\n');
  var blob = new Blob([csv], { type: 'text/csv' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = (storeName || 'opening').replace(/[^a-z0-9]/gi, '-').toLowerCase() + '-export.csv';
  a.click();
  URL.revokeObjectURL(url);
  showToast('Export downloaded!', 'success');
}

async function renderUserManagement() {
  var container = document.getElementById('adminUsersList');
  if (!container) return;
  container.innerHTML = '<div style="padding:16px;color:var(--text-muted);font-size:13px">Loading users…</div>';

  const { data: profiles, error } = await supabase.from('profiles').select('*').order('created_at');
  if (error || !profiles) {
    container.innerHTML = '<div style="padding:16px;color:var(--danger);font-size:13px">Could not load users. Check RLS policies allow admin to select all profiles.</div>';
    return;
  }

  var html = profiles.map(function(p) {
    var isAdmin = p.role === 'admin';
    var isSelf = p.email === state.userEmail;
    return '<div style="display:flex;align-items:center;gap:12px;padding:14px 0;border-bottom:1px solid var(--border-light)">' +
      '<div style="width:36px;height:36px;border-radius:50%;background:' + (isAdmin ? 'var(--hb)' : 'var(--surface)') + ';border:1px solid ' + (isAdmin ? 'var(--hb)' : 'var(--border)') + ';display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:' + (isAdmin ? '#fff' : 'var(--text-secondary)') + '">' + (p.full_name || p.email || '?').charAt(0).toUpperCase() + '</div>' +
      '<div style="flex:1;min-width:0">' +
        '<div style="font-size:14px;font-weight:600;color:var(--hb)">' + (p.full_name || '—') + (isSelf ? ' <span style="font-size:11px;color:var(--trigger);font-weight:700">(you)</span>' : '') + '</div>' +
        '<div style="font-size:12px;color:var(--text-secondary);margin-top:1px">' + (p.email || '—') + '</div>' +
      '</div>' +
      '<span class="badge ' + (isAdmin ? 'badge-blue' : 'badge-gray') + '">' + (isAdmin ? 'Admin' : 'Coach') + '</span>' +
      (!isSelf ? '<button class="btn btn-ghost" style="font-size:12px;padding:5px 12px" onclick="toggleUserRole(\'' + p.id + '\', \'' + p.email + '\', \'' + p.role + '\')">' + (isAdmin ? 'Make Coach' : 'Make Admin') + '</button>' : '<div style="width:95px"></div>') +
    '</div>';
  }).join('');

  container.innerHTML = html || '<div style="padding:16px;color:var(--text-muted);font-size:13px">No users found.</div>';
}

async function toggleUserRole(profileId, email, currentRole) {
  var newRole = currentRole === 'admin' ? 'coach' : 'admin';
  var label = newRole === 'admin' ? 'admin' : 'coach';
  if (!confirm('Change ' + email + ' to ' + label + '?')) return;
  const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', profileId);
  if (error) {
    showToast('Error: ' + error.message, 'error');
    return;
  }
  showToast(email + ' is now a ' + label + '.', 'success');
  renderUserManagement();
}

function toggleAdminOpening(id) {
  const el = document.getElementById(id);
  const chevron = document.getElementById('chevron-' + id);
  const isOpen = el.style.display !== 'none';
  el.style.display = isOpen ? 'none' : 'block';
  if (chevron) chevron.style.transform = isOpen ? '' : 'rotate(180deg)';
}

async function exportAllAdmin() {
  const allOpenings = await dbLoadAllOpenings();

  let csv = 'Store,Coach,Date,Day,Trainee,Role,Signoffs,Recap Days Complete\n';
  allOpenings.forEach(o => {
    const trainees = o.trainees || [];
    const signoffs = o.signoffs || [];
    const recaps = o.recaps || [];
    const recapCount = recaps.filter(r => r.recap_data && Object.values(r.recap_data).some(v => v)).length;
    if (trainees.length === 0) {
      csv += `"${o.store_name||''}","${o.coach_name||''}","${o.start_date||''}","${o.current_day||''}","(no trainees)","","","${recapCount}"\n`;
    } else {
      trainees.forEach(t => {
        const tc = signoffs.filter(s => s.trainee_id === t.id && s.status === 'signed').length;
        csv += `"${o.store_name||''}","${o.coach_name||''}","${o.start_date||''}","${o.current_day||''}","${t.name}","${t.role}","${tc}/${COMPETENCIES.length}","${recapCount}"\n`;
      });
    }
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download='nso_admin_export.csv'; a.click();
  showToast('Admin data exported!', 'success');
}

// ============================================================
// TRAINING VIDEOS
// ============================================================
// ============================================================
// RESOURCES PAGE
// ============================================================
function renderResourcesPage() {
  var el = document.getElementById('resourcesPageContent');
  if (!el) return;

  var RESOURCES = [
    {
      id: 'guest-journey',
      label: 'Guest Journey',
      icon: '🎭',
      videos: [
        { title: 'CH 1 — Introduction to Guest Journey', url: 'https://app.delightree.com/chapters/view/kz3q68dxq5n5inwaw936b9n6' },
        { title: 'CH 2 — Lobby', url: 'https://app.delightree.com/chapters/view/rzbo5apd44j8hlqlmnj84j9j' },
        { title: 'CH 3 — Barracks', url: 'https://app.delightree.com/chapters/view/4qjzk9n9nb9pflqlx3knzplx' },
        { title: 'CH 4 — Holodeck', url: 'https://app.delightree.com/chapters/view/2l97zx7x6knatlaba3x6kw26' },
        { title: 'CH 5 — Post Experience', url: 'https://app.delightree.com/chapters/view/7qz9kwplp6d306zomwonop6w' }
      ],
      written: [
        { title: 'Guest Journey QRG', url: 'https://app.delightree.com/chapters/view/aamkrj6aq256u869nq4rwdzo' },
        { title: 'Sandbox VR Website', url: 'http://sandboxvr.com' }
      ]
    },
    {
      id: 'experiences',
      label: 'Experiences',
      icon: '🕹️',
      videos: [
        { title: 'Age of Dinosaurs', url: 'https://app.delightree.com/chapters/view/7qqxb9naljwdu96kzkwb3l5l' },
        { title: 'Deadwood Phobia', url: 'https://app.delightree.com/chapters/view/aamqzj6366jou86e8x82xd8r' },
        { title: 'Exterminator', url: 'https://app.delightree.com/chapters/view/o9oqp69znp640zqxdrnbam83' },
        { title: 'Gatling Gun', url: 'https://app.delightree.com/chapters/view/2l97zzkazjpzsol45dpnnklo' }
      ],
      written: [
        { title: '— Quick Reference Guides —', url: null },
        { title: 'Age of Dinosaurs QRG', url: 'https://app.delightree.com/chapters/view/9qq6wqbd23pkuxo78k7xwwx6' },
        { title: 'Deadwood Phobia QRG', url: 'https://app.delightree.com/chapters/view/d8dbborn63zbi6mwloae82ad' },
        { title: 'Squid Game Virtuals QRG', url: 'https://app.delightree.com/chapters/view/rzb7mz4j4blmtzaokkez6pn7' },
        { title: 'Stranger Things Catalyst QRG', url: 'https://app.delightree.com/chapters/view/6qqj7mezdjxrfb7x4rlap35b' },
        { title: 'Rebel Moon QRG', url: 'https://app.delightree.com/chapters/view/4qjppor3o3a6ulaarzqdj762' },
        { title: '— Ops Flow Guides —', url: null },
        { title: 'Ops Flow Guide | Deadwood Mansion', url: 'https://app.delightree.com/chapters/view/nm84468wlmqp0z99djk7nk7x' },
        { title: 'Ops Flow Guide | Curse of Davy Jones', url: 'https://app.delightree.com/chapters/view/b5525wj2zqp8saanwl74naj9' },
        { title: 'Ops Flow Guide | Unbound Fighting League', url: 'https://app.delightree.com/chapters/view/3lzwwnldmqzp0ae3z2nwj43n' },
        { title: 'Ops Flow Guide | Deadwood Valley', url: 'https://app.delightree.com/chapters/view/xxmjjqmn5bkxs3o8aoq64jzj' },
        { title: 'Ops Flow Guide | Deadwood Phobia', url: 'https://app.delightree.com/chapters/view/8qo22eok3zqnfbll6mxwzxwx' },
        { title: 'Ops Flow Guide | Birthday Selfie', url: 'https://app.delightree.com/chapters/view/nm8446878r9mcj5pn5l427ll' },
        { title: 'Ops Flow Guide | Amber Sky', url: 'https://app.delightree.com/chapters/view/zb4jjq4rkj3l0dn4l6n3z636' },
        { title: 'Ops Flow Guide | Age of Dinosaurs', url: 'https://app.delightree.com/chapters/view/qnn7wn3wp72bu8ajnl4no673' },
        { title: 'Ops Flow Guide | Stranger Things Catalyst', url: 'https://app.delightree.com/chapters/view/b55ej7akq33qurkmw4k343n5' },
        { title: 'Ops Flow Guide | Rebel Moon', url: 'https://app.delightree.com/chapters/view/eo5eex68x5k9u8pa47n7w6r9' },
        { title: 'Ops Flow Guide | Dragonfire', url: 'https://app.delightree.com/chapters/view/6qzpe76eqaxjuwp9jaldoaq6' }
      ]
    },
    {
      id: 'tracking',
      label: 'Tracking',
      icon: '📡',
      videos: [
        { title: 'CH 1 — Active Tracking Headmount Intro', url: 'https://app.delightree.com/chapters/view/nm8qwxowdn3lizmdwkb392kb' },
        { title: 'CH 2 — Active Tracking Headmount Control Panel & Modes', url: 'https://app.delightree.com/chapters/view/qn6q3ex3wb7mfbdwb4bna8x9' },
        { title: 'CH 3 — Active Tracking Headmount Troubleshooting and Care', url: 'https://app.delightree.com/chapters/view/lznqb2x884jr0wkdw6w329z5' },
        { title: 'CH 4 — Passive Tracking Intro', url: 'https://app.delightree.com/chapters/view/kz3q66aal9baclewb2359e2q' },
        { title: 'CH 5 — Passive Tracking Props', url: 'https://app.delightree.com/chapters/view/aamqzz73az8btwmkr7j4zz6w' },
        { title: 'CH 6 — Passive Limb Tracker Assembly', url: 'https://app.delightree.com/chapters/view/zb43wwlaej32fl256wkn77ab' },
        { title: 'CH 7 — Passive Tracking Prop Tracker Assembly', url: 'https://app.delightree.com/chapters/view/xxmpbbxklb9aideb7qwojbw8' }
      ],
      written: [
        { title: 'Calibration SOP', url: 'https://app.delightree.com/chapters/view/o9ozzbz7nnxx0xkd87bxqll4' },
        { title: 'Building Trackers SOP', url: 'https://app.delightree.com/chapters/view/zb46rae6n8251pkl3k893re4' },
        { title: 'Camera Calibration Cheat Sheet', url: 'https://app.delightree.com/chapters/view/6qqwpx259np4hbp3elo232l9' },
        { title: 'MoCap Camera Cheat Sheet', url: 'https://app.delightree.com/chapters/view/6qqwpx259np4hbp3elo232l9' },
        { title: 'Tracker Build Charts', url: 'https://app.delightree.com/chapters/view/6qz3368zn355frn964or844x' }
      ],
      images: [
        { title: 'Tracker Ball Washer Assembly Guide', file: 'tracker washer diagram.png' }
      ]
    },
    {
      id: 'wireless',
      label: 'HTC Headset and Wireless Streaming',
      icon: '📶',
      videos: [
        { title: 'CH 1 — Intro to Wireless', url: 'https://app.delightree.com/chapters/view/qn6q38w5ow6a16x89xjbrn42' },
        { title: 'CH 2 — HTC Basics Wireless', url: 'https://app.delightree.com/chapters/view/eo5ql8w73487u7lbmde4wbx2' },
        { title: 'CH 3 — Hardware and Software Infrastructure', url: 'https://app.delightree.com/chapters/view/6qz4ke8e5e5qhxaek6edjm2z' },
        { title: 'CH 4 — Wireless Daily Operations', url: 'https://app.delightree.com/chapters/view/nm8qwpjw48kjczmdwkdoe79p' }
      ],
      written: [
        { title: 'HTC Kiosk Mode SOP', url: 'https://app.delightree.com/chapters/view/4qq5awwxkmn31l9eqpjm43qe' },
        { title: 'HTC Cheat Sheet', url: 'https://app.delightree.com/chapters/view/5qqewolj7jp2izll7ooo4ak8' },
        { title: 'HTC Vive Focus Vision SOP', url: 'https://app.delightree.com/chapters/view/j44m68zew4b9twz58noze47m' },
        { title: 'HTC Wireless Streaming SOP', url: 'https://app.delightree.com/chapters/view/qn6mmwmmk3ezh8aw5kaxkw83' },
        { title: 'HTC Handling QRG', url: 'https://app.delightree.com/chapters/view/b5mqdo42wro6ta7r4xwj5kpj' }
      ]
    },
    {
      id: 'servers',
      label: 'Holodeck Room Servers',
      icon: '🖥️',
      videos: [
        { title: 'CH 1 — Introduction', url: 'https://app.delightree.com/chapters/view/6qz4kkmjj2pbuxaek6j3lqbm' },
        { title: 'CH 2 — VNC', url: 'https://app.delightree.com/chapters/view/7qz9k29par75ipw9bw7639lp' },
        { title: 'CH 3 — Daily Operations and Care', url: 'https://app.delightree.com/chapters/view/b5mqdw47pzad1pn8wmmzaqbk' }
      ],
      written: []
    },
    {
      id: 'vests',
      label: 'Haptic Feedback Vests',
      icon: '🦺',
      videos: [
        { title: 'CH 1 — Introduction to Vests', url: 'https://app.delightree.com/chapters/view/rzbo5lzdjko6ul64b95a2j5e' },
        { title: 'CH 2 — Vest Pairing', url: 'https://app.delightree.com/chapters/view/mj8qelb9d9w3sqxw37b9lnzd' },
        { title: 'CH 3 — Vest Operations', url: 'https://app.delightree.com/chapters/view/qn6q3lboedjoh5oz3xp2zbj8' }
      ],
      written: [
        { title: 'Quick Reference Guide: Haptic Feedback Vests', url: 'https://app.delightree.com/chapters/view/2l9eep69x5jj0ezo58l8zx6m' },
        { title: 'Vest TactSuit Pro SOP', url: 'https://app.delightree.com/chapters/view/o994xpbl4lz4czlnppk2jj6d' },
        { title: 'Vest Maintenance and Handling SOP', url: 'https://app.delightree.com/chapters/view/mj877xnm89pn0dzajq2qzbnp' },
        { title: 'TactSuit X40 Vest SOP', url: 'https://app.delightree.com/chapters/view/2l9eep69x5jj0ezo58l8zx6m' }
      ]
    },
    {
      id: 'props',
      label: 'Props',
      icon: '🎮',
      videos: [
        { title: 'CH 1 — WiFi Prop Pairing & Troubleshooting', url: 'https://app.delightree.com/chapters/view/o9oqp8a6o43lizwrp8l6amza' },
        { title: 'CH 2 — Building Props', url: 'https://app.delightree.com/chapters/view/9qxojzxldz3dtezr3jnb7dp5' },
        { title: 'CH 3 — Props Daily Operations and Care', url: 'https://app.delightree.com/chapters/view/xxx3qoqnpm45c6oqmq9j267o' }
      ],
      written: [
        { title: 'Prop Operations Cheat Sheet', url: 'https://app.delightree.com/chapters/view/xxx7oeaqde3oue7798456kpe' },
        { title: 'WiFi Prop Troubleshooting Cheat Sheet', url: 'https://app.delightree.com/chapters/view/xxx7oeaqde3oue7798456kpe' },
        { title: 'WiFi Props QRG', url: 'https://app.delightree.com/chapters/view/9qxrrw4z6qe7ur83bwpr4wed' }
      ]
    },
    {
      id: 'silica',
      label: 'Checkfront, Silica & Command Bar',
      icon: '💻',
      videos: [
        { title: 'CH 1 — Intro and Mobile Check-In', url: 'https://app.delightree.com/chapters/view/qnn62o8el7a9h885pblbwmqp' },
        { title: 'CH 2 — Running Sessions', url: 'https://app.delightree.com/chapters/view/j44nba73ea9mtjlnoador9b7' }
      ],
      written: [
        { title: 'SOP: Checkfront', url: 'https://app.delightree.com/chapters/view/5qqrqm2ko4ansm272keoq6wx' },
        { title: 'Command Bar SOP', url: 'https://app.delightree.com/chapters/view/eo5z2kwe2eb8ubjeoo55x78z' }
      ]
    },
    {
      id: 't1',
      label: 'T1 Workflow & Escalation',
      icon: '🎫',
      videos: [
        { title: 'T1 Communication', url: 'https://app.delightree.com/chapters/view/b5mq93opkldqt5mqd4rn3b34' }
      ],
      written: [
        { title: 'T1 Support Tickets', url: 'https://app.delightree.com/chapters/view/j4nqrk83kokbh4pz935o78d9' }
      ]
    },
    {
      id: 'checklists',
      label: 'Checklists & SOPs',
      icon: '📋',
      videos: [],
      written: [
        { title: 'Opening Checklist', url: 'https://app.delightree.com/chapters/view/qn6mmw3r88bbcbnkxl7lmw7p' },
        { title: 'Closing Checklist', url: 'https://app.delightree.com/chapters/view/zb4jjqwwm4e60zqd8lpl362r' },
        { title: 'Store Cleaning SOP', url: 'https://app.delightree.com/chapters/view/9qxrrw548blphl34935lz7lm' },
        { title: 'Restroom Cleaning Checklist', url: 'https://app.delightree.com/chapters/view/pzxaaen5x6d4u6xj5838bpnd' }
      ]
    }
  ];

  function linkRow(item, type) {
    // Section header rows (url === null)
    if (!item.url) {
      return '<div style="font-size:10px;font-weight:700;letter-spacing:.05em;color:var(--text-muted);text-transform:uppercase;padding:10px 10px 2px;margin-top:4px">'
        + item.title.replace(/^—\s*/, '').replace(/\s*—$/, '')
        + '</div>';
    }
    var isVideo = type === 'video';
    var icon = isVideo
      ? '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="var(--trigger)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 13 8 5 13 5 3" fill="var(--trigger)"/></svg>'
      : '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="var(--text-secondary)" stroke-width="1.8" stroke-linecap="round"><path d="M4 2h8a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z"/><path d="M6 6h4M6 9h4M6 12h2"/></svg>';
    return '<a href="' + item.url + '" target="_blank" style="display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:6px;text-decoration:none;color:var(--text-primary);font-size:12.5px;transition:background 0.12s" onmouseover="this.style.background=\'var(--surface)\'" onmouseout="this.style.background=\'transparent\'">'
      + icon + '<span style="flex:1">' + item.title + '</span>'
      + '<svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="var(--text-muted)" stroke-width="2" stroke-linecap="round" style="flex-shrink:0"><path d="M3 8h10M8 3l5 5-5 5"/></svg>'
      + '</a>';
  }

  var html = '<div class="page-header" style="margin-bottom:24px"><div>'
    + '<div class="eyebrow">RESOURCES</div>'
    + '<div class="page-title">NSO Resources</div>'
    + '<div class="page-subtitle">All Delightree eLearning, videos, SOPs, and quick reference guides — organized by topic.</div>'
    + '</div></div>';

  // Learning Plan hero link
  html += '<div class="card mb-24" style="background:var(--trigger-light);border:1.5px solid var(--trigger)">'
    + '<div class="card-body" style="display:flex;align-items:center;justify-content:space-between;gap:16px">'
    + '<div><div style="font-weight:700;color:var(--hb);margin-bottom:2px">NSO GEG Learning Plan</div>'
    + '<div style="font-size:12px;color:var(--text-secondary)">The master agenda for the 3-day training program — always open this first.</div></div>'
    + '<a href="https://app.delightree.com/chapters/view/nmm89lolo598sr5opzam7nz3" target="_blank" class="btn btn-primary" style="white-space:nowrap;flex-shrink:0">Open on Delightree →</a>'
    + '</div></div>';

  html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px">';

  RESOURCES.forEach(function(cat) {
    html += '<div class="card">'
      + '<div class="card-header" style="padding-bottom:0">'
      + '<div style="display:flex;align-items:center;gap:8px"><span style="font-size:18px">' + cat.icon + '</span>'
      + '<div class="card-title" style="font-size:14px">' + cat.label + '</div></div>'
      + '</div>'
      + '<div style="padding:8px 6px 16px;display:flex;flex-direction:column;gap:1px">';

    if (cat.videos.length > 0) {
      html += '<div style="font-size:10px;font-weight:700;letter-spacing:.06em;color:var(--text-muted);text-transform:uppercase;padding:8px 10px 4px">Videos / eLearning</div>';
      cat.videos.forEach(function(v) { html += linkRow(v, 'video'); });
    }
    if (cat.written.length > 0) {
      html += '<div style="font-size:10px;font-weight:700;letter-spacing:.06em;color:var(--text-muted);text-transform:uppercase;padding:8px 10px 4px' + (cat.videos.length ? ';margin-top:4px;border-top:1px solid var(--border-light)' : '') + '">SOPs & Written Materials</div>';
      cat.written.forEach(function(w) { html += linkRow(w, 'written'); });
    }

    if (cat.images && cat.images.length > 0) {
      html += '<div style="border-top:1px solid var(--border-light);margin-top:8px;padding:10px 10px 4px">';
      html += '<div style="font-size:10px;font-weight:700;letter-spacing:.06em;color:var(--text-muted);text-transform:uppercase;margin-bottom:10px">Reference Diagrams</div>';
      cat.images.forEach(function(img) {
        var src = img.file.split('').map(function(c){ return c === ' ' ? '%20' : c; }).join('');
        html += '<a href="' + src + '" target="_blank" title="Click to open full size" style="display:block;border:1px solid var(--border-light);border-radius:var(--radius-md);overflow:hidden;margin-bottom:8px;text-decoration:none;transition:box-shadow 0.15s" onmouseover="this.style.boxShadow=\'var(--shadow-md)\'" onmouseout="this.style.boxShadow=\'none\'">'
          + '<img src="' + src + '" alt="' + img.title + '" style="width:100%;display:block">'
          + '<div style="padding:7px 10px;background:var(--surface);display:flex;align-items:center;justify-content:space-between;gap:8px">'
          + '<span style="font-size:11.5px;font-weight:500;color:var(--text-secondary)">' + img.title + '</span>'
          + '<span style="font-size:11px;color:var(--trigger);white-space:nowrap">Open full size →</span>'
          + '</div></a>';
      });
      html += '</div>';
    }

    html += '</div></div>';
  });

  html += '</div>';
  el.innerHTML = html;
}


function renderVideosPage() {
  var el = document.getElementById('pageContent');
  if (!el) return;

  var VIDEOS = {
    'Tech Essentials: Tracking': [
      { title: 'CH 1 — Active Tracking Headmount Intro', url: 'https://app.delightree.com/chapters/view/nm8qwxowdn3lizmdwkb392kb' },
      { title: 'CH 2 — Active Tracking Headmount Control Panel & Modes', url: 'https://app.delightree.com/chapters/view/qn6q3ex3wb7mfbdwb4bna8x9' },
      { title: 'CH 3 — Active Tracking Headmount Troubleshooting and Care', url: 'https://app.delightree.com/chapters/view/lznqb2x884jr0wkdw6w329z5' },
      { title: 'CH 4 — Passive Tracking Intro', url: 'https://app.delightree.com/chapters/view/kz3q66aal9baclewb2359e2q' },
      { title: 'CH 5 — Passive Tracking Props', url: 'https://app.delightree.com/chapters/view/aamqzz73az8btwmkr7j4zz6w' },
      { title: 'CH 6 — Passive Limb Tracker Assembly', url: 'https://app.delightree.com/chapters/view/zb43wwlaej32fl256wkn77ab' },
      { title: 'CH 7 — Passive Tracking Prop Tracker Assembly', url: 'https://app.delightree.com/chapters/view/xxmpbbxklb9aideb7qwojbw8' },
    ],
    'Tech Essentials: Wireless': [
      { title: 'CH 1 — Intro to Wireless', url: 'https://app.delightree.com/chapters/view/qn6q38w5ow6a16x89xjbrn42' },
      { title: 'CH 2 — HTC Basics Wireless', url: 'https://app.delightree.com/chapters/view/eo5ql8w73487u7lbmde4wbx2' },
      { title: 'CH 3 — Hardware and Software Infrastructure', url: 'https://app.delightree.com/chapters/view/6qz4ke8e5e5qhxaek6edjm2z' },
      { title: 'CH 4 — Wireless Daily Operations', url: 'https://app.delightree.com/chapters/view/nm8qwpjw48kjczmdwkdoe79p' },
    ],
    'Tech Essentials: Holodeck Server Rack': [
      { title: 'CH 1 — Introduction', url: 'https://app.delightree.com/chapters/view/6qz4kkmjj2pbuxaek6j3lqbm' },
      { title: 'CH 2 — VNC', url: 'https://app.delightree.com/chapters/view/7qz9k29par75ipw9bw7639lp' },
      { title: 'CH 3 — Daily Operations and Care', url: 'https://app.delightree.com/chapters/view/b5mqdw47pzad1pn8wmmzaqbk' },
    ],
    'Tech Essentials: Haptic Vests': [
      { title: 'CH 1 — Introduction to Vests', url: 'https://app.delightree.com/chapters/view/rzbo5lzdjko6ul64b95a2j5e' },
      { title: 'CH 2 — Vest Pairing', url: 'https://app.delightree.com/chapters/view/mj8qelb9d9w3sqxw37b9lnzd' },
      { title: 'CH 3 — Vest Operations', url: 'https://app.delightree.com/chapters/view/qn6q3lboedjoh5oz3xp2zbj8' },
    ],
    'Tech Essentials: Props': [
      { title: 'CH 1 — WiFi Prop Pairing & Troubleshooting', url: 'https://app.delightree.com/chapters/view/o9oqp8a6o43lizwrp8l6amza' },
      { title: 'CH 2 — Building Props', url: 'https://app.delightree.com/chapters/view/9qxojzxldz3dtezr3jnb7dp5' },
      { title: 'CH 3 — Props Daily Operations and Care', url: 'https://app.delightree.com/chapters/view/xxx3qoqnpm45c6oqmq9j267o' },
    ],
    'Tech Essentials: Silica': [
      { title: 'CH 1 — Intro and Mobile Check-In', url: 'https://app.delightree.com/chapters/view/qnn62o8el7a9h885pblbwmqp' },
      { title: 'CH 2 — Running Sessions', url: 'https://app.delightree.com/chapters/view/j44nba73ea9mtjlnoador9b7' },
    ],
    'Tech Essentials: Other': [
      { title: 'T1 Communication', url: 'https://app.delightree.com/chapters/view/b5mq93opkldqt5mqd4rn3b34' },
      { title: 'HTC Handling Guide', url: 'https://app.delightree.com/chapters/view/b5mqdo42wro6ta7r4xwj5kpj' },
    ],
    'Service Essentials: Guest Journey': [
      { title: 'CH 1 — Introduction to Guest Journey', url: 'https://app.delightree.com/chapters/view/kz3q68dxq5n5inwaw936b9n6' },
      { title: 'CH 2 — Lobby', url: 'https://app.delightree.com/chapters/view/rzbo5apd44j8hlqlmnj84j9j' },
      { title: 'CH 3 — Barracks', url: 'https://app.delightree.com/chapters/view/4qjzk9n9nb9pflqlx3knzplx' },
      { title: 'CH 4 — Holodeck', url: 'https://app.delightree.com/chapters/view/2l97zx7x6knatlaba3x6kw26' },
      { title: 'CH 5 — Post Experience', url: 'https://app.delightree.com/chapters/view/7qz9kwplp6d306zomwonop6w' },
    ],
    'Service Essentials: Experiences': [
      { title: 'Age of Dinosaurs', url: 'https://app.delightree.com/chapters/view/7qqxb9naljwdu96kzkwb3l5l' },
      { title: 'Deadwood Phobia', url: 'https://app.delightree.com/chapters/view/aamqzj6366jou86e8x82xd8r' },
      { title: 'Exterminator', url: 'https://app.delightree.com/chapters/view/o9oqp69znp640zqxdrnbam83' },
      { title: 'Gatling Gun', url: 'https://app.delightree.com/chapters/view/2l97zzkazjpzsol45dpnnklo' },
    ],
  };

  var sectionColors = {
    'Tech Essentials: Tracking': 'var(--trigger)',
    'Tech Essentials: Wireless': 'var(--trigger)',
    'Tech Essentials: Holodeck Server Rack': 'var(--trigger)',
    'Tech Essentials: Haptic Vests': 'var(--trigger)',
    'Tech Essentials: Props': 'var(--trigger)',
    'Tech Essentials: Silica': 'var(--trigger)',
    'Tech Essentials: Other': 'var(--trigger)',
    'Service Essentials: Guest Journey': 'var(--warp)',
    'Service Essentials: Experiences': 'var(--warp)',
  };

  var html = '<div class="page-header" style="margin-bottom:24px"><div>' +
    '<div class="page-title">Training Videos</div>' +
    '<div class="page-subtitle">All Delightree training videos — cast to the post-experience TV during each block.</div>' +
    '</div></div>';

  html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px">';

  Object.keys(VIDEOS).forEach(function(section) {
    var color = sectionColors[section] || 'var(--trigger)';
    var isTech = section.startsWith('Tech');
    var badgeColor = isTech ? 'blue' : 'green';
    html += '<div class="card">';
    html += '<div class="card-header" style="padding-bottom:12px">';
    html += '<div class="card-title" style="font-size:14px">' + section + '</div>';
    html += '<span class="badge badge-' + badgeColor + '">' + (isTech ? 'Tech' : 'Service') + '</span>';
    html += '</div>';
    html += '<div style="display:flex;flex-direction:column;gap:6px;padding:0 20px 16px">';
    VIDEOS[section].forEach(function(v) {
      html += '<a href="' + v.url + '" target="_blank" style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:var(--radius-sm);border:1px solid var(--border-light);text-decoration:none;color:var(--text-primary);font-size:13px;transition:background 0.15s" onmouseover="this.style.background=\'var(--surface)\'" onmouseout="this.style.background=\'transparent\'">' +
        '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><polygon points="5 3 19 12 5 21 5 3"/></svg>' +
        '<span>' + v.title + '</span>' +
        '</a>';
    });
    html += '</div></div>';
  });

  html += '</div>';
  el.innerHTML = html;
}

// ============================================================
// LEADERSHIP LENS
// ============================================================
function renderLeadershipLens() {
  const container = document.getElementById('leadershipContent');
  if (!container) return;

  container.innerHTML = `
  <div class="card mb-20" style="border-left:3px solid var(--trigger);background:var(--trigger-light)">
    <div class="card-body" style="padding:20px 24px">
      <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:var(--trigger);font-weight:700;margin-bottom:8px">Opening Support Coach Role</div>
      <div style="font-size:14px;line-height:1.7;color:var(--hb)">Opening Support Coaches are responsible for more than helping a store get through opening week. They model the operating habits new leaders need after support leaves: <strong>financial awareness, labor discipline, equipment care, facility readiness, guest-first execution, and leadership ownership.</strong></div>
    </div>
  </div>

  <div class="grid-3" style="margin-bottom:24px">
    <div class="card">
      <div class="card-header">
        <div>
          <div style="font-size:20px;margin-bottom:6px">📊</div>
          <div class="card-title">Know the Numbers</div>
          <div class="card-subtitle">Coach leaders to understand the business, not just run it</div>
        </div>
      </div>
      <div class="card-body" style="display:flex;flex-direction:column;gap:10px">
        <div style="font-size:13px;color:var(--text-secondary);line-height:1.6">Strong store leaders know their Daily Budgeted Goal before the first guest walks in. They know what LY did. And they know what today's performance means for the week.</div>
        <div style="border-top:1px solid var(--border-light);padding-top:10px">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--trigger);margin-bottom:8px">Coach Them On</div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <div style="font-size:13px;color:var(--hb);display:flex;gap:8px;align-items:flex-start"><span style="color:var(--trigger);flex-shrink:0">→</span>What is today's Daily Budgeted Goal and where does it come from?</div>
            <div style="font-size:13px;color:var(--hb);display:flex;gap:8px;align-items:flex-start"><span style="color:var(--trigger);flex-shrink:0">→</span>What did Last Year (LY) do on this day — and why does the comparison matter?</div>
            <div style="font-size:13px;color:var(--hb);display:flex;gap:8px;align-items:flex-start"><span style="color:var(--trigger);flex-shrink:0">→</span>How do leaders explain business performance to their team in a motivating way?</div>
            <div style="font-size:13px;color:var(--hb);display:flex;gap:8px;align-items:flex-start"><span style="color:var(--trigger);flex-shrink:0">→</span>What does it mean to be "above goal" vs. "below goal" in real operational terms?</div>
          </div>
        </div>
        <div style="background:var(--surface);border-radius:var(--radius-md);padding:10px 12px;font-size:12px;color:var(--text-secondary);border:1px solid var(--border-light)"><strong>Coaching prompt:</strong> Ask the SM to brief you on today's numbers as if you were a new team member at the morning huddle. Coach the delivery, not just the accuracy.</div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div>
          <div style="font-size:20px;margin-bottom:6px">⚖️</div>
          <div class="card-title">Protect the Margin</div>
          <div class="card-subtitle">Labor discipline is a leadership habit, not a finance task</div>
        </div>
      </div>
      <div class="card-body" style="display:flex;flex-direction:column;gap:10px">
        <div style="font-size:13px;color:var(--text-secondary);line-height:1.6">New leaders often staff for comfort instead of demand. Opening Support Coaches help them build the habit of reading real-time bookings and heat maps to make staffing decisions that protect margin without hurting the guest experience.</div>
        <div style="border-top:1px solid var(--border-light);padding-top:10px">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--trigger);margin-bottom:8px">Coach Them On</div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <div style="font-size:13px;color:var(--hb);display:flex;gap:8px;align-items:flex-start"><span style="color:var(--trigger);flex-shrink:0">→</span>Reading real-time booking trends — when to add hours, when to pull back</div>
            <div style="font-size:13px;color:var(--hb);display:flex;gap:8px;align-items:flex-start"><span style="color:var(--trigger);flex-shrink:0">→</span>Using future heat maps to anticipate peak and quiet periods</div>
            <div style="font-size:13px;color:var(--hb);display:flex;gap:8px;align-items:flex-start"><span style="color:var(--trigger);flex-shrink:0">→</span>Making staffing adjustments proactively — not reactively</div>
            <div style="font-size:13px;color:var(--hb);display:flex;gap:8px;align-items:flex-start"><span style="color:var(--trigger);flex-shrink:0">→</span>The line between protecting margin and damaging the guest experience</div>
          </div>
        </div>
        <div style="background:var(--surface);border-radius:var(--radius-md);padding:10px 12px;font-size:12px;color:var(--text-secondary);border:1px solid var(--border-light)"><strong>Coaching prompt:</strong> Pull up today's booking view together. Ask the SM: "Given what you see here, what staffing decision would you make and why?"</div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div>
          <div style="font-size:20px;margin-bottom:6px">📅</div>
          <div class="card-title">Plan Ahead</div>
          <div class="card-subtitle">Strong stores are never surprised by their own calendar</div>
        </div>
      </div>
      <div class="card-body" style="display:flex;flex-direction:column;gap:10px">
        <div style="font-size:13px;color:var(--text-secondary);line-height:1.6">A leader who only knows today is always reacting. Opening Support Coaches build the habit of reviewing the next 14 days — identifying peaks, training blocks, risk days, and operational challenges before they arrive.</div>
        <div style="border-top:1px solid var(--border-light);padding-top:10px">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--trigger);margin-bottom:8px">Coach Them On</div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <div style="font-size:13px;color:var(--hb);display:flex;gap:8px;align-items:flex-start"><span style="color:var(--trigger);flex-shrink:0">→</span>The 14-day booking review — what to look for and how often to do it</div>
            <div style="font-size:13px;color:var(--hb);display:flex;gap:8px;align-items:flex-start"><span style="color:var(--trigger);flex-shrink:0">→</span>Identifying upcoming peak periods and staffing to meet them</div>
            <div style="font-size:13px;color:var(--hb);display:flex;gap:8px;align-items:flex-start"><span style="color:var(--trigger);flex-shrink:0">→</span>Blocking time for specialized training without operational risk</div>
            <div style="font-size:13px;color:var(--hb);display:flex;gap:8px;align-items:flex-start"><span style="color:var(--trigger);flex-shrink:0">→</span>What tomorrow's leader needs to know before they walk in</div>
          </div>
        </div>
        <div style="background:var(--surface);border-radius:var(--radius-md);padding:10px 12px;font-size:12px;color:var(--text-secondary);border:1px solid var(--border-light)"><strong>Coaching prompt:</strong> Have the SM walk you through the next two weekends on the booking calendar. Are they staffed correctly? Do they know which days are high-risk?</div>
      </div>
    </div>
  </div>

  <div class="card mb-20">
    <div class="card-header">
      <div>
        <div class="card-title">Equipment Longevity & Facility Standards</div>
        <div class="card-subtitle">The store must look and perform at day-one standard at all times</div>
      </div>
    </div>
    <div class="card-body">
      <div class="grid-2" style="gap:24px">
        <div>
          <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--trigger);margin-bottom:10px">Equipment Care</div>
          <div style="display:flex;flex-direction:column;gap:8px">
            <div style="font-size:13px;color:var(--hb);display:flex;gap:8px;align-items:flex-start"><span style="color:var(--trigger);flex-shrink:0">→</span>High-touch gear (vests, headsets, props) cleaned and maintained to day-one standard between every session</div>
            <div style="font-size:13px;color:var(--hb);display:flex;gap:8px;align-items:flex-start"><span style="color:var(--trigger);flex-shrink:0">→</span>Equipment stored correctly — vests hung by sleeve, trackers in labeled drawers, props binned</div>
            <div style="font-size:13px;color:var(--hb);display:flex;gap:8px;align-items:flex-start"><span style="color:var(--trigger);flex-shrink:0">→</span>Faulty equipment identified, flagged in the daily log, and escalated through the correct T1/RMA path — not left in rotation</div>
            <div style="font-size:13px;color:var(--hb);display:flex;gap:8px;align-items:flex-start"><span style="color:var(--trigger);flex-shrink:0">→</span>No rough handling, no dropping, no skipping cleaning steps under time pressure</div>
          </div>
        </div>
        <div>
          <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--trigger);margin-bottom:10px">Facility Readiness</div>
          <div style="display:flex;flex-direction:column;gap:8px">
            <div style="font-size:13px;color:var(--hb);display:flex;gap:8px;align-items:flex-start"><span style="color:var(--trigger);flex-shrink:0">→</span>Server room, storage, and BOH areas clean, organized, and ready for a franchise or leadership walkthrough at any time</div>
            <div style="font-size:13px;color:var(--hb);display:flex;gap:8px;align-items:flex-start"><span style="color:var(--trigger);flex-shrink:0">→</span>Lobby and barracks held to guest-ready standard throughout the day — not just at open and close</div>
            <div style="font-size:13px;color:var(--hb);display:flex;gap:8px;align-items:flex-start"><span style="color:var(--trigger);flex-shrink:0">→</span>Supplies stocked, labeled, and at par — the team knows the par levels and owns them</div>
            <div style="font-size:13px;color:var(--hb);display:flex;gap:8px;align-items:flex-start"><span style="color:var(--trigger);flex-shrink:0">→</span>The store can receive a franchise partner visit without any scrambling or embarrassment</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-header">
      <div>
        <div class="card-title">Leadership Depth Coaching</div>
        <div class="card-subtitle">The SM and ASM must be able to run the store before you leave</div>
      </div>
    </div>
    <div class="card-body">
      <div style="font-size:13px;color:var(--text-secondary);line-height:1.7;margin-bottom:16px">By the end of opening week, the SM and ASM should be able to run a full day without the Opening Support Coach in the building — not just executing tasks, but making decisions, coaching their team, and holding standards.</div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <div style="background:var(--surface);border:1px solid var(--border-light);border-radius:var(--radius-md);padding:12px 16px">
          <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--hb);margin-bottom:6px">The question to ask yourself each day:</div>
          <div style="font-size:14px;color:var(--trigger);font-style:italic">"If I didn't come in tomorrow, would this store still open cleanly, serve guests well, and make good decisions?"</div>
        </div>
        <div style="background:var(--surface);border:1px solid var(--border-light);border-radius:var(--radius-md);padding:12px 16px">
          <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--hb);margin-bottom:6px">Signs the SM is ready:</div>
          <div style="display:flex;flex-direction:column;gap:6px;margin-top:6px">
            <div style="font-size:13px;color:var(--text-secondary)">✓ Briefs the team before the day starts without being asked</div>
            <div style="font-size:13px;color:var(--text-secondary)">✓ Knows the day's goal and communicates it with energy</div>
            <div style="font-size:13px;color:var(--text-secondary)">✓ Makes staffing and labor decisions proactively</div>
            <div style="font-size:13px;color:var(--text-secondary)">✓ Catches equipment issues before the coach does</div>
            <div style="font-size:13px;color:var(--text-secondary)">✓ Coaches GEGs in real time — not just manages tasks</div>
            <div style="font-size:13px;color:var(--text-secondary)">✓ Debrief at end of day is detailed, honest, and action-oriented</div>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

// ============================================================
// FRANCHISE CHECKS / DAY 0
// ============================================================
const FRANCHISE_CHECK_GROUPS = [
  {
    group: 'Partnership & Planning',
    desc: 'Complete these conversations with the Franchise Owner or Store Manager before Day 1 begins.',
    checks: [
      { key: 'f-agenda-review', label: 'All 5-day agenda items reviewed with Franchise Store Manager/Owner' },
      { key: 'f-guest-policies', label: 'Guest policies discussed — late arrivals, refunds, waivers, recovery model — and how each will be trained on' },
      { key: 'f-team-policies', label: 'Team policies discussed — dress code, clock-in/out procedures, late policy, conduct standards — and how each will be trained on' },
    ]
  },
  {
    group: 'Staff iPads Ready',
    desc: 'Verify all staff iPads are configured and logged in before training begins.',
    checks: [
      { key: 'f-learning-plan', label: 'NSO GEG Learning Plan uploaded to all staff iPads' },
      { key: 'f-tracker-guide', label: 'Guide to Building Trackers downloaded to all staff iPads' },
      { key: 'f-tracker-charts', label: 'Tracker build charts downloaded to all store iPads' },
      { key: 'f-server-cheatsheets', label: 'Room Server Rack Cheat Sheets downloaded to all staff iPads' },
      { key: 'f-delightree', label: 'Delightree bookmarked on all staff iPads' },
      { key: 'f-slack', label: 'Staff Slack logged in on all staff iPads' },
      { key: 'f-checkfront-staff', label: 'Checkfront logged in on all staff iPads' },
      { key: 'f-checkfront-manager', label: 'Manager account logged in to Checkfront on the manager\'s iPad' },
    ]
  },
  {
    group: 'Technical Readiness',
    desc: 'All technical systems must be confirmed operational before Day 1.',
    checks: [
      { key: 'f-trackers-built', label: 'At least one full set of limb trackers built for the Guest Journey role-play' },
      { key: 'f-holodecks-calibrated', label: 'All holodecks calibrated and mock sessions run to confirm readiness' },
    ]
  },
  {
    group: 'Store Physical Setup',
    desc: 'The store must be physically ready for a training environment.',
    checks: [
      { key: 'f-boxes-unpacked', label: 'Boxes unpacked; shelves labeled; work surfaces clear' },
      { key: 'f-tracker-supplies', label: 'Tracker supplies sorted into labeled drawers; par levels set' },
      { key: 'f-charging', label: 'Charging station set; cables routed; spare batteries charging' },
      { key: 'f-cleaning-tools', label: 'Tools and cleaning supplies stocked; non-alcohol wipes per SOP' },
      { key: 'f-printers', label: 'Label printer and backroom printer online; paper, ink, and labels ready' },
      { key: 'f-props', label: 'Props and accessories binned and labeled' },
      { key: 'f-waste', label: 'Waste and recycling emptied; floor clear; drawer/bin index posted' },
    ]
  }
];

function renderFranchiseChecks() {
  const container = document.getElementById('franchiseContent');
  if (!container) return;

  if (!state.openingId) {
    container.innerHTML = `<div class="card" style="padding:32px;text-align:center;border:2px dashed var(--border)">
      <div style="font-size:13px;color:var(--text-muted)">Set up an opening first to track Day 0 checks.</div>
      <button class="btn btn-primary" style="margin-top:16px" onclick="openSetupModal(true)">Set Up Opening</button>
    </div>`;
    return;
  }

  const totalChecks = FRANCHISE_CHECK_GROUPS.reduce((sum, g) => sum + g.checks.length, 0);
  const completedChecks = FRANCHISE_CHECK_GROUPS.reduce((sum, g) =>
    sum + g.checks.filter(c => state.franchiseChecks[c.key]).length, 0);
  const pct = totalChecks > 0 ? Math.round((completedChecks / totalChecks) * 100) : 0;

  let html = `<div class="card mb-20">
    <div class="card-header">
      <div>
        <div class="card-title">Day 0 Readiness</div>
        <div class="card-subtitle">${completedChecks} of ${totalChecks} checks complete</div>
      </div>
      <div style="display:flex;align-items:center;gap:12px">
        <div style="font-size:14px;font-weight:700;color:${pct===100?'var(--success)':'var(--hb)'}">${pct}%</div>
        <div style="width:120px"><div class="progress-bar-wrap"><div class="progress-bar-fill ${pct===100?'green':'blue'}" style="width:${pct}%"></div></div></div>
      </div>
    </div>
  </div>`;

  FRANCHISE_CHECK_GROUPS.forEach(group => {
    const groupDone = group.checks.filter(c => state.franchiseChecks[c.key]).length;
    const groupKeys = '[' + group.checks.map(c => "'" + c.key + "'").join(',') + ']';
    html += `<div class="card mb-20">
      <div class="card-header">
        <div>
          <div class="card-title">${group.group}</div>
          <div class="card-subtitle">${group.desc}</div>
        </div>
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:12px;color:var(--text-secondary)">${groupDone}/${group.checks.length}</span>
          <button onclick="markGroupAllComplete(${groupKeys})" style="font-size:11px;font-weight:600;padding:3px 10px;border-radius:12px;border:1px solid var(--trigger);background:transparent;color:var(--trigger);cursor:pointer;white-space:nowrap">✓ Mark All</button>
        </div>
      </div>
      <div class="card-body" style="display:flex;flex-direction:column;gap:0">`;
    group.checks.forEach(check => {
      const checked = !!state.franchiseChecks[check.key];
      html += `<label style="display:flex;align-items:flex-start;gap:12px;padding:12px 0;border-bottom:1px solid var(--border-light);cursor:pointer">
        <input type="checkbox" ${checked ? 'checked' : ''} onchange="toggleFranchiseCheck('${check.key}', this.checked); renderFranchiseChecks()"
          style="margin-top:2px;width:16px;height:16px;accent-color:var(--trigger);flex-shrink:0">
        <span style="font-size:14px;color:${checked?'var(--text-muted)':'var(--hb)'};${checked?'text-decoration:line-through':''}">${check.label}</span>
      </label>`;
    });
    html += `</div></div>`;
  });

  container.innerHTML = html;
}

function renderFranchisePartnerReview() {
  const container = document.getElementById('franchiseeContent');
  if (!container) return;

  if (!state.openingId) {
    container.innerHTML = `<div class="card" style="padding:32px;text-align:center;border:2px dashed var(--border)">
      <div style="font-size:13px;color:var(--text-muted)">Set up an opening first.</div>
      <button class="btn btn-primary" style="margin-top:16px" onclick="openSetupModal(true)">Set Up Opening</button>
    </div>`;
    return;
  }

  let html = '';

  const FSIGNOFF_SECTIONS = [
    {
      key_prefix: 'fsignoff-training',
      title: 'Training Summary',
      subtitle: 'Confirm what took place during the opening training program.',
      items: [
        { key: 'fsignoff-training-days', label: 'All 5 training days were completed as scheduled' },
        { key: 'fsignoff-training-elearning', label: 'All trainees completed required Delightree eLearning modules' },
        { key: 'fsignoff-training-signoffs', label: 'Competency sign-offs were reviewed and discussed with the franchise partner' },
        { key: 'fsignoff-training-attendance', label: 'Attendance was consistent — any absences were discussed' },
      ]
    },
    {
      key_prefix: 'fsignoff-readiness',
      title: 'Team Readiness',
      subtitle: 'Select all areas where the team demonstrated readiness.',
      items: [
        { key: 'fsignoff-ready-guest', label: 'Team can deliver the full Guest Journey confidently and consistently' },
        { key: 'fsignoff-ready-tech', label: 'Team can operate all technology independently (trackers, vests, props, wireless)' },
        { key: 'fsignoff-ready-sales', label: 'Team understands and can execute Repeatability and upsell moments' },
        { key: 'fsignoff-ready-ops', label: 'Team can complete open and close procedures without guidance' },
        { key: 'fsignoff-ready-sm', label: 'Store Manager is ready to independently lead the store' },
      ]
    },
    {
      key_prefix: 'fsignoff-opportunities',
      title: 'Development Opportunities',
      subtitle: 'Identify areas that need continued attention during opening weekend.',
      items: [
        { key: 'fsignoff-dev-guest', label: 'Guest experience and service delivery' },
        { key: 'fsignoff-dev-tech', label: 'Technology operations and troubleshooting' },
        { key: 'fsignoff-dev-sales', label: 'Sales, Repeatability, and walk-in conversion' },
        { key: 'fsignoff-dev-ops', label: 'Operational procedures and execution speed' },
        { key: 'fsignoff-dev-sm', label: 'Store Manager\'s leadership and team direction' },
        { key: 'fsignoff-dev-none', label: 'No critical gaps identified — team is ready to operate' },
      ]
    },
    {
      key_prefix: 'fsignoff-plan',
      title: 'Opening Weekend Action Plan',
      subtitle: 'What happens next — agreed upon by OSC and franchise partner.',
      items: [
        { key: 'fsignoff-plan-coach-present', label: 'Coach will be present for Friends & Family Day' },
        { key: 'fsignoff-plan-sm-leads', label: 'SM will lead F&F Day independently with coach in an observing role' },
        { key: 'fsignoff-plan-debrief', label: 'End-of-day debrief scheduled for each opening weekend day' },
        { key: 'fsignoff-plan-areas', label: 'Specific coaching focus areas have been communicated to the SM' },
        { key: 'fsignoff-plan-followup', label: 'Follow-up plan is in place for any critical development areas' },
      ]
    },
    {
      key_prefix: 'fsignoff-confirm',
      title: 'Formal Sign-Off',
      subtitle: 'Both parties confirm this review is accurate and complete.',
      items: [
        { key: 'fsignoff-osc-confirms', label: 'OSC confirms: This summary accurately reflects the training program and outcomes' },
        { key: 'fsignoff-franchisee-confirms', label: 'Franchise Partner confirms: I have reviewed this summary and acknowledge the plan for opening weekend' },
      ]
    },
  ];

  const fsTotal = FSIGNOFF_SECTIONS.reduce((s, sec) => s + sec.items.length, 0);
  const fsDone = FSIGNOFF_SECTIONS.reduce((s, sec) => s + sec.items.filter(i => state.franchiseChecks[i.key]).length, 0);
  const fsPct = fsTotal > 0 ? Math.round((fsDone / fsTotal) * 100) : 0;
  const fsComplete = FSIGNOFF_SECTIONS[FSIGNOFF_SECTIONS.length - 1].items.every(i => state.franchiseChecks[i.key]);

  html += `<div class="card mb-20">
    <div class="card-header">
      <div>
        <div class="card-title">Partner Review Sign-Off</div>
        <div class="card-subtitle">Complete this together with the franchise partner on Day 4 — takes 5–7 minutes. Both parties confirm before F&F Day.</div>
      </div>
      <div style="display:flex;align-items:center;gap:12px">
        ${fsComplete ? '<span class="badge badge-green">Signed Off</span>' : ''}
        <div style="font-size:14px;font-weight:700;color:` + (fsPct===100?'var(--success)':'var(--hb)') + `">${fsPct}%</div>
        <div style="width:100px"><div class="progress-bar-wrap"><div class="progress-bar-fill ${fsPct===100?'green':'blue'}" style="width:${fsPct}%"></div></div></div>
      </div>
    </div>
  </div>`;

  FSIGNOFF_SECTIONS.forEach(section => {
    const secDone = section.items.filter(i => state.franchiseChecks[i.key]).length;
    const isSignOff = section.key_prefix === 'fsignoff-confirm';
    const sectionKeys = '[' + section.items.map(i => "'" + i.key + "'").join(',') + ']';
    html += `<div class="card mb-20" ${isSignOff ? 'style="border:2px solid ' + (secDone === section.items.length ? 'var(--success)' : 'var(--trigger)') + '"' : ''}>
      <div class="card-header">
        <div>
          <div class="card-title">${section.title}</div>
          <div class="card-subtitle">${section.subtitle}</div>
        </div>
        <div style="display:flex;align-items:center;gap:10px">
          <div style="font-size:12px;color:var(--text-secondary)">${secDone}/${section.items.length}</div>
          ${secDone < section.items.length ? `<button class="btn btn-sm btn-secondary" onclick="markFranchiseeAllComplete(${sectionKeys})" style="font-size:11px;padding:4px 10px">✓ Mark All</button>` : ''}
        </div>
      </div>
      <div class="card-body" style="display:flex;flex-direction:column;gap:0">`;
    section.items.forEach(item => {
      const checked = !!state.franchiseChecks[item.key];
      html += `<label style="display:flex;align-items:flex-start;gap:12px;padding:12px 0;border-bottom:1px solid var(--border-light);cursor:pointer">
        <input type="checkbox" ${checked ? 'checked' : ''} onchange="toggleFranchiseCheck('${item.key}', this.checked); renderFranchisePartnerReview()"
          style="margin-top:2px;width:16px;height:16px;accent-color:${isSignOff ? 'var(--success)' : 'var(--trigger)'};flex-shrink:0">
        <span style="font-size:14px;color:${checked?'var(--text-muted)':'var(--hb)'};${checked?'text-decoration:line-through':''}">${item.label}</span>
      </label>`;
    });
    html += `</div></div>`;
  });

  container.innerHTML = html;
}

function toggleFranchiseCheck(key, checked) {
  state.franchiseChecks[key] = checked;
  dbSaveFranchiseCheck(key, checked);
}

function markFranchiseeAllComplete(keys) {
  keys.forEach(function(key) {
    state.franchiseChecks[key] = true;
    dbSaveFranchiseCheck(key, true);
  });
  renderFranchisePartnerReview();
}

function markGroupAllComplete(keys) {
  keys.forEach(function(key) {
    state.franchiseChecks[key] = true;
    dbSaveFranchiseCheck(key, true);
  });
  renderFranchiseChecks();
  showToast('All items marked complete', 'success');
}

// ============================================================
// OPENING SWITCHER
// ============================================================
async function renderOpeningSwitcherList() {
  const list = document.getElementById('openingSwitcherList');
  if (!list) return;
  list.innerHTML = '<div style="padding:8px 0;font-size:12px;color:var(--text-muted)">Loading…</div>';
  const isAdmin = canEdit();
  const openings = isAdmin ? await dbLoadAllOpeningsForSwitcher() : await dbLoadOpeningsForCoach();
  if (openings.length === 0) {
    list.innerHTML = '<div style="padding:8px 0;font-size:12px;color:var(--text-muted)">No openings yet.</div>';
    return;
  }
  list.innerHTML = openings.map(o => {
    const isCurrent = o.id === state.openingId;
    const dateStr = o.start_date ? new Date(o.start_date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : 'No date';
    const coachLine = isAdmin ? `<div style="font-size:11px;color:var(--trigger);font-weight:600;margin-top:1px">Coach: ${o.coach_name || '—'}</div>` : '';
    return `<button onclick="switchToOpening('${o.id}')" style="display:flex;flex-direction:column;align-items:flex-start;width:100%;text-align:left;padding:10px 12px;border-radius:var(--radius-md);border:1px solid ${isCurrent?'var(--trigger)':'var(--border-light)'};background:${isCurrent?'var(--trigger-light)':'var(--white)'};margin-bottom:8px;cursor:pointer;transition:all 0.15s" ${isCurrent?'disabled':''}>
      <div style="font-size:13px;font-weight:600;color:var(--hb)">${o.store_name}</div>
      ${coachLine}
      <div style="font-size:11px;color:var(--text-secondary);margin-top:2px">${dateStr} · Day ${o.current_day || 1} of 5${isCurrent?' · <strong>Current</strong>':''}</div>
    </button>`;
  }).join('');
}

async function switchToOpening(openingId) {
  closeModal('openingSwitcherModal');
  showToast('Loading opening…', 'info');
  // Reset state
  state.openingId = openingId;
  state.trainees = [];
  state.signoffs = {};
  state.recaps = {};
  state.franchiseChecks = {};
  state.oscReport = {};
  // Load via dbLoadState which picks most-recently-updated — we need to load by specific ID
  const { data: o } = await supabase.from('openings').select('*').eq('id', openingId).single();
  if (!o) { showToast('Could not load opening', 'info'); return; }
  state.opening = { store: o.store_name, coach: o.coach_name, date: o.start_date };
  state.currentDay = o.current_day || 1;

  const [{ data: trainees }, { data: signoffs }, { data: recaps }, { data: fchecks }, { data: oscReports }] = await Promise.all([
    supabase.from('trainees').select('*').eq('opening_id', openingId).order('created_at'),
    supabase.from('signoffs').select('*').eq('opening_id', openingId),
    supabase.from('recaps').select('*').eq('opening_id', openingId),
    supabase.from('franchise_checks').select('*').eq('opening_id', openingId),
    supabase.from('osc_reports').select('*').eq('opening_id', openingId).order('updated_at', { ascending: false }).limit(1)
  ]);

  state.trainees = (trainees || []).map(t => ({ id: t.id, name: t.name, role: t.role, notes: t.notes || '' }));
  state.signoffs = {};
  (signoffs || []).forEach(s => { state.signoffs[s.trainee_id + '_' + s.competency_id] = s.status; });
  state.recaps = {};
  (recaps || []).forEach(r => {
    state.recaps[r.day_num] = r.recap_data || {};
  });
  state.franchiseChecks = {};
  (fchecks || []).forEach(f => { state.franchiseChecks[f.check_key] = f.checked; });
  state.oscReport = (oscReports && oscReports[0]) || {};

  refreshAfterLoad();
  navigate('dashboard');
  showToast(`Switched to: ${o.store_name}`, 'success');
}

// ============================================================
// TOAST
// ============================================================
function showToast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast ' + (type === 'success' ? 'success' : 'info');
  toast.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      ${type === 'success' ? '<circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.3"/><path d="M4.5 7l2 2 3-3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>' : '<circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.3"/><path d="M7 4v3M7 9.5v.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>'}
    </svg>
    ${msg}`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateY(8px)'; toast.style.transition = 'all 0.3s'; setTimeout(() => toast.remove(), 300); }, 3000);
}

// ============================================================
// INIT
// ============================================================
selectDayAgenda(1);
renderKBNav();
const _ac1 = document.getElementById('agendacard-1');
if (_ac1) _ac1.classList.add('active');
initApp();

// Browser Back / Forward support
window.addEventListener('popstate', function(e) {
  var view = e.state && e.state.view;
  if (view) {
    // navigate() without pushing another history entry
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    var el = document.getElementById('view-' + view);
    if (el) el.classList.add('active');
    var navEl = document.getElementById({
      dashboard:'nav-dashboard', team:'nav-roster', schedule:'nav-schedule',
      competencies:'nav-competencies', recap:'nav-recap', knowledge:'nav-kb',
      franchise:'nav-franchise', franchisee:'nav-franchisee', osc:'nav-osc',
      resources:'nav-resources', leadership:'nav-leadership', admin:'nav-admin', videos:'nav-videos'
    }[view]);
    if (navEl) navEl.classList.add('active');
    state.currentView = view;
    if (view === 'schedule') renderAgenda(state.currentAgendaDay);
    if (view === 'competencies') renderCompetencyTable(state.currentCompDay);
    if (view === 'knowledge') renderKBNav();
    if (view === 'team') renderTeamRoster();
    if (view === 'recap') loadRecapFields(state.currentRecapDay);
    if (view === 'franchise') renderFranchiseChecks();
    if (view === 'franchisee') renderFranchisePartnerReview();
    if (view === 'leadership') renderLeadershipLens();
    if (view === 'admin') renderAdminPage();
    if (view === 'resources') renderResourcesPage();
    if (view === 'osc') loadOSCReportFields();
  }
});

// Handle direct URL with hash on load (e.g. after refresh on a non-dashboard view)
(function() {
  var hash = window.location.hash.slice(1);
  if (hash && hash !== 'dashboard') {
    // wait for initApp to finish, then navigate
    setTimeout(function() { if (state.userEmail) navigate(hash); }, 1200);
  }
})();

// ============================================================
// LEADERSHIP TRAINING UI
// ============================================================
async function renderLeadershipTrainingPage() {
  const container = document.getElementById('leadershipTrainingContent');
  if (!container) return;
  container.innerHTML = '<div style="padding:32px;color:var(--text-muted);font-size:13px">Loading leadership training…</div>';

  if (!state.leadershipTraining) {
    const { data } = await dbLoadLeadershipTraining();
    if (!data) {
      renderLeadershipSetup(container);
      return;
    }
  }
  renderLeadershipDashboard(container);
}

function renderLeadershipSetup(container) {
  updateLeadershipSidebarTabs(false);
  container.innerHTML = `
    <div class="page-header">
      <div class="eyebrow">LEADERSHIP TRAINING</div>
      <div class="page-title">Start a Leadership Training Program</div>
      <div class="page-subtitle">Five-day Franchise Manager learning plan with individual leader tracking and a final readiness report.</div>
    </div>
    <div class="card" style="max-width:560px">
      <div class="card-header"><div class="card-title">New Leadership Training</div></div>
      <div class="card-body">
        <div class="form-row"><label class="form-label">Franchise Store Name</label><input class="input" id="lt-franchise-store" placeholder="e.g. Sandbox VR – San Tan"></div>
        <div class="form-row"><label class="form-label">Certified Training Store</label><input class="input" id="lt-training-store" placeholder="e.g. Sandbox VR – Mesa"></div>
        <div class="form-row"><label class="form-label">Franchise Owner Name</label><input class="input" id="lt-fo-name" placeholder="Optional"></div>
        <div class="form-row"><label class="form-label">Franchise Company</label><input class="input" id="lt-company" placeholder="Optional"></div>
        <div class="form-row"><label class="form-label">Your Name (Trainer)</label><input class="input" id="lt-trainer-name" placeholder="Your name"></div>
        <div class="form-row"><label class="form-label">Start Date</label><input class="input" type="date" id="lt-start-date"></div>
        <button class="btn btn-primary" style="width:100%;justify-content:center;margin-top:8px" onclick="createLeadershipTraining()">Create Leadership Training</button>
      </div>
    </div>`;
}

async function createLeadershipTraining() {
  const g = id => document.getElementById(id).value.trim();
  const franchiseStore = g('lt-franchise-store');
  const trainingStore = g('lt-training-store');
  const trainerName = g('lt-trainer-name');
  if (!franchiseStore || !trainingStore || !trainerName) {
    showToast('Please fill in franchise store, training store, and your name.', 'error'); return;
  }
  const btn = document.querySelector('#leadershipTrainingContent button[onclick="createLeadershipTraining()"]');
  if (btn) btn.disabled = true;
  const { data, error } = await dbCreateLeadershipTraining({
    franchise_store_name: franchiseStore,
    certified_training_store_name: trainingStore,
    franchise_owner_name: g('lt-fo-name'),
    franchise_company: g('lt-company'),
    trainer_name: trainerName,
    start_date: g('lt-start-date') || null
  });
  if (error) { showToast('Error: ' + (error.message || 'Could not create training'), 'error'); if (btn) btn.disabled = false; return; }
  showToast('Leadership training created!', 'success');
  renderLeadershipDashboard(document.getElementById('leadershipTrainingContent'));
}

function renderLeadershipDashboard(container) {
  const lt = state.leadershipTraining;
  const sp = state.currentStoreProgram;
  const participants = state.leadershipParticipants;
  const totalComps = LEADERSHIP_COMPETENCIES.length;
  const dayNames = ['', 'Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5'];

  // Overall progress
  let totalSigned = 0, totalPossible = participants.length * totalComps;
  participants.forEach(p => {
    totalSigned += LEADERSHIP_COMPETENCIES.filter(c => state.leadershipSignoffs[p.id + '_' + c.id] === 'signed').length;
  });
  const overallPct = totalPossible > 0 ? Math.round((totalSigned / totalPossible) * 100) : 0;

  let html = `
    <div class="page-header">
      <div class="eyebrow">LEADERSHIP TRAINING</div>
      <div class="page-title">${sp ? sp.franchise_store_name : 'Leadership Training'}</div>
      <div class="page-subtitle">Trainer: ${lt.trainer_name} &nbsp;·&nbsp; ${lt.start_date ? 'Started ' + lt.start_date : 'No start date'} &nbsp;·&nbsp; ${dayNames[lt.current_day] || 'Day 1'} of 5</div>
    </div>

    <div class="grid-4" style="margin-bottom:24px">
      <div class="stat-card"><div class="stat-icon">📅</div><div class="stat-label">CURRENT DAY</div><div class="stat-value">${lt.current_day}</div><div class="stat-sub">${LEADERSHIP_AGENDA[lt.current_day - 1]?.title || ''}</div></div>
      <div class="stat-card"><div class="stat-icon">👥</div><div class="stat-label">PARTICIPANTS</div><div class="stat-value">${participants.length}</div><div class="stat-sub">leaders added</div></div>
      <div class="stat-card"><div class="stat-icon">✅</div><div class="stat-label">SIGN-OFFS</div><div class="stat-value">${totalSigned}</div><div class="stat-sub">of ${totalPossible} total</div></div>
      <div class="stat-card"><div class="stat-icon">📊</div><div class="stat-label">OVERALL</div><div class="stat-value">${overallPct}%</div><div class="stat-sub">completion</div></div>
    </div>

    <div class="grid-2" style="margin-bottom:24px">
      <div class="card">
        <div class="card-header">
          <div><div class="card-title">Day Navigation</div><div class="card-subtitle">Advance the training day</div></div>
        </div>
        <div class="card-body">
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            ${[1,2,3,4,5].map(d => `<button class="btn ${d === lt.current_day ? 'btn-primary' : 'btn-secondary'}" onclick="setLeadershipDay(${d})">${dayNames[d]}</button>`).join('')}
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header">
          <div><div class="card-title">Today's Focus</div><div class="card-subtitle">${LEADERSHIP_AGENDA[lt.current_day - 1]?.title || ''}</div></div>
        </div>
        <div class="card-body" style="font-size:13px;color:var(--text-secondary)">${LEADERSHIP_AGENDA[lt.current_day - 1]?.focus || ''}</div>
      </div>
    </div>`;

  html += `<div id="leadershipTabContent"></div>`;

  container.innerHTML = html;
  updateLeadershipSidebarTabs(true);
  renderLeadershipTab(state._leadershipTab || 'roster');
}

function setLeadershipTab(tab) {
  state._leadershipTab = tab;
  renderLeadershipTab(tab);
  ['roster','agenda','signoffs','notes','report'].forEach(t => {
    const btn = document.getElementById('nav-lt-' + t);
    if (btn) btn.classList.toggle('active', t === tab);
  });
  closeSidebar();
}

function updateLeadershipSidebarTabs(show) {
  const el = document.getElementById('nav-lt-tabs');
  if (el) el.style.display = show ? '' : 'none';
  if (show) {
    const tab = state._leadershipTab || 'roster';
    ['roster','agenda','signoffs','notes','report'].forEach(t => {
      const btn = document.getElementById('nav-lt-' + t);
      if (btn) btn.classList.toggle('active', t === tab);
    });
  }
}

async function setLeadershipDay(day) {
  const err = await dbSaveLeadershipCurrentDay(day);
  if (err) { showToast('Could not update day: ' + (err.message || 'DB error'), 'error'); return; }
  renderLeadershipDashboard(document.getElementById('leadershipTrainingContent'));
}

function renderLeadershipTab(tab) {
  const container = document.getElementById('leadershipTabContent');
  if (!container) return;
  if (tab === 'roster') renderLeadershipRoster(container);
  else if (tab === 'agenda') renderLeadershipAgenda(container);
  else if (tab === 'signoffs') renderLeadershipSignoffs(container);
  else if (tab === 'notes') renderLeadershipNotes(container);
  else if (tab === 'report') renderLeadershipReport(container);
}

function renderLeadershipRoster(container) {
  const roleColors = { 'Owner': 'badge-dark', 'SM': 'badge-blue', 'ASM': 'badge-amber', 'Events Manager': 'badge-green', 'Custom': 'badge-gray' };
  let html = `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
    <div style="font-size:15px;font-weight:700;color:var(--hb)">Leadership Participants</div>
    <button class="btn btn-primary" onclick="openAddLeaderModal()">+ Add Leader</button>
  </div>`;

  if (state.leadershipParticipants.length === 0) {
    html += '<div class="card" style="padding:32px;text-align:center;color:var(--text-muted);font-size:13px">No leaders added yet. Click "Add Leader" to get started.</div>';
  } else {
    html += '<div class="card">';
    state.leadershipParticipants.forEach(p => {
      const signed = LEADERSHIP_COMPETENCIES.filter(c => state.leadershipSignoffs[p.id + '_' + c.id] === 'signed').length;
      const total = LEADERSHIP_COMPETENCIES.length;
      const pct = Math.round((signed / total) * 100);
      html += `<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--border-light)">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:36px;height:36px;border-radius:50%;background:var(--trigger-light);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;color:var(--trigger)">${p.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}</div>
          <div>
            <div style="font-weight:600;font-size:14px">${p.name}</div>
            <span class="badge ${roleColors[p.role] || 'badge-gray'}" style="font-size:11px">${p.role === 'Custom' && p.custom_role ? p.custom_role : p.role}</span>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:16px">
          <div style="text-align:right">
            <div style="font-size:11px;color:var(--text-muted)">Sign-offs</div>
            <div style="font-size:14px;font-weight:700;color:${pct===100?'var(--success)':'var(--hb)'}">${signed}/${total}</div>
          </div>
          <div style="width:80px"><div class="progress-bar-wrap"><div class="progress-bar-fill ${pct===100?'green':'blue'}" style="width:${pct}%"></div></div></div>
          <button onclick="removeLeadershipParticipant('${p.id}')" style="color:var(--text-muted);background:transparent;border:none;cursor:pointer;font-size:13px;padding:4px 8px;border-radius:4px" onmouseover="this.style.background='var(--danger-light)';this.style.color='var(--danger)'" onmouseout="this.style.background='transparent';this.style.color='var(--text-muted)'">Remove</button>
        </div>
      </div>`;
    });
    html += '</div>';
  }
  container.innerHTML = html;
}

function openAddLeaderModal() {
  document.getElementById('lt-new-name').value = '';
  document.getElementById('lt-new-role').value = 'Owner';
  document.getElementById('lt-new-custom-role').value = '';
  document.getElementById('lt-custom-role-row').style.display = 'none';
  document.getElementById('addLeaderModal').classList.add('open');
}

async function saveNewLeader() {
  const name = document.getElementById('lt-new-name')?.value.trim();
  const role = document.getElementById('lt-new-role')?.value;
  const customRole = document.getElementById('lt-new-custom-role')?.value.trim();
  if (!name) { showToast('Please enter a name.', 'error'); return; }
  const { data, error } = await dbSaveLeadershipParticipant({ name, role, custom_role: customRole });
  if (error) { showToast('Error adding leader: ' + (error.message || 'DB error'), 'error'); return; }
  state.leadershipParticipants.push({ id: data.id, name, role, custom_role: customRole || '', notes: '' });
  closeModal('addLeaderModal');
  showToast(name + ' added!', 'success');
  renderLeadershipTab(state._leadershipTab || 'roster');
}

async function removeLeadershipParticipant(participantId) {
  const p = state.leadershipParticipants.find(x => x.id === participantId);
  if (!p || !confirm('Remove ' + p.name + '? This cannot be undone.')) return;
  const err = await dbDeleteLeadershipParticipant(participantId);
  if (err) { showToast('Error removing participant.', 'error'); return; }
  state.leadershipParticipants = state.leadershipParticipants.filter(x => x.id !== participantId);
  showToast(p.name + ' removed.', 'success');
  renderLeadershipTab(state._leadershipTab || 'roster');
}

function renderLeadershipAgenda(container) {
  const day = state.currentLeadershipDay;
  const agenda = LEADERSHIP_AGENDA[day - 1];
  if (!agenda) { container.innerHTML = '<div style="color:var(--text-muted)">No agenda for this day.</div>'; return; }

  let html = `<div class="card mb-20">
    <div class="card-header">
      <div><div class="card-title">Day ${day}: ${agenda.title}</div><div class="card-subtitle">${agenda.focus}</div></div>
    </div>
  </div>`;

  agenda.blocks.forEach(block => {
    html += `<div class="card mb-20" style="border-left:3px solid var(--trigger)">
      <div style="padding:16px">
        <div style="display:flex;align-items:baseline;gap:12px;margin-bottom:8px">
          <div style="font-size:13px;font-weight:700;color:var(--hb)">${block.title}</div>
          <div style="font-size:11px;color:var(--text-muted);white-space:nowrap">${block.time}</div>
        </div>
        <ul style="margin:0;padding-left:18px;color:var(--text-secondary);font-size:13px">
          ${block.objectives.map(o => `<li style="margin-bottom:4px">${o}</li>`).join('')}
        </ul>
      </div>
    </div>`;
  });
  container.innerHTML = html;
}

function renderLeadershipSignoffs(container) {
  const participants = state.leadershipParticipants;
  const day = state.currentLeadershipDay;
  const dayComps = LEADERSHIP_COMPETENCIES.filter(c => c.day === day);

  if (participants.length === 0) {
    container.innerHTML = '<div class="card" style="padding:32px;text-align:center;color:var(--text-muted);font-size:13px">Add leaders to the roster first.</div>';
    return;
  }

  // Group by category
  const categories = [...new Set(dayComps.map(c => c.category))];
  let html = `<div style="font-size:13px;color:var(--text-muted);margin-bottom:16px">Showing Day ${day} competencies — switch days using the Day Navigation above.</div>`;

  if (dayComps.length === 0) {
    container.innerHTML = html + '<div class="card" style="padding:24px;color:var(--text-muted);font-size:13px">No competencies for this day.</div>';
    return;
  }

  categories.forEach(cat => {
    const comps = dayComps.filter(c => c.category === cat);
    html += `<div class="card mb-20">
      <div style="padding:12px 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted);border-bottom:1px solid var(--border-light)">${cat}</div>
      <div style="overflow-x:auto">
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead>
            <tr style="background:var(--surface-alt)">
              <th style="text-align:left;padding:8px 16px;font-weight:600;color:var(--text-secondary);min-width:260px">Competency</th>
              ${participants.map(p => `<th style="text-align:center;padding:8px 12px;font-weight:600;color:var(--text-secondary);white-space:nowrap">${p.name.split(' ')[0]}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${comps.map(c => `
              <tr style="border-bottom:1px solid var(--border-light)">
                <td style="padding:10px 16px;color:var(--text-primary)">${c.name}</td>
                ${participants.map(p => {
                  const signed = state.leadershipSignoffs[p.id + '_' + c.id] === 'signed';
                  return `<td style="text-align:center;padding:10px 12px">
                    <button onclick="toggleLeadershipSignoff('${p.id}','${c.id}',${c.day})"
                      style="width:32px;height:32px;border-radius:50%;border:2px solid ${signed?'var(--success)':'var(--border)'};background:${signed?'var(--success)':'transparent'};cursor:pointer;color:${signed?'#fff':'var(--text-muted)'};font-size:14px;display:inline-flex;align-items:center;justify-content:center">
                      ${signed ? '✓' : ''}
                    </button>
                  </td>`;
                }).join('')}
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
  });
  container.innerHTML = html;
}

async function toggleLeadershipSignoff(participantId, competencyId, dayNum) {
  const key = participantId + '_' + competencyId;
  const current = state.leadershipSignoffs[key];
  const newStatus = current === 'signed' ? 'pending' : 'signed';
  state.leadershipSignoffs[key] = newStatus;
  const err = await dbSaveLeadershipSignoff(participantId, competencyId, newStatus, dayNum);
  if (err) { showToast('Save failed: ' + (err.message || 'DB error'), 'error'); state.leadershipSignoffs[key] = current; }
  renderLeadershipTab('signoffs');
}

function renderLeadershipNotes(container) {
  const day = state.currentLeadershipDay;
  const notes = state.leadershipDailyNotes[day] || {};
  const sp = state.currentStoreProgram;
  const storeName = sp ? sp.franchise_store_name : 'Leadership Training';

  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div><div class="card-title">Day ${day} Trainer Notes</div><div class="card-subtitle">${storeName}</div></div>
        <button class="btn btn-secondary" onclick="copyLeadershipNotes()" style="font-size:12px;padding:6px 12px">Copy to Slack</button>
      </div>
      <div class="card-body">
        <div class="form-row"><label class="form-label">Overall Observations</label>
          <textarea class="recap-textarea" id="lt-notes-observations" placeholder="What did you observe today across the group?" oninput="autoSaveLeadershipNotes()">${notes.observations || ''}</textarea>
          <div class="recap-chips">
            <button class="recap-chip" onclick="ltChip('lt-notes-observations','Group engaged well throughout the day.')">Group engaged</button>
            <button class="recap-chip" onclick="ltChip('lt-notes-observations','Strong energy and enthusiasm from all participants.')">Strong energy</button>
            <button class="recap-chip" onclick="ltChip('lt-notes-observations','Pacing was challenging — adjusted agenda accordingly.')">Pacing challenge</button>
            <button class="recap-chip" onclick="ltChip('lt-notes-observations','Knowledge gaps surfaced — additional coaching provided.')">Gaps surfaced</button>
          </div>
        </div>
        <div class="form-row"><label class="form-label">Standout Moments</label>
          <textarea class="recap-textarea" id="lt-notes-standouts" placeholder="Highlights, breakthroughs, or moments of confidence..." oninput="autoSaveLeadershipNotes()">${notes.standouts || ''}</textarea>
          <div class="recap-chips">
            <button class="recap-chip" onclick="ltChip('lt-notes-standouts','Excellent role-play performance from ___ today.')">Strong role-play</button>
            <button class="recap-chip" onclick="ltChip('lt-notes-standouts','Leader took initiative without prompting.')">Took initiative</button>
            <button class="recap-chip" onclick="ltChip('lt-notes-standouts','Guest interaction felt natural and confident.')">Natural guest interaction</button>
            <button class="recap-chip" onclick="ltChip('lt-notes-standouts','Confident equipment handling across the group.')">Confident with gear</button>
          </div>
        </div>
        <div class="form-row"><label class="form-label">Areas Needing More Practice</label>
          <textarea class="recap-textarea" id="lt-notes-gaps" placeholder="Skills or topics that need reinforcement tomorrow..." oninput="autoSaveLeadershipNotes()">${notes.gaps || ''}</textarea>
          <div class="recap-chips">
            <button class="recap-chip" onclick="ltChip('lt-notes-gaps','CheckFront navigation needs more reps.')">CheckFront navigation</button>
            <button class="recap-chip" onclick="ltChip('lt-notes-gaps','Guest complaint handling requires additional coaching.')">Complaint handling</button>
            <button class="recap-chip" onclick="ltChip('lt-notes-gaps','Technical calibration steps need reinforcement.')">Tech calibration</button>
            <button class="recap-chip" onclick="ltChip('lt-notes-gaps','Sales repeatability pitch needs more practice.')">Sales repeatability</button>
          </div>
        </div>
        <div class="form-row"><label class="form-label">Plan for Tomorrow</label>
          <textarea class="recap-textarea" id="lt-notes-tomorrow" placeholder="What will you focus on or adjust tomorrow?" oninput="autoSaveLeadershipNotes()">${notes.tomorrow || ''}</textarea>
          <div class="recap-chips">
            <button class="recap-chip" onclick="ltChip('lt-notes-tomorrow','Add more dedicated role-play time.')">More role-play</button>
            <button class="recap-chip" onclick="ltChip('lt-notes-tomorrow','Review CheckFront basics before advancing.')">Review CheckFront</button>
            <button class="recap-chip" onclick="ltChip('lt-notes-tomorrow','Focus on guest touchpoints and journey flow.')">Guest touchpoints</button>
            <button class="recap-chip" onclick="ltChip('lt-notes-tomorrow','Full run-through with no coaching prompts.')">Full run-through</button>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:12px;margin-top:8px">
          <button class="btn btn-primary" onclick="saveLeadershipNotes()">Save Notes</button>
          <span id="lt-notes-save-status" style="font-size:12px;color:var(--text-muted)"></span>
        </div>
      </div>
    </div>`;
}

function ltChip(fieldId, text) {
  var el = document.getElementById(fieldId);
  if (!el) return;
  if (el.value && !el.value.endsWith('\n') && el.value.trim()) el.value += '\n';
  el.value += text;
  autoSaveLeadershipNotes();
}

async function copyLeadershipNotes() {
  const day = state.currentLeadershipDay;
  const sp = state.currentStoreProgram;
  const storeName = sp ? sp.franchise_store_name : 'Leadership Training';
  const g = id => (document.getElementById(id)?.value || '').trim();

  const obs = g('lt-notes-observations');
  const standouts = g('lt-notes-standouts');
  const gaps = g('lt-notes-gaps');
  const tomorrow = g('lt-notes-tomorrow');

  const lines = [`*Day ${day} Trainer Notes — ${storeName}*`, ''];
  if (obs) lines.push(`*Overall Observations:*\n${obs}`, '');
  if (standouts) lines.push(`*Standout Moments:*\n${standouts}`, '');
  if (gaps) lines.push(`*Areas Needing More Practice:*\n${gaps}`, '');
  if (tomorrow) lines.push(`*Plan for Tomorrow:*\n${tomorrow}`, '');

  const text = lines.join('\n').trim();
  const html = text
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/\*(.*?)\*/g,'<strong>$1</strong>')
    .replace(/\n/g,'<br>');

  try {
    await navigator.clipboard.write([new ClipboardItem({
      'text/html': new Blob([html], { type: 'text/html' }),
      'text/plain': new Blob([text], { type: 'text/plain' })
    })]);
    showToast('Copied to clipboard — paste into Slack!', 'success');
  } catch(e) {
    await navigator.clipboard.writeText(text);
    showToast('Copied as plain text — bold may not carry over in Slack.', 'success');
  }
}

let _ltNotesTimer = null;
function autoSaveLeadershipNotes() {
  clearTimeout(_ltNotesTimer);
  _ltNotesTimer = setTimeout(saveLeadershipNotes, 2000);
}

async function saveLeadershipNotes() {
  const day = state.currentLeadershipDay;
  const g = id => (document.getElementById(id)?.value || '');
  const notesData = {
    observations: g('lt-notes-observations'),
    standouts: g('lt-notes-standouts'),
    gaps: g('lt-notes-gaps'),
    tomorrow: g('lt-notes-tomorrow')
  };
  state.leadershipDailyNotes[day] = notesData;
  const err = await dbSaveLeadershipDailyNotes(day, notesData);
  const status = document.getElementById('lt-notes-save-status');
  if (status) status.textContent = err ? 'Save failed.' : 'Saved.';
  if (!err) setTimeout(() => { if (status) status.textContent = ''; }, 2000);
}

function renderLeadershipReport(container) {
  const participants = state.leadershipParticipants;
  if (participants.length === 0) {
    container.innerHTML = '<div class="card" style="padding:32px;text-align:center;color:var(--text-muted);font-size:13px">Add leaders to the roster first, then complete their readiness reports here.</div>';
    return;
  }

  const statusLabels = { ready: 'Ready', ready_with_support: 'Ready with Support', needs_additional_training: 'Needs Additional Training' };
  const statusColors = { ready: 'badge-green', ready_with_support: 'badge-amber', needs_additional_training: 'badge-danger' };

  let html = '';
  participants.forEach(p => {
    const report = state.leadershipReports[p.id] || {};
    const signed = LEADERSHIP_COMPETENCIES.filter(c => state.leadershipSignoffs[p.id + '_' + c.id] === 'signed').length;
    const total = LEADERSHIP_COMPETENCIES.length;
    const pct = Math.round((signed / total) * 100);
    const currentStatus = report.readiness_status || '';
    const currentRating = report.rating_1_to_4 || 0;

    html += `<div class="card mb-20">
      <div class="card-header">
        <div>
          <div class="card-title">${p.name}</div>
          <div class="card-subtitle">${p.role === 'Custom' && p.custom_role ? p.custom_role : p.role} &nbsp;·&nbsp; ${signed}/${total} competencies (${pct}%)</div>
        </div>
        ${currentStatus ? `<span class="badge ${statusColors[currentStatus] || 'badge-gray'}">${statusLabels[currentStatus]}</span>` : ''}
      </div>
      <div class="card-body">
        <div class="form-row"><label class="form-label">Readiness Status</label>
          <select class="input" id="lt-report-status-${p.id}">
            <option value="">— Select —</option>
            ${Object.entries(statusLabels).map(([v,l]) => `<option value="${v}" ${currentStatus===v?'selected':''}>${l}</option>`).join('')}
          </select>
        </div>
        <div class="form-row"><label class="form-label">Overall Rating (1–4)</label>
          <div style="display:flex;gap:8px">
            ${[1,2,3,4].map(n => `<button onclick="setLeaderRating('${p.id}',${n})" id="lt-rating-${p.id}-${n}"
              style="width:40px;height:40px;border-radius:8px;border:2px solid ${currentRating===n?'var(--trigger)':'var(--border)'};background:${currentRating===n?'var(--trigger)':'transparent'};color:${currentRating===n?'#fff':'var(--text-secondary)'};font-weight:700;cursor:pointer">${n}</button>`).join('')}
          </div>
        </div>
        <div class="form-row"><label class="form-label">Strengths</label>
          <textarea class="recap-textarea" id="lt-report-strengths-${p.id}" placeholder="What did this leader do well?">${report.strengths || ''}</textarea>
        </div>
        <div class="form-row"><label class="form-label">Risks / Development Areas</label>
          <textarea class="recap-textarea" id="lt-report-risks-${p.id}" placeholder="What areas need continued development?">${report.risks || ''}</textarea>
        </div>
        <div class="form-row"><label class="form-label">Follow-Up Items</label>
          <textarea class="recap-textarea" id="lt-report-followups-${p.id}" placeholder="Any specific follow-up commitments or check-in plans?">${report.follow_ups || ''}</textarea>
        </div>
        <div class="form-row"><label class="form-label">Final Notes</label>
          <textarea class="recap-textarea" id="lt-report-final-${p.id}" placeholder="Overall impression and final certification notes...">${report.final_notes || ''}</textarea>
        </div>
        <button class="btn btn-primary" onclick="saveLeaderReadinessReport('${p.id}')">Save Report</button>
      </div>
    </div>`;
  });
  container.innerHTML = html;

  // Store ratings in state for button management
  participants.forEach(p => {
    const report = state.leadershipReports[p.id] || {};
    state['_ltRating_' + p.id] = report.rating_1_to_4 || 0;
  });
}

function setLeaderRating(participantId, rating) {
  state['_ltRating_' + participantId] = rating;
  [1,2,3,4].forEach(n => {
    const btn = document.getElementById(`lt-rating-${participantId}-${n}`);
    if (btn) {
      btn.style.borderColor = n === rating ? 'var(--trigger)' : 'var(--border)';
      btn.style.background = n === rating ? 'var(--trigger)' : 'transparent';
      btn.style.color = n === rating ? '#fff' : 'var(--text-secondary)';
    }
  });
}

async function saveLeaderReadinessReport(participantId) {
  const g = id => document.getElementById(id)?.value || '';
  const report = {
    readiness_status: g(`lt-report-status-${participantId}`),
    rating_1_to_4: state['_ltRating_' + participantId] || null,
    strengths: g(`lt-report-strengths-${participantId}`),
    risks: g(`lt-report-risks-${participantId}`),
    follow_ups: g(`lt-report-followups-${participantId}`),
    final_notes: g(`lt-report-final-${participantId}`)
  };
  state.leadershipReports[participantId] = { ...report, participant_id: participantId };
  const err = await dbSaveLeadershipReadinessReport(participantId, report);
  if (err) { showToast('Save failed: ' + (err.message || 'DB error'), 'error'); return; }
  const p = state.leadershipParticipants.find(x => x.id === participantId);
  showToast((p?.name || 'Report') + ' saved!', 'success');
  renderLeadershipTab('report');
}

// ============================================================
// SCORECARDS
// ============================================================

let _sc = {}; // scorecard editor state

async function renderScorecards() {
  const container = document.getElementById('view-scorecards');
  if (!container) return;
  container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted)">Loading scorecards...</div>';

  const [openingsResult, scorecardsResult] = await Promise.all([
    dbLoadAllOpeningsForScorecards(),
    dbLoadAllScorecards()
  ]);

  const openings = openingsResult.data || [];
  const scMap = {};
  (scorecardsResult.data || []).forEach(s => { scMap[s.opening_id] = s; });

  let html = `
    <div class="page-header">
      <div class="eyebrow">ADMIN</div>
      <div class="page-title">Store Opening Scorecards</div>
      <div class="page-subtitle">Post-opening performance review for each store. Admin only.</div>
    </div>`;

  if (openings.length === 0) {
    html += '<div class="card" style="padding:32px;text-align:center;color:var(--text-muted)">No openings found.</div>';
    container.innerHTML = html;
    return;
  }

  openings.forEach(o => {
    const sc = scMap[o.id];
    const dateStr = o.start_date ? new Date(o.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
    html += `<div class="card mb-20" style="cursor:pointer;transition:box-shadow 0.15s" onmouseenter="this.style.boxShadow='0 2px 12px rgba(0,0,0,0.12)'" onmouseleave="this.style.boxShadow=''" onclick="openScorecardEditor('${o.id}')">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px">
        <div>
          <div style="font-size:14px;font-weight:700;color:var(--text)">${o.store_name}</div>
          <div style=”font-size:12px;color:var(--text-muted);margin-top:2px”>Coach: ${o.coach_name || '-'} &nbsp;&middot;&nbsp; ${dateStr}</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          ${sc ? '<span class="badge badge-green">Scorecard</span>' : '<span class="badge badge-gray">No scorecard yet</span>'}
          <span style="color:var(--text-muted);font-size:20px;line-height:1">&rsaquo;</span>
        </div>
      </div>
    </div>`;
  });

  container.innerHTML = html;
}

async function openScorecardEditor(openingId) {
  const container = document.getElementById('view-scorecards');
  container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted)">Loading...</div>';

  const [openingData, scorecardResult, ltListResult] = await Promise.all([
    dbLoadOpeningForScorecard(openingId),
    dbLoadScorecard(openingId),
    dbLoadAllLeadershipTrainingsForLink()
  ]);

  _sc = {
    openingId,
    opening: openingData.opening,
    trainees: openingData.trainees,
    signoffs: openingData.signoffs,
    oscReport: openingData.oscReport,
    recaps: openingData.recaps,
    sc: scorecardResult.data || {},
    ltList: ltListResult.data || [],
    ltData: null
  };

  if (_sc.sc.leadership_training_id) {
    _sc.ltData = await dbLoadLeadershipDataForScorecard(_sc.sc.leadership_training_id);
  }

  renderScorecardEditorHTML(container);
}

function renderScorecardEditorHTML(container) {
  const { opening, sc, ltList, ltData } = _sc;
  const scores = calcScorecardScores();

  const ltOptions = ltList.map(lt => {
    const sp = lt.store_programs;
    const label = sp
      ? `${sp.franchise_store_name} — ${lt.trainer_name}${lt.start_date ? ', ' + lt.start_date : ''}`
      : lt.trainer_name;
    return `<option value="${lt.id}" ${sc.leadership_training_id === lt.id ? 'selected' : ''}>${label}</option>`;
  }).join('');

  const statusColors = { green: 'badge-green', amber: 'badge-amber', red: 'badge-danger', gray: 'badge-gray' };
  const statusWord = s => ({ green: 'Green', amber: 'Amber', red: 'Red', gray: '—' })[s] || '—';

  const scoreRow = (label, score) => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:11px 0;border-bottom:1px solid var(--border)">
      <span style="font-size:13px;font-weight:600;color:var(--text)">${label}</span>
      <div style="display:flex;align-items:center;gap:10px">
        <span style="font-size:12px;color:var(--text-secondary)">${score.label || '—'}</span>
        <span class="badge ${statusColors[score.status] || 'badge-gray'}" style="min-width:52px;text-align:center">${statusWord(score.status)}</span>
      </div>
    </div>`;

  let ltSummaryHtml = '';
  if (ltData && ltData.lt) {
    const { lt: lt2, sp: sp2, participants, signoffs: lso, reports } = ltData;
    const totalComps = LEADERSHIP_COMPETENCIES.length;
    let totalSigned = 0;
    participants.forEach(p => {
      totalSigned += LEADERSHIP_COMPETENCIES.filter(c => lso.some(s => s.participant_id === p.id && s.competency_id === c.id)).length;
    });
    const pct2 = participants.length > 0 ? Math.round((totalSigned / (participants.length * totalComps)) * 100) : 0;
    ltSummaryHtml = `<div style="margin-top:12px;padding:12px 14px;background:var(--surface);border-radius:var(--radius);border:1px solid var(--border);font-size:12px;color:var(--text-secondary)">
      <div style="font-weight:700;color:var(--text);margin-bottom:3px">${sp2 ? sp2.franchise_store_name : 'Linked Training'}</div>
      <div>Trainer: ${lt2.trainer_name} &nbsp;&middot;&nbsp; ${participants.length} participants &nbsp;&middot;&nbsp; ${pct2}% signed off &nbsp;&middot;&nbsp; ${reports.length} readiness report${reports.length !== 1 ? 's' : ''}</div>
    </div>`;
  }

  container.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px">
      <button class="btn btn-secondary" onclick="renderScorecards()">← All Scorecards</button>
    </div>

    <div class="page-header">
      <div class="eyebrow">SCORECARD</div>
      <div class="page-title">${opening.store_name}</div>
      <div class="page-subtitle">Coach: ${opening.coach_name || '—'} &nbsp;·&nbsp; ${opening.start_date || '—'}</div>
    </div>

    <div class="card mb-20">
      <div class="card-header"><div class="card-title">At-a-Glance Scores</div><div class="card-subtitle">Green: ≥90% &nbsp;·&nbsp; Amber: 70–89% &nbsp;·&nbsp; Red: &lt;70%</div></div>
      <div class="card-body" style="padding-top:0;padding-bottom:4px">
        ${scoreRow('NSO Sign-off Completion', scores.signoff)}
        ${scoreRow('eLearning Completion', scores.elearning)}
        ${scoreRow('Staffing (Trained)', scores.staffing)}
        ${scoreRow('T1 Process-Confusion Tickets', scores.t1)}
        ${scoreRow('Leadership Readiness', scores.leadership)}
      </div>
    </div>

    <div class="card mb-20">
      <div class="card-header"><div class="card-title">Linked Leadership Training</div></div>
      <div class="card-body">
        <div class="form-row">
          <label class="form-label">Link a leadership training program to this opening</label>
          <select class="input" id="sc-lt-link" onchange="onScorecardLTChange()">
            <option value="">— None —</option>
            ${ltOptions}
          </select>
        </div>
        ${ltSummaryHtml}
      </div>
    </div>

    <div class="card mb-20">
      <div class="card-header"><div class="card-title">Manual Data Entry</div></div>
      <div class="card-body">
        <div class="form-row">
          <label class="form-label">eLearning Completion (%)</label>
          <input type="number" class="input" id="sc-elearning" min="0" max="100" style="max-width:160px" placeholder="e.g. 87" value="${sc.elearning_pct != null ? sc.elearning_pct : ''}">
        </div>
        <div class="grid-2" style="gap:16px">
          <div class="form-row">
            <label class="form-label">Total T1 Tickets (first 30 days)</label>
            <input type="number" class="input" id="sc-t1-total" min="0" placeholder="e.g. 20" value="${sc.t1_total != null ? sc.t1_total : ''}">
          </div>
          <div class="form-row">
            <label class="form-label">Process-Confusion T1 Tickets</label>
            <input type="number" class="input" id="sc-t1-process" min="0" placeholder="e.g. 2" value="${sc.t1_process_confusion != null ? sc.t1_process_confusion : ''}">
          </div>
        </div>
      </div>
    </div>

    <div class="card mb-20">
      <div class="card-header">
        <div><div class="card-title">Brain Dump</div><div class="card-subtitle">Slack notes, permit delays, deployment context, anything not captured elsewhere</div></div>
      </div>
      <div class="card-body">
        <textarea class="recap-textarea" id="sc-brain-dump" style="min-height:140px" placeholder="Paste Slack highlights, permit delays, deployment issues, stakeholder feedback, morale observations...">${sc.brain_dump || ''}</textarea>
      </div>
    </div>

    <div style="display:flex;gap:12px;margin-bottom:24px;flex-wrap:wrap;align-items:center">
      <button class="btn btn-primary" onclick="saveScorecardData()">Save Scorecard</button>
      <button class="btn btn-secondary" onclick="copyScorecardAIPrompt()">Copy AI Prompt</button>
      <span id="sc-save-status" style="font-size:12px;color:var(--text-muted)"></span>
    </div>

    <div class="card mb-20">
      <div class="card-header">
        <div><div class="card-title">AI Summary</div><div class="card-subtitle">Generate with the Copy AI Prompt button, paste into ChatGPT, then save the result here</div></div>
      </div>
      <div class="card-body">
        <textarea class="recap-textarea" id="sc-ai-summary" style="min-height:120px" placeholder="Paste the AI-generated summary here to save it to this scorecard...">${sc.ai_summary || ''}</textarea>
      </div>
    </div>`;
}

function calcScorecardScores() {
  const { trainees, signoffs, sc, ltData } = _sc;
  const scores = {};

  // 1. NSO sign-off completion
  let totalSigned = 0, totalPossible = 0;
  (trainees || []).forEach(t => {
    const isLeader = t.role === 'SM' || t.role === 'ASM';
    const applicable = COMPETENCIES.filter(c => !c.smOnly || isLeader);
    totalPossible += applicable.length;
    totalSigned += applicable.filter(c =>
      (signoffs || []).some(s => s.trainee_id === t.id && s.competency_id === c.id && s.status === 'signed')
    ).length;
  });
  const signoffPct = totalPossible > 0 ? Math.round((totalSigned / totalPossible) * 100) : null;
  scores.signoff = { label: signoffPct != null ? signoffPct + '%' : 'N/A', status: pctToStatus(signoffPct) };

  // 2. eLearning
  const ePct = sc.elearning_pct != null ? parseInt(sc.elearning_pct) : null;
  scores.elearning = { label: ePct != null ? ePct + '%' : 'Not entered', status: pctToStatus(ePct) };

  // 3. Staffing
  const hasSM = (trainees || []).some(t => t.role === 'SM');
  const hasASM = (trainees || []).some(t => t.role === 'ASM');
  const leadCount = (trainees || []).filter(t => t.role === 'Lead GEG').length;
  let staffStatus, staffLabel;
  if (hasSM && hasASM && leadCount >= 1) {
    staffStatus = 'green';
    staffLabel = 'SM ✓  ASM ✓  ' + leadCount + ' Lead' + (leadCount > 1 ? 's' : '') + ' ✓';
  } else if ((hasSM || hasASM) && leadCount >= 1) {
    staffStatus = 'amber';
    staffLabel = 'SM ' + (hasSM ? '✓' : '✗') + '  ASM ' + (hasASM ? '✓' : '✗') + '  ' + leadCount + ' Lead' + (leadCount !== 1 ? 's' : '');
  } else {
    staffStatus = 'red';
    staffLabel = 'SM ' + (hasSM ? '✓' : '✗') + '  ASM ' + (hasASM ? '✓' : '✗') + '  ' + leadCount + ' Lead' + (leadCount !== 1 ? 's' : '');
  }
  scores.staffing = { label: staffLabel, status: staffStatus };

  // 4. T1 process-confusion tickets
  const t1Total = sc.t1_total != null ? parseInt(sc.t1_total) : null;
  const t1Process = sc.t1_process_confusion != null ? parseInt(sc.t1_process_confusion) : null;
  let t1Status = 'gray', t1Label = 'Not entered';
  if (t1Total === 0 && t1Process != null) {
    t1Label = 'No T1 tickets';
    t1Status = 'green';
  } else if (t1Total != null && t1Process != null && t1Total > 0) {
    const pct = Math.round((t1Process / t1Total) * 100);
    t1Label = t1Process + '/' + t1Total + ' tickets = ' + pct + '%';
    t1Status = pct <= 10 ? 'green' : pct <= 20 ? 'amber' : 'red';
  }
  scores.t1 = { label: t1Label, status: t1Status };

  // 5. Leadership readiness
  if (ltData && ltData.reports) {
    const { reports } = ltData;
    if (reports.length === 0) {
      scores.leadership = { label: 'No readiness reports yet', status: 'gray' };
    } else {
      const readyCount = reports.filter(r => r.readiness_status === 'ready').length;
      const supportCount = reports.filter(r => r.readiness_status === 'ready_with_support').length;
      const needsCount = reports.filter(r => r.readiness_status === 'needs_additional_training').length;
      const parts = [];
      if (readyCount) parts.push(readyCount + ' Ready');
      if (supportCount) parts.push(supportCount + ' With Support');
      if (needsCount) parts.push(needsCount + ' Needs Training');
      scores.leadership = { label: parts.join(' · '), status: needsCount > 0 ? 'red' : supportCount > 0 ? 'amber' : 'green' };
    }
  } else {
    scores.leadership = { label: 'No leadership training linked', status: 'gray' };
  }

  return scores;
}

function pctToStatus(pct) {
  if (pct == null) return 'gray';
  if (pct >= 90) return 'green';
  if (pct >= 70) return 'amber';
  return 'red';
}

async function onScorecardLTChange() {
  const ltId = document.getElementById('sc-lt-link')?.value || null;
  _sc.sc.leadership_training_id = ltId || null;
  _sc.ltData = ltId ? await dbLoadLeadershipDataForScorecard(ltId) : null;
  renderScorecardEditorHTML(document.getElementById('view-scorecards'));
}

async function saveScorecardData() {
  const { openingId } = _sc;
  const elearning = document.getElementById('sc-elearning')?.value;
  const t1Total = document.getElementById('sc-t1-total')?.value;
  const t1Process = document.getElementById('sc-t1-process')?.value;
  const brainDump = document.getElementById('sc-brain-dump')?.value || '';
  const aiSummary = document.getElementById('sc-ai-summary')?.value || '';
  const ltId = document.getElementById('sc-lt-link')?.value || null;

  const data = {
    opening_id: openingId,
    leadership_training_id: ltId || null,
    elearning_pct: elearning !== '' ? parseInt(elearning) : null,
    t1_total: t1Total !== '' ? parseInt(t1Total) : null,
    t1_process_confusion: t1Process !== '' ? parseInt(t1Process) : null,
    brain_dump: brainDump,
    ai_summary: aiSummary
  };

  const err = await dbSaveScorecard(data);
  const statusEl = document.getElementById('sc-save-status');
  if (err) {
    if (statusEl) statusEl.textContent = 'Save failed.';
    showToast('Save failed: ' + (err.message || 'DB error'), 'error');
    return;
  }

  _sc.sc = Object.assign({}, _sc.sc, data);
  if (statusEl) { statusEl.textContent = 'Saved!'; setTimeout(function() { if (statusEl) statusEl.textContent = ''; }, 2500); }
  showToast('Scorecard saved!', 'success');
  renderScorecardEditorHTML(document.getElementById('view-scorecards'));
}

async function copyScorecardAIPrompt() {
  const { opening, oscReport, recaps, sc, ltData } = _sc;
  const elearning = document.getElementById('sc-elearning')?.value;
  const t1Total = document.getElementById('sc-t1-total')?.value;
  const t1Process = document.getElementById('sc-t1-process')?.value;
  const brainDump = document.getElementById('sc-brain-dump')?.value || '';

  const liveSc = Object.assign({}, sc, {
    elearning_pct: elearning !== '' ? parseInt(elearning) : sc.elearning_pct,
    t1_total: t1Total !== '' ? parseInt(t1Total) : sc.t1_total,
    t1_process_confusion: t1Process !== '' ? parseInt(t1Process) : sc.t1_process_confusion,
    brain_dump: brainDump
  });

  const prevSc = _sc.sc;
  _sc.sc = liveSc;
  const scores = calcScorecardScores();
  _sc.sc = prevSc;

  const sw = function(s) { return { green: 'GREEN', amber: 'AMBER', red: 'RED', gray: 'N/A' }[s] || 'N/A'; };

  var prompt = 'You are a Sandbox VR regional support analyst creating a post-opening scorecard summary.\n\n';
  prompt += 'STORE: ' + opening.store_name + '\n';
  prompt += 'OPENING DATE: ' + (opening.start_date || 'Unknown') + '\n';
  prompt += 'COACH: ' + (opening.coach_name || 'Unknown') + '\n\n';
  prompt += 'SCORECARD SCORES:\n';
  prompt += '- NSO Sign-off Completion: ' + scores.signoff.label + ' [' + sw(scores.signoff.status) + ']\n';
  prompt += '- eLearning Completion: ' + scores.elearning.label + ' [' + sw(scores.elearning.status) + ']\n';
  prompt += '- Staffing Trained: ' + scores.staffing.label + ' [' + sw(scores.staffing.status) + ']\n';
  prompt += '- T1 Process-Confusion Tickets (30 days): ' + scores.t1.label + ' [' + sw(scores.t1.status) + ']\n';
  prompt += '- Leadership Readiness: ' + scores.leadership.label + ' [' + sw(scores.leadership.status) + ']';

  if (oscReport) {
    prompt += '\n\nOSC REPORT:\n';
    prompt += '- Deployment Rating: ' + (oscReport.deployment_rating || 'N/A') + '/5\n';
    prompt += '- Team Rating: ' + (oscReport.team_rating || 'N/A') + '/5\n';
    prompt += '- SM Rating: ' + (oscReport.sm_rating || 'N/A') + '/5\n';
    prompt += '- ASM Rating: ' + (oscReport.asm_rating || 'N/A') + '/5';
    if (oscReport.deployment_notes) prompt += '\n- Deployment Notes: ' + oscReport.deployment_notes;
    if (oscReport.team_notes) prompt += '\n- Team Notes: ' + oscReport.team_notes;
    if (oscReport.sm_notes) prompt += '\n- SM Notes: ' + oscReport.sm_notes;
    if (oscReport.asm_notes) prompt += '\n- ASM Notes: ' + oscReport.asm_notes;
    if (oscReport.biz_impact_notes) prompt += '\n- Business Impact: ' + oscReport.biz_impact_notes;
  }

  var recapLines = [];
  var recapFields = [
    ['ld-progress', 'Learning Plan'], ['team-successes', 'Wins'], ['team-opportunities', 'Opportunities'],
    ['tech-mscap', 'Tech Issues'], ['tech-tickets', 'T1 Tickets'], ['building-permits', 'Permits']
  ];
  (_sc.recaps || []).forEach(function(r) {
    var data = r.recap_data || {};
    var lines = recapFields.map(function(f) { return data[f[0]] ? '  [' + f[1] + '] ' + data[f[0]] : null; }).filter(Boolean);
    if (lines.length) recapLines.push('Day ' + r.day_num + ':\n' + lines.join('\n'));
  });
  if (recapLines.length) prompt += '\n\nDAILY RECAP HIGHLIGHTS:\n' + recapLines.join('\n');

  if (ltData && ltData.lt) {
    var lt2 = ltData.lt, sp2 = ltData.sp, participants = ltData.participants, reports = ltData.reports, notes = ltData.notes;
    prompt += '\n\nLEADERSHIP TRAINING' + (sp2 ? ' (' + sp2.franchise_store_name + ')' : '') + ':\nTrainer: ' + lt2.trainer_name;
    if (participants.length > 0) {
      prompt += '\nParticipants:';
      participants.forEach(function(p) {
        var rpt = reports.find(function(r) { return r.participant_id === p.id; });
        var role = (p.role === 'Custom' && p.custom_role) ? p.custom_role : p.role;
        var status = rpt && rpt.readiness_status ? rpt.readiness_status.replace(/_/g, ' ') : 'no report';
        var rating = rpt && rpt.rating_1_to_4 ? ' (' + rpt.rating_1_to_4 + '/4)' : '';
        prompt += '\n  - ' + p.name + ' (' + role + '): ' + status + rating;
        if (rpt && rpt.strengths) prompt += '\n    Strengths: ' + rpt.strengths;
        if (rpt && rpt.risks) prompt += '\n    Risks: ' + rpt.risks;
        if (rpt && rpt.follow_ups) prompt += '\n    Follow-ups: ' + rpt.follow_ups;
      });
    }
    var noteLines = [];
    (notes || []).forEach(function(n) {
      var d = n.notes_data || {};
      if (d.observations) noteLines.push('  Day ' + n.day_num + ' Observations: ' + d.observations);
      if (d.gaps) noteLines.push('  Day ' + n.day_num + ' Gaps: ' + d.gaps);
    });
    if (noteLines.length) prompt += '\nTrainer Notes:\n' + noteLines.join('\n');
  }

  if (liveSc.brain_dump) prompt += '\n\nADDITIONAL CONTEXT / BRAIN DUMP:\n' + liveSc.brain_dump;

  prompt += '\n\n---\n\n';
  prompt += 'Please write a concise store opening scorecard summary with exactly the following sections:\n\n';
  prompt += '1. OVERALL (2-3 sentences): A narrative summary of how this opening went. Synthesize the data — do not just list the scores back.\n';
  prompt += '2. TOP STRENGTHS (3 bullet points): Specific things that went well, grounded in the data above.\n';
  prompt += '3. WATCH ITEMS (3 bullet points): Risks, gaps, or areas needing follow-up support from the regional team.\n';
  prompt += '4. RECOMMENDED ACTION (1 sentence): The single most important follow-up for the support team in the next 30 days.\n\n';
  prompt += 'Keep the total response under 250 words. Use professional but direct language.';

  try {
    await navigator.clipboard.writeText(prompt);
    showToast('AI prompt copied — paste into ChatGPT!', 'success');
  } catch(e) {
    showToast('Could not copy to clipboard.', 'error');
  }
}
