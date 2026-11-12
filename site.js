/* torquemen.com · menu, product gallery, phone sticky bar, WhatsApp launch-list sign-up (Supabase, insert-only). */
(() => {
  const SB_URL = 'https://urtwdqmiypjhnduspmwk.supabase.co/rest/v1/torque_launch_list';
  const SB_KEY = 'sb_publishable_8y2_Ah5AoqFzAMfRH6kqbg_ajX2xnPY'; // publishable key: the table only allows inserts
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const toast = $('#toast'); let tm;
  const say = (m) => { if (!toast) return; toast.textContent = m; toast.classList.add('show'); clearTimeout(tm); tm = setTimeout(() => toast.classList.remove('show'), 2200); };

  /* menu */
  const mb = $('.menu-btn'), menu = $('#menu');
  if (mb && menu) mb.addEventListener('click', () => {
    const open = mb.getAttribute('aria-expanded') !== 'true';
    mb.setAttribute('aria-expanded', String(open)); menu.classList.toggle('open', open);
  });

  /* product gallery */
  const slides = $$('.gallery .stage img'), thumbs = $$('.thumbs button');
  if (slides.length) {
    let cur = 0;
    const show = (i) => {
      cur = (i + slides.length) % slides.length;
      slides.forEach((s, k) => { s.hidden = k !== cur; });
      thumbs.forEach((t, k) => t.setAttribute('aria-pressed', String(k === cur)));
      const n = $('#shotNo'); if (n) n.textContent = cur + 1;
    };
    thumbs.forEach((t, k) => t.addEventListener('click', () => show(k)));
    let x0 = null;
    const stage = $('.gallery .stage');
    stage.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener('touchend', (e) => {
      if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) show(cur + (dx < 0 ? 1 : -1));
    });
  }

  /* phone sticky bar: appears once the first sign-up form has scrolled out of view */
  const bar = $('.bar'), first = $('.signup');
  if (bar && first && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => bar.classList.toggle('show', !e.isIntersecting && e.boundingClientRect.top < 0)).observe(first);
  }

  /* sign-up */
  const clean = (v) => {
    let d = (v || '').replace(/\D/g, '');
    if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
    if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
    return d;
  };
  $$('form.signup').forEach((f) => f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = $('.msg', f), btn = $('button[type=submit]', f), phone = clean($('input[type=tel]', f).value);
    msg.classList.remove('err');
    if (!/^[6-9]\d{9}$/.test(phone)) { msg.textContent = 'Enter a 10-digit Indian mobile number.'; msg.classList.add('err'); return; }
    if (!$('input[type=checkbox]', f).checked) { msg.textContent = 'Tick the box so we can WhatsApp you.'; msg.classList.add('err'); return; }
    btn.disabled = true; msg.textContent = 'Saving…';
    try {
      const r = await fetch(SB_URL, {
        method: 'POST',
        headers: { apikey: SB_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ phone, consent: true, page: location.pathname.slice(0, 80), user_agent: navigator.userAgent.slice(0, 300) }),
      });
      if (r.status === 201) { f.classList.add('done'); msg.textContent = 'Done. We’ll WhatsApp you when TORQUE launches.'; }
      else if (r.status === 409) { f.classList.add('done'); msg.textContent = 'You’re already on the list. We’ll WhatsApp you at launch.'; }
      else { throw new Error(r.status); }
    } catch (err) {
      msg.textContent = 'Couldn’t save that. Please try again in a minute.'; msg.classList.add('err');
    } finally { btn.disabled = false; }
  }));
})();
