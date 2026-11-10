/* Pure state helpers. No Washington-specific content or browser storage. */
(() => {
  'use strict';
  const create = (defaults = {}, conciseDefaults = {}) => ({
    shared: { subject: '', message: '', ...defaults, conciseSubject: conciseDefaults.subject ?? '', conciseMessage: conciseDefaults.message ?? '' },
    personal: {}, selected: '', district: '', channel: 'letter', letterVersion: 'full'
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
      subject: personal[subjectField] ?? state.shared[subjectField],
      message: personal[messageField] ?? [greeting, request, state.shared[messageField]].filter(Boolean).join('\n\n')
    };
  }
  function edit(state, official, field, value) {
    if (state.letterVersion === 'concise' && ['subject', 'message'].includes(field)) field = field === 'subject' ? 'conciseSubject' : 'conciseMessage';
    state.personal[official.id] = { ...state.personal[official.id], [field]: value };
  }
  const record = value => value && typeof value === 'object' && !Array.isArray(value);
  const strings = (value, keys) => Object.fromEntries(keys.filter(key => typeof value?.[key] === 'string').map(key => [key, value[key]]));
  function restore(value, defaults = {}, conciseDefaults = {}) {
    const state = create(defaults, conciseDefaults);
    if (!record(value)) return state;
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
  window.ActionModel = { create, restore, draft, edit };
})();
