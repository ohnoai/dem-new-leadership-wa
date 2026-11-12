(() => {
  'use strict';
  const C = window.CAMPAIGN, T = window.CAMPAIGN_CONTENT, M = window.ActionModel, Z = window.CAMPAIGN_ZIPS || { zips: {} };
  const $ = id => document.getElementById(id);

  // ---- Storage, migration and cross-tab safety (unchanged from the previous interface) ----
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
  // Only a problem is shown; a working save needs no message.
  function saveStatus() {
    const text = readFailures.size || writeFailures.size ? 'Not saved. Copy your work.' : draftConflict ? 'Another tab changed this draft. Copy any edits here, then reload.' : '';
    $('saveStatus').textContent = text; $('saveStatus').hidden = !text;
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
  function mergeActions() {
    const latest = read(actionKey);
    if (latest === undefined) { actions = { ...actions, ...pendingActions }; saveStatus(); return false; }
    actions = { ...(latest && typeof latest === 'object' && !Array.isArray(latest) ? latest : {}), ...pendingActions };
    return true;
  }

  // ---- Small helpers ----
  function feedback(text) {
    const el = $('feedback'); el.textContent = text; el.classList.toggle('show', !!text);
    clearTimeout(feedback.timer); if (text) feedback.timer = setTimeout(() => el.classList.remove('show'), 4000);
  }
  const channels = ['letter', 'call', 'social'];
  const contacted = o => channels.some(channel => actions[`${o.id}:${channel}`] === true);
  const house = allOfficials.filter(o => o.group === 'house').sort((a, b) => a.district.localeCompare(b.district));
  const districtName = n => `${Z.state || C.code}-${String(n).padStart(2, '0')}`;
  const repFor = district => house.find(o => o.district === district);
  const districtChosen = () => !!repFor(state.district);
  // Your officials: both senators, your own House member if a Democrat, then state leadership.
  function myList() {
    const rep = officials.find(o => o.group === 'house' && o.district === state.district);
    return [...officials.filter(o => o.group === 'senate'), ...(rep ? [rep] : []), ...officials.filter(o => o.group === 'influence')];
  }
  function current() {
    const list = myList();
    return list.find(o => o.id === state.selected) || list.find(o => !contacted(o)) || list[0];
  }
  const letterFields = () => state.letterVersion === 'concise' ? { message: 'conciseMessage', subject: 'conciseSubject' } : { message: 'message', subject: 'subject' };
  function socialText(st, o) {
    const n = normalized(o), handle = o.name + ':';
    // Sharing may target any network; a published X/Facebook identity is not a universal mention.
    return st.personal[o.id]?.social ?? T.posts?.[n.vote || 'influence']?.replace('[official]', handle) ?? T.social.replace('[handle]', handle).replace('[socialRequest]', n.vote ? 'Use your caucus vote to support a credible alternative.' : 'Use your influence to advocate for change.');
  }
  // The text shown for an official and channel; the same model calls as before, so wording is unchanged.
  function texts(st, o) {
    const n = normalized(o), d = M.draft(st, n, T);
    return { subject: d.subject, letter: d.message, call: M.call(st, n, T), social: socialText(st, o) };
  }
  const shown = (o = current()) => texts(state, o)[state.channel];
  const editFields = channel => channel === 'letter' ? Object.values(letterFields()) : [channel];
  // A copy of state with this channel's personal edits removed: the original text.
  function withoutEdits(o, channel) {
    const st = { ...state, personal: { ...state.personal }, bindings: { ...state.bindings } };
    const p = { ...st.personal[o.id] }, b = { ...st.bindings[o.id] };
    for (const field of editFields(channel)) { delete p[field]; delete b[field]; }
    st.personal[o.id] = p; st.bindings[o.id] = b;
    return st;
  }

  // ---- Static copy ----
  $('edition').textContent = C.state.toUpperCase();
  $('headline').textContent = T.headline;
  $('intro').textContent = T.intro;
  $('heroKicker').textContent = C.kicker || `${C.state.toUpperCase()}. A NEW DIRECTION.`;
  $('howLine').textContent = T.howItWorks || '';
  document.title = `${T.name} · ${C.state}`;
  $('districtFinder').href = C.districtFinder || $('districtFinder').href;
  $('forkLink').href = C.repository || $('forkLink').href;
  $('finishTitle').textContent = T.finish?.title || 'Thank you.';
  $('finishMessage').textContent = T.finish?.message || '';
  for (const source of C.sources) {
    const link = document.createElement('a'); link.textContent = source.name + ' ↗';
    link.href = source.url; link.target = '_blank'; link.rel = 'noopener noreferrer'; $('sources').append(link);
  }

  // ---- Steps ----
  let step = districtChosen() ? 3 : 1, forcePick = false, reviewing = false, celebrated = false;
  const detailInputs = { name: 'detailName', city: 'detailCity', county: 'detailCounty', zip: 'detailZip' };
  const zip5 = () => (state.details.zip || '').replace(/\D/g, '').slice(0, 5);
  function setSteps() {
    const states = step === 1 ? ['active', districtChosen() ? 'done' : 'locked', districtChosen() ? 'done' : 'locked']
      : step === 2 ? ['done', 'active', 'locked'] : ['done', 'done', 'active'];
    states.forEach((s, i) => { $('s' + (i + 1)).dataset.state = s; });
  }
  function focusStep(n) { $('h' + n + 't').focus({ preventScroll: true }); $('s' + n).scrollIntoView({ block: 'start' }); }
  function renderSummaries() {
    const d = state.details, county = (d.county || '').trim();
    const parts = [d.name, d.city, county && (/county$/i.test(county) ? county : county + ' County'), d.zip].map(v => (v || '').trim()).filter(Boolean);
    $('sum1').textContent = parts.length ? '✓ ' + parts.join(' · ') : 'Skipped. Letters will end with [Your name].';
    const rep = repFor(state.district);
    $('sum2').textContent = !rep ? '' : rep.active !== false ? `✓ ${rep.district} · ${rep.name}` : `✓ ${rep.district} · ${rep.name}, a Republican, so not on your list`;
  }
  function choiceButton(rep) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'btn choice'; b.dataset.district = rep.district;
    b.textContent = `${rep.district} · ${rep.name}`;
    if (rep.active === false) { const s = document.createElement('span'); s.textContent = 'Republican'; b.append(' ', s); }
    return b;
  }
  function renderDistrictStep() {
    const zip = zip5(), hits = /^\d{5}$/.test(zip) ? Z.zips[zip] : null;
    const single = !forcePick && hits?.length === 1 && repFor(districtName(hits[0]));
    $('districtMatch').hidden = $('confirmDistrict').hidden = $('otherDistrict').hidden = !single;
    $('districtChoices').hidden = $('districtLead').hidden = !!single;
    $('finderLead').textContent = single ? 'Live near a district line?' : 'Not sure?';
    $('districtFinder').textContent = single ? 'Check your exact address ↗' : "Look up your exact address on the state's district finder ↗";
    if (single) {
      const rep = repFor(districtName(hits[0]));
      $('matchLabel').textContent = `ZIP ${zip} is most likely ${rep.district}. Your representative:`;
      $('matchName').textContent = rep.name + (rep.active === false ? ' (Republican)' : '');
      $('confirmDistrict').dataset.district = rep.district;
      return;
    }
    const multi = !forcePick && hits?.length > 1;
    $('districtLead').textContent = multi ? `ZIP ${zip} crosses a district line. Which one is yours?` : zip && !hits && !forcePick ? `We couldn't match ZIP ${zip}. Pick your district.` : 'Pick your district.';
    const reps = multi ? hits.map(n => repFor(districtName(n))).filter(Boolean) : house;
    $('districtChoices').replaceChildren(...reps.map(choiceButton));
  }
  function pickDistrict(district) {
    state.district = district; forcePick = false; reviewing = false;
    const list = myList();
    if (!list.some(o => o.id === state.selected)) state.selected = (list.find(o => !contacted(o)) || list[0]).id;
    save(); step = 3; render(); focusStep(3);
  }
  $('done1').onclick = () => {
    const hits = Z.zips[zip5()];
    // Keep a chosen district when the ZIP still fits it (or there is no usable ZIP); otherwise ask again.
    const keep = districtChosen() && (!hits || hits.some(n => districtName(n) === state.district));
    forcePick = false; step = keep ? 3 : 2; save(); render(); focusStep(step);
  };
  $('confirmDistrict').onclick = () => pickDistrict($('confirmDistrict').dataset.district);
  $('districtChoices').onclick = event => { const b = event.target.closest('[data-district]'); if (b) pickDistrict(b.dataset.district); };
  $('pickOther').onclick = () => { forcePick = true; renderDistrictStep(); $('districtChoices').querySelector('button')?.focus(); };
  for (const b of document.querySelectorAll('[data-change]')) b.onclick = () => { step = +b.dataset.change; forcePick = false; render(); focusStep(step); };
  for (const [field, id] of Object.entries(detailInputs)) $(id).oninput = () => { state.details[field] = $(id).value; save(); };

  // ---- Step 3: one official at a time ----
  // "I sent it!" unlocks once the official's form, phone or profile has been opened for this channel (or, with no
  // link to open, once the text is copied). Kept for this browser session only: official IDs and channels, no text.
  const openedKey = `${prefix}-opened`;
  const opened = new Set((() => { try { const v = JSON.parse(sessionStorage.getItem(openedKey)); return Array.isArray(v) ? v : []; } catch { return []; } })());
  function markOpened(o = current(), channel = state.channel) {
    opened.add(`${o.id}:${channel}`);
    try { sessionStorage.setItem(openedKey, JSON.stringify([...opened])); } catch {}
    if (current() === o && state.channel === channel) renderConsole();
  }
  const unlocked = (o = current()) => opened.has(`${o.id}:${state.channel}`) || actions[`${o.id}:${state.channel}`] === true;
  function renderProgress() {
    const list = myList(), count = list.filter(contacted).length;
    $('progress').hidden = !districtChosen();
    $('progressText').replaceChildren(`${count} / ${list.length} `, Object.assign(document.createElement('span'), { className: 'pc', textContent: 'contacted' }));
    $('progressBar').style.width = `${list.length ? count / list.length * 100 : 0}%`;
  }
  const reviewSnapshot = () => { const t = texts(state, current()); return JSON.stringify([state.channel, t.subject, t.letter, t.call, t.social]); };
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
  // Warn only when edited text passes a verified or user-reported form limit. Nothing is ever shortened.
  function renderLimit(o, t) {
    const warnings = [];
    if (state.channel === 'letter') for (const field of ['subject', 'message']) {
      const rule = o.form?.[field], value = field === 'message' ? t.letter : t.subject;
      const reported = rule?.status === 'user-reported';
      const limit = (rule?.status === 'verified' || reported) && Number.isInteger(rule.limit) && rule.limit > 0 ? rule.limit : null;
      const count = rule?.status === 'verified' && rule.newlines === 'crlf' ? value.replace(/\r?\n/g, '\r\n').length : value.length;
      if (limit && count > limit) warnings.push(`This ${field} is ${count.toLocaleString('en-US')} characters; this office's form takes about ${limit.toLocaleString('en-US')}${reported ? ' (reported by a user, not verified)' : ''}. Shorten your edit or use Concise.`);
    }
    $('limitWarning').hidden = !warnings.length; $('limitWarning').textContent = warnings.join(' ');
  }
  function renderConsole() {
    const list = myList(), o = current(), n = list.length, i = list.indexOf(o), all = list.every(contacted);
    state.selected = o.id;
    $('console').hidden = all && !reviewing; $('finish').hidden = !all || reviewing;
    if (all && !reviewing) { if (!celebrated) { celebrated = true; window.celebrate?.(); } return; }
    const t = texts(state, o), channel = state.channel;
    $('position').textContent = `Contacting ${i + 1} of ${n}`;
    $('officialName').textContent = o.name;
    $('officialRole').textContent = o.office + (o.group === 'house' ? ' · ' + o.district : '');
    $('previousOfficial').disabled = i <= 0; $('nextOfficial').disabled = i >= n - 1;
    for (const b of document.querySelectorAll('[data-channel]')) b.setAttribute('aria-pressed', String(b.dataset.channel === channel));
    for (const b of document.querySelectorAll('[data-version]')) b.setAttribute('aria-pressed', String(b.dataset.version === (state.letterVersion || 'full')));
    $('letterVersion').hidden = $('subjectRow').hidden = channel !== 'letter';
    const subject = o.form?.subject, noTextSubject = channel === 'letter' && subject?.status === 'verified' && ['absent', 'category'].includes(subject.control);
    $('subjectText').textContent = t.subject;
    $('copySubject').hidden = noTextSubject;
    $('subjectHelp').hidden = !noTextSubject; $('subjectHelp').textContent = noTextSubject ? subject.help : '';
    $('textLabel').textContent = { letter: `Your letter (${state.letterVersion === 'concise' ? 'concise' : 'full'})`, call: 'Your call script', social: 'Your post' }[channel];
    $('preview').textContent = t[channel];
    $('copyText').textContent = { letter: 'Copy letter', call: 'Copy script', social: 'Copy post' }[channel];
    const link = $('contactLink'), phone = o.phone ? '+1' + o.phone.replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '') : '';
    const target = { letter: o.website, call: phone && 'tel:' + phone, social: o.social }[channel];
    link.hidden = !target;
    if (target) { link.href = target; link.textContent = { letter: 'Open contact form ↗', call: 'Call ' + o.phone, social: 'Open their profile ↗' }[channel]; }
    if (channel === 'call') link.removeAttribute('target'); else link.target = '_blank';
    const how = {
      letter: ['Copy your letter', 'Open their contact form', 'Paste it into their form and send it there.', "This site doesn't send anything."],
      call: ['Copy your script, or keep it on screen', 'Call their office', 'Read your script when someone answers.', "This site doesn't call for you."],
      social: ['Copy your post', target ? 'Open their profile' : 'Open your social app', 'Paste it and post it there.', "This site doesn't post anything."]
    }[channel];
    $('howCopy').textContent = how[0]; $('howOpen').textContent = how[1]; $('howSend').textContent = how[2]; $('howNote').textContent = how[3];
    const left = list.filter(x => !contacted(x) && x !== o).length, ready = unlocked(o);
    $('sent').textContent = `I sent it! ${left ? 'Next official' : 'Finish'} →`;
    $('sent').setAttribute('aria-disabled', String(!ready));
    $('sentHint').textContent = ready ? '' : target ? { letter: 'Open their form first (step 2).', call: 'Call them first (step 2).', social: 'Open their profile first (step 2).' }[channel] : 'Copy your post first (step 1).';
    $('officialList').replaceChildren(...list.map(x => {
      const li = document.createElement('li'); li.className = contacted(x) ? 'done' : '';
      li.textContent = (contacted(x) ? '✓ ' : '') + x.name; if (x === o) li.setAttribute('aria-current', 'true');
      return li;
    }));
    renderReview(); renderLimit(o, t);
  }
  function render() {
    for (const [field, id] of Object.entries(detailInputs)) $(id).value = state.details[field] || '';
    if (step > 1 && step !== 2 && !districtChosen()) step = 2;
    setSteps(); renderSummaries(); renderProgress();
    if (step === 2) renderDistrictStep();
    if (step === 3) renderConsole();
    saveStatus();
  }
  function select(id) { state.selected = id; feedback(''); save(); renderConsole(); }
  $('previousOfficial').onclick = () => { const list = myList(); select(list[Math.max(0, list.indexOf(current()) - 1)].id); };
  $('nextOfficial').onclick = () => { const list = myList(); select(list[Math.min(list.length - 1, list.indexOf(current()) + 1)].id); };
  for (const b of document.querySelectorAll('[data-channel]')) b.onclick = () => { state.channel = b.dataset.channel; feedback(''); save(); renderConsole(); };
  for (const b of document.querySelectorAll('[data-version]')) b.onclick = () => { state.letterVersion = b.dataset.version; feedback(''); save(); renderConsole(); };
  $('sent').onclick = () => {
    if (!unlocked()) {
      feedback($('sentHint').textContent + ' ' + $('howNote').textContent);
      ($('contactLink').hidden ? $('copyText') : $('contactLink')).focus();
      return;
    }
    const list = myList(), o = current();
    pendingActions[`${o.id}:${state.channel}`] = true;
    if (mergeActions() && persist(actionKey, actions)) pendingActions = {};
    const i = list.indexOf(o), next = list.find((x, j) => j > i && !contacted(x)) || list.find(x => !contacted(x));
    if (next) state.selected = next.id; else reviewing = false;
    save(); renderProgress(); renderConsole(); focusStep(3);
  };
  $('reviewMessages').onclick = () => { reviewing = true; renderConsole(); focusStep(3); };

  // Copy: the clipboard API, then a temporary-textarea fallback, then select the text for a manual copy.
  async function copy(text, done, isCurrent = () => true, field) {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(text);
      if (isCurrent()) feedback(done);
      return;
    } catch {}
    if (!isCurrent()) return;
    const ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
    document.body.append(ta); ta.select(); let ok = false; try { ok = document.execCommand('copy'); } catch {} ta.remove();
    if (ok) { feedback(done); return; }
    if (field) { openEditor(); const el = $(field); el.focus(); el.select(); }
    feedback('Clipboard unavailable. Text selected; use your device’s Copy command.');
  }
  // Async copies report success only if the same official and channel are still on screen.
  const context = () => { const id = current().id, channel = state.channel, source = state; return () => state === source && current().id === id && state.channel === channel; };
  $('copyText').onclick = async () => {
    if (!allowReviewedAction()) return;
    const o = current(), channel = state.channel;
    await copy(shown(), 'Copied. Ready to paste.', context(), 'editBody');
    if ($('contactLink').hidden) markOpened(o, channel);
  };
  $('copySubject').onclick = () => { if (allowReviewedAction()) copy(texts(state, current()).subject, 'Subject copied. Ready to paste.', context(), 'editSubject'); };
  // Save synchronously before navigation, including mobile tab/app switches.
  $('contactLink').addEventListener('click', event => { if (!allowReviewedAction()) event.preventDefault(); else { save(); markOpened(); } });
  document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
  window.addEventListener('pagehide', save);

  // ---- Edit dialog ----
  let resetRequested = false;
  function openEditor() {
    const o = current(), t = texts(state, o), channel = state.channel;
    resetRequested = false;
    $('editorTitle').textContent = `Edit · ${o.name}`;
    $('editorSubject').hidden = channel !== 'letter';
    $('editSubject').value = t.subject;
    $('editBodyLabel').textContent = { letter: 'Letter', call: 'Call script', social: 'Post' }[channel];
    $('editBody').value = t[channel];
    if (!$('editor').open) $('editor').showModal();
  }
  $('editText').onclick = $('preview').onclick = openEditor;
  $('resetText').onclick = () => {
    const t = texts(withoutEdits(current(), state.channel), current());
    resetRequested = true; $('editSubject').value = t.subject; $('editBody').value = t[state.channel];
  };
  $('saveText').onclick = () => {
    const o = current(), n = normalized(o), channel = state.channel;
    if (resetRequested) {
      const clean = withoutEdits(o, channel);
      state.personal[o.id] = clean.personal[o.id]; state.bindings[o.id] = clean.bindings[o.id];
    }
    const before = texts(state, o);
    if (channel === 'letter' && $('editSubject').value !== before.subject) M.editDisplayed(state, n, 'subject', $('editSubject').value, T);
    const body = $('editBody').value;
    if (body !== before[channel]) M.editDisplayed(state, n, channel === 'letter' ? 'message' : channel, body, T);
    $('editor').close(); save(); renderConsole();
    // Confirm only a real save; a refused or failed save keeps its own warning on screen.
    if (!draftConflict && !readFailures.size && !writeFailures.size) feedback(resetRequested ? 'Back to the original text.' : 'Saved on this device.');
  };
  $('cancelEdit').onclick = () => $('editor').close();

  // ---- Finish: share ----
  const share = T.share || {};
  function shareRow() {
    const e = encodeURIComponent, text = e(share.text || ''), url = e(share.url || location.href), icons = window.BRAND_ICONS || {};
    const svg = (d, line) => `<svg viewBox="0 0 24 24" aria-hidden="true"${line ? ' fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"' : ''}><path${line ? '' : ' fill="currentColor"'} d="${d}"/></svg>`;
    // Intent formats checked 2026-11-11 (docs/development.md). Instagram and TikTok have no web share link.
    const items = [
      ['X', `https://twitter.com/intent/tweet?text=${text}`, icons.x],
      ['Bluesky', `https://bsky.app/intent/compose?text=${text}`, icons.bluesky],
      ['Threads', `https://www.threads.com/intent/post?text=${text}${share.hashtag ? '&tag=' + e(share.hashtag) : ''}`, icons.threads],
      ['Facebook', `https://www.facebook.com/sharer/sharer.php?u=${url}`, icons.facebook],
      ['Snapchat', `https://www.snapchat.com/scan?attachmentUrl=${url}`, icons.snapchat],
      ['Reddit', `https://www.reddit.com/submit?url=${url}&title=${e((share.text || '').split('\n\n')[0])}`, icons.reddit],
      ['WhatsApp', `https://wa.me/?text=${text}`, icons.whatsapp],
      ['Text', `sms:?&body=${text}`, 'M4 5h16v11H9l-5 4Z', true],
      ['Email', `mailto:?subject=${e(share.emailSubject || '')}&body=${text}`, 'M3 6h18v12H3ZM3 7l9 6 9-6', true]
    ];
    return items.map(([name, href, d, line]) => `<li><a href="${href}"${href.startsWith('http') ? ' target="_blank" rel="noopener noreferrer"' : ''} aria-label="Share on ${name}">${d ? svg(d, line) : ''}<span>${name}</span></a></li>`).join('')
      + (navigator.share ? `<li><button type="button" id="shareMore" aria-label="More ways to share">${svg('M12 3v12M7 8l5-5 5 5M5 14v6h14v-6', true)}<span>More</span></button></li>` : '');
  }
  $('shareRow').innerHTML = shareRow();
  $('copyShare').onclick = () => copy(share.text || '', 'Copied. Paste it anywhere.');
  $('shareMore')?.addEventListener('click', () => navigator.share({ text: share.text }).catch(() => {}));

  // ---- About, privacy and erase ----
  $('aboutLink').onclick = () => $('about').showModal();
  $('closeAbout').onclick = () => $('about').close();
  // Other tabs never silently overwrite unsaved-in-memory work. Progress is independent.
  window.addEventListener('storage', event => {
    if (event.key === actionKey) {
      if (event.newValue === null && event.oldValue !== null) { pendingActions = {}; actions = {}; state = M.create(T.shared, T.concise?.shared); lastDraft = 'null'; draftConflict = false; readFailures.clear(); writeFailures.clear(); step = 1; render(); saveStatus(); }
      else mergeActions();
      renderProgress(); if (step === 3) renderConsole();
    }
    if (event.key === draftKey && event.newValue === null && event.oldValue !== null) {
      state = M.create(T.shared, T.concise?.shared); lastDraft = 'null'; draftConflict = false; step = 1; render();
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
      lastDraft = 'null'; state = M.create(T.shared, T.concise?.shared); actions = {}; pendingActions = {}; readFailures.clear(); writeFailures.clear(); draftConflict = false;
      opened.clear(); try { sessionStorage.removeItem(openedKey); } catch {}
      step = 1; reviewing = false; celebrated = false; render(); $('eraseConfirm').hidden = true; feedback('Local drafts and actions erased.');
    }
    catch { writeFailures.add(draftKey); saveStatus(); feedback('Unable to erase browser storage. Use browser settings.'); }
  };

  celebrated = districtChosen() && myList().every(contacted); // no confetti for a finish reached on an earlier visit
  render();
  if (!savedDrafts && C.code === 'WA' && Object.keys(state.personal).length) {
    save();
    if (savedActions === null) persist(actionKey, actions);
  }
})();
