/* Tip jar: Ko-fi and Lightning. Everything comes from CAMPAIGN_CONTENT.tips in campaign.js, and nothing shows
   unless this page is on one of its hosts, so a fork never shows another campaign's payment details.
   Nothing here contacts another site until a visitor opens a payment option:
   - Ko-fi: their embeddable form loads in a frame only after the Ko-fi button is tapped.
   - Lightning: the address's LNURL-pay lookup (LUD-06/16), invoices and the BTC/USD price are requested only
     after the Lightning button is tapped. Those servers must allow browser requests (CORS). */
(() => {
  'use strict';
  const T = window.CAMPAIGN_CONTENT || {}, tips = T.tips;
  if (!tips || !(tips.hosts || []).includes(location.hostname) || !(tips.kofi || tips.lightning)) return;
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const host = url => { try { return new URL(url).hostname; } catch { return ''; } };
  const LN = tips.lightning || '', [lnUser, lnDomain] = LN.split('@');
  const AMOUNTS = (tips.amounts || [5, 10, 25]).filter(n => n > 0);
  const kofiEmbed = tips.kofi ? tips.kofi.replace(/\/?$/, '/') + '?hidefeed=true&widget=true&embed=true&preview=true' : '';
  const heart = stroke => `<svg viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M12 20s-7-4.5-9-9a4.5 4.5 0 0 1 9-3 4.5 4.5 0 0 1 9 3c-2 4.5-9 9-9 9Z"/></svg>`;
  const bolt = '<svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7Z"/></svg>';
  const kofiIcon = window.BRAND_ICONS?.kofi ? `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="${window.BRAND_ICONS.kofi}"/></svg>` : heart('currentColor');

  function card(id) {
    return `<section class="tips" aria-labelledby="${id}">
      <div class="tips-head"><p class="eyebrow">SUPPORT THE PROJECT</p>${heart('var(--accent)')}</div>
      <h2 id="${id}">Keep the pressure on.</h2>
      <p>${esc(T.name || 'This project')} is free and independently maintained. If you'd like to help cover its costs, tips are appreciated. Never required.</p>
      <div class="tip-row">
        ${tips.kofi ? `<button class="tip primary" type="button" data-tip-toggle aria-expanded="false" aria-controls="${id}-kofi">${kofiIcon}Ko-fi<small>Card or PayPal</small></button>` : ''}
        ${LN ? `<button class="tip" type="button" data-tip-toggle aria-expanded="false" aria-controls="${id}-ln">${bolt}Lightning<small>Pay with Bitcoin</small></button>` : ''}
      </div>
      ${tips.kofi ? `<p class="third">Ko-fi is a separate company. Tapping it loads their payment form, and their privacy policy applies.</p>
      <div class="kofi" id="${id}-kofi" hidden>
        <iframe data-src="${esc(kofiEmbed)}" title="Tip ${esc(T.name || '')} on Ko-fi"></iframe>
        <a class="link" href="${esc(tips.kofi)}" target="_blank" rel="noopener noreferrer">Open Ko-fi in a new tab instead</a>
      </div>` : ''}
      ${LN ? `<div class="ln" id="${id}-ln" hidden>
        <div class="ln-qr" data-ln-qr role="img" aria-label="QR code for the Lightning address ${esc(LN)}"></div>
        <p class="ln-addr"><span>${esc(LN)}</span><button class="link" type="button" data-ln-copy="addr">Copy</button></p>
        <p class="ln-hint">Scan with any Lightning wallet, or pick an amount for a ready-made invoice.</p>
        <div class="ln-amts" role="group" aria-label="Amount in dollars">${AMOUNTS.map(d => `<button type="button" data-usd="${d}" aria-pressed="false">$${d}</button>`).join('')}<button type="button" data-ln-other aria-pressed="false">Other</button></div>
        <form class="ln-custom" data-ln-custom hidden><label class="ln-dollar"><span aria-hidden="true">$</span><input data-ln-usd inputmode="decimal" autocomplete="off" aria-label="Amount in dollars" placeholder="Amount"></label><button type="submit">Make invoice</button></form>
        <input class="ln-note" data-ln-note maxlength="250" placeholder="Add a note (optional)" aria-label="Note with your tip (optional)">
        <p class="ln-status" data-ln-status role="status" aria-live="polite"></p>
        <div class="ln-actions">
          <a data-ln-open href="lightning:${esc(LN)}">Open my wallet</a>
          <button type="button" data-ln-copy="pr" hidden>Copy invoice</button>
          <button type="button" data-ln-webln hidden>Pay with browser wallet</button>
        </div>
      </div>` : ''}
      <p class="fine">Voluntary tips support site maintenance, not a political candidate or party. Not tax-deductible.</p>
    </section>`;
  }
  $('tipDialogBody').innerHTML = card('tipsHeader');
  $('finishTips').innerHTML = card('tipsFinish');
  $('tipjarBtn').hidden = false;
  $('tipjarBtn').setAttribute('aria-label', 'Tip jar');
  $('tipjarBtn').onclick = () => $('tipDialog').showModal();
  $('closeTips').onclick = () => $('tipDialog').close();
  const services = [tips.kofi && `Ko-fi's payment form loads only if you tap Ko-fi`, LN && `Lightning tips request an invoice${tips.priceUrl ? ' and the bitcoin price' : ''} from ${[...new Set([lnDomain, host(tips.priceUrl)].filter(Boolean))].join(' and ')} only when you use them`].filter(Boolean);
  $('tipPrivacy').textContent = `The tip jar contacts other sites only when you use it: ${services.join('; ')}.`;
  $('tipPrivacy').hidden = false;

  function toast(text) { const el = $('feedback'); el.textContent = text; el.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('show'), 3000); }
  async function copy(text, done) {
    try { await navigator.clipboard.writeText(text); toast(done); return; } catch {}
    const ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
    document.body.append(ta); ta.select(); let ok = false; try { ok = document.execCommand('copy'); } catch {} ta.remove();
    toast(ok ? done : "Couldn't copy. Select the text and copy it yourself.");
  }

  // QR codes: qrcode-generator 1.4.4 (MIT), loaded the first time a Lightning panel opens.
  let qrLib = null;
  const loadQR = () => qrLib ||= new Promise((resolve, reject) => {
    const s = document.createElement('script'); s.src = 'vendor/qrcode-generator-1.4.4.js';
    s.onload = () => resolve(window.qrcode); s.onerror = () => { qrLib = null; reject(); }; document.head.append(s);
  });
  async function drawQR(panel, text, label) {
    const box = panel.querySelector('[data-ln-qr]');
    try {
      const qrcode = await loadQR(), q = qrcode(0, text.length > 100 ? 'L' : 'M'); q.addData(text); q.make();
      box.innerHTML = q.createSvgTag({ cellSize: 4, margin: 0, scalable: true }); box.setAttribute('aria-label', label); box.hidden = false;
    } catch { box.hidden = true; }
  }
  let payParams = null, price = null;
  const lnParams = () => payParams ||= fetch(`https://${lnDomain}/.well-known/lnurlp/${encodeURIComponent(lnUser)}`)
    .then(r => r.ok ? r.json() : Promise.reject()).then(p => p.tag === 'payRequest' && p.callback ? p : Promise.reject()).catch(e => { payParams = null; throw e; });
  const lnPrice = () => price ||= fetch(tips.priceUrl)
    .then(r => r.ok ? r.json() : Promise.reject()).then(j => j.price > 0 ? j.price : Promise.reject()).catch(e => { price = null; throw e; });
  const usd = d => '$' + d.toLocaleString('en-US', { minimumFractionDigits: Number.isInteger(d) ? 0 : 2, maximumFractionDigits: 2 });
  function reset(panel) {
    panel.pr = null;
    drawQR(panel, 'lightning:' + LN, 'QR code for the Lightning address ' + LN);
    panel.querySelector('[data-ln-open]').href = 'lightning:' + LN;
    panel.querySelectorAll('[data-usd],[data-ln-other]').forEach(b => b.setAttribute('aria-pressed', 'false'));
    panel.querySelector('[data-ln-custom]').hidden = true;
    panel.querySelector('[data-ln-copy="pr"]').hidden = panel.querySelector('[data-ln-webln]').hidden = true;
    panel.querySelector('[data-ln-status]').textContent = '';
  }
  async function invoice(panel, dollars, button) {
    const status = panel.querySelector('[data-ln-status]');
    panel.querySelectorAll('[data-usd],[data-ln-other]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    if (button.dataset.usd) panel.querySelector('[data-ln-custom]').hidden = true;
    panel.classList.add('busy'); status.textContent = 'Making your invoice...';
    try {
      const [p, rate] = await Promise.all([lnParams(), lnPrice()]);
      const sats = Math.round(dollars / rate * 1e8), msat = sats * 1000;
      if (msat < p.minSendable || msat > p.maxSendable) {
        status.textContent = `Pick an amount between ${usd(Math.ceil(p.minSendable / 1000 * rate / 1e8 * 100) / 100)} and ${usd(Math.floor(p.maxSendable / 1000 * rate / 1e8))}.`;
        return;
      }
      const note = panel.querySelector('[data-ln-note]').value.trim().slice(0, p.commentAllowed || 0);
      const r = await (await fetch(p.callback + (p.callback.includes('?') ? '&' : '?') + 'amount=' + msat + (note ? '&comment=' + encodeURIComponent(note) : ''))).json();
      if (typeof r.pr !== 'string' || !/^ln/i.test(r.pr)) throw new Error('No invoice');
      panel.pr = r.pr;
      await drawQR(panel, 'lightning:' + r.pr.toUpperCase(), `QR code for a ${usd(dollars)} Lightning invoice`);
      panel.querySelector('[data-ln-open]').href = 'lightning:' + r.pr;
      panel.querySelector('[data-ln-copy="pr"]').hidden = false;
      panel.querySelector('[data-ln-webln]').hidden = !window.webln;
      status.textContent = `Invoice for ${usd(dollars)} (${sats.toLocaleString('en-US')} sats) is ready. Scan it or open your wallet.`;
    } catch {
      reset(panel); status.textContent = "Couldn't make an invoice just now. The address above still works.";
    } finally { panel.classList.remove('busy'); }
  }
  document.addEventListener('submit', event => {
    const form = event.target.closest('[data-ln-custom]'); if (!form) return;
    event.preventDefault();
    const panel = form.closest('.ln'), value = parseFloat(form.querySelector('[data-ln-usd]').value.replace(/[$,\s]/g, ''));
    if (!(value > 0)) { panel.querySelector('[data-ln-status]').textContent = 'Enter a dollar amount, like 15.'; return; }
    invoice(panel, Math.round(value * 100) / 100, panel.querySelector('[data-ln-other]'));
  });
  document.addEventListener('click', async event => {
    const toggle = event.target.closest('[data-tip-toggle]');
    if (toggle) {
      // One payment panel open at a time.
      const panel = $(toggle.getAttribute('aria-controls')), open = panel.hidden;
      toggle.closest('.tips').querySelectorAll('[data-tip-toggle]').forEach(b => { b.setAttribute('aria-expanded', 'false'); $(b.getAttribute('aria-controls')).hidden = true; });
      panel.hidden = !open; toggle.setAttribute('aria-expanded', String(open));
      if (open && panel.classList.contains('ln') && !panel.querySelector('svg')) reset(panel);
      const frame = panel.querySelector('iframe[data-src]');
      if (open && frame && !frame.src) frame.src = frame.dataset.src;
      return;
    }
    const panel = event.target.closest('.ln'); if (!panel) return;
    const amount = event.target.closest('[data-usd]');
    if (amount) return amount.getAttribute('aria-pressed') === 'true' ? reset(panel) : invoice(panel, +amount.dataset.usd, amount);
    const other = event.target.closest('[data-ln-other]');
    if (other) {
      if (other.getAttribute('aria-pressed') === 'true') return reset(panel);
      reset(panel); other.setAttribute('aria-pressed', 'true');
      panel.querySelector('[data-ln-custom]').hidden = false; panel.querySelector('[data-ln-usd]').focus();
      return;
    }
    const c = event.target.closest('[data-ln-copy]');
    if (c) return c.dataset.lnCopy === 'pr' ? copy(panel.pr, 'Invoice copied') : copy(LN, 'Lightning address copied');
    if (event.target.closest('[data-ln-webln]') && panel.pr) {
      try { await window.webln.enable(); await window.webln.sendPayment(panel.pr); panel.querySelector('[data-ln-status]').textContent = 'Paid. Thank you!'; window.celebrate?.(); }
      catch { toast('Payment not sent'); }
    }
  });
})();
