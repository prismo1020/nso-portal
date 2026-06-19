// ============================================================
// DB — all Supabase persistence operations
// ============================================================

async function dbLoadState(passedUser) {
  let user = passedUser || null;
  if (!user) {
    const { data } = await supabase.auth.getUser();
    user = data?.user || null;
  }
  if (!user) return 'no-user';

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  state.userRole = profile?.role || 'coach';
  state.userEmail = user.email;

  // Load the most recently updated active opening for this coach
  const { data: openings } = await supabase
    .from('openings')
    .select('*')
    .eq('coach_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(1);

  if (!openings || openings.length === 0) return 'no-opening';

  const o = openings[0];
  state.openingId = o.id;
  state.opening = { store: o.store_name, coach: o.coach_name, date: o.start_date };
  state.currentDay = o.current_day || 1;

  const [
    { data: trainees },
    { data: signoffs },
    { data: recaps },
    { data: fchecks }
  ] = await Promise.all([
    supabase.from('trainees').select('*').eq('opening_id', o.id).order('created_at'),
    supabase.from('signoffs').select('*').eq('opening_id', o.id),
    supabase.from('recaps').select('*').eq('opening_id', o.id),
    supabase.from('franchise_checks').select('*').eq('opening_id', o.id)
  ]);

  state.trainees = (trainees || []).map(t => ({ id: t.id, name: t.name, role: t.role, notes: t.notes || '' }));

  state.signoffs = {};
  (signoffs || []).forEach(s => {
    state.signoffs[s.trainee_id + '_' + s.competency_id] = s.status;
  });

  state.recaps = {};
  (recaps || []).forEach(r => {
    state.recaps[r.day_num] = r.recap_data || {};
  });

  state.franchiseChecks = {};
  state.franchiseCheckNames = {};
  state.franchiseCheckTimestamps = {};
  (fchecks || []).forEach(f => {
    state.franchiseChecks[f.check_key] = f.checked;
    state.franchiseCheckNames[f.check_key] = f.signed_name || '';
    state.franchiseCheckTimestamps[f.check_key] = f.checked_at || null;
    state.franchiseCheckDates[f.check_key] = f.signed_date || '';
  });
  state.partnerReviewNotes = o.partner_review_notes || '';

  await dbLoadOverrides();
  await dbLoadOSCReport();
  return true;
}

async function dbLoadOSCReport() {
  if (!state.openingId) return;
  const { data, error } = await supabase
    .from('osc_reports')
    .select('*')
    .eq('opening_id', state.openingId)
    .order('updated_at', { ascending: false })
    .limit(1);
  if (error) { console.error('dbLoadOSCReport:', error); return; }
  state.oscReport = (data && data[0]) || {};
}

async function dbSaveOSCReport(report) {
  if (!state.openingId) return { message: 'No opening loaded' };
  const { error } = await supabase.from('osc_reports').upsert({
    opening_id:            state.openingId,
    ff_headcount:          report.ff_headcount,
    weekend_bookings:      report.weekend_bookings,
    t1_ticket_count:       report.t1_ticket_count,
    team_resolvable:       report.team_resolvable,
    biz_impact_notes:      report.biz_impact_notes,
    deployed_by:           report.deployed_by,
    deployment_rating:     report.deployment_rating,
    deployment_notes:      report.deployment_notes,
    tech_specialist:       report.tech_specialist,
    tech_specialist_name:  report.tech_specialist_name,
    tech_specialist_notes: report.tech_specialist_notes,
    team_rating:           report.team_rating,
    team_notes:            report.team_notes,
    sm_rating:             report.sm_rating,
    sm_notes:              report.sm_notes,
    asm_rating:            report.asm_rating,
    asm_notes:             report.asm_notes,
    fo_rating:             report.fo_rating,
    fo_notes:              report.fo_notes,
    updated_at:            new Date().toISOString()
  }, { onConflict: 'opening_id' });
  if (error) console.error('dbSaveOSCReport:', error);
  return error || null;
}

async function dbLoadOverrides() {
  const { data, error } = await supabase.from('content_overrides').select('*');
  if (error) { console.error('dbLoadOverrides:', error); return; }
  state.overrides = {};
  (data || []).forEach(r => {
    const key = r.content_type + '|' + r.content_id + '|' + r.field_name;
    state.overrides[key] = r.value;
  });
}

async function dbSaveOverride(contentType, contentId, fieldName, value) {
  const { error } = await supabase.from('content_overrides').upsert({
    content_type: contentType,
    content_id:   contentId,
    field_name:   fieldName,
    value:        value,
    updated_at:   new Date().toISOString()
  }, { onConflict: 'content_type,content_id,field_name' });
  if (error) console.error('dbSaveOverride:', error);
  return error || null;
}

async function dbSaveOpening() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !state.opening) return;

  const payload = {
    coach_id:   user.id,
    store_name: state.opening.store,
    coach_name: state.opening.coach,
    start_date: state.opening.date || null,
    current_day: state.currentDay,
    updated_at: new Date().toISOString()
  };

  if (state.openingId) {
    await supabase.from('openings').update(payload).eq('id', state.openingId);
  } else {
    const { data, error } = await supabase.from('openings').insert(payload).select().single();
    if (data) state.openingId = data.id;
    if (error) console.error('dbSaveOpening:', error);
  }
}

async function dbUpdateCurrentDay() {
  if (!state.openingId) return;
  await supabase.from('openings')
    .update({ current_day: state.currentDay, updated_at: new Date().toISOString() })
    .eq('id', state.openingId);
}

async function dbSaveTrainee(trainee) {
  if (!state.openingId) return;
  const { error } = await supabase.from('trainees').upsert({
    id:         trainee.id,
    opening_id: state.openingId,
    name:       trainee.name,
    role:       trainee.role,
    notes:      trainee.notes || null
  }, { onConflict: 'id' });
  if (error) console.error('dbSaveTrainee:', error);
}

async function dbDeleteTrainee(id) {
  const { error } = await supabase.from('trainees').delete().eq('id', id);
  if (error) console.error('dbDeleteTrainee:', error);
}

async function dbSaveSignoff(traineeId, compId, status) {
  if (!state.openingId) return;

  if (status === 'pending') {
    await supabase.from('signoffs')
      .delete()
      .eq('trainee_id', traineeId)
      .eq('competency_id', compId);
  } else {
    const comp = COMPETENCIES.find(c => c.id === compId);
    const { error } = await supabase.from('signoffs').upsert({
      opening_id:    state.openingId,
      trainee_id:    traineeId,
      competency_id: compId,
      status:        status,
      day_num:       comp?.day || null,
      updated_at:    new Date().toISOString()
    }, { onConflict: 'trainee_id,competency_id' });
    if (error) console.error('dbSaveSignoff:', error);
  }
}

async function dbSaveRecap(day) {
  if (!state.openingId) return { message: 'No opening loaded' };
  const r = state.recaps[day] || {};
  const { error } = await supabase.from('recaps').upsert({
    opening_id:  state.openingId,
    day_num:     day,
    recap_data:  r,
    updated_at:  new Date().toISOString()
  }, { onConflict: 'opening_id,day_num' });
  if (error) console.error('dbSaveRecap:', error);
  return error || null;
}

async function dbSaveFranchiseCheck(key, checked, signedName) {
  if (!state.openingId) return;
  const now = new Date().toISOString();
  const payload = {
    opening_id:  state.openingId,
    check_key:   key,
    checked:     checked,
    updated_at:  now
  };
  if (signedName !== undefined) payload.signed_name = signedName || '';
  // Only set checked_at on the transition to checked; never clear it
  if (checked && !state.franchiseCheckTimestamps[key]) {
    payload.checked_at = now;
    state.franchiseCheckTimestamps[key] = now;
  }
  const { error } = await supabase.from('franchise_checks').upsert(payload, { onConflict: 'opening_id,check_key' });
  if (error) console.error('dbSaveFranchiseCheck:', error);
}

async function dbSaveFranchiseCheckDate(key, date) {
  if (!state.openingId) return;
  const { error } = await supabase.from('franchise_checks').upsert({
    opening_id: state.openingId,
    check_key: key,
    signed_date: date,
    updated_at: new Date().toISOString()
  }, { onConflict: 'opening_id,check_key' });
  if (error) console.error('dbSaveFranchiseCheckDate:', error);
}

async function dbSavePartnerReviewNotes(notes) {
  if (!state.openingId) return;
  const { error } = await supabase.from('openings')
    .update({ partner_review_notes: notes, updated_at: new Date().toISOString() })
    .eq('id', state.openingId);
  if (error) console.error('dbSavePartnerReviewNotes:', error);
}

async function dbLoadOpeningsForCoach() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('openings')
    .select('id, store_name, coach_name, start_date, current_day, status, updated_at')
    .eq('coach_id', user.id)
    .order('updated_at', { ascending: false });
  if (error) { console.error('dbLoadOpeningsForCoach:', error); return []; }
  return data || [];
}

async function dbLoadAllOpeningsForSwitcher() {
  const { data, error } = await supabase
    .from('openings')
    .select('id, store_name, coach_name, start_date, current_day, status, updated_at')
    .order('updated_at', { ascending: false });
  if (error) { console.error('dbLoadAllOpeningsForSwitcher:', error); return []; }
  return data || [];
}

async function dbDeleteOpening(openingId) {
  const { error } = await supabase.from('openings').delete().eq('id', openingId);
  return error || null;
}

async function dbLoadAllOpenings() {
  // Fetch openings first, then related data per opening separately.
  // Avoids nested-join RLS issues that can silently return empty.
  const { data: openings, error } = await supabase
    .from('openings')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) { console.error('dbLoadAllOpenings openings:', error); return []; }
  if (!openings || openings.length === 0) return [];

  const results = await Promise.all(openings.map(async (o) => {
    const [
      { data: trainees },
      { data: signoffs },
      { data: recaps },
      { data: fchecks }
    ] = await Promise.all([
      supabase.from('trainees').select('*').eq('opening_id', o.id),
      supabase.from('signoffs').select('*').eq('opening_id', o.id),
      supabase.from('recaps').select('*').eq('opening_id', o.id),
      supabase.from('franchise_checks').select('*').eq('opening_id', o.id)
    ]);
    return {
      ...o,
      trainees:         trainees        || [],
      signoffs:         signoffs        || [],
      recaps:           recaps          || [],
      franchise_checks: fchecks         || []
    };
  }));

  return results;
}

// ============================================================
// LEADERSHIP TRAINING DB HELPERS
// ============================================================
async function dbLoadAllLeadershipTrainingsForAdmin() {
  const { data: trainings, error } = await supabase
    .from('leadership_trainings')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) return { error };
  if (!trainings || trainings.length === 0) return { data: [] };

  const rows = await Promise.all(trainings.map(async (t) => {
    const [{ data: program }, { data: participants }, { data: signoffs }, { data: reports }] = await Promise.all([
      supabase.from('store_programs').select('*').eq('id', t.store_program_id).single(),
      supabase.from('leadership_participants').select('*').eq('leadership_training_id', t.id),
      supabase.from('leadership_signoffs').select('*').eq('leadership_training_id', t.id),
      supabase.from('leadership_readiness_reports').select('*').eq('leadership_training_id', t.id)
    ]);
    return { ...t, store_program: program || {}, participants: participants || [], signoffs: signoffs || [], readiness_reports: reports || [] };
  }));
  return { data: rows };
}

async function dbLoadLeadershipTraining(trainingId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: { message: 'No user loaded' } };

  let query = supabase
    .from('leadership_trainings')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1);
  if (trainingId) query = supabase.from('leadership_trainings').select('*').eq('id', trainingId).limit(1);

  const { data: trainings, error } = await query;
  if (error) return { error };
  if (!trainings || trainings.length === 0) {
    state.currentStoreProgram = null;
    state.leadershipTraining = null;
    state.leadershipParticipants = [];
    state.leadershipSignoffs = {};
    state.leadershipDailyNotes = {};
    state.leadershipReports = {};
    return { data: null };
  }

  const training = trainings[0];
  state.leadershipTraining = training;
  const [
    { data: program, error: programError },
    { data: participants, error: participantsError },
    { data: signoffs, error: signoffsError },
    { data: notes, error: notesError },
    { data: reports, error: reportsError }
  ] = await Promise.all([
    supabase.from('store_programs').select('*').eq('id', training.store_program_id).single(),
    supabase.from('leadership_participants').select('*').eq('leadership_training_id', training.id).order('created_at'),
    supabase.from('leadership_signoffs').select('*').eq('leadership_training_id', training.id),
    supabase.from('leadership_daily_notes').select('*').eq('leadership_training_id', training.id),
    supabase.from('leadership_readiness_reports').select('*').eq('leadership_training_id', training.id)
  ]);

  const firstError = programError || participantsError || signoffsError || notesError || reportsError;
  if (firstError) return { error: firstError };

  state.currentStoreProgram = program || null;
  state.currentLeadershipDay = training.current_day || 1;
  state.leadershipParticipants = (participants || []).map(p => ({
    id: p.id, name: p.name, role: p.role,
    custom_role: p.custom_role || '', notes: p.notes || ''
  }));
  state.leadershipSignoffs = {};
  (signoffs || []).forEach(s => {
    state.leadershipSignoffs[s.participant_id + '_' + s.competency_id] = s.status;
  });
  state.leadershipDailyNotes = {};
  (notes || []).forEach(n => { state.leadershipDailyNotes[n.day_num] = n.notes_data || {}; });
  state.leadershipReports = {};
  (reports || []).forEach(r => { state.leadershipReports[r.participant_id] = r; });
  return { data: training };
}

async function dbCreateLeadershipTraining(payload) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: { message: 'No user loaded' } };

  const { data: program, error: programError } = await supabase.from('store_programs').insert({
    franchise_store_name: payload.franchise_store_name,
    certified_training_store_name: payload.certified_training_store_name,
    franchise_owner_name: payload.franchise_owner_name || null,
    franchise_company: payload.franchise_company || null,
    status: 'active',
    created_by: user.id,
    updated_at: new Date().toISOString()
  }).select().single();
  if (programError) return { error: programError };

  const { data: training, error: trainingError } = await supabase.from('leadership_trainings').insert({
    store_program_id: program.id,
    trainer_id: user.id,
    trainer_name: payload.trainer_name,
    start_date: payload.start_date || null,
    current_day: 1,
    status: 'active',
    updated_at: new Date().toISOString()
  }).select().single();
  if (trainingError) return { error: trainingError };

  state.currentStoreProgram = program;
  state.leadershipTraining = training;
  state.currentLeadershipDay = 1;
  state.leadershipParticipants = [];
  state.leadershipSignoffs = {};
  state.leadershipDailyNotes = {};
  state.leadershipReports = {};
  return { data: training };
}

async function dbDeleteLeadershipTraining(trainingId) {
  const { error } = await supabase.from('leadership_trainings').delete().eq('id', trainingId);
  return error || null;
}

async function dbSaveLeadershipCurrentDay(day) {
  if (!state.leadershipTraining) return { message: 'No leadership training loaded' };
  const { error } = await supabase.from('leadership_trainings')
    .update({ current_day: day, updated_at: new Date().toISOString() })
    .eq('id', state.leadershipTraining.id);
  if (!error) { state.leadershipTraining.current_day = day; state.currentLeadershipDay = day; }
  return error || null;
}

async function dbSaveLeadershipFormalSignoff(field, checked, name) {
  if (!state.leadershipTraining) return { message: 'No leadership training loaded' };
  const nameField = field + '_name';
  const atField = field + '_at';
  const now = new Date().toISOString();
  const payload = { [field]: checked, [nameField]: name || '', updated_at: now };
  // Record timestamp only on initial confirmation; preserve it if unchecked/re-checked
  if (checked && !state.leadershipTraining[atField]) payload[atField] = now;
  const { error } = await supabase.from('leadership_trainings')
    .update(payload)
    .eq('id', state.leadershipTraining.id);
  if (!error) Object.assign(state.leadershipTraining, payload);
  return error || null;
}

async function dbSaveLeadershipParticipant(participant) {
  if (!state.leadershipTraining) return { message: 'No leadership training loaded' };
  const payload = {
    leadership_training_id: state.leadershipTraining.id,
    name: participant.name,
    role: participant.role,
    custom_role: participant.custom_role || null,
    notes: participant.notes || null,
    updated_at: new Date().toISOString()
  };
  if (participant.id) payload.id = participant.id;
  const { data, error } = await supabase.from('leadership_participants').upsert(payload, { onConflict: 'id' }).select().single();
  if (error) return { error };
  return { data };
}

async function dbDeleteLeadershipParticipant(participantId) {
  const { error } = await supabase.from('leadership_participants').delete().eq('id', participantId);
  return error || null;
}

async function dbSaveLeadershipSignoff(participantId, competencyId, status, dayNum) {
  if (!state.leadershipTraining) return { message: 'No leadership training loaded' };
  if (status === 'pending') {
    const { error } = await supabase.from('leadership_signoffs')
      .delete().eq('participant_id', participantId).eq('competency_id', competencyId);
    return error || null;
  }
  const { error } = await supabase.from('leadership_signoffs').upsert({
    leadership_training_id: state.leadershipTraining.id,
    participant_id: participantId,
    competency_id: competencyId,
    status: status,
    day_num: dayNum,
    updated_at: new Date().toISOString()
  }, { onConflict: 'participant_id,competency_id' });
  return error || null;
}

async function dbSaveLeadershipDailyNotes(dayNum, notesData) {
  if (!state.leadershipTraining) return { message: 'No leadership training loaded' };
  const { error } = await supabase.from('leadership_daily_notes').upsert({
    leadership_training_id: state.leadershipTraining.id,
    day_num: dayNum,
    notes_data: notesData,
    updated_at: new Date().toISOString()
  }, { onConflict: 'leadership_training_id,day_num' });
  return error || null;
}

async function dbSaveLeadershipReadinessReport(participantId, report) {
  if (!state.leadershipTraining) return { message: 'No leadership training loaded' };
  const { error } = await supabase.from('leadership_readiness_reports').upsert({
    leadership_training_id: state.leadershipTraining.id,
    participant_id: participantId,
    readiness_status: report.readiness_status || null,
    rating_1_to_4: report.rating_1_to_4 || null,
    strengths: report.strengths || null,
    risks: report.risks || null,
    follow_ups: report.follow_ups || null,
    final_notes: report.final_notes || null,
    updated_at: new Date().toISOString()
  }, { onConflict: 'leadership_training_id,participant_id' });
  return error || null;
}

// ============================================================
// SCORECARDS
// ============================================================

async function dbLoadScorecard(openingId) {
  const { data, error } = await supabase
    .from('scorecards')
    .select('*')
    .eq('opening_id', openingId)
    .maybeSingle();
  return { data, error };
}

async function dbSaveScorecard(scorecardData) {
  const { error } = await supabase
    .from('scorecards')
    .upsert({ ...scorecardData, updated_at: new Date().toISOString() }, { onConflict: 'opening_id' });
  return error || null;
}

async function dbLoadAllOpeningsForScorecards() {
  const { data, error } = await supabase
    .from('openings')
    .select('id, store_name, coach_name, start_date, status, current_day')
    .order('created_at', { ascending: false });
  return { data: data || [], error };
}

async function dbLoadAllScorecards() {
  const { data, error } = await supabase.from('scorecards').select('*');
  return { data: data || [], error };
}

async function dbLoadOpeningForScorecard(openingId) {
  const [opening, trainees, signoffs, oscReport, recaps] = await Promise.all([
    supabase.from('openings').select('*').eq('id', openingId).single(),
    supabase.from('trainees').select('*').eq('opening_id', openingId),
    supabase.from('signoffs').select('*').eq('opening_id', openingId),
    supabase.from('osc_reports').select('*').eq('opening_id', openingId).maybeSingle(),
    supabase.from('recaps').select('*').eq('opening_id', openingId).order('day_num')
  ]);
  return {
    opening: opening.data,
    trainees: trainees.data || [],
    signoffs: signoffs.data || [],
    oscReport: oscReport.data || null,
    recaps: recaps.data || [],
    error: opening.error || trainees.error || signoffs.error
  };
}

async function dbLoadAllLeadershipTrainingsForLink() {
  const { data, error } = await supabase
    .from('leadership_trainings')
    .select('id, trainer_name, start_date, store_programs ( franchise_store_name, certified_training_store_name )')
    .order('created_at', { ascending: false });
  return { data: data || [], error };
}

async function dbLoadLeadershipDataForScorecard(trainingId) {
  const { data: lt } = await supabase
    .from('leadership_trainings')
    .select('*, store_programs(*)')
    .eq('id', trainingId)
    .single();
  const [participants, lSignoffs, reports, notes] = await Promise.all([
    supabase.from('leadership_participants').select('*').eq('leadership_training_id', trainingId),
    supabase.from('leadership_signoffs').select('*').eq('leadership_training_id', trainingId),
    supabase.from('leadership_readiness_reports').select('*').eq('leadership_training_id', trainingId),
    supabase.from('leadership_daily_notes').select('*').eq('leadership_training_id', trainingId).order('day_num')
  ]);
  return {
    lt,
    sp: lt?.store_programs || null,
    participants: participants.data || [],
    signoffs: lSignoffs.data || [],
    reports: reports.data || [],
    notes: notes.data || []
  };
}
