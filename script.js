(function(){
  var sleep = function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); };

  // header hairline on scroll
  var h = document.querySelector('header');
  function onScroll(){ h.classList.toggle('scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, {passive:true}); onScroll();

  // only animate what's on screen
  // Each piece runs in its own guard so one failure can't take the rest down.
  function safe(fn){ try { var p = fn(); if (p && p.catch) p.catch(function(e){ if (window.console) console.warn(e); }); } catch(e){ if (window.console) console.warn(e); } }

  // Only animate what's on screen, and pause while the tab is hidden.
  function watch(el){
    var s = {v:true};
    if (el && 'IntersectionObserver' in window){
      s.v = false;
      new IntersectionObserver(function(es){ s.v = es[es.length - 1].isIntersecting; }, {threshold:0, rootMargin:'0px 0px -10% 0px'}).observe(el);
    }
    return s;
  }
  async function until(s){ while(!s.v || document.hidden) await sleep(250); }

  // ── conversation scripts: [speaker, text]. them = person, ai = agent, sys = status line
  var SCRIPTS = {
    rec: [
      ['sys','Incoming call · Sun 7:40pm'],
      ['them','Hi, water is coming through my kitchen ceiling. Can someone come out?'],
      ['ai','I can help. Is it still running, or have you shut off the main?'],
      ['them','Shut it off. It stopped.'],
      ['ai','Good. I have a tech at 8am tomorrow, or an emergency visit tonight for $189. Which works?'],
      ['them','8am is fine.'],
      ['cal',{day:'Mon, Sep 28',rows:[['7am','Water heater swap','Dave'],['8am','Ceiling leak · 12 Birch Ln','Mike',1],['9am']]}],
      ['ai','You’re booked for 8am. Mike will text when he’s on the way.'],
      ['ok','✓ Added to calendar · summary texted to owner']
    ],
    book: [
      ['them','Any chance Thursday afternoon for the furnace tune-up?'],
      ['ai','Thursday works. I have 2:00 or 4:30. Which is better?'],
      ['them','2 please'],
      ['cal',{day:'Thu, Oct 1',rows:[['1pm','Boiler service','Ray'],['2pm','Furnace tune-up · 14 Oak St','Ray',1],['3pm']]}],
      ['ai','You’re booked Thu 2:00pm. I’ll text a reminder Wednesday evening.'],
      ['ok','✓ Added to calendar · reminder queued']
    ],
    tix: [
      ['them','Where’s my order? #48812'],
      ['sys','Read order history + shipping policy'],
      ['ai','Hi Sam, it shipped Monday with UPS and arrives tomorrow by 7pm. Tracking is below.'],
      ['them','Perfect, thanks!'],
      ['ok','✓ Ticket closed in 90 seconds']
    ],
    lead: [
      ['them','Find more companies like our three best accounts.'],
      ['sys','Searching 3 counties · checking contacts'],
      ['leads',{title:'12 matches',meta:'top 3 shown',rows:[
        ['Ridgeline Property Mgmt','40 rentals · Dana Kim, Ops','Hiring maintenance lead','#2d6a73'],
        ['Summit HOA Services','12 communities · Raj Patel, GM','Won new contract','#7a4bb0'],
        ['Blue Oak Apartments','220 units · Lisa Moreno, Owner','Opened 2nd site','#2f6fd6']]}],
      ['ai','Top pick is Ridgeline. They just posted a maintenance job, so the opener mentions it.'],
      ['mail',{to:'dana@ridgelinepm.com',subject:'Your maintenance lead opening',body:'Hi Dana, saw Ridgeline is <mark>hiring a maintenance lead</mark> for its 40 rentals. While you look, we can cover after-hours calls for your tenants…'}],
      ['ai','Queue all 12 for tomorrow morning?'],
      ['them','Yes, queue them.'],
      ['ok','✓ 12 openers scheduled for 9am']
    ],
    inv: [
      ['sys','New email from Ferguson · 1 PDF attached'],
      ['doc',{name:'INV-88412.pdf',po:'PO #2207',more:'10 more lines match',rows:[
        ['L7','1/2" PEX, 100 ft','6','6'],
        ['L8','SharkBite couplings','30','30'],
        ['L9','3/4" copper elbows','40','24'],
        ['L10','Pipe insulation','12','12']]}],
      ['ai','13 of 14 lines match. Line 9 bills 40 elbows, but you ordered 24. That\u2019s $38.40 extra.'],
      ['them','Good catch. Post the rest, I’ll call them about line 9.'],
      ['ai','Posted to QuickBooks. Line 9 is held with a note.'],
      ['ok','✓ Posted · 1 exception']
    ],
    kb: [
      ['them','What’s the warranty on the RX-40?'],
      ['sys','Searched manuals + price lists'],
      ['ai','3 years parts, 1 year labour. Source: RX-40 manual, page 14.'],
      ['them','Does that cover the pump?'],
      ['ai','Yes. The pump is listed under parts, same page, section 2.']
    ]
  };

  function bubble(kind, text, label){
    var d = document.createElement('div');
    if (kind === 'cal'){
      d.className = 'calcard';
      var html = '<div class="cal-h"><svg><use href="#i-cal"/></svg>Google Calendar<span>' + text.day + '</span></div>';
      text.rows.forEach(function(r){
        html += '<div class="cal-row"><time>' + r[0] + '</time><div>' +
          (r[1] ? '<div class="ev ' + (r[3] ? 'new' : 'busy') + '">' + r[1] + (r[2] ? '<small>' + r[2] + '</small>' : '') + '</div>' : '') +
          '</div></div>';
      });
      d.innerHTML = html; return d;
    }
    if (kind === 'leads'){
      d.className = 'xcard';
      var h = '<div class="x-h"><svg><use href="#i-target"/></svg>' + text.title + '<span>' + text.meta + '</span></div>';
      text.rows.forEach(function(r, i){
        h += '<div class="lrow" style="--k:' + i + '"><span class="logo-sq" style="--lc:' + r[3] + '">' + r[0].split(' ').map(function(w){return w[0];}).slice(0,2).join('') + '</span>' +
          '<div><b>' + r[0] + '</b><small>' + r[1] + '</small><span class="sig">' + r[2] + '</span></div>' +
          '<span class="vstat" style="--k:' + i + '"><i class="chk">checking…</i><i class="ok">✓ verified</i></span></div>';
      });
      d.innerHTML = h; return d;
    }
    if (kind === 'mail'){
      d.className = 'xcard mail';
      d.innerHTML = '<div class="x-h"><svg><use href="#i-inbox"/></svg>Draft opener<span>1 of 12</span></div>' +
        '<div class="to"><span>To</span><b>' + text.to + '</b><span>Subject</span><b>' + text.subject + '</b></div><p>' + text.body + '</p>';
      return d;
    }
    if (kind === 'doc'){
      d.className = 'xcard doc';
      var g = '<span class="scan"></span><div class="x-h"><svg><use href="#i-doc"/></svg>' + text.name + '<span>vs ' + text.po + '</span></div>' +
        '<div class="drow head"><span>#</span><span>Item</span><span class="n">Billed</span><span class="n">PO</span><span></span></div>';
      text.rows.forEach(function(r, i){
        var bad = r[3] !== r[2];
        g += '<div class="drow' + (bad ? ' flag' : '') + '" style="--k:' + i + '"><code>' + r[0] + '</code><span>' + r[1] + '</span>' +
          '<span class="n billed">' + r[2] + '</span><span class="n">' + r[3] + '</span>' +
          '<span class="st ' + (bad ? 'bad">!' : 'good">✓') + '</span></div>';
      });
      d.innerHTML = g + '<div class="more">✓ ' + text.more + '</div>';
      return d;
    }
    if (kind === 'sys' || kind === 'ok' || kind === 'warn'){
      d.className = 'sys' + (kind === 'sys' ? '' : ' ' + kind);
      d.textContent = text; return d;
    }
    d.className = 'msg ' + (kind === 'photo' ? 'them' : kind);
    if (label){ var b = document.createElement('span'); b.className = 'by'; b.textContent = label; d.appendChild(b); }
    if (kind === 'photo'){ var t = document.createElement('span'); t.className = 'thumb'; d.appendChild(t); }
    d.appendChild(document.createTextNode(text));
    return d;
  }
  function typing(){
    var d = document.createElement('div');
    d.className = 'msg ai typing';
    d.innerHTML = '<i></i><i></i><i></i>';
    return d;
  }
  function trim(box){ while (box.children.length > 14) box.removeChild(box.firstChild); }

  async function play(box, steps, vis, labels){
    for (var i = 0; i < steps.length; i++){
      var k = steps[i][0], t = steps[i][1];
      await until(vis);
      if (i === 0 && k !== 'ai'){
        // open each loop immediately so the chat never sits empty
      } else if (k === 'ai'){
        await sleep(450);
        var ty = typing(); box.appendChild(ty);
        await sleep(Math.min(1900, 700 + t.length * 13));
        if (ty.parentNode) ty.parentNode.removeChild(ty);
      } else if (k === 'them' || k === 'photo'){
        await sleep(1000 + Math.min(900, t.length * 12));
      } else {
        await sleep(700);
      }
      box.appendChild(bubble(k, t, labels && labels[k === 'photo' ? 'them' : k]));
      trim(box);
      var hold = {cal:1400, leads:2600, mail:2200, doc:3000}[k];
      if (hold) await sleep(hold);
    }
  }
  function renderStatic(box, steps, labels){
    box.innerHTML = '';
    steps.forEach(function(s){ box.appendChild(bubble(s[0], s[1], labels && labels[s[0] === 'photo' ? 'them' : s[0]])); });
  }

  // agent cards: each loops its own conversation
  Array.prototype.forEach.call(document.querySelectorAll('.thread[data-s]'), function(box, idx){ safe(function(){
    var steps = SCRIPTS[box.getAttribute('data-s')];
    if (!steps) return;
    renderStatic(box, steps);
    var vis = watch(box);
    return (async function loop(){
      await until(vis);
      await sleep(idx * 700);
      for(;;){
        box.innerHTML = '';
        await play(box, steps, vis);
        await sleep(4200);
        box.classList.add('fading'); await sleep(450);
        box.classList.remove('fading');
      }
    })();
  }); });

  // ── approval card: full back-and-forth, then waits for the visitor to decide
  var KAREN = [
    ['them','The 3/4" brass fitting from order #51207 arrived cracked. I can’t finish the job with it.'],
    ['ai','Sorry about that, Karen. Could you send a photo of the crack?'],
    ['photo','Here you go.'],
    ['sys','Photo checked · matches damage-in-transit policy'],
    ['ai','Thanks, that’s shipping damage. Would you like a replacement sent today, or a full refund of $84.00?'],
    ['them','Refund please. I already bought one locally.'],
    ['warn','Refund over $50 → held for your approval']
  ];
  var LABELS = {them:'Karen M.', ai:'Agent'};
  var apv = {
    card: document.getElementById('approve'),
    box: document.getElementById('apv-thread'),
    panel: document.getElementById('apv-panel'),
    pill: document.getElementById('apv-pill'),
    draft: document.getElementById('apv-draft'),
    edit: document.getElementById('apv-edit')
  };
  var decide = null;
  function setPill(cls, txt){ apv.pill.className = 'pill ' + cls; apv.pill.textContent = txt; }
  function draftText(){
    var clone = apv.draft.cloneNode(true);
    var meta = clone.querySelector('.meta'); if (meta) meta.remove();
    return clone.textContent.trim();
  }
  document.getElementById('apv-yes').addEventListener('click', function(){ decide && decide('yes'); });
  document.getElementById('apv-back').addEventListener('click', function(){ decide && decide('back'); });
  apv.edit.addEventListener('click', function(){
    apv.draft.contentEditable = 'true'; apv.draft.focus(); apv.edit.textContent = 'Editing…';
  });

  // The buttons only appear once the conversation reaches the approval step,
  // so a tap can never land on a button that isn't listening yet.
  renderStatic(apv.box, KAREN, LABELS);
  apv.panel.hidden = true;
  setPill('p-hand', 'Handling');

  async function resolve(choice){
    apv.panel.hidden = true;
    apv.draft.contentEditable = 'false'; apv.edit.textContent = 'Edit';
    if (choice === 'yes'){
      apv.box.appendChild(bubble('ai', draftText(), LABELS.ai));
      await sleep(600);
      apv.box.appendChild(bubble('ok', '✓ Approved by you · sent · reversible for 24h'));
      setPill('p-done', 'Sent');
      await sleep(1400);
      apv.box.appendChild(bubble('them', 'That was fast. Thank you!', LABELS.them));
    } else {
      apv.box.appendChild(bubble('sys', 'Sent back to the agent with your note'));
      setPill('p-hand', 'Returned');
    }
    trim(apv.box);
  }

  safe(function(){
    var avis = watch(apv.card);
    var original = apv.draft.innerHTML;
    return (async function loop(){
      for(;;){
        await until(avis);
        apv.box.innerHTML = ''; apv.panel.hidden = true; apv.draft.innerHTML = original;
        setPill('p-hand', 'Handling');
        await play(apv.box, KAREN, avis, LABELS);
        await sleep(500);
        apv.panel.hidden = false; setPill('p-you', 'Needs you');
        var choice = await new Promise(function(r){ decide = function(c){ decide = null; r(c); }; });
        await resolve(choice);
        await sleep(6500);
        apv.box.classList.add('fading'); await sleep(450); apv.box.classList.remove('fading');
      }
    })();
  });

  // ── hero dashboard: new activity keeps arriving
  var POOL = [
    ['flame','i-phone','Receptionist','After-hours call, water heater quote booked','p-done','Done','calls'],
    ['blue','i-cal','Booking','Rescheduled Mrs. Ortiz to Fri 10am','p-done','Done','jobs'],
    ['jade','i-inbox','Ticket support','Answered 3 “where’s my order” emails','p-done','Done',null],
    ['violet','i-target','Lead finder','5 new property managers researched','p-done','Done',null],
    ['flame','i-phone','Receptionist','Caller asked for a $6k repipe quote','p-hand','Handed off','calls'],
    ['amber','i-doc','Invoices','Ferguson invoice posted, all lines match','p-done','Done',null],
    ['blue','i-cal','Booking','New drain cleaning booked Sat 9am','p-done','Done','jobs'],
    ['jade','i-inbox','Ticket support','Refund request over $50 drafted','p-you','Needs you','you']
  ];
  var feed = document.getElementById('feed');
  var K = {calls: document.getElementById('k-calls'), jobs: document.getElementById('k-jobs'), you: document.getElementById('k-you')};
  function bump(key){
    var el = K[key]; if (!el) return;
    el.textContent = String(parseInt(el.textContent, 10) + 1);
    el.classList.add('bump'); setTimeout(function(){ el.classList.remove('bump'); }, 900);
  }
  var clock = 19 * 60 + 42;
  function fmt(m){ var hh = Math.floor(m / 60) % 24, mm = m % 60, ap = hh >= 12 ? 'p' : 'a'; hh = hh % 12 || 12; return hh + ':' + (mm < 10 ? '0' : '') + mm + ap; }
  if (feed) safe(function(){
    var fvis = watch(document.getElementById('app'));
    return (async function(){
      var i = 0;
      await sleep(2200);
      for(;;){
        await until(fvis);
        var e = POOL[i++ % POOL.length];
        clock += 3 + Math.floor(Math.random() * 7);
        var row = document.createElement('div');
        row.className = 'row new';
        var ink = e[0] === 'amber' ? ';color:#171310' : '';
        row.innerHTML = '<span class="av" style="background:var(--' + e[0] + ')' + ink + '"><svg><use href="#' + e[1] + '"/></svg></span>' +
          '<span class="what"><span class="who">' + e[2] + '</span> · ' + e[3] + '</span>' +
          '<span class="pill ' + e[4] + '">' + e[5] + '</span><time>' + fmt(clock) + '</time>';
        feed.insertBefore(row, feed.firstChild);
        setTimeout(function(r){ r.classList.remove('new'); }.bind(null, row), 1600);
        while (feed.children.length > 6) feed.removeChild(feed.lastChild);
        if (e[6]) bump(e[6]);
        // keep the example day believable if someone leaves the page open for hours
        if (i % 40 === 0){ K.calls.textContent = '14'; K.jobs.textContent = '6'; K.you.textContent = '2'; clock = 19 * 60 + 42; }
        await sleep(3400);
      }
    })();
  });

  // ── brief → plan: the owner's brief types itself, then the plan fills in
  var q = document.getElementById('brief-q');
  var full = q ? q.textContent : '';
  var steps = Array.prototype.slice.call(document.querySelectorAll('#brief .step'));
  var live = document.getElementById('brief-live');
  if (q && live) safe(function(){
    var bvis = watch(document.getElementById('brief'));
    return (async function(){
      for(;;){
        await until(bvis);
        live.classList.add('off');
        steps.forEach(function(s){ s.classList.add('pending'); s.classList.remove('hot'); });
        var caret = document.createElement('span'); caret.className = 'caret';
        q.textContent = ''; q.appendChild(caret);
        for (var c = 0; c < full.length; c++){
          q.insertBefore(document.createTextNode(full[c]), caret);
          await sleep(full[c] === ' ' ? 20 : 32);
        }
        caret.remove();
        await sleep(600);
        for (var s = 0; s < steps.length; s++){
          steps[s].classList.remove('pending'); steps[s].classList.add('hot');
          await sleep(750);
          steps[s].classList.remove('hot');
        }
        live.classList.remove('off');
        await sleep(6000);
      }
    })();
  });
})();

/* Turns the "What we build" grid into a slowly turning ring of cards.
   The conversation loop above already plays each card's thread; this part only
   moves the cards.

   Motion model: `pos` is where the ring is pointing, in cards (0 = first card
   front and centre, 2.5 = halfway between the third and fourth). Every DWELL ms
   `target` steps forward by one and `pos` eases toward it, so the ring glides to
   the next card and then holds still long enough to read it. Dragging moves
   `pos` directly; letting go snaps to the nearest card. */
(function(){
  var ring = document.getElementById('ring');
  var stage = document.getElementById('ring-stage');
  var tabsBox = document.getElementById('ring-tabs');
  if (!ring || !stage) return;
  // reduced motion: leave the original grid in place
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var cards = Array.prototype.slice.call(ring.querySelectorAll('.field'));
  var N = cards.length;
  if (N < 3) return;

  var DWELL = 5200;          // ms a card sits at the front before the ring turns
  var EASE_TAU = 260;        // ms; bigger = lazier glide between cards
  var STEP = 360 / N;        // degrees between neighbouring cards

  var pos = 0, target = 0, held = 0;
  var radius = 340, cardW = 340;
  var paused = false, onScreen = true, dragging = null;
  var lastFront = -1;

  // Side notes, keyed by each card's conversation id (data-s). Every line restates
  // or narrows something the page already says: card copy, the approvals section,
  // or the tool list under "Your tools, your permissions".
  var NOTES = {
    rec:  {does:['Answers on the first ring, day or night','Qualifies the caller','Books real jobs into your calendar'],
           back:'Big quotes and anything outside your rules get texted to you with a summary.',
           tools:'Your existing number · SMS · Google Calendar'},
    book: {does:['Takes requests by text, email or web','Checks real availability first','Confirms, reminds and reschedules'],
           back:'Anything it can’t fit without breaking a rule you set comes to you.',
           tools:'Google · Outlook · Calendly'},
    tix:  {does:['Finds the answer in your docs and order history','Replies in your voice','Logs every action it takes'],
           back:'Refunds over your limit and the hard cases go to a person.',
           tools:'Gmail · Outlook · help desks'},
    lead: {does:['Finds companies like your best customers','Verifies the contact','Drafts the opener'],
           back:'You see the list and the drafts. You decide who hears from you.',
           tools:'Slack · HubSpot'},
    inv:  {does:['Reads invoices and POs','Checks them against what you expected','Posts the ones that match'],
           back:'Only what’s wrong, flagged line by line.',
           tools:'Accounts inbox · QuickBooks'},
    kb:   {does:['Pricing rules and warranty terms','Which vendor, which part','Answered from your own files, source cited'],
           back:'Questions your files don’t cover go to the person who knows.',
           tools:'Teams · Slack · your own files'}
  };

  function mod(n, m){ return ((n % m) + m) % m; }
  function front(){ return mod(Math.round(pos), N); }

  ring.classList.add('ring-on');

  // ── tabs, one per card, coloured with that card's accent
  var tabs = cards.map(function(card, i){
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'ring-tab'; b.setAttribute('role', 'tab');
    b.style.setProperty('--acc', getComputedStyle(card).getPropertyValue('--acc'));
    b.innerHTML = '<i></i>' + card.querySelector('.h3').textContent + '<span class="bar"></span>';
    b.addEventListener('click', function(){ goTo(i); });
    tabsBox.appendChild(b);
    card.setAttribute('aria-roledescription', 'slide');
    card.setAttribute('aria-label', (i + 1) + ' of ' + N);
    return b;
  });
  var notes = ['left', 'right'].map(function(side){
    var el = document.createElement('div');
    el.className = 'ring-note ' + side;
    stage.appendChild(el);
    return el;
  });
  var noteTimer = null;
  function fillNotes(i){
    var card = cards[i], thread = card.querySelector('.thread[data-s]');
    var n = thread && NOTES[thread.getAttribute('data-s')];
    if (!n) return;
    var acc = getComputedStyle(card).getPropertyValue('--acc');
    var name = card.querySelector('.h3').textContent;
    notes[0].style.setProperty('--acc', acc);
    notes[1].style.setProperty('--acc', acc);
    notes[0].innerHTML = '<div class="eyebrow-n">Handles on its own<i></i></div><ul>' +
      n.does.map(function(d){ return '<li>' + d + '</li>'; }).join('') + '</ul>';
    notes[1].innerHTML = '<div class="eyebrow-n"><i></i>' + name + ' · hands back</div><p>' + n.back +
      '</p><div class="rule"></div><div class="eyebrow-n">Works inside</div><div class="tools">' + n.tools + '</div>';
  }
  // fade out, swap the words while invisible, fade back in
  function swapNotes(i){
    clearTimeout(noteTimer);
    notes.forEach(function(el){ el.classList.add('swap'); });
    noteTimer = setTimeout(function(){
      fillNotes(i);
      notes.forEach(function(el){ el.classList.remove('swap'); });
    }, 300);
  }

  var count = document.createElement('span');
  count.className = 'ring-count';
  tabsBox.parentNode.insertBefore(count, tabsBox.nextSibling);

  // shortest way round to card i
  function goTo(i){
    var d = mod(i - target, N);
    if (d > N / 2) d -= N;
    target += d; held = 0;
  }
  function step(n){ target = Math.round(target) + n; held = 0; }
  document.getElementById('ring-prev').addEventListener('click', function(){ step(-1); });
  document.getElementById('ring-next').addEventListener('click', function(){ step(1); });
  ring.addEventListener('keydown', function(e){
    if (e.key === 'ArrowRight'){ step(1); e.preventDefault(); }
    if (e.key === 'ArrowLeft'){ step(-1); e.preventDefault(); }
  });

  // ── size: card width follows the viewport, radius follows the card width
  function layout(){
    var vw = document.documentElement.clientWidth;
    cardW = Math.min(340, Math.round(vw * 0.8));
    // the distance at which N cards of this width just touch, plus breathing room
    radius = Math.round((cardW / 2) / Math.tan(Math.PI / N) + (vw < 640 ? 24 : 70));
    ring.style.setProperty('--card-w', cardW + 'px');
    var tallest = 0;
    cards.forEach(function(c){ tallest = Math.max(tallest, c.offsetHeight); });
    ring.style.setProperty('--stage-h', (tallest + 70) + 'px');

    // How far the side cards (one step round the ring) reach from the centre on
    // screen: their outer edge, projected through the stage's perspective.
    var th = 2 * Math.PI / N;
    var ex = (cardW / 2) * Math.cos(th) + radius * Math.sin(th);
    var ez = -(cardW / 2) * Math.sin(th) + radius * Math.cos(th) - radius;
    var edge = Math.round(ex * 1600 / (1600 - ez));
    // notes only when each side has room for a readable column
    var room = vw / 2 - edge - 40 - 32;
    var noteW = Math.min(250, room);
    ring.style.setProperty('--edge', edge + 'px');
    ring.style.setProperty('--note-w', noteW + 'px');
    ring.classList.toggle('has-notes', noteW >= 180);
  }
  layout();
  window.addEventListener('resize', layout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);

  // ── render one frame: place every card on the circle
  function render(t){
    var sway = Math.sin(t / 2600) * 1.6;   // a slow idle drift so the ring never looks frozen
    cards.forEach(function(card, i){
      var off = i - pos;
      off = mod(off + N / 2, N) - N / 2;   // wrap so every card takes the short way round
      var deg = off * STEP + sway;
      var c = Math.cos(deg * Math.PI / 180);
      var near = (c + 1) / 2;              // 1 at the front, 0 directly behind
      card.style.transform = 'translateZ(' + (-radius) + 'px) rotateY(' + deg.toFixed(2) + 'deg) translateZ(' + radius + 'px)';
      // front half of the ring is solid so nothing ghosts through it; the back half fades out
      card.style.opacity = (c >= 0 ? 1 : Math.max(0, 1 + c / 0.6) * 0.55).toFixed(3);
      card.style.zIndex = Math.round(near * 100);
      // side cards go slightly grey and soft so the front one reads first
      card.style.filter = c > 0.95 ? '' : 'saturate(' + (0.55 + 0.45 * c).toFixed(2) + ') brightness(' + (0.9 + 0.1 * c).toFixed(3) + ')' + (c < 0.2 ? ' blur(' + ((0.2 - c) * 2.2).toFixed(1) + 'px)' : '');
    });
    var f = front();
    if (f !== lastFront){
      lastFront = f;
      cards.forEach(function(c, i){
        var on = i === f;
        c.classList.toggle('is-front', on);
        c.setAttribute('aria-hidden', on ? 'false' : 'true');
        tabs[i].setAttribute('aria-selected', on ? 'true' : 'false');
      });
      count.textContent = (f + 1) + ' / ' + N;
      swapNotes(f);
    }
    tabs.forEach(function(tb, i){
      tb.querySelector('.bar').style.transform = 'scaleX(' + (i === f ? Math.min(held / DWELL, 1) : 0) + ')';
    });
  }

  var last = performance.now();
  function frame(t){
    var dt = Math.min(t - last, 250); last = t;   // capped so a long stall (tab switch) doesn't jump the ring
    if (!dragging){
      pos += (target - pos) * (1 - Math.exp(-dt / EASE_TAU));
      if (Math.abs(target - pos) < 0.001) pos = target;
      var settled = Math.abs(target - pos) < 0.02;
      if (settled && !paused && onScreen && !document.hidden){
        held += dt;
        if (held >= DWELL){ target += 1; held = 0; }
      }
    }
    if (onScreen) render(t);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  if ('IntersectionObserver' in window){
    new IntersectionObserver(function(es){ onScreen = es[es.length - 1].isIntersecting; }, {threshold:0.15}).observe(stage);
  }

  // hovering the ring (mouse only) or focusing inside it holds the current card
  stage.addEventListener('mouseenter', function(){ paused = true; });
  stage.addEventListener('mouseleave', function(){ paused = false; });
  ring.addEventListener('focusin', function(){ paused = true; });
  ring.addEventListener('focusout', function(){ paused = false; });

  // ── drag / swipe to spin; a short tap on a side card brings it to the front
  stage.addEventListener('pointerdown', function(e){
    if (e.button !== undefined && e.button !== 0) return;
    dragging = {x: e.clientX, y: e.clientY, pos0: pos, moved: false, id: e.pointerId, card: e.target.closest('.field')};
  });
  window.addEventListener('pointermove', function(e){
    if (!dragging || e.pointerId !== dragging.id) return;
    var dx = e.clientX - dragging.x;
    if (!dragging.moved && Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(e.clientY - dragging.y)){
      dragging.moved = true; stage.classList.add('dragging');
      try { stage.setPointerCapture(e.pointerId); } catch(_){}
    }
    if (dragging.moved) pos = dragging.pos0 - dx / (cardW * 0.85);
  });
  function release(e){
    if (!dragging || e.pointerId !== dragging.id) return;
    if (dragging.moved){
      target = Math.round(pos); held = 0;
    } else if (dragging.card){
      var i = cards.indexOf(dragging.card);
      if (i !== front()) goTo(i);
    }
    dragging = null; stage.classList.remove('dragging');
  }
  window.addEventListener('pointerup', release);
  window.addEventListener('pointercancel', release);
})();
