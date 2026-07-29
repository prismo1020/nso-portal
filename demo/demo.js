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
    summary: "Build the mental model, service language, and complete guest journey before adding technical complexity.",
    intent: "Establish shared language and a clear picture of excellent performance.",
    evidence: "Baseline confidence, observed service behaviors, and first-attempt scenario notes.",
    blocks: [
      {
        time: "20 min",
        title: "Welcome and opening standards",
        tag: "3 objectives",
        objectives: ["Connect the opening goal to the guest promise.", "Name the five-day performance standard.", "Surface prior experience and confidence."],
        coach: "Start with the performance the team must own on launch day. Use the confidence check to decide where examples and repetitions will be most valuable.",
        say: "By Day 5, you will run the complete experience without coach prompting. Today we build the shared picture of what excellent looks like.",
        see: "Listen for mismatched expectations, unfamiliar language, and areas where confidence is high without supporting experience.",
        doText: "Learners map their previous experience to one strength they can transfer and one capability they need to build.",
        evidence: "Baseline confidence pulse and coach notes by learner.",
      },
      {
        time: "40 min",
        title: "The complete guest journey",
        tag: "4 objectives",
        objectives: ["Sequence the full guest journey.", "Explain the purpose of each touchpoint.", "Identify predictable moments of confusion.", "Connect team behavior to guest confidence."],
        coach: "Teach the whole journey before isolated tasks so every later procedure has a clear purpose and place.",
        say: "Watch for the moments when a guest decides whether the operation feels trustworthy, effortless, and worth recommending.",
        see: "Look for learners who can explain why each touchpoint matters, not only what happens there.",
        doText: "Pairs assemble journey cards in sequence, explain the handoffs, and identify one failure point at each stage.",
        evidence: "Journey-map accuracy and quality of the learner explanations.",
      },
      {
        time: "60 min",
        title: "Guided guest-flow practice",
        tag: "Observed practice",
        objectives: ["Model the complete flow.", "Practice each guest-facing handoff.", "Use standard language naturally.", "Recover after a missed step."],
        coach: "Model once, practice in short loops, and remove support as accuracy increases. Correct the highest-impact behavior before the next attempt.",
        say: "Your first attempt is diagnostic. We are looking for what to practice, not perfection.",
        see: "Track sequencing errors, unclear handoffs, overreliance on prompts, and guest language that sounds memorized rather than conversational.",
        doText: "Learners rotate through host, team member, and observer roles for two complete guest-flow repetitions.",
        evidence: "Observation rubric with sequence, clarity, and independence ratings.",
      },
      {
        time: "45 min",
        title: "Guest recovery language",
        tag: "Scenario lab",
        objectives: ["Recognize a recovery moment.", "Acknowledge impact before solving.", "Choose the correct next action.", "Maintain ownership through the handoff."],
        coach: "Use realistic but low-complexity scenarios first. Increase ambiguity only after the response model is visible in the learner's behavior.",
        say: "The guest should hear ownership before they hear policy. Name the impact, explain the next step, and stay with the resolution.",
        see: "Watch for defensive language, premature escalation, policy recitation, and promises outside the learner's authority.",
        doText: "Each learner completes two recovery scenarios and repeats one after targeted feedback.",
        evidence: "Scenario score and the specific behavior improved on the second attempt.",
      },
    ],
  },
  2: {
    title: "Service and Technical Response",
    summary: "Connect issue recognition, escalation boundaries, and guest communication.",
    intent: "Build accurate technical judgment while protecting the guest experience.",
    evidence: "Issue classification accuracy, tool selection, escalation judgment, and timed response.",
    blocks: [
      {
        time: "20 min",
        title: "Retrieval and confidence check",
        tag: "Adaptive start",
        objectives: ["Recall the guest journey without prompts.", "Identify unresolved Day 1 questions.", "Set the day's practice priorities."],
        coach: "Use retrieval results to adjust time and grouping. Revisit only the gaps that would undermine today's technical practice.",
        say: "Show what you remember before we add complexity. The gaps tell us where today's coaching time will have the greatest value.",
        see: "Compare confidence with accuracy and note concepts that were remembered individually but not connected as a system.",
        doText: "Learners complete a five-question team challenge and self-rate confidence before answers are reviewed.",
        evidence: "Retrieval score, confidence variance, and adjusted practice priorities.",
      },
      {
        time: "30 min",
        title: "Technical issue categories",
        tag: "4 objectives",
        objectives: ["Recognize common issue patterns.", "Separate symptoms from causes.", "Select a safe first check.", "Know when to stop and escalate."],
        coach: "Teach categories and decision boundaries instead of memorized fixes. The goal is repeatable judgment when the exact issue changes.",
        say: "Name what you observe, identify the safest first check, and explain what evidence would change your next action.",
        see: "Listen for guessing, skipped safety checks, and solution-first thinking without a clear issue classification.",
        doText: "Small groups sort fictional issue cards by category, first action, and escalation boundary.",
        evidence: "Classification accuracy and reasoning captured on the decision grid.",
      },
      {
        time: "60 min",
        title: "Recovery tools and escalation",
        tag: "Practice lab",
        objectives: ["Use the approved response tools.", "Document the issue clearly.", "Communicate guest impact.", "Escalate with complete context."],
        coach: "Demonstrate the full response once, then give learners incomplete cases that require them to identify the missing information.",
        say: "A useful escalation lets the next person act immediately. Include the condition, actions already taken, result, and guest impact.",
        see: "Watch for incomplete context, repeated actions, unclear ownership, and escalation before local checks are complete.",
        doText: "Learners complete a response worksheet, give a verbal handoff, and peer-check it against the evidence standard.",
        evidence: "Handoff completeness score and correct escalation boundary.",
      },
      {
        time: "90 min",
        title: "Timed technical scenarios",
        tag: "Observed practice",
        objectives: ["Diagnose under realistic time pressure.", "Protect guest communication.", "Use tools in the correct order.", "Recover or escalate within the standard."],
        coach: "Increase pressure gradually. Do not add a second variable until the learner can execute the core sequence accurately.",
        say: "The clock matters, but sequence matters more. Stay observable, communicate, and avoid creating a second problem while solving the first.",
        see: "Record hesitation points, skipped steps, unsafe shortcuts, and whether guest communication disappears when technical pressure rises.",
        doText: "Each learner runs two timed scenarios, receives one priority correction, and repeats the weaker scenario.",
        evidence: "Time to resolution, sequence accuracy, communication rating, and repeat-attempt change.",
      },
      {
        time: "30 min",
        title: "Process-confusion review",
        tag: "Coach debrief",
        objectives: ["Separate knowledge gaps from process gaps.", "Name recurring confusion.", "Assign the correct improvement owner."],
        coach: "Do not coach around an unclear process. Capture repeated confusion as system evidence and route it to the correct owner.",
        say: "If several capable people misunderstand the same step, we may have a process problem rather than a learner problem.",
        see: "Look for repeated questions, conflicting sources, unclear ownership, and steps that require undocumented expert knowledge.",
        doText: "The group classifies each issue as knowledge, practice, environment, or process and assigns a next action.",
        evidence: "Confusion log with classification, owner, and resolution date.",
      },
    ],
  },
  3: {
    title: "Role-Play and Operations",
    summary: "Convert procedures into fluent performance through coached scenarios and progressive independence.",
    intent: "Integrate isolated skills into complete operational performance.",
    evidence: "Independent opening, full guest flow, recovery under pressure, and closing performance.",
    blocks: [
      {
        time: "15 min",
        title: "Day 2 retrieval practice",
        tag: "3 prompts",
        objectives: ["Recall the response sequence.", "Explain escalation boundaries.", "Identify one personal risk area."],
        coach: "Keep this fast and evidence-based. Use misses to assign observation partners and scenario order.",
        say: "Today the pieces become a full shift. First, retrieve the decision path you will need when the pressure increases.",
        see: "Note who recalls isolated facts but cannot explain the decision path from signal to action.",
        doText: "Learners answer three scenario prompts individually, then compare reasoning with a partner.",
        evidence: "Retrieval accuracy and personalized practice focus.",
      },
      {
        time: "45 min",
        title: "Opening procedure rehearsal",
        tag: "5 objectives",
        objectives: ["Sequence the opening.", "Verify readiness conditions.", "Assign ownership.", "Surface blockers.", "Communicate the launch decision."],
        coach: "Give the team the checklist, not the answers. Allow time for them to detect omissions before prompting.",
        say: "The opening is complete only when the environment is ready, ownership is clear, and remaining risk is visible.",
        see: "Watch for checkbox completion without verification, duplicated ownership, and blockers that are noticed but not escalated.",
        doText: "Pairs lead an opening rehearsal while an observer records evidence and one hidden condition tests their judgment.",
        evidence: "Opening rubric, missed-condition count, and level of coach prompting.",
      },
      {
        time: "90 min",
        title: "Full guest-flow scenarios",
        tag: "Observed practice",
        objectives: ["Run the experience end to end.", "Coordinate team handoffs.", "Maintain service standards.", "Recover from an unexpected change."],
        coach: "Run complete scenarios so handoffs and competing demands become visible. Pause only for safety or a failure that invalidates the practice.",
        say: "Treat every handoff as part of the guest experience. The next teammate should receive both the guest and the context they need.",
        see: "Track bottlenecks, role confusion, dropped context, and whether quality changes as demand increases.",
        doText: "Teams complete two end-to-end runs with rotating roles and a different disruption introduced in each.",
        evidence: "Journey score, handoff quality, recovery behavior, and observer notes.",
      },
      {
        time: "60 min",
        title: "Technical recovery under pressure",
        tag: "Scenario lab",
        objectives: ["Recognize the signal.", "Protect the guest.", "Execute the response.", "Escalate with complete evidence."],
        coach: "Select scenarios from the prior day's weakest categories. A stronger learner should receive greater ambiguity, not simply finish early.",
        say: "Accuracy, communication, and ownership all count. Resolving the issue while losing the guest is not a successful recovery.",
        see: "Look for regression under pressure, especially skipped communication and escalation without a complete local assessment.",
        doText: "Each learner completes one targeted pressure scenario and one transfer scenario with a changed surface condition.",
        evidence: "Targeted scenario score, transfer score, and remaining gap classification.",
      },
      {
        time: "45 min",
        title: "Closing procedure rehearsal",
        tag: "5 objectives",
        objectives: ["Complete the closing sequence.", "Verify the environment.", "Document unresolved issues.", "Transfer ownership.", "Prepare the next opening."],
        coach: "Place one unresolved issue in the scenario so learners must decide whether to resolve, document, or escalate it.",
        say: "A strong close protects tomorrow. Leave the environment, information, and ownership clearer than you found them.",
        see: "Watch for end-of-day shortcuts, undocumented follow-up, and task completion without a final condition check.",
        doText: "Learners rotate leadership of the closing sequence and complete a final verbal and written handoff.",
        evidence: "Closing rubric, handoff quality, and unresolved-action ownership.",
      },
    ],
  },
  4: {
    title: "Full Opening Simulation",
    summary: "Run the operation as a complete system while the coach observes, scores, and intervenes only when required.",
    intent: "Test transfer, leadership, and operational judgment in a realistic simulation.",
    evidence: "Sustained team performance, leadership decisions, partner confidence, and residual risk.",
    blocks: [
      {
        time: "30 min",
        title: "Leadership huddle",
        tag: "Readiness plan",
        objectives: ["Review performance evidence.", "Assign roles by readiness.", "Name likely risks.", "Set intervention boundaries."],
        coach: "Require the local leader to use evidence from prior days rather than intuition alone when assigning roles and support.",
        say: "Use yesterday's evidence to decide who leads, who needs support, and what conditions would trigger an intervention.",
        see: "Listen for evidence-based decisions, clear ownership, realistic risk anticipation, and a shared definition of success.",
        doText: "The local leader runs the huddle, assigns roles, and explains the evidence behind each decision.",
        evidence: "Leadership decision quality and alignment between evidence, role, and support.",
      },
      {
        time: "180 min",
        title: "Full opening simulation",
        tag: "Observed performance",
        objectives: ["Sustain the operation.", "Manage demand and handoffs.", "Resolve disruptions.", "Lead without coach dependence."],
        coach: "Observe from the edge. Record patterns across time, not isolated mistakes, and intervene only at the agreed boundaries.",
        say: "Run the operation. I will observe and capture evidence. Ask for support only through the same path you will use after launch.",
        see: "Track consistency, workload decisions, leadership presence, recovery speed, communication quality, and repeated process friction.",
        doText: "The team runs a complete simulated opening with changing demand, guest needs, and operational disruptions.",
        evidence: "Time-stamped observation log, competency evidence, scenario results, and escalation record.",
      },
      {
        time: "45 min",
        title: "Partner readiness review",
        tag: "Formal review",
        objectives: ["Compare evidence to readiness criteria.", "Surface unresolved risk.", "Confirm ownership.", "Align on the launch recommendation."],
        coach: "Lead with evidence, separate critical from coachable gaps, and avoid letting a single percentage replace judgment.",
        say: "Here is what the team demonstrated, what remains open, the risk attached to each gap, and the action already assigned.",
        see: "Look for disagreement about standards, unowned risk, or confidence statements that are not supported by observed performance.",
        doText: "Coach and local leader review the evidence together and record a shared readiness position.",
        evidence: "Partner confirmation, unresolved-risk list, and decision rationale.",
      },
      {
        time: "30 min",
        title: "Gap-closing plan",
        tag: "Named owners",
        objectives: ["Prioritize remaining gaps.", "Choose the correct intervention.", "Assign owners and deadlines.", "Define recheck evidence."],
        coach: "Match the action to the cause. More practice will not fix an unclear process, missing tool, or ownership gap.",
        say: "For each gap, name the cause, next action, owner, deadline, and evidence that will prove it is closed.",
        see: "Watch for vague actions, generic retraining, deadlines without owners, and rechecks that do not test the original gap.",
        doText: "The group builds a gap plan and schedules the final evidence check for every launch-critical item.",
        evidence: "Action plan with cause, intervention, owner, deadline, and success measure.",
      },
    ],
  },
  5: {
    title: "Launch Readiness",
    summary: "Validate independent performance, close remaining gaps, and make the formal readiness decision.",
    intent: "Confirm transfer, complete ownership handoff, and turn opening evidence into the next improvement cycle.",
    evidence: "Final performance, dual confirmation, opening support plan, and improvement recommendations.",
    blocks: [
      {
        time: "45 min",
        title: "Targeted remediation",
        tag: "Gap practice",
        objectives: ["Address only open critical gaps.", "Use the intervention matched to the cause.", "Verify corrected performance."],
        coach: "Do not repeat the whole curriculum. Use yesterday's evidence to run the smallest practice that can close or clarify each gap.",
        say: "This block is targeted. You will practice the specific behavior, condition, or decision that remains open, then demonstrate it again.",
        see: "Confirm whether the issue changes after feedback, a tool correction, clarified ownership, or another realistic repetition.",
        doText: "Assigned learners complete their targeted practice and a fresh evidence check under the original success criteria.",
        evidence: "Before-and-after gap status with the intervention used.",
      },
      {
        time: "120 min",
        title: "Independent team run",
        tag: "Final assessment",
        objectives: ["Operate without coach prompting.", "Sustain standards across the run.", "Recover from variability.", "Lead the team locally."],
        coach: "Use the same evidence standards established before training. Do not lower the bar because time is running out.",
        say: "This is the final independent run. The team owns decisions, communication, recovery, and escalation.",
        see: "Observe whether performance transfers without prompts and remains stable when timing, demand, or personnel conditions shift.",
        doText: "The team completes the full run while the coach records evidence without providing corrective prompts.",
        evidence: "Final assessment by competency, independence, consistency, and risk.",
      },
      {
        time: "45 min",
        title: "Leadership confirmation",
        tag: "Dual sign-off",
        objectives: ["Review the full body of evidence.", "Confirm the readiness decision.", "Document exceptions.", "Accept local ownership."],
        coach: "Make the decision transparent. State the evidence, limits, exceptions, and follow-up expectations before either party confirms.",
        say: "The recommendation is based on observed performance across the week, not attendance or completion alone.",
        see: "Confirm shared understanding of remaining risk, exception ownership, support boundaries, and follow-up dates.",
        doText: "Coach and local leader independently review the record, discuss differences, and complete the shared confirmation.",
        evidence: "Dual confirmation with exceptions and decision rationale.",
      },
      {
        time: "30 min",
        title: "Opening-weekend plan",
        tag: "Ownership transfer",
        objectives: ["Transfer operational ownership.", "Confirm support paths.", "Schedule outcome review.", "Capture improvements for the next opening."],
        coach: "Close the loop beyond launch. The final plan should protect the current opening and produce evidence that improves the next one.",
        say: "Here is what the local team owns, what support remains available, what we will measure, and when we will review the outcome.",
        see: "Look for unclear ownership, unsupported assumptions, missing outcome measures, and lessons that have not been assigned for action.",
        doText: "The group finalizes the support map, opening measures, review date, and one recommended improvement to the next plan.",
        evidence: "Ownership transfer, support plan, review date, and improvement recommendation.",
      },
    ],
  },
};

const guides = {
  structure: {
    category: "START HERE",
    title: "How to use the five-day plan",
    lead: "The agenda is a sequence, not a menu. Each day prepares learners for the performance expected on the next.",
    useWhen: "Before Day 1, at the start of each training day, and whenever schedule pressure creates a temptation to skip or reorder an objective.",
    outcome: "The coach protects the performance standard while adapting time, grouping, and repetition to current evidence.",
    principle: "Protect the sequence. Do not move learners into complex technical practice before they understand the complete guest journey.",
    sections: [
      {
        title: "Read the plan as a performance pathway",
        body: "Each block prepares learners for a later, more independent performance. The objective defines the behavior, the activity creates practice, and the evidence determines what happens next.",
        bullets: ["Begin with the day's intent and required evidence.", "Open each block before facilitating and review its success criteria.", "Connect the block to the competency it prepares learners to demonstrate."],
      },
      {
        title: "Adjust the method, not the standard",
        body: "Local conditions may change the timing or grouping, but they should not erase the required performance.",
        bullets: ["Add repetition when evidence is weak.", "Change group size or practice order when access is limited.", "Record any delayed objective, the reason, owner, and recovery plan."],
      },
      {
        title: "Know what complete means",
        body: "Exposure, attendance, and confidence are not completion. Completion requires observable performance under the conditions defined for the competency.",
        bullets: ["Ask the learner to perform rather than explain when the objective is behavioral.", "Remove prompts before final evidence is captured.", "Leave the competency open when evidence is incomplete or inconsistent."],
      },
    ],
    language: { label: "COACH LANGUAGE", text: "We can change how we practice this today, but we cannot remove the performance the team needs for launch." },
    quickCheck: ["Can I name the performance this block prepares?", "Do I know what evidence I need before moving on?", "Have I documented any change to the planned sequence?"],
  },
  signals: {
    category: "START HERE",
    title: "Reading readiness signals",
    lead: "Good coaching begins by separating what learners say they know from what they can demonstrate under realistic conditions.",
    useWhen: "During Day 0 setup, retrieval practice, early demonstrations, and any moment when confidence and performance appear misaligned.",
    outcome: "The coach identifies the likely cause of a gap and chooses the right level of support instead of prescribing generic retraining.",
    principle: "Treat confidence as context and behavior as evidence. Neither should be interpreted without the other.",
    sections: [
      {
        title: "Collect more than one signal",
        body: "No single observation should determine readiness. Combine prior experience, retrieval, scenario performance, coach notes, and repeated behavior.",
        bullets: ["Compare confidence with first-attempt accuracy.", "Look for patterns across more than one condition.", "Notice whether the learner can explain why the action works."],
      },
      {
        title: "Classify the gap before coaching",
        body: "A missed behavior can come from missing knowledge, insufficient practice, environmental friction, unclear process, or unclear ownership.",
        bullets: ["Knowledge gap: the learner cannot describe the correct action.", "Performance gap: the learner knows the action but cannot execute it reliably.", "System gap: the expected action is unclear, unsupported, or contradicted by the environment."],
      },
      {
        title: "Match support to the cause",
        body: "The intervention should be as specific as the diagnosis. More explanation will not fix an access problem, and more repetition will not fix a broken process.",
        bullets: ["Clarify knowledge with a concise model or worked example.", "Build performance with coached practice and another attempt.", "Route system gaps to the owner and give the team an approved interim action."],
      },
    ],
    language: { label: "DIAGNOSTIC QUESTION", text: "Show me where the process became unclear, then tell me what information or condition would have helped you choose the next action." },
    quickCheck: ["Am I responding to a pattern or one isolated moment?", "Have I classified the gap before choosing an intervention?", "Does the next action test the original gap?"],
  },
  adjust: {
    category: "DAILY FACILITATION",
    title: "Adapting without losing the standard",
    lead: "Strong facilitation responds to the room while protecting the objective, evidence requirement, and readiness bar.",
    useWhen: "When time compresses, equipment is unavailable, learners progress at different speeds, or an unexpected operational condition changes the day.",
    outcome: "The day remains productive and traceable, with every changed block tied to a recovery action and evidence plan.",
    principle: "Flex the route, not the destination. A schedule change is acceptable only when the required performance remains visible and owned.",
    sections: [
      {
        title: "Protect the nonnegotiables",
        body: "Identify which outcomes are launch-critical before deciding what can move, shrink, combine, or repeat.",
        bullets: ["Keep safety, guest-impact, and independent-performance objectives intact.", "Do not replace performance practice with discussion alone.", "Preserve the final evidence check even when teaching time changes."],
      },
      {
        title: "Use productive substitutions",
        body: "When the planned environment is unavailable, choose a substitute that rehearses the same decision, sequence, or communication behavior.",
        bullets: ["Use tabletop sequencing when physical access is delayed.", "Use role-play when live-system practice is unavailable.", "Use peer observation to increase repetitions without adding coach bottlenecks."],
      },
      {
        title: "Document the variance",
        body: "A changed plan becomes manageable when the decision, impact, and recovery path are visible to the next coach and stakeholder.",
        bullets: ["Record what changed and why.", "Name the affected objective and evidence still required.", "Assign the recovery action, owner, and deadline."],
      },
    ],
    language: { label: "COACH LANGUAGE", text: "The environment changed, so we are changing the practice format. The objective and evidence standard remain the same." },
    quickCheck: ["Which objective is at risk?", "Does the substitute practice the same behavior?", "Who owns the missing evidence and by when?"],
  },
  scenarios: {
    category: "COACHING PRACTICE",
    title: "Running scenario practice",
    lead: "Scenario practice should reveal whether a learner can recognize the situation, select the process, and execute it under realistic pressure.",
    useWhen: "After learners understand the underlying process and before independent sign-off, especially for judgment, recovery, escalation, and handoff behaviors.",
    outcome: "The coach produces observable evidence of transfer and gives learners a focused opportunity to improve on the next attempt.",
    principle: "Score only observable behavior. Confidence and familiarity are useful signals, but they are not readiness evidence.",
    sections: [
      {
        title: "Brief without giving away the answer",
        body: "State the conditions, learner role, available tools, success criteria, and safety boundaries. Do not preview the exact decision the learner must make.",
        bullets: ["Use one primary challenge per early scenario.", "Clarify what the coach will and will not answer.", "Tell observers which behaviors to capture."],
      },
      {
        title: "Observe the decision path",
        body: "Let the learner work long enough to reveal recognition, sequence, communication, and judgment. Intervene only at the defined boundary.",
        bullets: ["Record actions and language, not personality labels.", "Note the first point where the response diverges from the standard.", "Capture unnecessary escalation, delay, or repeated work."],
      },
      {
        title: "Debrief, correct, and repeat",
        body: "Ask the learner to diagnose the attempt first. Reinforce one effective behavior, choose one priority correction, and create another attempt quickly.",
        bullets: ["Start with the learner's own diagnosis.", "Explain the impact of the priority behavior.", "Change one surface condition on the repeat to test transfer."],
      },
    ],
    language: { label: "DEBRIEF PROMPT", text: "What did you notice, where did your decision change, and what will you do differently in the next attempt?" },
    quickCheck: ["Did the scenario test the intended behavior?", "Did I capture observable evidence?", "Did the learner receive another attempt after feedback?"],
  },
  feedback: {
    category: "COACHING PRACTICE",
    title: "Giving observable feedback",
    lead: "Feedback should make the next attempt better, not simply describe the previous attempt.",
    useWhen: "Immediately after observed practice, during a safe pause in live work, or when a repeated behavior needs a specific correction.",
    outcome: "The learner understands the action, its impact, and the change required, then demonstrates the correction in another attempt.",
    principle: "Use action, impact, and next attempt: what happened, why it mattered, and what the learner will do differently.",
    sections: [
      {
        title: "Describe the observable moment",
        body: "Name the action, language, sequence, or decision you observed and where it occurred.",
        bullets: ["Say what happened without judging the learner.", "Use the same performance language as the rubric.", "Avoid vague labels such as good, weak, or unconfident."],
      },
      {
        title: "Connect action to impact",
        body: "Explain why the behavior matters to the guest, team, safety, operational flow, or readiness decision.",
        bullets: ["Prioritize the highest-impact correction.", "Limit feedback to what the learner can apply in the next attempt.", "Check that the learner can restate the expected change."],
      },
      {
        title: "Verify in another attempt",
        body: "Feedback is not complete when the conversation ends. It is complete when the learner demonstrates the changed behavior.",
        bullets: ["Create the next attempt quickly.", "Reduce prompting so the learner owns the correction.", "Record whether the behavior improved, remained inconsistent, or revealed a different gap."],
      },
    ],
    language: { label: "FEEDBACK MODEL", text: "When the handoff happened, the issue context was missing. That forced the next person to restart the diagnosis. On the next run, include the condition, actions taken, and current guest impact." },
    quickCheck: ["Did I name an action rather than a trait?", "Did I explain the impact?", "Did the learner demonstrate the correction?"],
  },
  differentiation: {
    category: "COACHING PRACTICE",
    title: "Coaching mixed readiness levels",
    lead: "A shared standard does not require identical practice. Learners may need different support, repetition, complexity, or roles to reach the same performance.",
    useWhen: "When some learners finish quickly, confidence varies widely, or the team includes different levels of prior experience.",
    outcome: "Every learner remains challenged at the right level while the coach protects a consistent final readiness standard.",
    principle: "Differentiate the path and support. Keep the final behavior and evidence requirement consistent.",
    sections: [
      {
        title: "Group with purpose",
        body: "Use evidence to choose pairs and roles rather than allowing convenience or confidence to determine who practices what.",
        bullets: ["Pair a fluent performer with a developing observer only when both have defined roles.", "Rotate the doer, checker, and explainer roles.", "Regroup when one learner begins carrying the performance for another."],
      },
      {
        title: "Adjust support and complexity",
        body: "Give developing learners clearer structure and more repetitions. Give stronger learners changed conditions that require transfer and judgment.",
        bullets: ["Use prompts early, then deliberately remove them.", "Repeat the same core behavior before adding complexity.", "Add ambiguity, time pressure, or competing demands for learners who are ready."],
      },
      {
        title: "Prevent invisible learners",
        body: "Group success can conceal an individual gap. Every learner needs an observable opportunity to perform the required behavior.",
        bullets: ["Track who has performed, observed, and explained.", "Require individual completion before final sign-off.", "Use targeted follow-up instead of repeating the full block for everyone."],
      },
    ],
    language: { label: "COACH LANGUAGE", text: "You are working toward the same standard. Your next practice is different because it targets the evidence you still need." },
    quickCheck: ["Has every learner performed individually?", "Is support decreasing as performance improves?", "Are stronger learners practicing transfer rather than waiting?"],
  },
  evidence: {
    category: "EVIDENCE AND DECISIONS",
    title: "Capturing usable performance evidence",
    lead: "Useful evidence is specific enough to support coaching now, a readiness decision later, and a better opening process next time.",
    useWhen: "During scenarios, independent runs, competency sign-offs, daily recaps, and any event that changes the readiness recommendation.",
    outcome: "The record shows the condition, observed behavior, result, support level, and next action without requiring the original coach to interpret it.",
    principle: "Document what another person would need to understand the performance and act on it.",
    sections: [
      {
        title: "Capture condition and behavior",
        body: "Describe what the learner faced and what they did. The same behavior can mean something different with full prompting than under independent pressure.",
        bullets: ["Name the scenario or operating condition.", "Record the observable action and sequence.", "Include the level of prompting or support."],
      },
      {
        title: "Record result and impact",
        body: "Connect the behavior to the outcome so the evidence supports a risk and readiness conversation.",
        bullets: ["State whether the standard was met.", "Describe guest, safety, team, or operational impact.", "Note consistency across attempts when available."],
      },
      {
        title: "Make the next action executable",
        body: "Every open gap should lead to a specific action that tests the same underlying capability.",
        bullets: ["Name the gap classification.", "Assign the practice, clarification, or system correction.", "Include the owner, deadline, and recheck evidence."],
      },
    ],
    language: { label: "EVIDENCE EXAMPLE", text: "During the timed recovery scenario, the learner identified the issue and used the correct first check without prompting, but escalated before documenting guest impact. Repeat with a changed issue condition before final sign-off." },
    quickCheck: ["Could another coach understand what happened?", "Does the evidence distinguish prompted from independent performance?", "Is the next action specific and owned?"],
  },
  readiness: {
    category: "EVIDENCE AND DECISIONS",
    title: "Making a readiness decision",
    lead: "Readiness is a body of evidence across competencies, scenarios, attendance, judgment, and independent performance.",
    useWhen: "At daily checkpoints, the partner review, final sign-off, and whenever a launch-critical gap changes status.",
    outcome: "The recommendation is transparent, evidence-based, risk-aware, and paired with ownership for every exception.",
    principle: "A percentage is a signal, not the decision. Review which competencies remain open and the risk attached to each.",
    sections: [
      {
        title: "Review the full body of evidence",
        body: "Look across competency sign-offs, scenario results, independent runs, recap patterns, process confusion, and operating conditions.",
        bullets: ["Weight launch-critical competencies more heavily than low-risk gaps.", "Look for consistency and transfer, not one successful attempt.", "Review both individual and team-system performance."],
      },
      {
        title: "Separate gap from risk",
        body: "Not every open item has the same launch impact. State what remains open, the cause, and the consequence if it persists.",
        bullets: ["Critical: affects safety, core guest experience, or essential operation.", "Controlled: has an owner, support path, and acceptable temporary control.", "Developmental: can continue after launch without compromising the readiness bar."],
      },
      {
        title: "Make the recommendation transparent",
        body: "Explain the decision, supporting evidence, limitations, exceptions, and next review so stakeholders can confirm the same reality.",
        bullets: ["State ready, ready with conditions, or not ready.", "List every exception and named owner.", "Record what evidence would change the decision."],
      },
    ],
    language: { label: "DECISION LANGUAGE", text: "The team meets the launch standard in the core guest journey and opening sequence. Technical recovery remains controlled through a named support path and a scheduled recheck before launch." },
    quickCheck: ["Does the recommendation match the evidence?", "Are critical gaps separated from developmental ones?", "Is every exception owned and time-bound?"],
  },
  confusion: {
    category: "ESCALATION",
    title: "Handling process confusion",
    lead: "Repeated questions are product data. They can reveal a knowledge gap, unclear process, or missing ownership.",
    useWhen: "When multiple learners ask the same question, approved sources conflict, a step depends on undocumented expertise, or coaches repeatedly invent workarounds.",
    outcome: "The immediate need is stabilized while the underlying process issue is captured, owned, corrected, and measured in the next opening.",
    principle: "Do not coach around a broken process. Capture the confusion, resolve the immediate need, and route the system issue to its owner.",
    sections: [
      {
        title: "Stabilize the immediate need",
        body: "Give the team the safest approved next action and prevent an improvised workaround from becoming the unofficial process.",
        bullets: ["Confirm whether the issue affects safety or launch-critical work.", "Name the temporary action and its limits.", "Tell the team who owns the final answer."],
      },
      {
        title: "Classify the source of confusion",
        body: "Determine whether the issue came from missing knowledge, unclear guidance, conflicting sources, environmental mismatch, or incomplete ownership.",
        bullets: ["Capture the exact question and condition.", "Identify which sources or roles conflict.", "Separate a one-person misunderstanding from a repeatable system signal."],
      },
      {
        title: "Close the system loop",
        body: "Update the correct part of the operating system and verify that the change reduces confusion in the next use.",
        bullets: ["Assign an owner and resolution date.", "Update the agenda, guide, competency, tool, or process.", "Measure whether the same escalation repeats in the next opening."],
      },
    ],
    language: { label: "ESCALATION LANGUAGE", text: "The immediate action is clear, but the approved sources conflict. I am recording the exact condition and routing the process decision to its owner before this becomes a local workaround." },
    quickCheck: ["Did I stabilize the immediate need?", "Did I capture the exact source of confusion?", "Is there an owner and a way to verify the fix?"],
  },
  intervene: {
    category: "ESCALATION",
    title: "Knowing when to intervene",
    lead: "Coaches need enough restraint to reveal independent performance and enough judgment to protect people, guests, and the validity of the practice.",
    useWhen: "During scenario practice, simulations, reverse shadowing, or live operations when the coach must decide whether to observe, prompt, pause, or take over.",
    outcome: "The coach preserves authentic evidence without allowing avoidable harm, compounding error, or an invalid practice condition.",
    principle: "Intervene at the boundary you defined before practice, not at the first sign of learner discomfort.",
    sections: [
      {
        title: "Observe when learning is still productive",
        body: "Hesitation, self-correction, and noncritical error can produce valuable evidence and learning when the environment remains safe.",
        bullets: ["Allow time for recognition and recovery.", "Capture the behavior before coaching.", "Avoid rescuing the learner because silence feels uncomfortable."],
      },
      {
        title: "Prompt when the practice can continue",
        body: "Use the smallest prompt that restores productive practice without supplying the complete solution.",
        bullets: ["Prompt attention before prompting action.", "Name the decision point, not the answer.", "Record the level of support because prompted performance is not independent evidence."],
      },
      {
        title: "Pause or take over at the boundary",
        body: "Stop the attempt when safety, guest impact, operational integrity, or the validity of the scenario is at risk.",
        bullets: ["Pause when an error begins compounding.", "Take over when immediate protection is required.", "Debrief the boundary and create a safe repeat attempt when possible."],
      },
    ],
    language: { label: "MINIMAL PROMPT", text: "Pause. What condition are you seeing, and which decision point does that condition trigger?" },
    quickCheck: ["Was the intervention boundary defined before practice?", "Did I use the least support necessary?", "Did I record that the performance was prompted?"],
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
  document.getElementById("agendaIntent").textContent = data.intent;
  document.getElementById("agendaEvidence").textContent = data.evidence;
  document.getElementById("agendaList").innerHTML = data.blocks.map((block, index) => {
    const bodyId = `agenda-block-${day}-${index}`;
    const isOpen = index === 0;
    return `
      <article class="agenda-block ${isOpen ? "open" : ""}">
        <button class="agenda-block-toggle" aria-expanded="${isOpen}" aria-controls="${bodyId}" data-agenda-block="${bodyId}">
          <span class="agenda-time">${block.time}</span>
          <span class="agenda-block-name"><strong>${block.title}</strong><small>${block.tag}</small></span>
          <span class="agenda-expand-label">${isOpen ? "Hide guide" : "Open guide"}</span>
          <span class="agenda-chevron" aria-hidden="true">⌄</span>
        </button>
        <div class="agenda-block-body" id="${bodyId}" ${isOpen ? "" : "hidden"}>
          <div class="agenda-objectives">
            <span class="agenda-section-label">Performance objectives</span>
            <ul>${block.objectives.map((objective) => `<li>${objective}</li>`).join("")}</ul>
          </div>
          <div class="agenda-coach-note">
            <span class="agenda-section-label">Coach guidance</span>
            <p>${block.coach}</p>
          </div>
          <div class="say-see-do">
            <article class="ssd-card say">
              <span>SAY</span>
              <p>${block.say}</p>
            </article>
            <article class="ssd-card see">
              <span>SEE</span>
              <p>${block.see}</p>
            </article>
            <article class="ssd-card do">
              <span>DO</span>
              <p>${block.doText}</p>
            </article>
          </div>
          <div class="agenda-evidence">
            <span class="agenda-section-label">Evidence captured</span>
            <p>${block.evidence}</p>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function toggleAgendaBlock(button) {
  const body = document.getElementById(button.dataset.agendaBlock);
  const article = button.closest(".agenda-block");
  const willOpen = button.getAttribute("aria-expanded") !== "true";
  button.setAttribute("aria-expanded", String(willOpen));
  button.querySelector(".agenda-expand-label").textContent = willOpen ? "Hide guide" : "Open guide";
  body.hidden = !willOpen;
  article.classList.toggle("open", willOpen);
}

function renderGuide(key) {
  const guide = guides[key];
  document.getElementById("guideArticle").innerHTML = `
    <span class="guide-category">${guide.category}</span>
    <h2>${guide.title}</h2>
    <p class="lead">${guide.lead}</p>
    <div class="guide-context">
      <article>
        <span>USE THIS WHEN</span>
        <p>${guide.useWhen}</p>
      </article>
      <article>
        <span>COACH OUTCOME</span>
        <p>${guide.outcome}</p>
      </article>
    </div>
    <div class="principle"><strong>COACH PRINCIPLE</strong>${guide.principle}</div>
    <div class="guide-sections">
      ${guide.sections.map((section, index) => `
        <section class="guide-section">
          <span class="guide-step">${String(index + 1).padStart(2, "0")}</span>
          <div>
            <h3>${section.title}</h3>
            <p>${section.body}</p>
            <ul>${section.bullets.map((bullet) => `<li>${bullet}</li>`).join("")}</ul>
          </div>
        </section>
      `).join("")}
    </div>
    <div class="guide-language">
      <span>${guide.language.label}</span>
      <p>“${guide.language.text}”</p>
    </div>
    <aside class="guide-check">
      <span>QUICK EVIDENCE CHECK</span>
      <ul>${guide.quickCheck.map((item) => `<li>${item}</li>`).join("")}</ul>
    </aside>
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

document.getElementById("agendaList").addEventListener("click", (event) => {
  const button = event.target.closest("[data-agenda-block]");
  if (button) toggleAgendaBlock(button);
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
    const searchable = `${button.textContent} ${JSON.stringify(guides[button.dataset.guide])}`.toLowerCase();
    button.hidden = Boolean(query && !searchable.includes(query));
  });
  document.querySelectorAll(".guide-group").forEach((group) => {
    group.hidden = ![...group.querySelectorAll(".guide-link")].some((button) => !button.hidden);
  });
  document.getElementById("guideEmpty").hidden =
    [...document.querySelectorAll(".guide-link")].some((button) => !button.hidden);
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
