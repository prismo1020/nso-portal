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
  franchiseChecks: {}
};

let contextTarget = null;

// ============================================================
// DATA — AGENDAS
// ============================================================
const DAYS = [
  {
    num: 1,
    title: 'All Things Sandbox VR & the Guest Experience',
    type: 'Learning Plan',
    focus: 'Today is about orientation, immersion, and building the foundation. Your team needs to understand WHY they are here before they can learn HOW. Start with energy.',
    blocks: [
      { time: '15 min', title: 'Intros & Store Tour', objectives: ['Gain familiarity with the store layout.','Learn key Sandbox VR vocabulary (pages 8-10 of Learning Plan).','Set the tone — excited, professional, immersive.'], tip: 'Walk the team through the store yourself first, calling out each area by its correct name (Lobby, Barracks, Holodeck). Narrate the Guest Journey as you walk. This primes their mental model before they open a single document.', say: 'Tell the team what they\'re about to do and why each area matters to the Guest.', see: 'Watch for body language — curiosity is a good sign. Note who asks questions.', doText: 'Ask each team member to name one area and its purpose.', resources: ['Sandbox VR Vocab (Learning Plan pages 8-10)'] },
      { time: '30 min', title: 'Introduction to Sandbox VR', objectives: ['Describe Sandbox VR\'s History, Mission, & Core Values.','Discover the VR experiences available.','Understand KPIs and what drives the business.'], tip: 'Don\'t just read the history slides. Tell the story with pride. The detail that Sandbox VR started in Hong Kong in 2017, grew through word of mouth, and now has celebrity investors like Justin Timberlake and Katy Perry — that\'s a story. Make them feel like they\'re joining something special.', say: 'Explain why the mission matters to guests and to the team.', see: 'Watch for trainees who light up when they hear about the experiences. Those are your future top sellers.', doText: 'Have each trainee share one core value they connect with personally.', resources: ['Sandbox VR Website','Learning Plan: History (pages 6-9)','Mission & Core Values (page 7)'] },
      { time: '60 min', title: 'GEG Responsibilities & the Guest Journey', objectives: ['Watch Service Essentials: Guest Journey video.','Discuss GEG responsibilities at each touchpoint.','Walk through interaction scripts.'], tip: 'Always show the video first, then debrief. Research on multimedia learning (Mayer, 2009) shows that people retain more when they receive visual and auditory information together before verbal discussion. Let the video do the heavy lifting, then you amplify.', say: 'Explain each of the four touchpoints: Entrance/Check-In, Barracks, Holodeck, Post-Experience.', see: 'Watch how trainees respond to the scripted language — are they natural or stiff? Note it.', doText: 'Pair up and practice the check-in script with each other, rotating roles.', resources: ['Service Essentials: Guest Journey (Delightree)','Learning Plan pages 18-20'] },
      { time: '30 min', title: 'Guest Policies, Procedures & Guest Recovery', objectives: ['Review critical policies: late arrivals, cancellations, waivers, refunds.','Understand the Acknowledge-Empathize-Resolve recovery model.','Practice one Guest Recovery scenario.'], tip: 'Policies only stick when trainees practice applying them to real situations. Use the 5-minute grace period, the $50 rebooking fee, and a frustrated guest scenario as practice prompts. Make it feel real — not hypothetical.', say: 'Walk through the most common guest challenges and the policy response for each.', see: 'Who handles awkward guest scenarios naturally? Who freezes? Both are useful data.', doText: 'Role-play one delayed-guest scenario and one tech-issue recovery.', resources: ['Policies and Procedures (page 14)','Guest Recovery Model (page 14)'] },
      { time: '30 min', title: 'Break', objectives: ['Rest & recharge.'], tip: 'Use break time to do a quick informal check-in with the SM. How are they feeling about running the training? Note any early alignment or gaps.', say: '', see: '', doText: '', resources: [] },
      { time: '20 min', title: 'Technology Essentials: Tracking', objectives: ['Watch Tech Essentials: Tracking video.','Understand passive vs. active tracking fundamentals.','Learn tracker ball inspection standards (20% rule).'], tip: 'Tracking is the backbone of the entire experience. If trainees don\'t understand why tracker calibration matters, they\'ll treat it as a checkbox. Connect the tech to the guest — a bad calibration equals a broken experience.', say: 'Explain how mocap translates physical movement into the virtual world.', see: 'Look for trainees who seem genuinely curious about the technology — they often become your technical leaders.', doText: 'Inspect tracker balls as a group and practice identifying whether one meets the 20% damage threshold.', resources: ['Tech Essentials: Tracking (Delightree)','Calibration SOP (Delightree)'] },
      { time: '240+ min', title: 'Build All Store Trackers', objectives: ['Complete the Procedure Checklist: Trackers.','Build all limb and prop trackers as a group.','Ensure correct screw sizing (4x8 for limb trackers).'], tip: 'This is high-repetition hands-on learning at its best — exactly where retention rates spike. Space out the work so everyone touches each step multiple times, not just once. Blocked practice builds initial skill; varied practice builds lasting retention. Note: limb trackers use 4x8 screws, NOT 4x6.', say: 'Walk through each step of the Procedure Checklist before starting.', see: 'Observe technique and confidence. Anyone struggling becomes a priority for additional coaching.', doText: 'Every trainee builds at least one tracker from start to finish independently.', resources: ['Procedure Checklist: Trackers (page 26)'] },
    ]
  },
  {
    num: 2,
    title: 'Understanding Service, Sales & Operations',
    type: 'Learning Plan',
    focus: 'Day 2 is about equipping the team to handle a full session operationally. By end of day, every trainee should be able to navigate Checkfront, demonstrate vest pairing, and understand our sales approach.',
    blocks: [
      { time: '60 min', title: 'Booking & Experience Software: Checkfront & Silica', objectives: ['Navigate Checkfront to book, check-in, and manage sessions.','Use the Silica App on the staff iPad.','Practice a complete booking workflow.'], tip: 'Software confidence comes from repetition, not explanation. Give trainees hands-on time with the system as early as possible. Pair them up so they teach each other — peer teaching drives deeper processing.', say: 'Walk through a complete booking scenario while team follows along.', see: 'Watch for hesitation on the check-in flow — this is where new GEGs lose time with guests.', doText: 'Each trainee completes a practice booking and check-in independently.', resources: ['Checkfront Procedures Checklist (page 21)','SOP – Checkfront (Delightree)','Silica App (page 22)'] },
      { time: '60 min', title: 'How to Sell Sandbox VR', objectives: ['Understand the Repeatability KPI and the three moments to sell it.','Practice back-to-back booking conversations.','Understand Staff Conversion and walk-in engagement.'], tip: 'Selling at Sandbox VR isn\'t about pushing product — it\'s about extending a great experience. Trainees who feel awkward about sales usually do when framed as "convince them to spend money." Reframe it: you are offering them more of something they\'re already about to love.', say: 'Demonstrate the three repeatability moments: check-in, mid-experience (while geared up), post-experience.', see: 'Note natural salespeople vs. those who seem hesitant. Both can be great with the right framing.', doText: 'Role-play all three repeatability moments in rotation. Everyone goes twice.', resources: ['Upselling (page 13)'] },
      { time: '30 min', title: 'Technology Essentials: Holodeck Room Servers', objectives: ['Watch Technology Essentials: Holodeck Room Servers.','Understand the roles of EMU (Experience, Mocap, Video Servers).','Review basic hardware layout.'], tip: 'Connect the servers to what trainees already learned about tracking. EMU servers are what take the tracker data and turn it into the VR world. When they understand the signal flow, troubleshooting becomes intuitive instead of mysterious.', say: 'Explain what each server does in plain language — not technical specs.', see: 'Who asks the most system-level questions? Those are your tech-inclined GEGs.', doText: 'Trainees label each server type on a diagram before touching the hardware.', resources: ['Technology Essentials: Holodeck Room Servers (Delightree)'] },
      { time: '30 min', title: 'Procedure Checklist: Holodeck Room Servers', objectives: ['Complete the Basic Technology Procedures Checklist.','Review cleaning & maintenance responsibilities for Holodeck Room Servers.'], tip: 'Checklists reduce cognitive load and catch errors that confidence-based working misses. Frame checklists not as bureaucracy but as the standard every Sandbox location holds itself to — the mark of a professional team.', say: 'Walk through each step before trainees attempt it.', see: 'Observe speed and accuracy. Both extremes need coaching.', doText: 'Each trainee completes the checklist solo and self-checks against the answer.', resources: ['Basic Procedures Checklist (page 29)'] },
      { time: '30 min', title: 'Break', objectives: ['Rest & recharge.'], tip: '', say: '', see: '', doText: '', resources: [] },
      { time: '30 min', title: 'Technology Essentials: Wireless Streaming', objectives: ['Watch Tech Essentials: Wireless Streaming.','Understand hardware and software components of wireless streaming.'], tip: '', say: 'Cover the key components: headsets, base stations, wireless access points.', see: 'Watch for anyone who looks confused — wireless streaming has the most moving parts.', doText: 'Trainees draw the wireless signal flow from headset to server on a whiteboard.', resources: ['Tech Essentials: Wireless Streaming (Delightree)'] },
      { time: '60 min', title: 'Procedure Checklist: Wireless Streaming', objectives: ['Complete the Wireless Streaming Procedure Checklist.','Demonstrate ability to reset and reconnect wireless components.'], tip: 'This is a hands-on competency that every GEG will need to perform under guest pressure. Make sure every trainee does the full reset process at least twice before signing off.', say: 'Walk through each procedure step with explanations.', see: 'Watch for trainees who skip steps or do them out of order.', doText: 'Every trainee completes the full wireless reset procedure independently.', resources: ['Wireless Procedure Checklist (page 26)'] },
      { time: '30 min', title: 'Technology Essentials: Haptic Vests', objectives: ['Watch Tech Essentials: Haptic Vests video.','Understand haptic feedback technology and vest adjustment.','Complete vest pairing & troubleshooting activity.'], tip: 'The haptic vest is what guests are most excited about. Use that. When trainees understand that a poorly fitted vest means muted haptics and a diminished guest experience, they care more about getting it right.', say: 'Demonstrate proper vest fitting: adjustment range (up to 50"), pairing process, and LED status indicators.', see: 'Watch for proper adjustment technique — vest fit affects both haptic quality and guest comfort.', doText: 'Pair, troubleshoot, and re-pair vests in groups of 3. Rotate until each person has done it twice.', resources: ['Tech Essentials: Haptic Vests (Delightree)','Quick Reference Guide - Haptic Vests'] },
      { time: '30 min', title: 'Technology Essentials: Props', objectives: ['Watch Tech Essentials: Props.','Understand prop types (Gun, Wand, Pistol) and their experience assignments.','Complete prop pairing & troubleshooting activity.'], tip: 'Props are often where new GEGs lose confidence under pressure because props don\'t always pair on the first attempt. Give trainees permission to troubleshoot — normalize the issue-solving process as part of the role.', say: 'Explain each prop type and which experiences they are used for.', see: 'Who handles prop troubleshooting calmly? Who gets frustrated? Coaching opportunity.', doText: 'Each trainee pairs all three prop types successfully and practices the re-pair process.', resources: ['Tech Essentials: Props (Delightree)','Procedure Checklist: Prop Pairing (page 27)'] },
    ]
  },
  {
    num: 3,
    title: 'Review, Role-Play & Store Daily Procedures',
    type: 'Learning Plan',
    focus: 'Day 3 ties everything together. The shift from knowledge to execution happens here. Role-play should be the majority of the day — the more realistic the scenarios, the better.',
    blocks: [
      { time: '60 min', title: 'Opening Procedures', objectives: ['Practice completing the Opening Checklist.','Complete Room Calibration for all rooms.','Identify and correct any calibration issues independently.'], tip: 'Opening is where the day\'s operational success is set. Trainees who can execute a clean open will handle busy days with confidence. Trainees who skip steps will create downstream problems. Don\'t let shortcuts slide today.', say: 'Walk through the Opening Checklist item by item before trainees attempt it.', see: 'Watch for the instinct to rush. Speed comes with experience — completeness comes with habit.', doText: 'Each trainee leads the opening sequence for one room from start to finish.', resources: ['Opening Checklist (Delightree)','Room Calibration SOP (Delightree)','Checklist (page 28)'] },
      { time: '30 min', title: 'T1 Ticket Workflow', objectives: ['Watch Technology Essentials: T1 Workflow.','Understand when to escalate to T1 (5-minute rule).','Practice submitting a T1 ticket.'], tip: 'The 5-minute rule exists for a reason: GEGs often try to resolve things themselves out of pride or guest embarrassment. Make it clear that fast escalation to T1 is the professional move, not an admission of failure.', say: 'Cover the 5-minute escalation rule, what info to include in a ticket, and how to communicate the delay to guests.', see: 'Look for confidence and clarity in how trainees describe a tech issue — this is what they\'ll need under real-time pressure.', doText: 'Each trainee submits a practice T1 ticket describing a hypothetical issue.', resources: ['Technology Essentials: T1 Workflow (Delightree)'] },
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
  { day: 1, id: 'c1-1', name: 'Names all store areas' },
  { day: 1, id: 'c1-2', name: 'Recites Mission & Core Values' },
  { day: 1, id: 'c1-3', name: 'Delivers Guest Journey intro' },
  { day: 1, id: 'c1-4', name: 'Applies Guest Recovery model' },
  { day: 1, id: 'c1-5', name: 'Builds tracker independently' },
  { day: 2, id: 'c2-1', name: 'Completes Checkfront booking' },
  { day: 2, id: 'c2-2', name: 'Delivers repeatability pitch ×3' },
  { day: 2, id: 'c2-3', name: 'Pairs haptic vest independently' },
  { day: 2, id: 'c2-4', name: 'Pairs props (Gun, Wand, Pistol)' },
  { day: 2, id: 'c2-5', name: 'Completes wireless reset' },
  { day: 3, id: 'c3-1', name: 'Leads opening procedures' },
  { day: 3, id: 'c3-2', name: 'Submits T1 ticket correctly' },
  { day: 3, id: 'c3-3', name: 'Full Guest Journey run' },
  { day: 3, id: 'c3-4', name: 'Tracks up a full group' },
  { day: 3, id: 'c3-5', name: 'Leads closing procedures' },
  { day: 4, id: 'c4-1', name: 'All roles in Guest Journey' },
  { day: 4, id: 'c4-2', name: 'Handles tech issue under pressure' },
  { day: 4, id: 'c4-3', name: 'Executes guest recovery live' },
  { day: 5, id: 'c5-1', name: 'Full F&F session — no coaching' },
  { day: 5, id: 'c5-2', name: 'Maintains standard for 5+ hrs' },
];

// ============================================================
// KNOWLEDGE BASE DATA
// ============================================================
const KB = {
  'The Guest Journey': [
    {
      id: 'gj-overview',
      title: 'The Guest Journey: Overview',
      category: 'The Guest Journey',
      eyebrow: 'GUEST EXPERIENCE',
      subtitle: 'Four touchpoints. One unforgettable experience.',
      content: `<h3>What is the Guest Journey?</h3>
<p>The Guest Journey is the term Sandbox VR uses for the complete arc of a guest's visit — from the moment they walk through the door to the moment they leave. It is not a series of tasks. It is a narrative you and your team co-create with every group you host.</p>
<p>There are four key touchpoints:</p>
<ul>
<li><strong>Entrance / Check-In</strong> — The Host makes the first impression. Warm, knowledgeable, and energized.</li>
<li><strong>Barracks</strong> — Guests gear up. GEGs help with trackers, explain the experience, and build anticipation.</li>
<li><strong>Holodeck</strong> — The experience runs. GEGs monitor, troubleshoot, and keep energy high.</li>
<li><strong>Post-Experience</strong> — Guests decompress, watch their recap video, and this is where your best repeatability conversations happen.</li>
</ul>
<div class="science-callout"><div class="science-callout-label">Training Science</div><div class="science-callout-text">Peak-end rule (Kahneman, 1999): Guests remember an experience based primarily on how it felt at its most intense moment and how it ended. Your Post-Experience interaction is as important as the Holodeck itself. Train your team to own the ending.</div></div>
<h3>The Host Role</h3>
<p>The Host is responsible for check-in: greeting groups, confirming bookings in Checkfront, processing the digital waiver, and handing the group off to the Barracks GEG. The Host also handles walk-in traffic and phone inquiries — two major conversion opportunities.</p>
<h3>The Barracks GEG Role</h3>
<p>The Barracks GEG explains the experience, fits trackers, pairs haptic vests, and ensures every guest is set up correctly before they enter the Holodeck. This is the last preparation touchpoint — any anxiety a guest has needs to be addressed here.</p>`
    },
    {
      id: 'gj-scripts',
      title: 'Guest Interaction Scripts',
      category: 'The Guest Journey',
      eyebrow: 'GUEST EXPERIENCE',
      subtitle: 'Natural language, not a script. A guide, not a script.',
      content: `<h3>Why We Use Scripted Language</h3>
<p>Scripted language isn't about making GEGs robotic — it's about ensuring that every guest hears the right information in the right way, every time. Think of it as a jazz standard: you know the melody, but you're free to interpret it.</p>
<div class="science-callout"><div class="science-callout-label">Training Science</div><div class="science-callout-text">Cognitive load theory (Sweller, 1988) shows that when people are overwhelmed with decisions, performance drops. Scripts reduce decision-making burden so GEGs can focus on reading the guest, not on figuring out what to say next.</div></div>
<h3>Check-In Language</h3>
<p>At check-in, the goal is warm, confident, and efficient. Guests often arrive excited and slightly nervous. Your energy sets the tone.</p>
<ul>
<li>Greet by group size: "Welcome to Sandbox VR! Are you here for [booking name]?"</li>
<li>Plant the seed early: "After your experience today, I can show you how to book another session — a lot of groups love going back-to-back."</li>
<li>For walk-ins: "Have you heard of us before? Let me show you something..."</li>
</ul>
<h3>Gear-Up Language</h3>
<p>In the Barracks, guests are putting on unfamiliar equipment. Your calm competence is contagious.</p>
<ul>
<li>"These trackers go on your wrists and ankles — they're how the system sees your movement."</li>
<li>"The vest has vibrating motors — you'll actually feel things in the experience."</li>
<li>"If anything feels loose or uncomfortable once we start, just let me know through the mic."</li>
</ul>`
    }
  ],
  'Technology': [
    {
      id: 'tech-tracking',
      title: 'Passive Trackers: Build, Inspect & Troubleshoot',
      category: 'Technology',
      eyebrow: 'TECH ESSENTIALS',
      subtitle: 'Trackers don\'t have batteries. They don\'t need charging. They do need your attention.',
      content: `<h3>What Passive Trackers Are</h3>
<p>Passive limb trackers are small devices strapped to a guest's wrists and ankles. They use reflective marker balls that Vicon infrared cameras detect in 3D space — translating physical movement into the virtual world. There are no batteries in trackers. Do not tell guests they need charging. Only props, vests, and headsets have batteries.</p>
<div class="science-callout"><div class="science-callout-label">The 20% Rule</div><div class="science-callout-text">Replace a tracker ball only when more than 20% of its reflective surface is damaged, scratched, or missing. Cosmetic wear alone does not justify replacement. Inspect every ball before every session — damaged balls cause tracking drift that guests experience as phantom movement or jitter.</div></div>
<h3>Building Trackers</h3>
<p>When building trackers from scratch, always reference the Tracker Build Chart for the correct setup. Pin counts vary by type: limb trackers and wand trackers use 5 pins; gun and pistol trackers use 4. Tracker balls are hand-tightened only — never use tools. The screw size for limb trackers is 4x8, not 4x6.</p>
<div class="science-callout"><div class="science-callout-label">Coach Note</div><div class="science-callout-text">Tracker building is one of the best hands-on learning activities in the NSO program — high repetition, tangible output, and every trainee can do it at the same time. Make sure each person completes at least one full build independently before signing off on this competency.</div></div>
<h3>Prop Tracker Placement</h3>
<ul>
<li><strong>Gun trackers</strong> — Slide onto rail with set screws facing you. Stop at the 6th gap, tighten onto the ridge immediately after.</li>
<li><strong>Pistol trackers</strong> — Stop at the 7th gap, tighten onto the ridge immediately after.</li>
<li>The set screw must always tighten onto a ridge, never inside a gap.</li>
</ul>
<h3>Tracker Asset Numbers</h3>
<p>Each tracker is assigned a number in Vicon Evoke. If a box is unchecked next to a number, that tracker is disabled and won't appear in-experience. Player 1 (Red) limbs run 12–15, Player 2 (Blue) run 22–25, and so on through Player 6 (Purple) at 62–65. ATH head trackers are the X0 number for each player (10, 20, 30...).</p>
<h3>Troubleshooting Order</h3>
<ul>
<li>First, inspect reflective tracker balls — condition and damage.</li>
<li>Second, check pin condition — correct count, not bent, not loose.</li>
<li>Third, verify tracker build against the Tracker Build Chart.</li>
<li>Fourth, check Vicon Evoke — all tracker assets enabled.</li>
<li>Fifth, recalibrate the room if all checks pass and issues persist.</li>
<li>If a tracker looks upside down or twisted in-experience, the physical tracker is almost always worn incorrectly — check orientation before any software steps.</li>
</ul>
<div class="science-callout"><div class="science-callout-label">Dead Spots</div><div class="science-callout-text">If tracking fails consistently in one specific area of the holodeck, that may be a camera dead spot. Do not adjust or re-angle Vicon cameras. Submit a T1 tracking ticket and wait for confirmation before any camera work is done.</div></div>`
    },
    {
      id: 'tech-vests',
      title: 'Haptic Vests: Fitting, Pairing & Care',
      category: 'Technology',
      eyebrow: 'TECH ESSENTIALS',
      subtitle: 'The vest is what guests feel. Get the fit and pairing right every time.',
      content: `<h3>What the Vest Does</h3>
<p>The haptic vest (bHaptics TactSuit X40) has vibrating motors distributed across the torso that fire in sync with in-experience events. A poorly fitted vest means muted haptics and a diminished guest experience. This matters — teach trainees to care about fit, not just getting it on quickly.</p>
<h3>LED States</h3>
<ul>
<li><strong>Solid blue</strong> — vest is paired and ready.</li>
<li><strong>Flashing blue</strong> — vest is unpaired and needs pairing.</li>
<li><strong>No light</strong> — vest is off or uncharged.</li>
</ul>
<p>Lock state is not shown by LED color. Confirm Button Lock and Stay Lock status through bHaptics Player only.</p>
<h3>Pairing Procedure</h3>
<ol style="padding-left:18px;margin-bottom:12px;font-size:13.5px;color:var(--text-secondary);line-height:1.8">
<li>Hold the vest power button until LED blinks blue (pairing mode).</li>
<li>VNC into the corresponding SPC.</li>
<li>Open bHaptics mini-player, select the gear icon (top right).</li>
<li>Go to Device tab — only one vest should appear.</li>
<li>Select the vest and click Pair.</li>
<li>Confirm solid blue LED.</li>
<li>Set: Button Lock ON, Stay Lock ON, Turn Off After = Never.</li>
<li>Close VNC — leaving it open slows SPC performance.</li>
</ol>
<div class="science-callout"><div class="science-callout-label">Coach Note</div><div class="science-callout-text">Vest pairing under time pressure is where new GEGs lose composure. The pairing process should feel automatic before Day 5. Drill it in groups of 3, rotating, until every trainee can pair without hesitation. If a red bar appears in bHaptics during pairing, that's a driver issue — contact T1. Do not reseat the dongle.</div></div>
<h3>Gear Up (Always Track Up First)</h3>
<p>Trackers go on before the vest — always. Put wrist and ankle trackers on first. Fully loosen vest straps before distributing. Distribute by player color: Red (P1), Blue (P2), Green (P3), Yellow (P4), Pink (P5), Purple (P6). Tighten side straps for a snug fit. For guests with broader shoulders, unbutton the shoulder buttons at the top.</p>
<h3>Charging Rules</h3>
<ul>
<li>Charge all vests overnight at close of business.</li>
<li>Unplug all vests at opening — charging during business hours causes connection issues.</li>
<li>Battery life is approximately 10 hours. Full charge takes approximately 2 hours (USB-C).</li>
</ul>
<h3>Cleaning & Storage</h3>
<ul>
<li>Spray microfiber cloth with Briotech sanitizer — never spray directly onto the vest (damages electronics).</li>
<li>Wash vest liners in a washing machine weekly. Fabric refresher spray is for odor between washes only.</li>
<li>Hang vests by their sleeves, never by the straps (straps break over time).</li>
<li>Store in color order: Red, Blue, Green, Yellow, Pink, Purple.</li>
</ul>`
    },
    {
      id: 'tech-atd',
      title: 'Active Tracking Head Mount (ATH)',
      category: 'Technology',
      eyebrow: 'TECH ESSENTIALS',
      subtitle: 'Head tracking lives here. Know the LED states before you need them.',
      content: `<h3>What the ATH Does</h3>
<p>The Active Tracking Head Mount (ATH) clips onto the HTC Vive Focus Vision headset and uses infrared LEDs tracked by the MoCap cameras to capture guest head movement. Unlike passive trackers, the ATH is a powered device — it charges simultaneously with the headset.</p>
<h3>Required Components</h3>
<ul>
<li>1x Vive Focus Vision headset</li>
<li>1x Active Tracking Head Mount (ATH)</li>
<li>1x Silicone Face Shield</li>
<li>1x 3.5mm Audio Spiral Cable</li>
<li>2x Cable Clips</li>
</ul>
<p>If any component is missing, the setup is invalid. Do not run a session without all five.</p>
<h3>Status LED Guide</h3>
<ul>
<li><strong>Red</strong> — No communication between ATH and headset. Tracking cannot work.</li>
<li><strong>Yellow</strong> — Communication okay, standby mode, IR LEDs off. Normal when not streaming.</li>
<li><strong>Green</strong> — Communication okay, operation mode, IR LEDs active. Expected during gameplay.</li>
</ul>
<div class="science-callout"><div class="science-callout-label">Coach Note</div><div class="science-callout-text">Teach trainees the LED states as a table, not a list. Red = problem, Yellow = standby/normal, Green = good. When they can recall this instantly, they won't waste time second-guessing a yellow ATH between sessions.</div></div>
<h3>Player ID Color Codes</h3>
<p>Each ATH is assigned to a player slot. The Player ID must match the assigned station and should not be blinking during a session: P1 Red (23679), P2 Blue (13578), P3 Green (12579), P4 Yellow (13689), P5 Pink (23478), P6 Purple (12489).</p>
<h3>Basic Troubleshooting</h3>
<ul>
<li><strong>LED Red</strong> — Physically seat and connect the headset. Restart Kiosk Mode (long-press side button). Still red: contact T1.</li>
<li><strong>Front LED blinking white</strong> — Turn ATH off, wait 10 seconds, turn on. Repeat up to 3 times. Still blinking: replace ATH and contact T1.</li>
<li><strong>Yellow during active experience</strong> — Confirm experience is launched. Restart Kiosk Mode. Still yellow: escalate to T1.</li>
</ul>`
    },
    {
      id: 'tech-t1',
      title: 'T1 Escalation: The 5-Minute Rule',
      category: 'Technology',
      eyebrow: 'TECH SUPPORT',
      subtitle: 'When to escalate, how to escalate, and how to manage the guest while you do.',
      content: `<h3>The 5-Minute Rule</h3>
<p>If you have been troubleshooting a tech issue for 5 minutes and it is not resolved, stop and escalate to T1. This is not a defeat — it is the professional move. T1 is available 24/7 precisely so you don't have to troubleshoot alone.</p>
<div class="science-callout"><div class="science-callout-label">Why GEGs Delay (And Why They Shouldn't)</div><div class="science-callout-text">New GEGs often delay T1 escalation out of pride or concern about bothering the helpdesk. In the meantime, guests are waiting, frustration builds, and recovery becomes harder. Fast escalation is the sign of a professional, not a failure. Build this instinct early.</div></div>
<h3>How to Submit a T1 Ticket via Slack</h3>
<ul>
<li>Use the T1 Slack workflow — the workflow link goes first, before any troubleshooting.</li>
<li>Include: store name, room number, issue description, what you have already tried.</li>
<li>Copy the booking ID from the Silica in-experience page (press the copy button) to give T1 immediate context.</li>
<li>Stay with the guest while the ticket is open — don't disappear.</li>
</ul>
<h3>Managing the Guest During a Tech Issue</h3>
<p>Use the Acknowledge-Empathize-Resolve model:</p>
<ul>
<li><strong>Acknowledge</strong> — "We have a small tech hiccup — I'm on it right now."</li>
<li><strong>Empathize</strong> — "You're not losing any playing time — we'll make sure of that."</li>
<li><strong>Resolve</strong> — If resolution takes more than a few minutes, involve your manager. Consider a voucher or time extension.</li>
</ul>
<div class="science-callout"><div class="science-callout-label">Coach Note</div><div class="science-callout-text">Run a simulated T1 escalation scenario on Day 3 — give a trainee a "tech problem" mid-practice session and watch how they communicate with the guest AND submit the ticket simultaneously. This dual-task moment reveals who is truly guest-ready under pressure.</div></div>`
    }
  ],
  'Systems & Software': [
    {
      id: 'sys-checkfront',
      title: 'Checkfront: Bookings, Check-In & Daily Manifest',
      category: 'Systems & Software',
      eyebrow: 'SYSTEMS',
      subtitle: 'The booking system every GEG touches every shift. Know it cold.',
      content: `<h3>What Checkfront Does</h3>
<p>Checkfront is Sandbox VR's booking and payment platform. GEGs use it to create bookings, process payments, view the daily manifest, and check guests in. The web browser version handles almost everything. The Checkfront app is used only for gift card payments, Apple Pay, Google Pay, and Square Reader transactions.</p>
<h3>Making a New Booking</h3>
<ol style="padding-left:18px;margin-bottom:12px;font-size:13.5px;color:var(--text-secondary);line-height:1.8">
<li>Go to the Bookings tab → New Booking.</li>
<li>Select the date, then choose Private or Public session.</li>
<li>Select the experience and time slot. Always enter the number of guests — even for private sessions.</li>
<li>If a promo code applies, select Apply Discount before entering guest details.</li>
<li>Enter guest name, email, and phone number.</li>
<li>Select Pay Now. Payment must be completed immediately — bookings must never sit in Reserved status without payment.</li>
</ol>
<div class="science-callout"><div class="science-callout-label">Critical Rule</div><div class="science-callout-text">Bookings must never remain in Reserved status without payment. There is no 72-hour grace period. If a booking is Reserved and unpaid, address it immediately. Always send a confirmation email after any booking modification.</div></div>
<h3>The Daily Manifest</h3>
<p>The Daily Manifest lives in the Bookings tab and is the primary tool for daily operations. Review it at the start of every shift. It shows all bookings, booking status, guest names, room assignments, and which public sessions can be combined to free up capacity. Use it to contact guests, confirm arrival times, and prep any pre-ordered add-ons.</p>
<h3>Booking Statuses</h3>
<ul>
<li><strong>Paid</strong> — Fully paid. Ready to go.</li>
<li><strong>Reserved</strong> — No payment processed. Not acceptable for standard operations.</li>
<li><strong>Deposit</strong> — Partially paid (typically event packages).</li>
<li><strong>Cancelled</strong> — Payment forfeited or refunded.</li>
<li><strong>VIP</strong> — Influencer or celebrity guest.</li>
</ul>
<h3>Booking Not Showing on Check-In iPad?</h3>
<p>This is almost always a Checkfront sync issue, not an iPad problem. Fix 1: find the booking in Checkfront, set Invoice Status to Reserved, wait 5 seconds, then set it back to Paid. This forces a re-sync. If that doesn't work, use the manual check-in URL: <code>https://checkin.sandboxvr.com/[StoreCode]-[BookingID]</code>. If the check-in app is frozen, force-close and relaunch, then restart the iPad if needed. Still failing: contact T1.</p>
<div class="science-callout"><div class="science-callout-label">Coach Note — Say See Do</div><div class="science-callout-text">Say: walk through a complete booking scenario while the team follows along on their own iPads. See: watch for hesitation on the payment step and the check-in flow — this is where new GEGs lose time with guests. Do: each trainee completes a full practice booking independently, then checks themselves in using the Daily Manifest.</div></div>`
    },
    {
      id: 'sys-silica',
      title: 'Silica: Session Management from Start to Finish',
      category: 'Systems & Software',
      eyebrow: 'SYSTEMS',
      subtitle: 'Silica is not SBOS. Learn how sessions are created, run, and closed.',
      content: `<h3>What Silica Is</h3>
<p>Silica is Sandbox VR's current operating platform for in-store session management. It replaces the legacy SBOS system entirely. Do not apply SBOS knowledge to Silica — the platforms behave differently. Silica does not support user-initiated OS restarts. You can restart the experience window, but not the Silica OS itself.</p>
<h3>Session Status Colors (Main Dashboard)</h3>
<ul>
<li><strong>Green</strong> — Room is ready.</li>
<li><strong>Gray</strong> — Room is in use.</li>
<li><strong>Dark gray</strong> — Room is wrapping up.</li>
</ul>
<h3>Creating a Session</h3>
<ol style="padding-left:18px;margin-bottom:12px;font-size:13.5px;color:var(--text-secondary);line-height:1.8">
<li>Open the Silica app on the staff iPad.</li>
<li>Tap Create Session — a list of Checkfront bookings within ~2 hours appears.</li>
<li>Select the booking row (highlights green when all guests have checked in).</li>
<li>Assign a vacant holodeck.</li>
<li>Confirm the experience (auto-filled from Checkfront), select language, tap Continue.</li>
<li>Enter team name, take player photos, confirm nicknames (auto-filled from mobile check-in).</li>
<li>Help guests choose avatars or weapons, then tap Continue.</li>
</ol>
<h3>Health Check Page</h3>
<p>After player setup, Silica runs a health check. Gray = not started, Red = issue, Green = ready. Launch Mirror Room only activates when all required checks are green. Props will show red until the trigger is pulled — that's normal. Vests can show red and you can still proceed; resolve vest issues after launching.</p>
<h3>Player Status Colors (During Session)</h3>
<ul>
<li><strong>Green</strong> — Normal.</li>
<li><strong>Red</strong> — Headset disconnected.</li>
<li><strong>Orange</strong> — Headset latency issues. Contact T1 via Slack immediately.</li>
<li><strong>Yellow</strong> — Other device issues (audio, vest, props).</li>
</ul>
<div class="science-callout"><div class="science-callout-label">Critical</div><div class="science-callout-text">If status colors are consistently red, orange, or yellow, contact T1 on Slack immediately. Do not wait to see if it clears on its own. Each new booking requires a fresh check-in — prior check-in details do not carry over between sessions.</div></div>
<h3>Mobile Check-In</h3>
<p>Guests can complete check-in at home before arriving — via the website immediately after booking, or through the confirmation email. Waivers, nicknames, and booking details are submitted in advance. Nicknames auto-populate in Silica. This saves significant time during gear-up. If a guest arrives without checking in, they can use the in-store kiosk iPad to complete it on-site.</p>
<h3>End of Session</h3>
<p>At the end of a session, cast the scoreboard and souvenir video to the Post-Experience TV from within Silica. The QR code for guests to download their video is on the Silica iPad — not the TV. The TV shows the video; the iPad has the download link.</p>
<div class="science-callout"><div class="science-callout-label">Coach Note — Say See Do</div><div class="science-callout-text">Say: walk through the full session creation flow while the team watches on a second device. See: watch for hesitation on the health check page — new GEGs often panic when they see red on props or vests. Do: each trainee creates a test session from scratch and walks through the health check to launch independently.</div></div>`
    }
  ],
  'Sales & KPIs': [
    {
      id: 'sales-repeatability',
      title: 'Repeatability: How to Sell More Experiences',
      category: 'Sales & KPIs',
      eyebrow: 'SALES',
      subtitle: 'Three moments. One KPI. Countless return visits.',
      content: `<h3>What is Repeatability?</h3>
<p>Repeatability tracks the percentage of guests who book an additional experience — either back-to-back the same day or a future return visit (replay within 6 months). It is one of Sandbox VR's core KPIs because return guests drive sustainable revenue and are far more likely to bring new groups.</p>
<h3>The Three Repeatability Moments</h3>
<p>Repeatability conversations work best when they happen at the right emotional moment — not as a sale, but as a natural extension of enthusiasm.</p>
<ul>
<li><strong>Check-In</strong> — Plant the seed before the experience. "Many groups love the back-to-back — keeps the momentum going."</li>
<li><strong>Still Geared Up</strong> — The highest-conversion moment. Guests are still in the adrenaline window. "How was it? Ready to go again?"</li>
<li><strong>Post-Experience</strong> — For future replay booking. Show the Checkfront calendar. "We have availability in [timeframe] — want to lock it in?"</li>
</ul>
<div class="science-callout"><div class="science-callout-label">Training Science</div><div class="science-callout-text">Emotional state influences decision-making (Damasio, 1994). Guests asked to rebook while still geared up — in the peak of their excitement — are significantly more likely to say yes than guests asked at checkout. Train your team to use that window.</div></div>
<h3>Conversion: Walk-Ins and Phone Inquiries</h3>
<p>Staff Conversion tracks the percentage of guests who didn't have a booking but made one after interacting with a team member. Every interaction with a curious passerby is a conversion opportunity.</p>
<ul>
<li>Invite them in for a quick look at the Holodeck or the recap video playing on the Post-Experience TV.</li>
<li>Use the experiences as conversation hooks — "Have you seen Squid Game? We have a VR version."</li>
</ul>`
    }
  ],
  'Policies & Procedures': [
    {
      id: 'policy-overview',
      title: 'Guest Policies: The Quick Reference',
      category: 'Policies & Procedures',
      eyebrow: 'OPERATIONS',
      subtitle: 'Know these cold. You will be asked in the middle of a busy shift.',
      content: `
<div style="background:var(--warning-light);border:1px solid rgba(245,166,35,0.3);border-radius:var(--radius-md);padding:14px 16px;margin-bottom:20px">
  <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#8A5A00;margin-bottom:8px">Franchise Verification Required</div>
  <div style="font-size:13px;color:var(--hb);margin-bottom:12px">Before training on guest policies, confirm with the franchisee that these policies match their local standards. Some franchisees may operate under different pricing, cancellation, or timing policies. Check each item before teaching.</div>
  <div style="display:flex;flex-direction:column;gap:8px">
    <label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;font-size:13px;color:var(--hb)">
      <input type="checkbox" onchange="toggleFranchiseCheck('Cancellation policy confirmed with franchisee', this.checked)" style="margin-top:2px;width:16px;height:16px;cursor:pointer">
      <span>Cancellation & refund policy confirmed with franchisee</span>
    </label>
    <label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;font-size:13px;color:var(--hb)">
      <input type="checkbox" onchange="toggleFranchiseCheck('Late arrival / grace period policy confirmed', this.checked)" style="margin-top:2px;width:16px;height:16px;cursor:pointer">
      <span>Late arrival / grace period policy confirmed</span>
    </label>
    <label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;font-size:13px;color:var(--hb)">
      <input type="checkbox" onchange="toggleFranchiseCheck('Minor waiver policy confirmed', this.checked)" style="margin-top:2px;width:16px;height:16px;cursor:pointer">
      <span>Minor waiver requirements confirmed</span>
    </label>
    <label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;font-size:13px;color:var(--hb)">
      <input type="checkbox" onchange="toggleFranchiseCheck('Rescheduling policy confirmed', this.checked)" style="margin-top:2px;width:16px;height:16px;cursor:pointer">
      <span>Rescheduling policy confirmed</span>
    </label>
    <label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;font-size:13px;color:var(--hb)">
      <input type="checkbox" onchange="toggleFranchiseCheck('Voucher and rebooking fee amounts confirmed', this.checked)" style="margin-top:2px;width:16px;height:16px;cursor:pointer">
      <span>Voucher amounts and rebooking fee confirmed</span>
    </label>
  </div>
</div>
<h3>Arrival & Grace Period</h3>
<ul>
<li>Guests should arrive 15–30 minutes before their booking.</li>
<li>5-minute grace period from session start time.</li>
<li>After 5 minutes: booking subject to cancellation. Payment issues as a voucher, minus a $50 rebooking fee.</li>
<li>No-show: booking auto-cancelled, payment forfeited.</li>
</ul>
<h3>Cancellation Policy</h3>
<ul>
<li>72+ hours before booking: full refund.</li>
<li>48–72 hours: $50 fee, remainder as voucher.</li>
<li>Under 48 hours: no refund.</li>
</ul>
<h3>Physical Requirements & Waivers</h3>
<ul>
<li>No weight limit, but haptic vests adjust up to 50" chest circumference.</li>
<li>Not recommended for pregnant guests or those with heart conditions.</li>
<li>Guests under 18: parent/guardian must be physically present to sign the minor waiver.</li>
</ul>
<div class="science-callout"><div class="science-callout-label">Coach Note</div><div class="science-callout-text">Policy knowledge prevents the worst guest service moments — the ones where a GEG gives incorrect information under pressure. Don't just recite the policy. Run scenarios: "A guest arrives 8 minutes late — what do you do?" "A guest wants to cancel tomorrow. What are their options?" Scenario drilling makes policy instinctive.</div></div>
<h3>Guest Recovery Model</h3>
<p>When something goes wrong, use the Acknowledge-Empathize-Resolve framework:</p>
<ul>
<li><strong>Acknowledge</strong> — Acknowledge the issue without blame or excuses. Keep it calm.</li>
<li><strong>Empathize</strong> — The guest won't lose playing time. You're on it.</li>
<li><strong>Resolve</strong> — Find the right solution. Involve leadership for vouchers or refunds. Never penalize a guest for an operational failure.</li>
</ul>`
    }
  ],
  'Core Concepts': [
    {
      id: 'core-values',
      title: 'Mission, Vision & Core Values',
      category: 'Core Concepts',
      eyebrow: 'CULTURE',
      subtitle: 'This is who we are. Everything else follows from here.',
      content: `<h3>Mission</h3>
<p>We are taking our Sandbox holodeck platform to the next level — so that it remains the most social and immersive experience you can have with your friends. The Sandbox experience isn't just virtual reality — it's <em>Reality Elevated.</em></p>
<h3>The Three Core Values</h3>
<p><strong>We Embrace an Underdog Mindset</strong> — We remember where we started. Resilient, adaptable, scrappy. We don't succeed because we have the most resources — we succeed because we outwork and out-innovate.</p>
<p><strong>We Are Egoless</strong> — Humility, honesty, coachability. No job is above another. We pursue what's best for the company, not personal agendas. Growth comes through self-awareness and openness to feedback.</p>
<p><strong>We Win Collectively</strong> — Service is a core function — serving guests and serving each other. We build inclusive, uplifting communities. Communication and transparency are non-negotiables.</p>
<div class="science-callout"><div class="science-callout-label">Training Science</div><div class="science-callout-text">Values-based orientation (not just rules-based) produces significantly higher employee discretionary effort and alignment with organizational goals (Deci & Ryan, 2000). Trainees who internalize the "why" behind their work outperform those who are only taught the "how." Teach the values first.</div></div>
<h3>KPIs Overview</h3>
<ul>
<li><strong>Repeatability %</strong> — Guests who book back-to-back or replay within 6 months.</li>
<li><strong>Google Review Quantity & Rating</strong> — Social proof that drives new guest acquisition.</li>
<li><strong>Staff Conversion</strong> — Walk-in to booking conversion rate.</li>
<li><strong>Video Download & Share Rate</strong> — Souvenir video engagement.</li>
</ul>`
    },
    {
      id: 'core-experiences',
      title: 'Sandbox VR Experiences: The Trainer\'s Guide',
      category: 'Core Concepts',
      eyebrow: 'EXPERIENCES',
      subtitle: 'Know them. Love them. Sell them with genuine enthusiasm.',
      content: `<h3>Why Experience Knowledge Matters</h3>
<p>GEGs who know the experiences deeply — not just the names but the feelings, the mechanics, the audience — sell repeatability naturally. You cannot generate authentic excitement about something you don't understand.</p>
<div class="science-callout"><div class="science-callout-label">Coaching Tip</div><div class="science-callout-text">Have every trainee pick three experiences to become the "expert" on during training. When a guest asks, that GEG owns the answer. Distributed expertise in a team reduces bottlenecks and builds individual pride.</div></div>
<h3>Current Experiences</h3>
<ul>
<li><strong>Amber Sky</strong> — Sci-fi action. Robotic warriors vs. alien invasion. Hong Kong skyscraper setting. High energy, great for competitive groups.</li>
<li><strong>Curse of Davy Jones</strong> — Family-friendly pirates. Sword and flintlock. Best for families and first-timers who want fun without fear.</li>
<li><strong>Deadwood Mansion</strong> — Horror atmosphere. Zombie-infested mansion. For groups who want genuine fear in a safe environment.</li>
<li><strong>Deadwood Valley</strong> — Action horror. Zombie apocalypse city escape. More kinetic than Mansion.</li>
<li><strong>Deadwood Phobia</strong> — Psychological horror. Perception-bending. For brave groups who want something truly unsettling.</li>
<li><strong>Dragonfire: Seekers of the Shard</strong> — Fantasy RPG. Choose your class, fight a dragon. Great for gaming audiences.</li>
<li><strong>Rebel Moon</strong> — Netflix partnership (Zack Snyder). Sci-fi rebellion. Appeals to film fans and sci-fi enthusiasts.</li>
<li><strong>Squid Game Virtuals</strong> — Netflix IP. Most-watched show. Massive pop culture hook — the easiest sell to almost any group.</li>
<li><strong>Unbound Fighting League</strong> — PvP gladiator combat. The only player-vs-player experience. For competitive groups.</li>
<li><strong>Stranger Things: Catalyst</strong> — Netflix IP. Hawkins' secrets. Massive fan base. Strong family and nostalgia appeal.</li>
</ul>`
    }
  ]
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
    schedule: 'Daily Agenda',
    competencies: 'Competency Tracker',
    recap: 'Daily Recap',
    knowledge: 'Knowledge Base',
    team: 'Team Roster',
    admin: 'All Openings'
  };
  document.getElementById('topbarTitle').textContent = titles[view] || view;
  state.currentView = view;

  const navMap = { dashboard: 0, schedule: 1, competencies: 2, recap: 3, knowledge: 4, team: 5, admin: 7 };
  const navItems = document.querySelectorAll('.nav-item');
  if (navMap[view] !== undefined && navItems[navMap[view]]) navItems[navMap[view]].classList.add('active');

  if (view === 'schedule') renderAgenda(state.currentAgendaDay);
  if (view === 'competencies') renderCompetencyTable(state.currentCompDay);
  if (view === 'knowledge') renderKBNav();
  if (view === 'team') renderTeamRoster();
  if (view === 'recap') loadRecapFields(state.currentRecapDay);
  if (view === 'franchise') renderFranchiseChecks();
  if (view === 'admin') renderAdminPage();
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
    '</div><span class="badge badge-' + badgeColor + '">' + day.type + '</span></div></div>';

  day.blocks.forEach(function(block, idx) {
    var blockId = 'block-' + dayNum + '-' + idx;

    if (block.title === 'Break') {
      html += '<div style="display:flex;align-items:center;gap:14px;padding:12px 16px;margin-bottom:12px;background:var(--surface);border-radius:var(--radius-md);border:1px solid var(--border-light)">' +
        '<span class="agenda-time-pill">' + block.time + '</span>' +
        '<span style="font-size:13px;font-weight:600;color:var(--text-muted)">&mdash; Break &mdash;</span></div>';
      return;
    }

    var objCount = block.objectives.length;
    var objsHtml = block.objectives.map(function(o) {
      return '<div class="objective-item"><div class="objective-dot"></div><span>' + o + '</span></div>';
    }).join('');

    var resHtml = '';
    if (block.resources.length > 0) {
      resHtml = '<div style="margin-bottom:16px"><div class="objectives-label">Resources</div>' +
        block.resources.map(function(r) {
          return '<div class="objective-item"><div class="objective-dot" style="background:var(--warp)"></div><span style="color:var(--borg)">' + r + '</span></div>';
        }).join('') + '</div>';
    }

    var coachHtml = '';
    if (block.tip) {
      coachHtml = '<div class="coach-tip"><div class="coach-tip-label">Coach Guidance</div>' +
        '<div class="coach-tip-text">' + block.tip + '</div></div>' +
        '<div class="say-see-do">' +
        '<div class="ssd-block"><div class="ssd-label say">SAY</div><div class="ssd-text">' + (block.say || '') + '</div></div>' +
        '<div class="ssd-block"><div class="ssd-label see">SEE</div><div class="ssd-text">' + (block.see || '') + '</div></div>' +
        '<div class="ssd-block"><div class="ssd-label do">DO</div><div class="ssd-text">' + (block.doText || '') + '</div></div>' +
        '</div>';
    }

    html += '<div class="agenda-block">' +
      '<div class="agenda-block-header" id="header-' + blockId + '" onclick="toggleAgendaBlock(\'' + blockId + '\')">' +
      '<span class="agenda-time-pill">' + block.time + '</span>' +
      '<span class="agenda-block-title">' + block.title + '</span>' +
      '<span class="agenda-block-duration">' + objCount + ' objective' + (objCount !== 1 ? 's' : '') + '</span>' +
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
        ${comps.map(c => `<th class="competency-col">${c.name}</th>`).join('')}
        <th style="text-align:center;width:80px">Progress</th>
      </tr>
    </thead>
    <tbody>`;

  state.trainees.forEach(trainee => {
    const traineeComps = comps.map(c => {
      const key = trainee.id + '_' + c.id;
      const status = state.signoffs[key] || 'pending';
      const icons = { pending: '', signed: '✓', 'needs-work': '~', 'not-met': '✕' };
      return `<td class="competency-cell">
        <button class="signoff-btn ${status !== 'pending' ? status : ''}"
          onclick="openContextMenu(event, '${trainee.id}', '${c.id}')">${icons[status]}</button>
      </td>`;
    });

    const signedCount = comps.filter(c => state.signoffs[trainee.id + '_' + c.id] === 'signed').length;
    const pct = comps.length > 0 ? Math.round((signedCount / comps.length) * 100) : 0;

    html += `<tr>
      <td><div class="trainee-name">${trainee.name}</div></td>
      <td><span class="badge badge-gray" style="font-size:10px">${trainee.role}</span></td>
      ${traineeComps.join('')}
      <td style="text-align:center">
        <div style="font-size:11px;font-weight:600;color:${pct === 100 ? 'var(--success)' : 'var(--text-secondary)'}; margin-bottom:4px">${pct}%</div>
        <div class="progress-bar-wrap" style="width:60px;margin:0 auto">
          <div class="progress-bar-fill ${pct === 100 ? 'green' : 'blue'}" style="width:${pct}%"></div>
        </div>
      </td>
    </tr>`;
  });

  html += '</tbody></table>';
  container.innerHTML = html;
  updateCompProgress(day);
}

function updateCompProgress(day) {
  const comps = COMPETENCIES.filter(c => c.day === day);
  const total = state.trainees.length * comps.length;
  const signed = Object.entries(state.signoffs).filter(([k, v]) => {
    const compId = k.split('_')[1];
    return comps.find(c => c.id === compId) && v === 'signed';
  }).length;

  document.getElementById('compSignedCount').textContent = signed;
  document.getElementById('compTotalCount').textContent = total;
  const pct = total > 0 ? Math.round((signed / total) * 100) : 0;
  document.getElementById('compProgressBar').style.width = pct + '%';

  // Update all signoffs badge
  const allTotal = COMPETENCIES.length * state.trainees.length;
  const allSigned = Object.values(state.signoffs).filter(v => v === 'signed').length;
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

function loadRecapFields(day) {
  const r = state.recaps[day] || {};
  const fields = ['ld-topics', 'ld-team', 'tech', 'ops', 'sm', 'tomorrow', 'actions'];
  fields.forEach(f => {
    const el = document.getElementById('recap-' + f);
    if (el) el.value = r[f] || '';
  });
  updateRecapPreview();
}

function appendChip(fieldId, text) {
  const el = document.getElementById(fieldId);
  if (!el) return;
  if (el.value && !el.value.endsWith('\n') && el.value.trim()) el.value += '\n';
  el.value += text;
  updateRecapPreview();
}

function updateRecapPreview() {
  const get = id => (document.getElementById('recap-' + id) || {}).value || '';
  const storeName = state.opening ? state.opening.store : '[Store Name]';
  const coachName = state.opening ? state.opening.coach : '[Coach Name]';
  const day = state.currentRecapDay;

  const dayTitles = ['Day 1 — Guest Experience', 'Day 2 — Service, Sales & Tech', 'Day 3 — Role-Play & Ops', 'Day 4 — Full Roleplay', 'Day 5 — Friends & Family'];

  let preview = `📍 ${storeName} | ${dayTitles[day - 1]}\n`;
  preview += `👤 Coach: ${coachName}\n`;
  preview += `${'─'.repeat(40)}\n\n`;

  const ldTopics = get('ld-topics');
  const ldTeam = get('ld-team');
  if (ldTopics || ldTeam) {
    preview += `📋 L&D SUMMARY\n`;
    if (ldTopics) preview += `Topics: ${ldTopics}\n`;
    if (ldTeam) preview += `Team: ${ldTeam}\n`;
    preview += '\n';
  }

  const tech = get('tech');
  const ops = get('ops');
  if (tech || ops) {
    preview += `🔧 TECH & OPS\n`;
    if (tech) preview += `Tech: ${tech}\n`;
    if (ops) preview += `Ops: ${ops}\n`;
    preview += '\n';
  }

  const sm = get('sm');
  if (sm) {
    preview += `🏪 SM NOTES\n${sm}\n\n`;
  }

  const tomorrow = get('tomorrow');
  const actions = get('actions');
  if (tomorrow || actions) {
    preview += `🎯 TOMORROW\n`;
    if (tomorrow) preview += `Focus: ${tomorrow}\n`;
    if (actions) preview += `Actions: ${actions}\n`;
  }

  if (preview.trim() === `📍 ${storeName} | ${dayTitles[day - 1]}\n👤 Coach: ${coachName}\n${'─'.repeat(40)}`) {
    preview = 'Start filling in the fields to see your formatted recap appear here...';
  }

  document.getElementById('recapPreview').textContent = preview;
}

function saveRecap() {
  const day = state.currentRecapDay;
  const fields = ['ld-topics', 'ld-team', 'tech', 'ops', 'sm', 'tomorrow', 'actions'];
  state.recaps[day] = {};
  fields.forEach(f => {
    const el = document.getElementById('recap-' + f);
    if (el) state.recaps[day][f] = el.value;
  });
  dbSaveRecap(day);
  showToast(`Day ${day} recap saved!`, 'success');
  updateRecapStatusCard();
  const badge = document.getElementById('navRecapBadge');
  if (badge) badge.style.display = 'none';
}

function copyRecap() {
  const text = document.getElementById('recapPreview').textContent;
  navigator.clipboard.writeText(text).then(() => showToast('Copied to clipboard — paste into Slack!', 'success'));
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

  const content = document.getElementById('kbContent');
  content.innerHTML = `
    <div class="kb-article-eyebrow">${article.eyebrow}</div>
    <div class="kb-article-title">${article.title}</div>
    <div class="kb-article-subtitle">${article.subtitle}</div>
    <hr class="divider">
    <div class="kb-article-body">${article.content}</div>
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
    const totalComps = COMPETENCIES.length;
    const signedComps = COMPETENCIES.filter(c => state.signoffs[t.id + '_' + c.id] === 'signed').length;
    const pct = Math.round((signedComps / totalComps) * 100);
    return `<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--border-light)">
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
    </div>`;
  }).join('') + `<div style="padding-top:14px;display:flex;gap:8px">
    <button class="btn btn-secondary" onclick="openAddTraineeModal()">+ Add Another</button>
    <button class="btn btn-ghost" onclick="openAddTraineeModal();setTimeout(()=>switchAddTab('bulk'),50)">Bulk Add</button>
  </div>`;
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

  const allSigned = Object.values(state.signoffs).filter(v => v === 'signed').length;
  const allTotal = COMPETENCIES.length * state.trainees.length;
  document.getElementById('statSignoffs').textContent = allSigned;
  document.getElementById('statSignoffsDetail').textContent = `of ${allTotal} total`;
  document.getElementById('navSignoffBadge').textContent = allSigned;

  updateDashboardFocus();
  updateRecapStatusCard();
}

function updateDashboardFocus() {
  if (!state.opening) return;
  const day = DAYS[state.currentDay - 1];
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
    pendingComps.forEach(c => {
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
  const days = [1, 2, 3, 4, 5];
  const html = days.map(d => {
    const r = state.recaps[d];
    const complete = r && (r['ld-topics'] || r['ld-team'] || r['tech']);
    return `<div style="display:flex;align-items:center;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--border-light)">
      <span style="font-size:13px;font-weight:500">Day ${d}</span>
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
    await onSignedIn();
  } else {
    showLoginScreen();
  }

  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN') {
      await onSignedIn();
    } else if (event === 'SIGNED_OUT') {
      Object.assign(state, {
        opening: null, openingId: null, userRole: 'coach', userEmail: null,
        currentDay: 1, trainees: [], signoffs: {}, recaps: {}, franchiseChecks: {}
      });
      showLoginScreen();
    }
  });
}

async function onSignedIn() {
  document.getElementById('loginOverlay').style.display = 'none';
  const loaded = await dbLoadState();
  if (loaded) {
    refreshAfterLoad();
  }
  document.getElementById('userEmail').textContent = state.userEmail || '';
  // Admin nav is always visible; renderAdminPage() handles access control messaging
  document.getElementById('nav-admin').style.display = 'flex';
  renderOpeningSwitcherList(); // populate switcher in background
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
  errEl.style.display = 'none';
  if (!email || !password) { errEl.textContent = 'Please enter your email and password.'; errEl.style.display = 'block'; return; }
  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { errEl.textContent = error.message; errEl.style.display = 'block'; }
  } catch (e) {
    errEl.textContent = 'Connection error: ' + e.message;
    errEl.style.display = 'block';
  }
}

async function signUp() {
  const name = document.getElementById('loginName').value.trim();
  const email = document.getElementById('loginEmailSignUp').value.trim();
  const password = document.getElementById('loginPasswordSignUp').value;
  const errEl = document.getElementById('signupError');
  errEl.style.color = 'var(--danger)';
  errEl.style.display = 'none';
  if (!name) { errEl.textContent = 'Please enter your name.'; errEl.style.display = 'block'; return; }
  if (!email) { errEl.textContent = 'Please enter your email.'; errEl.style.display = 'block'; return; }
  if (password.length < 6) { errEl.textContent = 'Password must be at least 6 characters.'; errEl.style.display = 'block'; return; }
  try {
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
    if (error) {
      errEl.textContent = error.message;
      errEl.style.display = 'block';
    } else {
      errEl.style.color = 'var(--success)';
      errEl.textContent = 'Account created! Check your email to confirm, then sign in.';
      errEl.style.display = 'block';
    }
  } catch (e) {
    errEl.textContent = 'Connection error: ' + e.message;
    errEl.style.display = 'block';
  }
}

async function signOut() {
  await supabase.auth.signOut();
}

function refreshAfterLoad() {
  if (!state.opening) return;
  document.getElementById('sidebarStoreName').textContent = state.opening.store;
  document.getElementById('dashTitle').textContent = `Welcome back, ${state.opening.coach}.`;
  document.getElementById('dashSubtitle').textContent = `${state.opening.store} — Day ${state.currentDay} of 5. You've got this.`;
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
  document.getElementById('dashSubtitle').textContent = `${store} — Day ${day} of 5. You've got this.`;

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
  if (state.trainees.length >= 12) { showToast('Maximum 12 trainees per opening', 'info'); return; }

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
  const available = 12 - state.trainees.length;
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
// ADMIN PAGE
// ============================================================
function checkAdminPw() {
  // Legacy stub — admin access is now role-based via Supabase
  renderAdminPage();
}

async function renderAdminPage() {
  var container = document.getElementById('adminOpeningsList');
  container.innerHTML = '<div style="padding:24px;color:var(--text-muted);font-size:13px">Loading all openings…</div>';

  if (state.userRole !== 'admin') {
    container.innerHTML = '<div class="empty-state" style="padding:48px 0"><div style="font-size:13px;color:var(--text-muted)">Admin access only. Ask your Ops lead to grant admin role in Supabase.</div></div>';
    document.getElementById('adminLock').style.display = 'none';
    document.getElementById('adminContent').style.display = 'block';
    return;
  }

  document.getElementById('adminLock').style.display = 'none';
  document.getElementById('adminContent').style.display = 'block';

  var allOpenings = await dbLoadAllOpenings();

  if (allOpenings.length === 0) {
    container.innerHTML = '<div class="empty-state" style="padding:48px 0"><div style="font-size:13px;color:var(--text-muted)">No openings have been tracked yet.</div></div>';
    return;
  }

  var html = '';
  allOpenings.forEach(function(o) {
    var trainees = o.trainees || [];
    var signoffs = o.signoffs || [];
    var recaps = o.recaps || [];
    var franchiseChecks = o.franchise_checks || [];
    var allSigned = signoffs.filter(function(s){ return s.status === 'signed'; }).length;
    var allTotal = COMPETENCIES.length * trainees.length;
    var pct = allTotal > 0 ? Math.round((allSigned / allTotal) * 100) : 0;
    var recapCount = recaps.filter(function(r){ return r.ld_topics || r.ld_team; }).length;
    var openingId = 'admin-' + o.id.replace(/[^a-z0-9]/gi, '_');
    var opening = { store: o.store_name, coach: o.coach_name || (o.profiles && o.profiles.full_name) || '—', date: o.start_date };
    var pctBadge = pct === 100 ? 'badge-green' : 'badge-gray';
    var recapBadge = recapCount >= 5 ? 'badge-green' : 'badge-amber';

    html += '<div class="card mb-20">';
    html += '<div class="card-header" style="cursor:pointer" onclick="toggleAdminOpening(\'' + openingId + '\')">';
    html += '<div style="flex:1">';
    html += '<div class="card-title">' + (opening.store || 'Unknown Store') + '</div>';
    html += '<div class="card-subtitle">Coach: ' + (opening.coach || '—') + ' · Start: ' + (opening.date || '—') + ' · Day ' + (o.current_day || '?') + ' of 5</div>';
    html += '</div>';
    html += '<div style="display:flex;gap:16px;align-items:center">';
    html += '<span class="badge badge-blue">' + trainees.length + ' trainees</span>';
    html += '<span class="badge ' + pctBadge + '">' + pct + '% signed off</span>';
    html += '<span class="badge ' + recapBadge + '">' + recapCount + '/5 recaps</span>';
    html += '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" id="chevron-' + openingId + '" style="transition:transform 0.2s"><path d="M2 5l5 5 5-5"/></svg>';
    html += '</div></div>';
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
    [1,2,3,4,5].forEach(function(d) {
      var r = recaps.find(function(x){ return x.day_num === d; });
      var hasContent = r && (r.ld_topics || r.ld_team || r.tech);
      var badge = hasContent ? 'badge-green' : 'badge-gray';
      var label = hasContent ? 'Complete' : 'Pending';
      html += '<div style="padding:10px 0;border-bottom:1px solid var(--border-light)">';
      html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:' + (hasContent ? '8px' : '0') + '">';
      html += '<span style="font-size:13px;font-weight:600">Day ' + d + '</span>';
      html += '<span class="badge ' + badge + '">' + label + '</span>';
      html += '</div>';
      if (hasContent) {
        if (r.ld_topics) {
          var ldText = r.ld_topics.substring(0, 120) + (r.ld_topics.length > 120 ? '...' : '');
          html += '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:4px"><strong>L&amp;D:</strong> ' + ldText + '</div>';
        }
        if (r.sm_notes) {
          var smText = r.sm_notes.substring(0, 100) + (r.sm_notes.length > 100 ? '...' : '');
          html += '<div style="font-size:12px;color:var(--text-secondary)"><strong>SM:</strong> ' + smText + '</div>';
        }
      }
      html += '</div>';
    });
    html += '</div>';

    html += '</div></div></div>';
  });

  container.innerHTML = html;
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
    const recapCount = recaps.filter(r => r.ld_topics || r.ld_team).length;
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
    html += `<div class="card mb-20">
      <div class="card-header">
        <div>
          <div class="card-title">${group.group}</div>
          <div class="card-subtitle">${group.desc}</div>
        </div>
        <div style="font-size:12px;color:var(--text-secondary)">${groupDone}/${group.checks.length}</div>
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

function toggleFranchiseCheck(key, checked) {
  state.franchiseChecks[key] = checked;
  dbSaveFranchiseCheck(key, checked);
}

// ============================================================
// OPENING SWITCHER
// ============================================================
async function renderOpeningSwitcherList() {
  const list = document.getElementById('openingSwitcherList');
  if (!list) return;
  list.innerHTML = '<div style="padding:8px 0;font-size:12px;color:var(--text-muted)">Loading…</div>';
  const openings = await dbLoadOpeningsForCoach();
  if (openings.length === 0) {
    list.innerHTML = '<div style="padding:8px 0;font-size:12px;color:var(--text-muted)">No openings yet.</div>';
    return;
  }
  list.innerHTML = openings.map(o => {
    const isCurrent = o.id === state.openingId;
    const dateStr = o.start_date ? new Date(o.start_date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : 'No date';
    return `<button onclick="switchToOpening('${o.id}')" style="display:flex;flex-direction:column;align-items:flex-start;width:100%;text-align:left;padding:10px 12px;border-radius:var(--radius-md);border:1px solid ${isCurrent?'var(--trigger)':'var(--border-light)'};background:${isCurrent?'var(--trigger-light)':'var(--white)'};margin-bottom:8px;cursor:pointer;transition:all 0.15s" ${isCurrent?'disabled':''}>
      <div style="font-size:13px;font-weight:600;color:var(--hb)">${o.store_name}</div>
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
  // Load via dbLoadState which picks most-recently-updated — we need to load by specific ID
  const { data: o } = await supabase.from('openings').select('*').eq('id', openingId).single();
  if (!o) { showToast('Could not load opening', 'info'); return; }
  state.opening = { store: o.store_name, coach: o.coach_name, date: o.start_date };
  state.currentDay = o.current_day || 1;

  const [{ data: trainees }, { data: signoffs }, { data: recaps }, { data: fchecks }] = await Promise.all([
    supabase.from('trainees').select('*').eq('opening_id', openingId).order('created_at'),
    supabase.from('signoffs').select('*').eq('opening_id', openingId),
    supabase.from('recaps').select('*').eq('opening_id', openingId),
    supabase.from('franchise_checks').select('*').eq('opening_id', openingId)
  ]);

  state.trainees = (trainees || []).map(t => ({ id: t.id, name: t.name, role: t.role }));
  state.signoffs = {};
  (signoffs || []).forEach(s => { state.signoffs[s.trainee_id + '_' + s.competency_id] = s.status; });
  state.recaps = {};
  (recaps || []).forEach(r => {
    state.recaps[r.day_num] = { 'ld-topics': r.ld_topics||'', 'ld-team': r.ld_team||'', 'tech': r.tech||'', 'ops': r.ops||'', 'sm': r.sm_notes||'', 'tomorrow': r.tomorrow||'', 'actions': r.actions||'' };
  });
  state.franchiseChecks = {};
  (fchecks || []).forEach(f => { state.franchiseChecks[f.check_key] = f.checked; });

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
