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

  state.trainees = (trainees || []).map(t => ({ id: t.id, name: t.name, role: t.role }));

  state.signoffs = {};
  (signoffs || []).forEach(s => {
    state.signoffs[s.trainee_id + '_' + s.competency_id] = s.status;
  });

  state.recaps = {};
  (recaps || []).forEach(r => {
    state.recaps[r.day_num] = r.recap_data || {};
  });

  state.franchiseChecks = {};
  (fchecks || []).forEach(f => { state.franchiseChecks[f.check_key] = f.checked; });

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
    .single();
  // PGRST116 = "no rows found" — not an error
  if (error && error.code !== 'PGRST116') { console.error('dbLoadOSCReport:', error); return; }
  state.oscReport = data || {};
}

async function dbSaveOSCReport(report) {
  if (!state.openingId) return { message: 'No opening loaded' };
  const { error } = await supabase.from('osc_reports').upsert({
    opening_id:            state.openingId,
    ff_headcount:          report.ff_headcount,
    weekend_bookings:      report.weekend_bookings,
    t1_ticket_count:       report.t1_ticket_count,
    tech_type:             report.tech_type,
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
