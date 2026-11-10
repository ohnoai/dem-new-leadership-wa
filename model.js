/* Pure state helpers. No Washington-specific content or browser storage. */
(() => {
  'use strict';
  const create = (defaults = {}) => ({
    shared: { subject: '', message: '', ...defaults },
    personal: {}, selected: '', district: '', channel: 'letter'
  });
  function draft(state, official, content = {}) {
    const title = official.group === 'senate' ? 'Senator' : official.group === 'house' ? 'Representative' : '';
    const greeting = official.greeting || `Dear ${title ? title + ' ' : ''}${official.name.split(' ').at(-1)},`;
    const request = content.requests?.[official.vote || 'influence'] || '';
    const base = {
      subject: state.shared.subject,
      message: [greeting, request, state.shared.message].filter(Boolean).join('\n\n')
    };
    return { ...base, ...state.personal[official.id] };
  }
  function edit(state, official, field, value) {
    state.personal[official.id] = { ...state.personal[official.id], [field]: value };
  }
  const record = value => value && typeof value === 'object' && !Array.isArray(value);
  const strings = (value, keys) => Object.fromEntries(keys.filter(key => typeof value?.[key] === 'string').map(key => [key, value[key]]));
  function restore(value, defaults = {}) {
    const state = create(defaults);
    if (!record(value)) return state;
    Object.assign(state.shared, strings(value.shared, ['subject', 'message']));
    Object.assign(state, strings(value, ['selected', 'district']));
    if (['letter', 'call', 'social'].includes(value.channel)) state.channel = value.channel;
    if (record(value.personal)) {
      for (const [id, fields] of Object.entries(value.personal)) {
        if (record(fields)) Object.defineProperty(state.personal, id, { value: strings(fields, ['subject', 'message', 'call', 'social', 'legacyReview', 'reviewed']), enumerable: true, writable: true, configurable: true });
      }
    }
    return state;
  }
  window.ActionModel = { create, restore, draft, edit };
})();
