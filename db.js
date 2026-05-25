// ============================================================
// DB — all Supabase persistence operations
// ============================================================

async function dbLoadState() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

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

  if (!openings || openings.length === 0) return false;

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

  state.trainees = (trainees || []).map(t => ({ id: t.id, name: t.name, role: t.role }));

  state.signoffs = {};
  (signoffs || []).forEach(s => {
    state.signoffs[s.trainee_id + '_' + s.competency_id] = s.status;
  });

  state.recaps = {};
  (recaps || []).forEach(r => {
    state.recaps[r.day_num] = {
      'ld-topics':    r.ld_topics    || '',
      'ld-team':      r.ld_team      || '',
      'tech':         r.tech         || '',
      'ops':          r.ops          || '',
      'sm':           r.sm_notes     || '',
      'tomorrow':     r.tomorrow     || '',
      'actions':      r.actions      || '',
      'biz-goal':     r.biz_goal     || '',
      'biz-vs-goal':  r.biz_vs_goal  || '',
      'biz-ly':       r.biz_ly       || '',
      'biz-labor':    r.biz_labor    || '',
      'biz-staffing': r.biz_staffing || '',
      'biz-14day':    r.biz_14day    || '',
      'biz-risks':    r.biz_risks    || '',
      'biz-leader':   r.biz_leader   || '',
    };
  });

  state.franchiseChecks = {};
  (fchecks || []).forEach(f => { state.franchiseChecks[f.check_key] = f.checked; });

  return true;
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
    role:       trainee.role
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
  if (!state.openingId) return;
  const r = state.recaps[day] || {};
  const { error } = await supabase.from('recaps').upsert({
    opening_id:   state.openingId,
    day_num:      day,
    ld_topics:    r['ld-topics']    || null,
    ld_team:      r['ld-team']      || null,
    tech:         r['tech']         || null,
    ops:          r['ops']          || null,
    sm_notes:     r['sm']           || null,
    tomorrow:     r['tomorrow']     || null,
    actions:      r['actions']      || null,
    biz_goal:     r['biz-goal']     || null,
    biz_vs_goal:  r['biz-vs-goal']  || null,
    biz_ly:       r['biz-ly']       || null,
    biz_labor:    r['biz-labor']    || null,
    biz_staffing: r['biz-staffing'] || null,
    biz_14day:    r['biz-14day']    || null,
    biz_risks:    r['biz-risks']    || null,
    biz_leader:   r['biz-leader']   || null,
    updated_at:   new Date().toISOString()
  }, { onConflict: 'opening_id,day_num' });
  if (error) console.error('dbSaveRecap:', error);
}

async function dbSaveFranchiseCheck(key, checked) {
  if (!state.openingId) return;
  const { error } = await supabase.from('franchise_checks').upsert({
    opening_id:  state.openingId,
    check_key:   key,
    checked:     checked,
    updated_at:  new Date().toISOString()
  }, { onConflict: 'opening_id,check_key' });
  if (error) console.error('dbSaveFranchiseCheck:', error);
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
