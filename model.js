/* Pure state helpers. No Washington-specific content or browser storage. */
(() => {
  'use strict';
  const create = (defaults = {}, conciseDefaults = {}) => ({
    shared: { subject: '', message: '', ...defaults, conciseSubject: conciseDefaults.subject ?? '', conciseMessage: conciseDefaults.message ?? '' },
    personal: {}, details: {}, bindings: {}, categoryShared: {}, editorialVersion: 1, legacyShared: false, selected: '', district: '', channel: 'letter', letterVersion: 'full'
  });
  function draft(state, official, content = {}) {
    const title = official.group === 'senate' ? 'Senator' : official.group === 'house' ? 'Representative' : '';
    const greeting = official.greeting || `Dear ${title ? title + ' ' : ''}${official.name.split(' ').at(-1)},`;
    const concise = state.letterVersion === 'concise';
    const subjectField = concise ? 'conciseSubject' : 'subject';
    const messageField = concise ? 'conciseMessage' : 'message';
    const request = (concise ? content.concise : content)?.requests?.[official.vote || 'influence'] || '';
    const personal = state.personal[official.id] || {};
    return {
      ...personal,
      subject: personal[subjectField] ?? shared(state, official, content).subject ?? state.shared[subjectField],
      message: rendered(state, official, messageField, personal[messageField] ?? [greeting, shared(state, official, content).message ?? [request, state.shared[messageField]].filter(Boolean).join('\n\n')].filter(Boolean).join('\n\n'), personal[messageField] === undefined && !state.legacyShared && state.categoryShared?.[sharedKey(state, official)]?.message === undefined).text
    };
  }
  function edit(state, official, field, value) {
    if (state.letterVersion === 'concise' && ['subject', 'message'].includes(field)) field = field === 'subject' ? 'conciseSubject' : 'conciseMessage';
    state.personal[official.id] = { ...state.personal[official.id], [field]: value };
    if (state.bindings?.[official.id]) delete state.bindings[official.id][field];
  }
  const category = official => official.vote || 'influence';
  const sharedKey = (state, official) => `${category(official)}:${state.letterVersion || 'full'}`;
  function shared(state, official, content = {}) {
    return { ...(!state.legacyShared ? (state.letterVersion === 'concise' ? content.concise : content)?.letters?.[category(official)] : {}), ...state.categoryShared?.[sharedKey(state, official)] };
  }
  const clean = value => typeof value === 'string' ? value.trim().split(String.fromCharCode(13)).join(' ').split(String.fromCharCode(10)).join(' ') : '';
  function location(details = {}) {
    const city = clean(details.city), zip = clean(details.zip);
    const county = clean(details.county).replace(/(?:^|\s+)county(?:\s+county)*$/i, '').toLowerCase().replace(/\b\p{L}/gu, c => c.toUpperCase());
    const places = [city, county ? county + ' County' : ''].filter(Boolean);
    return places.length || zip ? [...places, 'WA' + (zip ? ' ' + zip : '')].join(', ') : '[Your location]';
  }
  const tokenValue = (token, details) => token === '[Your name]' ? clean(details?.name) || token : location(details);
  function rendered(state, official, field, raw, generated) {
    const bindings = generated ? [...raw.matchAll(/\[Your name\]|\[Your location\]/g)].map(m => ({ start: m.index, token: m[0] })) : state.bindings?.[official.id]?.[field] || [];
    let text = '', cursor = 0; const ranges = [];
    for (const b of bindings) {
      if (b.start < cursor || raw.slice(b.start, b.start + b.token.length) !== b.token) continue;
      text += raw.slice(cursor, b.start);
      const value = tokenValue(b.token, state.details);
      ranges.push({ start: text.length, end: text.length + value.length, token: b.token });
      text += value; cursor = b.start + b.token.length;
    }
    return { text: text + raw.slice(cursor), ranges };
  }
  function call(state, official, content = {}) {
    const raw = state.personal[official.id]?.call;
    const template = content.calls?.[category(official)] || content.call?.replace('[official]', official.name).replace('[request]', content.requests?.[category(official)] || '') || '';
    return rendered(state, official, 'call', raw ?? template.replace('[official]', official.name), raw === undefined).text;
  }
  function editDisplayed(state, official, field, value, content = {}) {
    if (field === 'subject' || field === 'social') { edit(state, official, field, value); return; }
    const storedField = field === 'message' && state.letterVersion === 'concise' ? 'conciseMessage' : field;
    const personal = state.personal[official.id] || {};
    let raw = personal[storedField];
    if (raw === undefined) {
      if (field === 'call') raw = (content.calls?.[category(official)] || '').replace('[official]', official.name);
      else {
        const greeting = official.greeting || `Dear ${official.group === 'senate' ? 'Senator' : 'Representative'} ${official.name.split(' ').at(-1)},`;
        const body = shared(state, official, content).message;
        raw = body === undefined ? draft(state, official, content).message : greeting + '\n\n' + body;
      }
    }
    const previous = rendered(state, official, storedField, raw, personal[storedField] === undefined && (field === 'call' || (!state.legacyShared && state.categoryShared?.[sharedKey(state, official)]?.message === undefined)));
    let start = 0, end = previous.text.length, nextEnd = value.length;
    while (start < end && start < nextEnd && previous.text[start] === value[start]) start++;
    while (end > start && nextEnd > start && previous.text[end - 1] === value[nextEnd - 1]) { end--; nextEnd--; }
    const delta = nextEnd - end;
    // An insertion may share a space with adjacent prose ("Jane Doe from").
    // Treat that immediate separator as part of the identity edit boundary.
    const keep = previous.ranges.filter(r => r.end + 1 < start || r.start - 1 > end).map(r => ({ ...r, start: r.start > end ? r.start + delta : r.start, end: r.start > end ? r.end + delta : r.end }));
    let result = '', cursor = 0; const bindings = [];
    for (const r of keep) { result += value.slice(cursor, r.start); bindings.push({ start: result.length, token: r.token }); result += r.token; cursor = r.end; }
    result += value.slice(cursor);
    edit(state, official, field, result);
    state.bindings[official.id] = { ...state.bindings[official.id], [storedField]: bindings };
  }
  const record = value => value && typeof value === 'object' && !Array.isArray(value);
  const strings = (value, keys) => Object.fromEntries(keys.filter(key => typeof value?.[key] === 'string').map(key => [key, value[key]]));
  function restore(value, defaults = {}, conciseDefaults = {}) {
    const state = create(defaults, conciseDefaults);
    if (!record(value)) return state;
    state.details = strings(value.details, ['name', 'city', 'county', 'zip']);
    state.legacyShared = value.legacyShared === true || (!value.editorialVersion && record(value.shared));
    if (record(value.categoryShared)) for (const [key, fields] of Object.entries(value.categoryShared)) {
      if (/^(senate|house|influence):(full|concise)$/.test(key) && record(fields)) state.categoryShared[key] = strings(fields, ['subject', 'message']);
    }
    if (record(value.bindings)) for (const [id, fields] of Object.entries(value.bindings)) {
      if (!record(fields) || ['__proto__', 'constructor', 'prototype'].includes(id)) continue;
      state.bindings[id] = {};
      for (const field of ['message', 'conciseMessage', 'call']) if (Array.isArray(fields[field])) state.bindings[id][field] = fields[field].filter(b => record(b) && Number.isInteger(b.start) && b.start >= 0 && ['[Your name]', '[Your location]'].includes(b.token)).sort((a, b) => a.start - b.start).map(b => ({ start: b.start, token: b.token }));
    }
    Object.assign(state.shared, strings(value.shared, ['subject', 'message', 'conciseSubject', 'conciseMessage']));
    Object.assign(state, strings(value, ['selected', 'district']));
    if (['letter', 'call', 'social'].includes(value.channel)) state.channel = value.channel;
    if (['full', 'concise'].includes(value.letterVersion)) state.letterVersion = value.letterVersion;
    if (record(value.personal)) {
      for (const [id, fields] of Object.entries(value.personal)) {
        if (record(fields)) Object.defineProperty(state.personal, id, { value: strings(fields, ['subject', 'message', 'conciseSubject', 'conciseMessage', 'call', 'social', 'legacyReview', 'reviewed']), enumerable: true, writable: true, configurable: true });
      }
    }
    return state;
  }
  window.ActionModel = { create, restore, draft, edit, editDisplayed, location, call, shared, sharedKey };
})();
