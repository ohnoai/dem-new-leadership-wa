(() => {
  'use strict';
  const C = window.CAMPAIGN, T = window.CAMPAIGN_CONTENT, M = window.ActionModel;
  const $ = id => document.getElementById(id);
  const prefix = `leadership-${C.code.toLowerCase()}`;
  const draftKey = `${prefix}-drafts-v3`, actionKey = `${prefix}-actions-v3`;
  const legacyKey = 'new-leadership-wa-v2';
  const readFailures = new Set(), writeFailures = new Set();
  let draftConflict = false;
  function read(key) {
    try { const value = JSON.parse(localStorage.getItem(key)); readFailures.delete(key); return value; }
    catch { readFailures.add(key); return undefined; }
  }
  const savedDrafts = read(draftKey), savedActions = read(actionKey);
  let lastDraft = JSON.stringify(savedDrafts);
  let state = M.restore(savedDrafts, T.shared, T.concise?.shared);
  let actions = savedActions;
  let pendingActions = {};
  if (!actions || typeof actions !== 'object' || Array.isArray(actions)) actions = {};
  const allOfficials = C.officials;
  const officials = allOfficials.filter(o => o.active !== false);
  const current = () => officials.find(o => o.id === state.selected) || officials[0];
  const ballot = o => Object.hasOwn(o, 'vote') ? o.vote : ['senate', 'house'].includes(o.group) ? o.group : null;
  const normalized = o => ({ ...o, vote: ballot(o) });
  // Preserve exact prototype text, including user-written greetings. Never rewrite it.
  if (savedDrafts !== undefined && !savedDrafts && C.code === 'WA') {
    const legacy = read(legacyKey);
    if (legacy && typeof legacy === 'object') {
      for (const o of allOfficials) {
        const old = legacy.drafts?.[o.group];
        if (old && ['senate', 'house'].includes(o.group)) {
          for (const field of ['subject', 'message']) if (typeof old[field] === 'string') M.edit(state, o, field, old[field]);
        }
        if (['senate', 'house'].includes(o.group) && typeof legacy.callScript?.[o.group] === 'string') M.edit(state, o, 'call', legacy.callScript[o.group]);
        if (typeof legacy.social === 'string') M.edit(state, o, 'social', legacy.social);
        if (state.personal[o.id]) state.personal[o.id].legacyReview = 'Imported prototype text';
        if (savedActions === null && legacy.progress?.[o.id] === true) actions[`${o.id}:letter`] = true;
      }
      if (typeof legacy.district === 'string') state.district = legacy.district;
    }
  }
  // Identify retained older v3 imports without rewriting their text.
  if (savedDrafts && C.code === 'WA') {
    const legacy = read(legacyKey);
    for (const o of officials) {
      const p = state.personal[o.id];
      if (p && !p.legacyReview && ['subject', 'message'].some(field => typeof p[field] === 'string' && p[field] === legacy?.drafts?.[o.group]?.[field])) p.legacyReview = 'Imported prototype text';
      if (p && !p.legacyReview && ((typeof p.call === 'string' && p.call === legacy?.callScript?.[o.group]) || (typeof p.social === 'string' && p.social === legacy?.social))) p.legacyReview = 'Imported prototype text';
    }
  }
  function saveStatus() {
    $('saveStatus').textContent = readFailures.size || writeFailures.size ? 'Not saved. Copy your work.' : draftConflict ? 'Another tab changed this draft.' : 'Saved on this device';
  }
  function persist(key, value) {
    let saved = false;
    try { localStorage.setItem(key, JSON.stringify(value)); writeFailures.delete(key); saved = true; }
    catch { writeFailures.add(key); }
    saveStatus();
    return saved;
  }
  const save = () => {
    try {
      const value = read(draftKey);
      if (value === undefined) { saveStatus(); return; }
      for (const key of [...readFailures]) if (key !== draftKey) read(key);
      if (Object.keys(pendingActions).length && mergeActions() && persist(actionKey, actions)) pendingActions = {};
      // A failed startup read establishes no baseline. Only an actually empty store is safe.
      if (lastDraft === undefined && value === null) lastDraft = 'null';
      const stored = JSON.stringify(value);
      if (stored !== lastDraft) {
        draftConflict = true; saveStatus();
        feedback('Copy any edits in this tab, then reload to use the latest saved draft. This tab will not overwrite it.');
        return;
      }
      draftConflict = false;
      if (persist(draftKey, state)) lastDraft = JSON.stringify(state);
    } catch { writeFailures.add(draftKey); saveStatus(); }
  };
  function feedback(text) { $('feedback').textContent = text; }
  function option(value, text) {
    const el = document.createElement('option'); el.value = value; el.textContent = text; return el;
  }
  for (const [label, matches] of [
    ['Senate Democrats', o => o.group === 'senate'],
    ['House Democrats', o => o.group === 'house'],
    ['Washington Democratic leadership', o => o.group === 'influence']
  ]) {
    const group = document.createElement('optgroup'); group.label = label;
    for (const o of officials.filter(matches)) group.append(option(o.id, `${o.name} · ${o.district}`));
    $('official').append(group);
  }
  for (const o of allOfficials.filter(o => o.group === 'house').sort((a, b) => a.district.localeCompare(b.district))) {
    $('district').append(option(o.district, `${o.district} · ${o.name}`));
  }
  $('edition').textContent = C.state.toUpperCase();
  $('headline').textContent = T.headline;
  $('intro').textContent = T.intro;
  $('heroKicker').textContent = C.kicker || `${C.state.toUpperCase()}. A NEW DIRECTION.`;
  document.title = `${T.name} · ${C.state}`;
  $('districtFinder').href = C.districtFinder || $('districtFinder').href;
  $('districtFinder').textContent = `Open ${C.state} district finder ↗`;
  $('districtMaps').href = C.districtMaps || $('districtMaps').href;
  $('forkLink').href = C.repository || $('forkLink').href;
  for (const source of C.sources) {
    const link = document.createElement('a'); link.textContent = source.name + ' ↗';
    link.href = source.url; link.target = '_blank'; link.rel = 'noopener noreferrer'; $('sources').append(link);
  }
  function renderDraft() {
    const o = normalized(current()), draft = M.draft(state, o, T);
    $('subject').value = draft.subject; $('message').value = draft.message;
    const personal = state.personal[o.id] || {};
    $('letterVersion').value = state.letterVersion || 'full';
    const fields = letterFields();
    const master = M.shared(state, o, T);
    $('sharedSubject').value = master.subject ?? state.shared[fields.subject]; $('sharedMessage').value = master.message ?? state.shared[fields.message];
    $('sharedVersion').textContent = state.letterVersion === 'concise' ? 'Editing the concise master.' : 'Editing the full master.';
    $('draftKind').textContent = typeof personal[fields.message] === 'string' ? 'Personal version' : 'Shared draft';
    $('useShared').hidden = !Object.hasOwn(personal, fields.message) && !Object.hasOwn(personal, fields.subject);
    $('callScript').value = M.call(state, o, T);
    // Sharing may target any network; a published X/Facebook identity is not a universal mention.
    const handle = o.name + ':';
    $('socialText').value = personal.social ?? T.posts?.[o.vote || 'influence']?.replace('[official]', handle) ?? T.social.replace('[handle]', handle).replace('[socialRequest]', o.vote ? 'Use your caucus vote to support a credible alternative.' : 'Use your influence to advocate for change.');
    renderReview(); renderCounts();
  }
  const letterFields = () => state.letterVersion === 'concise' ? { message: 'conciseMessage', subject: 'conciseSubject' } : { message: 'message', subject: 'subject' };
  function renderCounts() {
    const form = current().form || {}, warnings = [];
    for (const field of ['subject', 'message']) {
      const rule = form[field], value = $(field).value;
      const count = rule?.status === 'verified' && rule.newlines === 'crlf' ? value.replace(/\r?\n/g, '\r\n').length : value.length;
      const reported = rule?.status === 'user-reported';
      const limit = (rule?.status === 'verified' || reported) && Number.isInteger(rule.limit) && rule.limit > 0 ? rule.limit : null;
      $(field + 'Count').textContent = `${count.toLocaleString('en-US')}${limit ? ' / ' + limit.toLocaleString('en-US') : ''} characters${limit && reported ? ' (user-reported advisory)' : ''}`;
      if (limit && count > limit) warnings.push(`${field === 'message' ? 'Message' : 'Subject'} exceeds the ${reported ? 'user-reported advisory threshold' : 'verified form limit'} by ${(count - limit).toLocaleString('en-US')} characters.${reported ? ' This threshold is not independently verified; counting on the official form may differ.' : ''}`);
    }
    $('limitWarning').hidden = !warnings.length;
    $('limitWarning').textContent = warnings.length ? warnings.join(' ') + ' Edit this version or choose the concise alternative. Nothing has been shortened.' : '';
  }
  const reviewSnapshot = () => JSON.stringify([state.channel, $('subject').value, $('message').value, $('callScript').value, $('socialText').value]);
  function renderReview() {
    const p = state.personal[current().id];
    $('recipientReview').hidden = !p?.legacyReview;
    $('reviewExplanation').textContent = `Imported draft: review the greeting, names and request for ${current().name}. Original text was preserved and may name a different recipient.`;
    $('reviewedRecipient').checked = !!p?.reviewed && p.reviewed === reviewSnapshot();
  }
  function allowReviewedAction() {
    if (!$('recipientReview').hidden && !$('reviewedRecipient').checked) {
      feedback('Review the imported text for this official before copying, opening or sharing.');
      $('reviewedRecipient').focus(); return false;
    }
    return true;
  }
  $('reviewedRecipient').onchange = () => { M.edit(state, current(), 'reviewed', $('reviewedRecipient').checked ? reviewSnapshot() : ''); save(); };
  const actionId = () => `${current().id}:${state.channel}`;
  function renderProgress() {
    const count = officials.reduce((sum, o) => sum + ['letter', 'call', 'social'].filter(channel => actions[`${o.id}:${channel}`] === true).length, 0);
    const total = officials.length * 3;
    $('progressText').textContent = `${count} / ${total} actions`;
    $('progressBar').style.width = `${count / total * 100}%`;
    $('completed').checked = actions[actionId()] === true;
  }
  function render() {
    const o = current(), vote = ballot(o);
    state.selected = o.id;
    $('official').value = o.id; $('district').value = state.district;
    for (const [field, id] of Object.entries({ name: 'detailName', city: 'detailCity', county: 'detailCounty', zip: 'detailZip' })) $(id).value = state.details[field] || '';
    renderDistrict();
    $('officialName').textContent = o.name;
    $('officialRole').textContent = `${o.office} · ${o.district}${o.party ? ' · ' + o.party : ''}`;
    $('voteBadge').textContent = vote ? `Direct ${vote === 'senate' ? 'Senate' : 'House'} caucus vote` : 'Indirect influence';
    $('voteBadge').classList.toggle('indirect', !vote);
    $('voteDescription').textContent = vote ? `Ask for a leadership change in the ${vote === 'senate' ? 'Senate' : 'House'} Democratic caucus.` : 'No vote in Democratic congressional leadership elections. Ask this office to use its influence.';
    $('channel').value = state.channel;
    for (const channel of ['letter', 'call', 'social']) $(channel + 'Panel').hidden = state.channel !== channel;
    $('contactLink').href = o.website;
    $('contactHelp').textContent = 'Copy, open the official form, paste, and submit there. Nothing is sent from this site.' + (o.group === 'house' ? ' House offices generally accept messages only from their own constituents.' : '');
    $('formCompatibility').textContent = o.form?.note || 'Form limits are unverified. Check the official page before sending; no limit is assumed here.';
    const subject = o.form?.subject;
    const noTextSubject = subject?.status === 'verified' && ['absent', 'category'].includes(subject.control);
    $('copySubject').hidden = noTextSubject;
    $('subjectHelp').hidden = !noTextSubject;
    $('subjectHelp').textContent = noTextSubject ? subject.help : '';
    $('phoneLink').hidden = !o.phone;
    if (o.phone) { $('phoneLink').href = 'tel:+1' + o.phone.replace(/\D/g, '').replace(/^1(?=\d{10}$)/, ''); $('phoneLink').textContent = 'Call ' + o.phone; }
    $('phoneNote').textContent = o.phone ? 'Calls open your phone app. You decide whether to place the call.' : 'No verified direct phone number is listed. Use the official contact page instead.';
    $('socialProfile').hidden = !o.social;
    if (o.social) $('socialProfile').href = o.social;
    $('sharedSubject').value = state.shared.subject; $('sharedMessage').value = state.shared.message;
    renderDraft(); renderProgress(); saveStatus();
  }
  function select(id, moveFocus = false) {
    state.selected = id; feedback(''); render(); save();
    if (moveFocus) { $('official').focus({ preventScroll: true }); $('action').scrollIntoView({ block: 'start' }); }
  }
  $('official').onchange = () => select($('official').value);
  function renderDistrict() {
    const office = allOfficials.find(o => o.group === 'house' && o.district === state.district);
    $('districtNotice').hidden = !office || office.active !== false;
    $('districtNotice').textContent = office?.active === false ? `${office.district} is represented by ${office.name}, a Republican who cannot vote in Democratic leadership elections. Contact Senators Patty Murray and Maria Cantwell, or Washington Democratic leadership, instead. Any older drafts and action history for this office stay saved but are not counted in campaign progress.` : '';
  }
  $('district').onchange = () => {
    state.district = $('district').value;
    const o = officials.find(o => o.group === 'house' && o.district === state.district);
    if (o) { $('districtDetails').open = false; select(o.id, true); } else { select('murray'); renderDistrict(); }
  };
  $('channel').onchange = () => { state.channel = $('channel').value; feedback(''); render(); save(); };
  $('letterVersion').onchange = () => { state.letterVersion = $('letterVersion').value; feedback(''); renderDraft(); save(); };
  for (const field of ['subject', 'message']) $(field).oninput = () => {
    M.editDisplayed(state, normalized(current()), field, $(field).value, T); save();
    $('draftKind').textContent = Object.hasOwn(state.personal[current().id], letterFields().message) ? 'Personal version' : 'Shared draft';
    $('useShared').hidden = false;
    renderReview(); renderCounts();
  };
  for (const [id, field] of [['callScript', 'call'], ['socialText', 'social']]) $(id).oninput = () => { M.editDisplayed(state, normalized(current()), field, $(id).value, T); renderReview(); save(); };
  for (const [id, field] of [['sharedSubject', 'subject'], ['sharedMessage', 'message']]) $(id).oninput = () => {
    if (state.legacyShared) state.shared[letterFields()[field]] = $(id).value;
    else { const key = M.sharedKey(state, normalized(current())); state.categoryShared[key] = { ...state.categoryShared[key], [field]: $(id).value }; }
    renderDraft(); save();
  };
  for (const [field, id] of Object.entries({ name: 'detailName', city: 'detailCity', county: 'detailCounty', zip: 'detailZip' })) $(id).oninput = () => { state.details[field] = $(id).value; renderDraft(); save(); };
  $('useShared').onclick = () => { const p = state.personal[current().id], fields = letterFields(); delete p[fields.message]; delete p[fields.subject]; renderDraft(); save(); feedback('This recipient now uses the shared draft for this version.'); };
  function mergeActions() {
    const latest = read(actionKey);
    if (latest === undefined) { actions = { ...actions, ...pendingActions }; saveStatus(); return false; }
    actions = { ...(latest && typeof latest === 'object' && !Array.isArray(latest) ? latest : {}), ...pendingActions };
    return true;
  }
  $('completed').onchange = () => {
    pendingActions[actionId()] = $('completed').checked;
    if (mergeActions() && persist(actionKey, actions)) pendingActions = {};
    renderProgress();
  };
  $('nextOfficial').onclick = () => { const index = officials.findIndex(o => o.id === current().id); select(officials[(index + 1) % officials.length].id, true); };
  function captureAction(id) {
    const field = $(id), text = field.value, selected = state.selected, channel = state.channel, source = state;
    return { field, text, isCurrent: () => state === source && state.selected === selected && state.channel === channel && field.value === text };
  }
  async function copy(id, context) {
    if (!context && !allowReviewedAction()) return;
    context = context || captureAction(id);
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(context.text);
      if (context.isCurrent()) feedback('Copied. Ready to paste.');
    } catch {
      if (!context.isCurrent()) return;
      context.field.focus(); context.field.select();
      feedback('Clipboard unavailable. Text selected; use your device’s Copy command.');
    }
  }
  for (const [button, field] of [['copySubject', 'subject'], ['copyMessage', 'message'], ['copyCall', 'callScript'], ['copySocial', 'socialText']]) $(button).onclick = () => copy(field);
  $('sharePost').onclick = async () => {
    if (!allowReviewedAction()) return;
    const context = captureAction('socialText');
    if (!navigator.share) { await copy('socialText', context); return; }
    try { await navigator.share({ text: context.text }); if (context.isCurrent()) feedback('Share dialog closed. Mark complete only if you posted.'); }
    catch (error) { if (error.name !== 'AbortError') { await copy('socialText', context); } }
  };
  // Save synchronously before navigation, including mobile tab/app switches.
  for (const id of ['contactLink', 'phoneLink', 'socialProfile']) $(id).addEventListener('click', event => { if (!allowReviewedAction()) event.preventDefault(); else save(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
  window.addEventListener('pagehide', save);
  // Other tabs never silently overwrite unsaved-in-memory work. Progress is independent.
  window.addEventListener('storage', event => {
    if (event.key === actionKey) {
      if (event.newValue === null && event.oldValue !== null) { pendingActions = {}; actions = {}; state = M.create(T.shared, T.concise?.shared); lastDraft = 'null'; draftConflict = false; readFailures.clear(); writeFailures.clear(); render(); saveStatus(); }
      else mergeActions();
      renderProgress();
    }
    if (event.key === draftKey && event.newValue === null && event.oldValue !== null) {
      state = M.create(T.shared, T.concise?.shared); lastDraft = 'null'; draftConflict = false; render();
      feedback('Local details and drafts erased in another tab.');
    } else if (event.key === draftKey) feedback('Drafts changed in another tab. This tab keeps its current version; reload to use the other version.');
  });
  $('erase').onclick = () => { $('eraseConfirm').hidden = false; $('confirmErase').focus(); };
  $('cancelErase').onclick = () => { $('eraseConfirm').hidden = true; $('erase').focus(); };
  $('confirmErase').onclick = () => {
    try {
      localStorage.removeItem(legacyKey);
      // Create then remove an empty action record so other tabs receive an erase event even if no actions were saved.
      localStorage.setItem(actionKey, '{}');
      for (const key of [draftKey, actionKey]) localStorage.removeItem(key);
      lastDraft = 'null'; state = M.create(T.shared, T.concise?.shared); actions = {}; pendingActions = {}; readFailures.clear(); writeFailures.clear(); draftConflict = false; render(); $('eraseConfirm').hidden = true; feedback('Local drafts and actions erased.');
    }
    catch { writeFailures.add(draftKey); saveStatus(); feedback('Unable to erase browser storage. Use browser settings.'); }
  };
  render();
  if (!savedDrafts && C.code === 'WA' && Object.keys(state.personal).length) {
    save();
    if (savedActions === null) persist(actionKey, actions);
  }
})();