(() => {
  'use strict';
  const C = window.CAMPAIGN, T = window.CAMPAIGN_CONTENT, M = window.ActionModel;
  const $ = id => document.getElementById(id);
  const prefix = `leadership-${C.code.toLowerCase()}`;
  const draftKey = `${prefix}-drafts-v3`, actionKey = `${prefix}-actions-v3`;
  const legacyKey = 'new-leadership-wa-v2';
  let storageFailed = false;
  function read(key) {
    try { return JSON.parse(localStorage.getItem(key)); }
    catch { storageFailed = true; return null; }
  }
  const savedDrafts = read(draftKey), savedActions = read(actionKey);
  let lastDraft = JSON.stringify(savedDrafts);
  let state = M.restore(savedDrafts, T.shared);
  let actions = savedActions;
  let pendingActions = {};
  if (!actions || typeof actions !== 'object' || Array.isArray(actions)) actions = {};
  const officials = C.officials;
  const current = () => officials.find(o => o.id === state.selected) || officials[0];
  const ballot = o => Object.hasOwn(o, 'vote') ? o.vote : ['senate', 'house'].includes(o.group) ? o.group : null;
  const normalized = o => ({ ...o, vote: ballot(o) });
  // Preserve exact prototype text, including user-written greetings. Never rewrite it.
  if (!savedDrafts && C.code === 'WA') {
    const legacy = read(legacyKey);
    if (legacy && typeof legacy === 'object') {
      for (const o of officials) {
        const old = legacy.drafts?.[o.group];
        if (old && ['senate', 'house'].includes(o.group)) {
          for (const field of ['subject', 'message']) if (typeof old[field] === 'string') M.edit(state, o, field, old[field]);
        }
        if (['senate', 'house'].includes(o.group) && typeof legacy.callScript?.[o.group] === 'string') M.edit(state, o, 'call', legacy.callScript[o.group]);
        if (typeof legacy.social === 'string') M.edit(state, o, 'social', legacy.social);
        if (!savedActions && legacy.progress?.[o.id] === true) actions[`${o.id}:letter`] = true;
      }
      if (typeof legacy.district === 'string') state.district = legacy.district;
    }
  }
  function saveStatus() {
    $('saveStatus').textContent = storageFailed ? 'Not saved. Copy your work.' : 'Saved on this device';
  }
  function persist(key, value) {
    let saved = false;
    try { localStorage.setItem(key, JSON.stringify(value)); saved = true; }
    catch { storageFailed = true; }
    saveStatus();
    return saved;
  }
  const save = () => {
    try {
      const stored = JSON.stringify(read(draftKey));
      if (stored !== lastDraft) {
        $('saveStatus').textContent = 'Another tab changed this draft.';
        feedback('Copy any edits in this tab, then reload to use the latest saved draft. This tab will not overwrite it.');
        return;
      }
      persist(draftKey, state);
      if (!storageFailed) lastDraft = JSON.stringify(state);
    } catch { storageFailed = true; saveStatus(); }
  };
  function feedback(text) { $('feedback').textContent = text; }
  function option(value, text) {
    const el = document.createElement('option'); el.value = value; el.textContent = text; return el;
  }
  for (const [label, matches] of [
    ['U.S. senators', o => o.group === 'senate'],
    ['U.S. representatives', o => o.group === 'house'],
    ['State & party influence', o => o.group === 'influence']
  ]) {
    const group = document.createElement('optgroup'); group.label = label;
    for (const o of officials.filter(matches)) group.append(option(o.id, `${o.name} · ${o.district}`));
    $('official').append(group);
  }
  for (const o of officials.filter(o => o.group === 'house').sort((a, b) => a.district.localeCompare(b.district))) {
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
    $('draftKind').textContent = typeof personal.message === 'string' ? 'Personal version' : 'Shared draft';
    $('useShared').hidden = !Object.hasOwn(personal, 'message') && !Object.hasOwn(personal, 'subject');
    $('callScript').value = personal.call ?? T.call.replace('[official]', o.name).replace('[request]', T.requests[o.vote || 'influence']);
    // Sharing may target any network; a published X/Facebook identity is not a universal mention.
    const handle = o.name + ':';
    $('socialText').value = personal.social ?? T.social.replace('[handle]', handle).replace('[socialRequest]', o.vote ? 'Use your caucus vote to support a credible alternative.' : 'Use your influence to advocate for change.');
  }
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
    $('officialName').textContent = o.name;
    $('officialRole').textContent = `${o.office} · ${o.district}${o.party ? ' · ' + o.party : ''}`;
    $('voteBadge').textContent = vote ? `Direct ${vote === 'senate' ? 'Senate' : 'House'} caucus vote` : 'Indirect influence';
    $('voteBadge').classList.toggle('indirect', !vote);
    $('voteDescription').textContent = vote ? `Ask for a leadership change in the ${vote === 'senate' ? 'Senate' : 'House'} Democratic caucus.` : 'No vote in Democratic congressional leadership elections. Ask this office to use its influence.';
    $('channel').value = state.channel;
    for (const channel of ['letter', 'call', 'social']) $(channel + 'Panel').hidden = state.channel !== channel;
    $('contactLink').href = o.website;
    $('contactHelp').textContent = 'Copy, open the official form, paste, and submit there. Nothing is sent from this site.' + (o.group === 'house' ? ' House offices generally accept messages only from their own constituents.' : '') + (o.limit ? ` This office lists a ${o.limit.toLocaleString()}-character limit. Edit to fit; text is never truncated here.` : '');
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
  $('district').onchange = () => {
    state.district = $('district').value;
    const o = officials.find(o => o.group === 'house' && o.district === state.district);
    if (o) { $('districtDetails').open = false; select(o.id, true); } else save();
  };
  $('channel').onchange = () => { state.channel = $('channel').value; feedback(''); render(); save(); };
  for (const field of ['subject', 'message']) $(field).oninput = () => {
    M.edit(state, current(), field, $(field).value); save();
    $('draftKind').textContent = Object.hasOwn(state.personal[current().id], 'message') ? 'Personal version' : 'Shared draft';
    $('useShared').hidden = false;
  };
  for (const [id, field] of [['callScript', 'call'], ['socialText', 'social']]) $(id).oninput = () => { M.edit(state, current(), field, $(id).value); save(); };
  for (const [id, field] of [['sharedSubject', 'subject'], ['sharedMessage', 'message']]) $(id).oninput = () => { state.shared[field] = $(id).value; renderDraft(); save(); };
  $('useShared').onclick = () => { const p = state.personal[current().id]; delete p.message; delete p.subject; renderDraft(); save(); feedback('This recipient now uses the shared draft.'); };
  function mergeActions() {
    const latest = read(actionKey);
    actions = { ...(latest && typeof latest === 'object' && !Array.isArray(latest) ? latest : {}), ...pendingActions };
  }
  $('completed').onchange = () => {
    pendingActions[actionId()] = $('completed').checked;
    mergeActions();
    if (persist(actionKey, actions)) pendingActions = {};
    renderProgress();
  };
  $('nextOfficial').onclick = () => { const index = officials.findIndex(o => o.id === current().id); select(officials[(index + 1) % officials.length].id, true); };
  async function copy(id) {
    const field = $(id);
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(field.value); feedback('Copied. Ready to paste.');
    } catch {
      field.focus(); field.select();
      feedback('Clipboard unavailable. Text selected; use your device’s Copy command.');
    }
  }
  for (const [button, field] of [['copySubject', 'subject'], ['copyMessage', 'message'], ['copyCall', 'callScript'], ['copySocial', 'socialText']]) $(button).onclick = () => copy(field);
  $('sharePost').onclick = async () => {
    if (!navigator.share) { await copy('socialText'); return; }
    try { await navigator.share({ text: $('socialText').value }); feedback('Share dialog closed. Mark complete only if you posted.'); }
    catch (error) { if (error.name !== 'AbortError') { await copy('socialText'); } }
  };
  // Save synchronously before navigation, including mobile tab/app switches.
  $('contactLink').addEventListener('click', save);
  document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
  window.addEventListener('pagehide', save);
  // Other tabs never silently overwrite unsaved-in-memory work. Progress is independent.
  window.addEventListener('storage', event => {
    if (event.key === actionKey) { mergeActions(); renderProgress(); }
    if (event.key === draftKey) feedback('Drafts changed in another tab. This tab keeps its current version; reload to use the other version.');
  });
  $('erase').onclick = () => { $('eraseConfirm').hidden = false; $('confirmErase').focus(); };
  $('cancelErase').onclick = () => { $('eraseConfirm').hidden = true; $('erase').focus(); };
  $('confirmErase').onclick = () => {
    try { for (const key of [draftKey, actionKey, legacyKey]) localStorage.removeItem(key); lastDraft = 'null'; state = M.create(T.shared); actions = {}; pendingActions = {}; storageFailed = false; render(); $('eraseConfirm').hidden = true; feedback('Local drafts and actions erased.'); }
    catch { storageFailed = true; saveStatus(); feedback('Unable to erase browser storage. Use browser settings.'); }
  };
  render();
  if (!savedDrafts && C.code === 'WA' && Object.keys(state.personal).length) {
    save();
    if (!savedActions) persist(actionKey, actions);
  }
})();