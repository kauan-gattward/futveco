/* FUT.VECO — Área do professor (DEMO). Sem innerHTML: todo dado do usuário entra via textContent. */
(function () {
  'use strict';
  var R = window.FV.repo, U = window.FV.util, doc = document;
  var SESSION = 'fv_admin_session';
  var DEMO = { email: 'demo@futveco.com', senha: 'futveco' };
  var PROFS = ['@veveco.ftv', '@jpzin__19', '@mar.1aac'];
  var NIVEIS = ['iniciante', 'intermediário', 'avançado'];
  var DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  var DIAS_C = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  var MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  var brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

  /* ---------- helpers ---------- */
  function h(tag, props) {
    var el = doc.createElement(tag);
    if (props) Object.keys(props).forEach(function (k) {
      var v = props[k]; if (v == null || v === false) return;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else if (k in el && typeof v !== 'string') el[k] = v;
      else el.setAttribute(k, v === true ? '' : v);
    });
    for (var i = 2; i < arguments.length; i++) add(el, arguments[i]);
    return el;
  }
  function add(el, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) return c.forEach(function (x) { add(el, x); });
    el.appendChild(c.nodeType ? c : doc.createTextNode(String(c)));
  }
  function $(s, r) { return (r || doc).querySelector(s); }
  function today() { return U.iso(new Date()); }
  function pd(s) { var p = String(s || '').split('-'); return new Date(+p[0], +p[1] - 1, +p[2] || 1, 12); }
  function fdate(s) { if (!s) return '—'; var d = pd(s); return U.pad(d.getDate()) + '/' + U.pad(d.getMonth() + 1) + '/' + d.getFullYear(); }
  function fdateW(s) { return s ? DIAS_C[pd(s).getDay()] + ', ' + fdate(s).slice(0, 5) : '—'; }
  function fref(r) { var p = String(r).split('-'); return MESES[+p[1] - 1] + '/' + p[0].slice(2); }
  function money(v) { return brl.format(+v || 0); }
  function initials(n) { return String(n || '?').trim().split(/\s+/).slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase(); }
  function pill(v, label) { return h('span', { class: 'pill st-' + String(v).replace(/\s/g, '_') + ' lv-' + v, text: label || String(v).replace('_', ' ') }); }
  function waLink(tel, msg) {
    var d = String(tel || '').replace(/\D/g, ''); if (d.length < 10) return null;
    if (d.length <= 11) d = '55' + d;
    return 'https://wa.me/' + d + (msg ? '?text=' + encodeURIComponent(msg) : '');
  }
  function waBtn(tel, nome) {
    var url = waLink(tel, 'Olá ' + String(nome || '').split(' ')[0] + '! Aqui é da FUT.VECO');
    return url ? h('a', { class: 'btn sm wa', href: url, target: '_blank', rel: 'noopener noreferrer', 'aria-label': 'WhatsApp de ' + nome }, 'WhatsApp') : null;
  }
  function toast(msg) {
    var t = h('div', { class: 'toast', role: 'status', text: msg }); $('#toasts').appendChild(t);
    setTimeout(function () { t.remove(); }, 3200);
  }
  function weekStart(d) { d = new Date(d); d.setHours(12, 0, 0, 0); var k = (d.getDay() + 6) % 7; d.setDate(d.getDate() - k); return d; }
  function inWeek(s, ws) { var d = pd(s), e = new Date(ws); e.setDate(e.getDate() + 7); return d >= ws && d < e; }
  function byId(arr) { var m = {}; arr.forEach(function (x) { m[x.id] = x; }); return m; }
  function sortBy(arr, f) { return arr.slice().sort(function (a, b) { var x = f(a), y = f(b); return x < y ? -1 : x > y ? 1 : 0; }); }
  function empty(msg) { return h('div', { class: 'empty', text: msg }); }
  function view(title, sub, actions) {
    return h('section', { class: 'view' }, h('div', { class: 'vh' }, h('div', null, h('h1', { text: title }), sub ? h('p', { text: sub }) : null), h('div', { class: 'tools-r acts' }, actions)));
  }
  function tabs(list, current, onPick) {
    return h('div', { class: 'tabs', role: 'tablist' }, list.map(function (t) {
      return h('button', { type: 'button', role: 'tab', 'aria-selected': String(t[0] === current), text: t[1], onclick: function () { onPick(t[0]); } });
    }));
  }
  function sumVal(ps) { return ps.reduce(function (s, p) { return s + (+p.valor || 0); }, 0); }

  /* ---------- dialog forms ---------- */
  var dlg = $('#dlg'), dlgForm = $('#dlgForm'), dlgOpener = null, dlgSubmit = null;
  function openDialog(title, bodyNodes, buttons, onSubmit) {
    dlgOpener = doc.activeElement; dlgSubmit = onSubmit;
    $('#dlgTitle').textContent = title;
    $('#dlgBody').replaceChildren(); add($('#dlgBody'), bodyNodes);
    $('#dlgFoot').replaceChildren(); add($('#dlgFoot'), buttons);
    if (dlg.open) dlg.close();
    dlg.showModal();
    var f = $('#dlgBody input, #dlgBody select, #dlgBody textarea'); if (f) f.focus();
  }
  dlg.addEventListener('close', function () { if (dlgOpener && dlgOpener.isConnected) dlgOpener.focus(); });
  dlgForm.addEventListener('submit', function (e) {
    var sub = e.submitter;
    if (!sub || sub.value !== 'ok') return;
    e.preventDefault();
    dlgForm.querySelectorAll('[aria-invalid]').forEach(function (i) { i.removeAttribute('aria-invalid'); });
    var bad = [].slice.call(dlgForm.querySelectorAll('[required]')).filter(function (i) { return !i.value.trim(); });
    if (bad.length) { bad.forEach(function (i) { i.setAttribute('aria-invalid', 'true'); }); bad[0].focus(); toast('Preencha os campos obrigatórios.'); return; }
    var vals = {};
    dlgForm.querySelectorAll('[name]').forEach(function (i) {
      if (i.type === 'checkbox') { if (i.dataset.multi) { vals[i.name] = vals[i.name] || []; if (i.checked) vals[i.name].push(i.value); } else vals[i.name] = i.checked; }
      else vals[i.name] = i.type === 'number' ? (i.value === '' ? null : +i.value) : i.value.trim();
    });
    sub.disabled = true;
    Promise.resolve(dlgSubmit && dlgSubmit(vals)).then(function (keep) { if (keep !== false) dlg.close(); })
      .catch(function (err) { toast('Erro: ' + err.message); }).then(function () { sub.disabled = false; });
  });
  function field(f, val) {
    if (f && f.nodeType) return f;
    var id = 'f_' + f.name, inp;
    if (f.type === 'select') {
      inp = h('select', { id: id, name: f.name, required: f.required }, f.options.map(function (o) {
        var v = Array.isArray(o) ? o[0] : o, l = Array.isArray(o) ? o[1] : o;
        return h('option', { value: String(v), text: l, selected: String(val) === String(v) });
      }));
    } else if (f.type === 'textarea') inp = h('textarea', { id: id, name: f.name, rows: 3, maxlength: '1000' }, val || '');
    else if (f.type === 'multi') {
      var sel = val || [];
      return h('fieldset', { class: 'mf' }, h('legend', { text: f.label }), f.options.length ? h('div', { class: 'chkgrp' }, f.options.map(function (o) {
        return h('label', null, h('input', { type: 'checkbox', name: f.name, value: o[0], dataset: { multi: '1' }, checked: sel.indexOf(o[0]) >= 0 }), o[1]);
      })) : h('p', { class: 'muted', text: 'Nenhuma opção.' }));
    } else {
      var t = f.type || 'text';
      inp = h('input', { id: id, name: f.name, type: t, required: f.required, value: val == null ? '' : String(val), min: f.min, step: f.step, maxlength: /^(text|tel|email)$/.test(t) ? '120' : null, inputmode: t === 'tel' ? 'tel' : null, autocomplete: 'off' });
    }
    return h('label', { for: id }, f.label + (f.required ? ' *' : ''), inp);
  }
  function formDialog(title, fields, values, onSubmit, okLabel) {
    values = values || {};
    var nodes = fields.map(function (f) {
      if (Array.isArray(f)) return h('div', { class: 'two' }, f.map(function (x) { return field(x, values[x.name]); }));
      return field(f, f.nodeType ? null : values[f.name]);
    });
    openDialog(title, nodes, [h('button', { class: 'btn ghost', value: 'cancel', formnovalidate: true, text: 'Cancelar' }), h('button', { class: 'btn', value: 'ok', text: okLabel || 'Salvar' })], onSubmit);
  }
  function confirmDialog(title, msg, okLabel) {
    return new Promise(function (res) {
      var done = false;
      openDialog(title, [h('p', { text: msg })], [h('button', { class: 'btn ghost', value: 'cancel', formnovalidate: true, text: 'Cancelar' }), h('button', { class: 'btn danger', value: 'ok', text: okLabel || 'Confirmar' })], function () { done = true; res(true); });
      dlg.addEventListener('close', function c() { dlg.removeEventListener('close', c); if (!done) res(false); });
    });
  }

  /* ---------- auth (DEMO — não é segurança real) ---------- */
  function session() { try { return JSON.parse(sessionStorage.getItem(SESSION)); } catch (e) { return null; } }
  function showLogin() {
    $('#app').hidden = true; $('#login').hidden = false;
    var f = $('#loginForm'); f.reset(); $('#loginErr').textContent = ''; f.email.focus();
    doc.title = 'Área do professor — FUT.VECO';
  }
  $('#loginForm').addEventListener('submit', function (e) {
    e.preventDefault(); var f = e.target;
    if (f.email.value.trim().toLowerCase() === DEMO.email && f.senha.value === DEMO.senha) {
      sessionStorage.setItem(SESSION, JSON.stringify({ email: DEMO.email, t: Date.now() }));
      start();
    } else {
      $('#loginErr').textContent = 'E-mail ou senha incorretos. Use os dados de demonstração acima.';
      f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake'); f.senha.select();
    }
  });
  $('#fillDemo').addEventListener('click', function () { var f = $('#loginForm'); f.email.value = DEMO.email; f.senha.value = DEMO.senha; f.querySelector('[type=submit]').focus(); });
  $('#btnLogout').addEventListener('click', function () { sessionStorage.removeItem(SESSION); closeSide(); showLogin(); toast('Você saiu.'); });

  /* ---------- shell ---------- */
  var ROUTES = [['painel', '📊', 'Painel'], ['alunos', '👥', 'Alunos'], ['matriculas', '💳', 'Matrículas e planos'], ['aulas', '📅', 'Aulas e turmas'], ['agendamentos', '🕒', 'Agendamentos'], ['experimentais', '⭐', 'Aula experimental'], ['campeonatos', '🏆', 'Campeonatos']];
  var nav = $('#nav');
  ROUTES.forEach(function (r) { nav.appendChild(h('a', { href: '#/' + r[0], dataset: { r: r[0] } }, h('span', { 'aria-hidden': 'true', text: r[1] }), r[2])); });
  var side = $('#side'), scrim = $('#scrim'), burger = $('#burger');
  function openSide() { side.classList.add('open'); scrim.hidden = false; burger.setAttribute('aria-expanded', 'true'); var a = nav.querySelector('a'); if (a) a.focus(); }
  function closeSide() { if (!side.classList.contains('open')) return; side.classList.remove('open'); scrim.hidden = true; burger.setAttribute('aria-expanded', 'false'); }
  burger.addEventListener('click', function () { if (side.classList.contains('open')) closeSide(); else openSide(); });
  scrim.addEventListener('click', closeSide);
  nav.addEventListener('click', closeSide);
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && side.classList.contains('open')) { closeSide(); burger.focus(); } });

  $('#btnExport').addEventListener('click', function () {
    R.exportAll().then(function (d) {
      var url = URL.createObjectURL(new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' }));
      var a = h('a', { href: url, download: 'futveco-backup-' + today() + '.json' }); doc.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000); toast('Backup exportado.');
    });
  });
  $('#fileImport').addEventListener('change', function (e) {
    var file = e.target.files[0]; e.target.value = ''; if (!file) return;
    if (file.size > 5e6) { toast('Arquivo muito grande (máx. 5 MB).'); return; }
    file.text().then(function (t) { return R.importAll(JSON.parse(t)); }).then(function () { toast('Backup importado.'); render(); })
      .catch(function (err) { toast('Não foi possível importar: ' + err.message); });
  });
  $('#btnReset').addEventListener('click', function () {
    confirmDialog('Restaurar dados de exemplo', 'Isso apaga todos os dados deste navegador e recarrega os dados de exemplo. Continuar?', 'Restaurar')
      .then(function (ok) { if (ok) R.reset().then(function () { closeSide(); toast('Dados de exemplo restaurados.'); render(); }); });
  });

  var state = { alunosQ: '', alunosNivel: '', alunosStatus: 'ativo', matTab: 'mensal', mes: U.ym(0), pagStatus: '', aulasTab: 'agenda', wk: 0, chamadaTurma: '', chamadaData: today(), expTab: 'pendente', campCat: {} };
  var VIEWS = {};

  function start() { $('#login').hidden = true; $('#app').hidden = false; render(); }
  function render() {
    if (!session()) return showLogin();
    var parts = (location.hash || '#/painel').slice(2).split('/'), r = parts[0] || 'painel';
    if (!VIEWS[r]) r = 'painel';
    nav.querySelectorAll('a').forEach(function (a) { if (a.dataset.r === r) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    var main = $('#main');
    return Promise.resolve(VIEWS[r](parts[1])).then(function (v) {
      main.replaceChildren(v);
      var t = ROUTES.filter(function (x) { return x[0] === r; })[0]; doc.title = (t ? t[2] : '') + ' — FUT.VECO admin';
    }).catch(function (err) { console.error(err); main.replaceChildren(empty('Erro ao carregar: ' + err.message)); });
  }
  window.addEventListener('hashchange', function () { if (!session()) return; render(); var m = $('#main'); m.focus({ preventScroll: true }); window.scrollTo(0, 0); });

  /* ---------- Painel ---------- */
  function kpi(n, label, href) { return h('a', { class: 'card kpi', href: href }, h('b', { text: String(n) }), h('span', { text: label })); }
  function barChart(data, cls) {
    var max = Math.max.apply(null, data.map(function (d) { return d[1]; }).concat([1]));
    return h('div', { class: 'bars', role: 'img', 'aria-label': data.map(function (d) { return d[0] + ': ' + d[1]; }).join(', ') }, data.map(function (d, i) {
      var bar = h('i', { class: cls || '' }); bar.style.height = Math.max(3, d[1] / max * 100) + '%'; bar.style.animationDelay = i * 60 + 'ms';
      return h('div', { class: 'bar', 'aria-hidden': 'true' }, h('small', { text: String(d[1]) }), bar, h('small', { text: d[0] }));
    }));
  }
  function stackChart(data) {
    var max = Math.max.apply(null, data.map(function (d) { return d[1] + d[2]; }).concat([1]));
    return h('div', { class: 'bars', role: 'img', 'aria-label': data.map(function (d) { return d[0] + ': pago ' + money(d[1]) + ', em aberto ' + money(d[2]); }).join('; ') }, data.map(function (d, i) {
      var a = h('i', { class: 'red' }), p = h('i', { class: 'green' });
      a.style.height = (d[2] / max * 100) + '%'; p.style.height = (d[1] / max * 100) + '%'; a.style.animationDelay = p.style.animationDelay = i * 60 + 'ms';
      return h('div', { class: 'bar', 'aria-hidden': 'true' }, h('small', { text: String(Math.round(d[1] + d[2])) }), h('div', { class: 'stack2' }, a, p), h('small', { text: d[0] }));
    }));
  }
  VIEWS.painel = async function () {
    var all = await Promise.all(['alunos', 'pagamentos', 'turmas', 'agendamentos', 'experimentais', 'campeonatos'].map(function (c) { return R.list(c); }));
    var alunos = all[0], pags = all[1], turmas = all[2], ags = all[3], exps = all[4], camps = all[5];
    var ativos = alunos.filter(function (a) { return a.status === 'ativo'; });
    var ws = weekStart(new Date());
    var agSem = ags.filter(function (a) { return a.status !== 'cancelado' && inWeek(a.data, ws); });
    var pend = exps.filter(function (e) { return e.status === 'pendente'; });
    var abertos = pags.filter(function (p) { return p.status === 'aberto'; });
    var prox = sortBy(camps.filter(function (c) { return c.data >= today(); }), function (c) { return c.data; })[0];
    var hr = new Date().getHours(), saud = hr < 12 ? 'Bom dia' : hr < 18 ? 'Boa tarde' : 'Boa noite';
    var v = view('Painel', saud + ', professor! Resumo da FUT.VECO — ' + fdate(today()));
    v.appendChild(h('div', { class: 'grid g4', id: 'kpis' },
      kpi(ativos.length, 'alunos ativos', '#/alunos'),
      kpi(turmas.length + agSem.length, 'aulas na semana', '#/aulas'),
      kpi(pend.length, 'experimentais pendentes', '#/experimentais'),
      kpi(abertos.length, 'mensalidades em aberto · ' + money(sumVal(abertos)), '#/matriculas')));
    var porNivel = NIVEIS.map(function (n) { return [n, ativos.filter(function (a) { return a.nivel === n; }).length]; });
    var meses = [-5, -4, -3, -2, -1, 0].map(function (k) {
      var r = U.ym(k), ps = pags.filter(function (p) { return p.referencia === r; });
      return [fref(r), sumVal(ps.filter(function (p) { return p.status === 'pago'; })), sumVal(ps.filter(function (p) { return p.status === 'aberto'; }))];
    });
    var porDia = [1, 2, 3, 4, 5, 6, 0].map(function (d) { return [DIAS_C[d], turmas.filter(function (t) { return +t.dia_semana === d; }).length + agSem.filter(function (a) { return pd(a.data).getDay() === d; }).length]; });
    v.appendChild(h('div', { class: 'grid g2 mt' },
      h('div', { class: 'card' }, h('h3', { text: 'Mensalidades (R$)' }), stackChart(meses), h('div', { class: 'legend' }, h('span', { class: 'lg-g', text: 'pago' }), h('span', { class: 'lg-r', text: 'em aberto' }))),
      h('div', { class: 'card' }, h('h3', { text: 'Aulas por dia (semana)' }), barChart(porDia, 'b')),
      h('div', { class: 'card' }, h('h3', { text: 'Alunos ativos por nível' }), barChart(porNivel, 'c')),
      prox ? h('a', { class: 'card dark', href: '#/campeonatos/' + prox.id }, h('p', { class: 'muted', text: 'Próximo campeonato' }), h('h3', { text: '🏆 ' + prox.nome }), h('p', { text: fdateW(prox.data) + ' · ' + (prox.local || '') }),
        h('p', { class: 'muted', text: 'Faltam ' + Math.round((pd(prox.data) - pd(today())) / 864e5) + ' dias · ' + (prox.categorias || []).join(', ') }))
        : h('div', { class: 'card' }, h('h3', { text: 'Próximo campeonato' }), h('p', { class: 'muted', text: 'Nenhum campeonato futuro.' }), h('a', { class: 'btn sm', href: '#/campeonatos', text: 'Criar campeonato' }))));
    var hoje = new Date().getDay();
    var hojeT = sortBy(turmas.filter(function (t) { return +t.dia_semana === hoje; }), function (t) { return t.hora; });
    v.appendChild(h('div', { class: 'grid g2 mt' },
      h('div', { class: 'card' }, h('h3', { text: 'Aulas de hoje' }), hojeT.length ? h('div', { class: 'list' }, hojeT.map(function (t) {
        return h('div', { class: 'row' }, h('div', { class: 'main-c' }, h('b', { text: t.hora + ' · ' + t.nome }), h('small', { text: t.professor + ' · ' + (t.aluno_ids || []).length + '/' + t.vagas + ' alunos' })),
          h('button', { class: 'btn sm sec', type: 'button', text: 'Fazer chamada', onclick: function () { state.aulasTab = 'chamada'; state.chamadaTurma = t.id; state.chamadaData = today(); location.hash = '#/aulas'; } }));
      })) : h('p', { class: 'muted', text: 'Sem turmas hoje.' })),
      h('div', { class: 'card' }, h('h3', { text: 'Experimentais pendentes' }), pend.length ? h('div', { class: 'list' }, pend.slice(0, 4).map(function (e) {
        return h('div', { class: 'row' }, h('div', { class: 'main-c' }, h('b', { text: e.nome }), h('small', { text: fdateW(e.data) + ' · ' + e.nivel })), waBtn(e.telefone, e.nome));
      })) : h('p', { class: 'muted', text: 'Nenhum pedido pendente. 🎉' }))));
    return v;
  };

  /* ---------- Alunos ---------- */
  var ALUNO_FIELDS = [{ name: 'nome', label: 'Nome completo', required: true }, [{ name: 'telefone', label: 'WhatsApp', type: 'tel' }, { name: 'email', label: 'E-mail', type: 'email' }],
    [{ name: 'nivel', label: 'Nível', type: 'select', options: NIVEIS }, { name: 'status', label: 'Status', type: 'select', options: [['ativo', 'Ativo'], ['inativo', 'Inativo']] }],
    [{ name: 'desde', label: 'Aluno desde', type: 'date' }, { name: 'nascimento', label: 'Nascimento', type: 'date' }], { name: 'observacoes', label: 'Observações', type: 'textarea' }];
  function alunoForm(a) {
    formDialog(a ? 'Editar aluno' : 'Novo aluno', ALUNO_FIELDS, a || { status: 'ativo', nivel: 'iniciante', desde: today() }, async function (v) {
      if (a) await R.update('alunos', a.id, v); else await R.create('alunos', v);
      toast(a ? 'Aluno atualizado.' : 'Aluno cadastrado! 🎉'); render();
    });
  }
  VIEWS.alunos = async function () {
    var alunos = sortBy(await R.list('alunos'), function (a) { return String(a.nome).toLowerCase(); });
    var v = view('Alunos', alunos.filter(function (a) { return a.status === 'ativo'; }).length + ' ativos · ' + alunos.length + ' no total', h('button', { class: 'btn', type: 'button', id: 'novoAluno', text: '+ Novo aluno', onclick: function () { alunoForm(); } }));
    var q = h('input', { type: 'search', id: 'buscaAluno', placeholder: 'Buscar por nome, telefone ou e-mail', 'aria-label': 'Buscar alunos', value: state.alunosQ });
    var fn = h('select', { 'aria-label': 'Filtrar por nível' }, h('option', { value: '', text: 'Todos os níveis' }), NIVEIS.map(function (n) { return h('option', { value: n, text: n, selected: state.alunosNivel === n }); }));
    var fs = h('select', { id: 'fStatus', 'aria-label': 'Filtrar por status' }, [['', 'Todos'], ['ativo', 'Ativos'], ['inativo', 'Inativos']].map(function (o) { return h('option', { value: o[0], text: o[1], selected: state.alunosStatus === o[0] }); }));
    var list = h('div', { class: 'list', id: 'alunosList' });
    function draw() {
      state.alunosQ = q.value; state.alunosNivel = fn.value; state.alunosStatus = fs.value;
      var t = q.value.trim().toLowerCase();
      var f = alunos.filter(function (a) { return (!fn.value || a.nivel === fn.value) && (!fs.value || a.status === fs.value) && (!t || [a.nome, a.telefone, a.email].join(' ').toLowerCase().indexOf(t) >= 0); });
      list.replaceChildren();
      if (!f.length) { list.appendChild(empty('Nenhum aluno encontrado.')); return; }
      f.forEach(function (a, i) {
        var r = h('div', { class: 'row', dataset: { aluno: a.nome } }, h('div', { class: 'av', 'aria-hidden': 'true', text: initials(a.nome) }),
          h('div', { class: 'main-c' }, h('b', { text: a.nome }), h('small', { text: [a.telefone, a.email].filter(Boolean).join(' · ') || 'sem contato' })),
          pill(a.nivel), pill(a.status),
          h('div', { class: 'acts' }, waBtn(a.telefone, a.nome),
            h('button', { class: 'btn sm ghost', type: 'button', text: 'Editar', 'aria-label': 'Editar ' + a.nome, onclick: function () { alunoForm(a); } }),
            h('button', { class: 'btn sm danger', type: 'button', text: 'Excluir', 'aria-label': 'Excluir ' + a.nome, onclick: function () { delAluno(a); } })));
        r.style.animationDelay = Math.min(i, 10) * 30 + 'ms'; list.appendChild(r);
      });
    }
    q.addEventListener('input', draw); fn.addEventListener('change', draw); fs.addEventListener('change', draw);
    v.appendChild(h('div', { class: 'tools' }, q, fn, fs)); v.appendChild(list); draw();
    return v;
  };
  async function delAluno(a) {
    if (!(await confirmDialog('Excluir aluno', 'Excluir "' + a.nome + '"? As matrículas e mensalidades dele também serão removidas.', 'Excluir'))) return;
    var ms = await R.list('matriculas', { aluno_id: a.id }), ps = await R.list('pagamentos', { aluno_id: a.id }), ts = await R.list('turmas');
    for (var i = 0; i < ms.length; i++) await R.remove('matriculas', ms[i].id);
    for (i = 0; i < ps.length; i++) await R.remove('pagamentos', ps[i].id);
    for (i = 0; i < ts.length; i++) if ((ts[i].aluno_ids || []).indexOf(a.id) >= 0) await R.update('turmas', ts[i].id, { aluno_ids: ts[i].aluno_ids.filter(function (x) { return x !== a.id; }) });
    await R.remove('alunos', a.id); toast('Aluno excluído.'); render();
  }

  /* ---------- Matrículas e planos ---------- */
  VIEWS.matriculas = async function () {
    var all = await Promise.all(['alunos', 'planos', 'matriculas', 'pagamentos'].map(function (c) { return R.list(c); }));
    var alunos = all[0], planos = all[1], mats = all[2], pags = all[3], A = byId(alunos), P = byId(planos);
    var v = view('Matrículas e planos', 'Valores são dados de exemplo.');
    v.appendChild(tabs([['mensal', 'Mensalidades'], ['mat', 'Matrículas'], ['planos', 'Planos']], state.matTab, function (t) { state.matTab = t; render(); }));
    var acts = v.querySelector('.tools-r');
    if (state.matTab === 'mensal') {
      var refs = {}; pags.forEach(function (p) { refs[p.referencia] = 1; }); refs[U.ym(0)] = 1; refs[U.ym(1)] = 1;
      var mes = h('select', { 'aria-label': 'Mês de referência' }, Object.keys(refs).sort().reverse().map(function (r) { return h('option', { value: r, text: fref(r), selected: r === state.mes }); }));
      var st = h('select', { 'aria-label': 'Status do pagamento' }, [['', 'Todos'], ['aberto', 'Em aberto'], ['pago', 'Pagos']].map(function (o) { return h('option', { value: o[0], text: o[1], selected: state.pagStatus === o[0] }); }));
      mes.onchange = function () { state.mes = mes.value; render(); }; st.onchange = function () { state.pagStatus = st.value; render(); };
      var doMes = pags.filter(function (p) { return p.referencia === state.mes; });
      var lista = sortBy(doMes.filter(function (p) { return !state.pagStatus || p.status === state.pagStatus; }), function (p) { return (p.status === 'aberto' ? '0' : '1') + (A[p.aluno_id] ? A[p.aluno_id].nome : ''); });
      var pagos = doMes.filter(function (p) { return p.status === 'pago'; }), abertos = doMes.filter(function (p) { return p.status === 'aberto'; });
      v.appendChild(h('div', { class: 'tools' }, mes, st, h('button', { class: 'btn sec', type: 'button', text: 'Gerar mensalidades do mês', onclick: async function () {
        var n = 0;
        for (var i = 0; i < mats.length; i++) {
          var m = mats[i];
          if (m.status !== 'ativa' || doMes.some(function (p) { return p.matricula_id === m.id; })) continue;
          var pl = P[m.plano_id];
          await R.create('pagamentos', { matricula_id: m.id, aluno_id: m.aluno_id, referencia: state.mes, valor: pl ? pl.valor : 0, vencimento: state.mes + '-' + U.pad(+m.dia_vencimento || 10), status: 'aberto', pago_em: null }); n++;
        }
        toast(n ? n + ' mensalidade(s) gerada(s).' : 'Todas as mensalidades do mês já existem.'); render();
      } })));
      v.appendChild(h('div', { class: 'grid g4' }, kpi(money(sumVal(pagos)), 'recebido em ' + fref(state.mes), '#/matriculas'), kpi(money(sumVal(abertos)), 'em aberto', '#/matriculas'),
        kpi(pagos.length + '/' + doMes.length, 'pagas', '#/matriculas'), kpi(abertos.filter(function (p) { return p.vencimento < today(); }).length, 'atrasadas', '#/matriculas')));
      var l = h('div', { class: 'list mt', id: 'pagList' });
      if (!lista.length) l.appendChild(empty('Nenhuma mensalidade neste filtro.'));
      lista.forEach(function (p) {
        var a = A[p.aluno_id] || { nome: '(aluno removido)' }, atras = p.status === 'aberto' && p.vencimento < today();
        l.appendChild(h('div', { class: 'row', dataset: { aluno: a.nome } }, h('div', { class: 'main-c' }, h('b', { text: a.nome }), h('small', { text: money(p.valor) + ' · vence ' + fdate(p.vencimento) + (p.pago_em ? ' · pago em ' + fdate(p.pago_em) : '') })),
          pill(atras ? 'atrasado' : p.status, atras ? 'atrasado' : p.status === 'pago' ? 'pago' : 'em aberto'),
          h('div', { class: 'acts' }, p.status === 'aberto' ? waBtn(a.telefone, a.nome) : null,
            h('button', { class: 'btn sm ' + (p.status === 'pago' ? 'ghost' : ''), type: 'button', dataset: { pag: p.status }, text: p.status === 'pago' ? 'Marcar em aberto' : 'Marcar pago', onclick: async function () {
              await R.update('pagamentos', p.id, p.status === 'pago' ? { status: 'aberto', pago_em: null } : { status: 'pago', pago_em: today() });
              toast(p.status === 'pago' ? 'Marcada como em aberto.' : 'Pagamento registrado ✅'); render();
            } }))));
      });
      v.appendChild(l);
    } else if (state.matTab === 'mat') {
      var form = function (m) {
        if (!planos.length) { toast('Cadastre um plano primeiro.'); return; }
        formDialog(m ? 'Editar matrícula' : 'Nova matrícula', [
          { name: 'aluno_id', label: 'Aluno', type: 'select', required: true, options: sortBy(alunos, function (a) { return a.nome; }).map(function (a) { return [a.id, a.nome]; }) },
          { name: 'plano_id', label: 'Plano', type: 'select', required: true, options: planos.map(function (p) { return [p.id, p.nome + ' — ' + money(p.valor)]; }) },
          [{ name: 'inicio', label: 'Início', type: 'date', required: true }, { name: 'dia_vencimento', label: 'Dia do vencimento', type: 'number', min: 1, step: 1, required: true }],
          { name: 'status', label: 'Status', type: 'select', options: [['ativa', 'Ativa'], ['cancelada', 'Cancelada']] }
        ], m || { inicio: today(), dia_vencimento: 10, status: 'ativa' }, async function (val) {
          val.dia_vencimento = Math.min(28, Math.max(1, Math.round(+val.dia_vencimento || 10)));
          if (m) await R.update('matriculas', m.id, val); else await R.create('matriculas', val);
          toast('Matrícula salva.'); render();
        });
      };
      acts.appendChild(h('button', { class: 'btn', type: 'button', text: '+ Nova matrícula', onclick: function () { form(); } }));
      var lm = h('div', { class: 'list' });
      sortBy(mats, function (m) { return (m.status === 'ativa' ? '0' : '1') + (A[m.aluno_id] ? A[m.aluno_id].nome : ''); }).forEach(function (m) {
        var a = A[m.aluno_id] || { nome: '(aluno removido)' }, p = P[m.plano_id] || { nome: '(plano removido)', valor: 0 };
        lm.appendChild(h('div', { class: 'row' }, h('div', { class: 'main-c' }, h('b', { text: a.nome }), h('small', { text: p.nome + ' · ' + money(p.valor) + ' · vence dia ' + m.dia_vencimento + ' · desde ' + fdate(m.inicio) })), pill(m.status),
          h('div', { class: 'acts' }, h('button', { class: 'btn sm ghost', type: 'button', text: 'Editar', onclick: function () { form(m); } }))));
      });
      if (!mats.length) lm.appendChild(empty('Nenhuma matrícula.'));
      v.appendChild(lm);
    } else {
      var pform = function (p) {
        formDialog(p ? 'Editar plano' : 'Novo plano', [{ name: 'nome', label: 'Nome do plano', required: true }, [{ name: 'aulas_semana', label: 'Aulas por semana', type: 'number', min: 1, required: true }, { name: 'valor', label: 'Valor mensal (R$)', type: 'number', min: 0, step: '0.01', required: true }]],
          p || { aulas_semana: 2 }, async function (val) { if (p) await R.update('planos', p.id, val); else await R.create('planos', val); toast('Plano salvo.'); render(); });
      };
      acts.appendChild(h('button', { class: 'btn', type: 'button', text: '+ Novo plano', onclick: function () { pform(); } }));
      v.appendChild(h('div', { class: 'grid g4' }, planos.map(function (p) {
        var n = mats.filter(function (m) { return m.plano_id === p.id && m.status === 'ativa'; }).length;
        return h('div', { class: 'card' }, h('h3', { text: p.nome }), h('p', null, h('b', { text: money(p.valor) }), ' /mês'), h('p', { class: 'muted', text: p.aulas_semana + 'x por semana · ' + n + ' aluno(s)' }),
          h('div', { class: 'acts' }, h('button', { class: 'btn sm ghost', type: 'button', text: 'Editar', onclick: function () { pform(p); } }),
            h('button', { class: 'btn sm danger', type: 'button', text: 'Excluir', disabled: n > 0, title: n ? 'Há alunos neste plano' : null, onclick: async function () { if (await confirmDialog('Excluir plano', 'Excluir "' + p.nome + '"?', 'Excluir')) { await R.remove('planos', p.id); render(); } } })));
      })));
      if (!planos.length) v.appendChild(empty('Nenhum plano.'));
    }
    return v;
  };

  /* ---------- Aulas e turmas ---------- */
  function turmaOrder(t) { return ((+t.dia_semana + 6) % 7) + t.hora; }
  VIEWS.aulas = async function () {
    var all = await Promise.all(['alunos', 'turmas', 'agendamentos', 'experimentais', 'presencas'].map(function (c) { return R.list(c); }));
    var alunos = all[0], turmas = all[1], ags = all[2], exps = all[3], pres = all[4], A = byId(alunos);
    var v = view('Aulas e turmas', turmas.length + ' turmas semanais');
    var acts = v.querySelector('.tools-r');
    v.appendChild(tabs([['agenda', 'Agenda semanal'], ['turmas', 'Turmas'], ['chamada', 'Chamada / presença']], state.aulasTab, function (t) { state.aulasTab = t; render(); }));
    if (state.aulasTab === 'agenda') {
      var ws = weekStart(new Date()); ws.setDate(ws.getDate() + state.wk * 7);
      var we = new Date(ws); we.setDate(we.getDate() + 6);
      v.appendChild(h('div', { class: 'tools wknav' }, h('button', { class: 'btn sm ghost', type: 'button', 'aria-label': 'Semana anterior', text: '←', onclick: function () { state.wk--; render(); } }),
        h('b', { class: 'wkl', text: fdate(U.iso(ws)).slice(0, 5) + ' – ' + fdate(U.iso(we)) }),
        h('button', { class: 'btn sm ghost', type: 'button', text: 'Hoje', onclick: function () { state.wk = 0; render(); } }),
        h('button', { class: 'btn sm ghost', type: 'button', 'aria-label': 'Próxima semana', text: '→', onclick: function () { state.wk++; render(); } })));
      var wk = h('div', { class: 'week', id: 'agenda' });
      for (var i = 0; i < 7; i++) {
        var d = new Date(ws); d.setDate(d.getDate() + i);
        wk.appendChild(dayCell(U.iso(d), d.getDay()));
      }
      v.appendChild(wk);
    } else if (state.aulasTab === 'turmas') {
      var tform = function (t) {
        formDialog(t ? 'Editar turma' : 'Nova turma', [{ name: 'nome', label: 'Nome da turma', required: true },
          [{ name: 'modalidade', label: 'Modalidade', type: 'select', options: ['futevôlei', 'altinha'] }, { name: 'nivel', label: 'Nível', type: 'select', options: NIVEIS.concat(['todos']) }],
          [{ name: 'dia_semana', label: 'Dia da semana', type: 'select', options: DIAS.map(function (dd, k) { return [k, dd]; }) }, { name: 'hora', label: 'Horário', type: 'time', required: true }],
          [{ name: 'professor', label: 'Professor', type: 'select', options: PROFS }, { name: 'vagas', label: 'Vagas', type: 'number', min: 1, required: true }],
          { name: 'aluno_ids', label: 'Alunos da turma', type: 'multi', options: sortBy(alunos.filter(function (a) { return a.status === 'ativo'; }), function (a) { return a.nome; }).map(function (a) { return [a.id, a.nome]; }) }
        ], t || { modalidade: 'futevôlei', nivel: 'iniciante', dia_semana: 1, hora: '17:00', professor: PROFS[0], vagas: 10, aluno_ids: [] }, async function (val) {
          val.dia_semana = +val.dia_semana; val.duracao = 60; val.aluno_ids = val.aluno_ids || [];
          if (val.aluno_ids.length > val.vagas) { toast('A turma tem mais alunos (' + val.aluno_ids.length + ') que vagas (' + val.vagas + ').'); return false; }
          if (t) await R.update('turmas', t.id, val); else await R.create('turmas', val); toast('Turma salva.'); render();
        });
      };
      acts.appendChild(h('button', { class: 'btn', type: 'button', text: '+ Nova turma', onclick: function () { tform(); } }));
      var lt = h('div', { class: 'list' });
      sortBy(turmas, turmaOrder).forEach(function (t) {
        var n = (t.aluno_ids || []).length;
        lt.appendChild(h('div', { class: 'row' }, h('div', { class: 'av', 'aria-hidden': 'true', text: DIAS_C[t.dia_semana] }),
          h('div', { class: 'main-c' }, h('b', { text: t.nome }), h('small', { text: DIAS[t.dia_semana] + ' ' + t.hora + ' · ' + t.modalidade + ' · ' + t.professor })),
          pill(n >= t.vagas ? 'cancelado' : 'ativo', n + '/' + t.vagas + ' vagas'),
          h('div', { class: 'acts' }, h('button', { class: 'btn sm ghost', type: 'button', text: 'Editar', onclick: function () { tform(t); } }),
            h('button', { class: 'btn sm danger', type: 'button', text: 'Excluir', onclick: async function () { if (await confirmDialog('Excluir turma', 'Excluir a turma "' + t.nome + '" (' + DIAS[t.dia_semana] + ')?', 'Excluir')) { await R.remove('turmas', t.id); render(); } } }))));
      });
      if (!turmas.length) lt.appendChild(empty('Nenhuma turma cadastrada.'));
      v.appendChild(lt);
    } else {
      if (!turmas.some(function (x) { return x.id === state.chamadaTurma; }) && turmas[0]) state.chamadaTurma = sortBy(turmas, turmaOrder)[0].id;
      var t = byId(turmas)[state.chamadaTurma];
      var selT = h('select', { id: 'chTurma', 'aria-label': 'Turma' }, sortBy(turmas, turmaOrder).map(function (x) { return h('option', { value: x.id, text: DIAS_C[x.dia_semana] + ' ' + x.hora + ' · ' + x.nome, selected: x.id === state.chamadaTurma }); }));
      var selD = h('input', { type: 'date', id: 'chData', 'aria-label': 'Data da aula', value: state.chamadaData });
      selT.onchange = function () { state.chamadaTurma = selT.value; render(); }; selD.onchange = function () { state.chamadaData = selD.value || today(); render(); };
      v.appendChild(h('div', { class: 'tools' }, selT, selD));
      if (!t) { v.appendChild(empty('Cadastre uma turma primeiro.')); return v; }
      if (pd(state.chamadaData).getDay() !== +t.dia_semana) v.appendChild(h('p', { class: 'muted', text: '⚠ Esta turma acontece às ' + DIAS[t.dia_semana].toLowerCase() + 's; a data escolhida é ' + DIAS[pd(state.chamadaData).getDay()].toLowerCase() + '.' }));
      var reg = pres.filter(function (p) { return p.turma_id === t.id && p.data === state.chamadaData; })[0];
      var presentes = reg ? reg.presentes : [];
      var ids = (t.aluno_ids || []).filter(function (id) { return A[id]; });
      var box = h('div', { class: 'checks', id: 'chamada' }, ids.length ? ids.map(function (id) {
        return h('label', { class: 'check' }, h('input', { type: 'checkbox', value: id, checked: presentes.indexOf(id) >= 0 }), A[id].nome);
      }) : empty('Nenhum aluno nesta turma.'));
      var cnt = h('b', { id: 'chCount', text: presentes.length + '/' + ids.length + ' presentes' });
      box.addEventListener('change', function () { cnt.textContent = box.querySelectorAll('input:checked').length + '/' + ids.length + ' presentes'; });
      v.appendChild(h('div', { class: 'card' }, h('h3', { text: 'Chamada — ' + t.nome + ' · ' + fdateW(state.chamadaData) }), h('div', { class: 'tools' }, cnt,
        h('button', { class: 'btn sm ghost', type: 'button', text: 'Marcar todos', onclick: function () { box.querySelectorAll('input').forEach(function (x) { x.checked = true; }); box.dispatchEvent(new Event('change')); } })), box,
        h('p', { class: 'mt' }, h('button', { class: 'btn', type: 'button', id: 'salvarChamada', text: reg ? 'Atualizar chamada' : 'Salvar chamada', onclick: async function () {
          var sel = [].map.call(box.querySelectorAll('input:checked'), function (x) { return x.value; });
          if (reg) await R.update('presencas', reg.id, { presentes: sel }); else await R.create('presencas', { turma_id: t.id, data: state.chamadaData, presentes: sel });
          toast('Chamada salva: ' + sel.length + ' presente(s) ✅'); render();
        } }))));
      var hist = sortBy(pres.filter(function (p) { return p.turma_id === t.id; }), function (p) { return p.data; }).reverse();
      v.appendChild(h('div', { class: 'card mt' }, h('h3', { text: 'Histórico de presença' }), hist.length ? h('div', { class: 'list', id: 'histPres' }, hist.slice(0, 10).map(function (p) {
        return h('div', { class: 'row' }, h('div', { class: 'main-c' }, h('b', { text: fdateW(p.data) }), h('small', { text: p.presentes.map(function (id) { return A[id] ? A[id].nome.split(' ')[0] : '?'; }).join(', ') || 'ninguém' })), pill('ativo', p.presentes.length + '/' + ids.length));
      })) : h('p', { class: 'muted', text: 'Nenhuma chamada registrada.' })));
    }
    return v;
    function dayCell(ds, dow) {
      var evs = sortBy(turmas.filter(function (t) { return +t.dia_semana === dow; }).map(function (t) { return { h: t.hora, t: t }; })
        .concat(ags.filter(function (a) { return a.data === ds && a.status !== 'cancelado'; }).map(function (a) { return { h: a.hora, a: a }; }))
        .concat(exps.filter(function (e) { return e.data === ds && (e.status === 'pendente' || e.status === 'confirmada'); }).map(function (e) { return { h: '99', e: e }; })), function (x) { return x.h; });
      return h('div', { class: 'day' + (ds === today() ? ' today' : '') }, h('h4', null, h('span', { text: DIAS[dow] }), h('span', { text: fdate(ds).slice(0, 5) })),
        evs.length ? evs.map(function (x) {
          if (x.t) return h('button', { class: 'ev', type: 'button', 'aria-label': 'Fazer chamada: ' + x.t.nome + ', ' + fdate(ds), onclick: function () { state.aulasTab = 'chamada'; state.chamadaTurma = x.t.id; state.chamadaData = ds; render(); } },
            h('b', { text: x.t.hora + ' ' + x.t.nome }), x.t.professor + ' · ' + (x.t.aluno_ids || []).length + '/' + x.t.vagas);
          if (x.a) return h('a', { class: 'ev ag', href: '#/agendamentos' }, h('b', { text: x.a.hora + ' ' + (x.a.tipo === 'particular' ? 'Particular' : 'Avulsa') }), x.a.nome + ' · ' + x.a.professor);
          return h('a', { class: 'ev ex', href: '#/experimentais' }, h('b', { text: '⭐ Experimental' }), x.e.nome);
        }) : h('small', { class: 'muted', text: 'Livre' }));
    }
  };

  /* ---------- Agendamentos ---------- */
  VIEWS.agendamentos = async function () {
    var ags = await R.list('agendamentos'), alunos = await R.list('alunos');
    var v = view('Agendamentos', 'Aulas avulsas e particulares');
    var form = function (a) {
      formDialog(a ? 'Editar agendamento' : 'Agendar aula avulsa', [
        { name: 'aluno_id', label: 'Aluno cadastrado (opcional)', type: 'select', options: [['', '— não é aluno —']].concat(sortBy(alunos, function (x) { return x.nome; }).map(function (x) { return [x.id, x.nome]; })) },
        { name: 'nome', label: 'Nome (se não for aluno)' }, { name: 'telefone', label: 'WhatsApp', type: 'tel' },
        [{ name: 'data', label: 'Data', type: 'date', required: true }, { name: 'hora', label: 'Horário', type: 'time', required: true }],
        [{ name: 'professor', label: 'Professor', type: 'select', options: PROFS }, { name: 'tipo', label: 'Tipo', type: 'select', options: [['avulsa', 'Aula avulsa'], ['particular', 'Particular']] }],
        { name: 'status', label: 'Status', type: 'select', options: ['agendado', 'confirmado', 'cancelado'] }, { name: 'obs', label: 'Observações', type: 'textarea' }
      ], a || { data: U.addDays(1), hora: '09:00', professor: PROFS[0], tipo: 'avulsa', status: 'agendado' }, async function (val) {
        var al = alunos.filter(function (x) { return x.id === val.aluno_id; })[0];
        if (al) { val.nome = al.nome; val.telefone = val.telefone || al.telefone; } else val.aluno_id = null;
        if (!val.nome) { toast('Informe o nome ou escolha um aluno.'); return false; }
        if (a) await R.update('agendamentos', a.id, val); else await R.create('agendamentos', val); toast('Agendamento salvo.'); render();
      });
    };
    v.querySelector('.tools-r').appendChild(h('button', { class: 'btn', type: 'button', id: 'novoAg', text: '+ Agendar aula', onclick: function () { form(); } }));
    var fut = sortBy(ags.filter(function (a) { return a.data >= today(); }), function (a) { return a.data + a.hora; });
    var pas = sortBy(ags.filter(function (a) { return a.data < today(); }), function (a) { return a.data + a.hora; }).reverse();
    function rows(arr) {
      return arr.length ? h('div', { class: 'list' }, arr.map(function (a) {
        return h('div', { class: 'row' }, h('div', { class: 'av', 'aria-hidden': 'true', text: a.hora }), h('div', { class: 'main-c' }, h('b', { text: a.nome }), h('small', { text: fdateW(a.data) + ' · ' + (a.tipo === 'particular' ? 'Particular' : 'Avulsa') + ' · ' + a.professor + (a.obs ? ' · ' + a.obs : '') })), pill(a.status),
          h('div', { class: 'acts' }, waBtn(a.telefone, a.nome), h('button', { class: 'btn sm ghost', type: 'button', text: 'Editar', onclick: function () { form(a); } }),
            h('button', { class: 'btn sm danger', type: 'button', text: 'Excluir', onclick: async function () { if (await confirmDialog('Excluir agendamento', 'Excluir o agendamento de ' + a.nome + '?', 'Excluir')) { await R.remove('agendamentos', a.id); render(); } } })));
      })) : empty('Nada por aqui.');
    }
    v.appendChild(h('h2', { class: 'sh', text: 'Próximos' })); v.appendChild(rows(fut));
    v.appendChild(h('h2', { class: 'sh', text: 'Anteriores' })); v.appendChild(rows(pas));
    return v;
  };

  /* ---------- Aula experimental ---------- */
  var EXP_ST = [['pendente', 'Pendente'], ['confirmada', 'Confirmada'], ['compareceu', 'Compareceu'], ['virou_aluno', 'Virou aluno']];
  function expLabel(s) { var f = EXP_ST.filter(function (x) { return x[0] === s; })[0]; return f ? f[1] : s; }
  VIEWS.experimentais = async function () {
    var exps = await R.list('experimentais');
    var v = view('Aula experimental', 'Pedidos do site, do Instagram e cadastrados aqui');
    var form = function (e) {
      formDialog(e ? 'Editar pedido' : 'Novo pedido de aula experimental', [{ name: 'nome', label: 'Nome', required: true }, { name: 'telefone', label: 'WhatsApp', type: 'tel', required: true },
        [{ name: 'nivel', label: 'Nível', type: 'select', options: NIVEIS }, { name: 'data', label: 'Data', type: 'date', required: true }],
        [{ name: 'status', label: 'Status', type: 'select', options: EXP_ST.slice(0, 3) }, { name: 'origem', label: 'Origem', type: 'select', options: ['instagram', 'site', 'indicação', 'praia'] }], { name: 'obs', label: 'Observações', type: 'textarea' }],
        e || { nivel: 'iniciante', data: U.addDays(2), status: 'pendente', origem: 'instagram' }, async function (val) {
          if (e) await R.update('experimentais', e.id, val); else await R.create('experimentais', val); toast('Pedido salvo.'); render();
        });
    };
    v.querySelector('.tools-r').appendChild(h('button', { class: 'btn', type: 'button', text: '+ Novo pedido', onclick: function () { form(); } }));
    v.appendChild(tabs([['', 'Todos (' + exps.length + ')']].concat(EXP_ST.map(function (s) { return [s[0], s[1] + ' (' + exps.filter(function (e) { return e.status === s[0]; }).length + ')']; })), state.expTab, function (t) { state.expTab = t; render(); }));
    var l = h('div', { class: 'list', id: 'expList' });
    var f = sortBy(exps.filter(function (e) { return !state.expTab || e.status === state.expTab; }), function (e) { return e.data; });
    if (!f.length) l.appendChild(empty('Nenhum pedido aqui.'));
    f.forEach(function (e) {
      var sel = h('select', { 'aria-label': 'Status de ' + e.nome, class: 'stsel' }, EXP_ST.map(function (s) { return h('option', { value: s[0], text: s[1], selected: e.status === s[0] }); }));
      sel.onchange = async function () {
        if (sel.value === 'virou_aluno' && !e.aluno_id) { sel.value = e.status; converter(e); return; }
        await R.update('experimentais', e.id, { status: sel.value }); toast('Status: ' + expLabel(sel.value)); render();
      };
      l.appendChild(h('div', { class: 'row', dataset: { exp: e.nome } }, h('div', { class: 'av', 'aria-hidden': 'true', text: initials(e.nome) }),
        h('div', { class: 'main-c' }, h('b', { text: e.nome }), h('small', { text: fdateW(e.data) + ' · ' + e.nivel + ' · ' + (e.telefone || '') + ' · via ' + (e.origem || '—') + (e.obs ? ' · ' + e.obs : '') })),
        pill(e.status, expLabel(e.status)),
        h('div', { class: 'acts' }, waBtn(e.telefone, e.nome), sel,
          e.status !== 'virou_aluno' ? h('button', { class: 'btn sm sec conv', type: 'button', text: '→ Virar aluno', onclick: function () { converter(e); } }) : null,
          h('button', { class: 'btn sm ghost', type: 'button', text: 'Editar', onclick: function () { form(e); } }),
          h('button', { class: 'btn sm danger', type: 'button', text: 'Excluir', 'aria-label': 'Excluir pedido de ' + e.nome, onclick: async function () { if (await confirmDialog('Excluir pedido', 'Excluir o pedido de ' + e.nome + '?', 'Excluir')) { await R.remove('experimentais', e.id); render(); } } }))));
    });
    v.appendChild(l);
    return v;
  };
  async function converter(e) {
    var planos = await R.list('planos');
    formDialog('Transformar em aluno', [{ name: 'nome', label: 'Nome', required: true }, { name: 'telefone', label: 'WhatsApp', type: 'tel' }, { name: 'nivel', label: 'Nível', type: 'select', options: NIVEIS },
      { name: 'plano_id', label: 'Matricular no plano', type: 'select', options: [['', '— matricular depois —']].concat(planos.map(function (p) { return [p.id, p.nome + ' — ' + money(p.valor)]; })) }],
      { nome: String(e.nome).replace(/\s*\(exemplo\)\s*$/, ''), telefone: e.telefone, nivel: e.nivel }, async function (val) {
        var a = await R.create('alunos', { nome: val.nome, telefone: val.telefone, email: '', nivel: val.nivel, status: 'ativo', desde: today(), observacoes: 'Veio da aula experimental (' + fdate(e.data) + ')' });
        if (val.plano_id) await R.create('matriculas', { aluno_id: a.id, plano_id: val.plano_id, inicio: today(), dia_vencimento: 10, status: 'ativa' });
        await R.update('experimentais', e.id, { status: 'virou_aluno', aluno_id: a.id });
        toast(val.nome + ' agora é aluno(a) da FUT.VECO! 🏐'); render();
      }, 'Cadastrar aluno');
  }

  /* ---------- Campeonatos ---------- */
  function dname(d) { return d ? d.jogador1 + ' / ' + d.jogador2 : 'a definir'; }
  function roundName(r, total) { var k = total - r; return k === 0 ? 'Final' : k === 1 ? 'Semifinal' : k === 2 ? 'Quartas de final' : k === 3 ? 'Oitavas de final' : 'Rodada ' + r; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  async function genKnockout(cid, cat, teamIds) {
    var n = teamIds.length, size = 2; while (size < n) size *= 2;
    var rounds = Math.round(Math.log(size) / Math.LN2), created = [];
    for (var r = 1; r <= rounds; r++) {
      for (var p = 0; p < size / Math.pow(2, r); p++) {
        var j = { campeonato_id: cid, categoria: cat, fase: 'mata', rodada: r, pos: p, total: rounds, a: null, b: null, pa: null, pb: null, vencedor: null, bye: false };
        if (r === 1) { j.a = teamIds[p] || null; j.b = p + size / 2 < n ? teamIds[p + size / 2] : null; if (!j.b) { j.bye = true; j.vencedor = j.a; } }
        created.push(await R.create('jogos', j));
      }
    }
    for (var i = 0; i < created.length; i++) if (created[i].bye && created[i].vencedor) await advance(created[i], created);
  }
  // Leva o vencedor para o jogo seguinte; se o vencedor mudou, limpa os jogos à frente.
  async function advance(g, all) {
    all = all || await R.list('jogos', { campeonato_id: g.campeonato_id });
    var nx = all.filter(function (x) { return x.fase === 'mata' && x.categoria === g.categoria && x.rodada === g.rodada + 1 && x.pos === Math.floor(g.pos / 2); })[0];
    if (!nx) return;
    var slot = g.pos % 2 ? 'b' : 'a';
    if (nx[slot] === g.vencedor) return;
    var patch = {}; patch[slot] = g.vencedor || null;
    var reset = !!nx.vencedor; if (reset) { patch.pa = null; patch.pb = null; patch.vencedor = null; }
    Object.assign(nx, await R.update('jogos', nx.id, patch));
    if (reset) await advance(nx, all);
  }
  async function genGroups(cid, cat, teamIds) {
    var ng = Math.max(1, Math.round(teamIds.length / 4)), groups = [];
    for (var i = 0; i < ng; i++) groups.push([]);
    teamIds.forEach(function (t, k) { var row = Math.floor(k / ng), c = k % ng; groups[row % 2 ? ng - 1 - c : c].push(t); });
    for (var gi = 0; gi < ng; gi++) {
      var g = groups[gi], L = String.fromCharCode(65 + gi);
      for (var a = 0; a < g.length; a++) for (var b = a + 1; b < g.length; b++)
        await R.create('jogos', { campeonato_id: cid, categoria: cat, fase: 'grupo', grupo: L, a: g[a], b: g[b], pa: null, pb: null, vencedor: null });
    }
  }
  function standings(jogos) {
    var G = {};
    jogos.forEach(function (j) {
      var g = G[j.grupo] = G[j.grupo] || {};
      [j.a, j.b].forEach(function (t) { g[t] = g[t] || { id: t, j: 0, v: 0, d: 0, pf: 0, pc: 0 }; });
      if (j.vencedor) {
        var A = g[j.a], B = g[j.b]; A.j++; B.j++; A.pf += j.pa; A.pc += j.pb; B.pf += j.pb; B.pc += j.pa;
        if (j.vencedor === j.a) { A.v++; B.d++; } else { B.v++; A.d++; }
      }
    });
    var out = {};
    Object.keys(G).sort().forEach(function (k) { out[k] = Object.keys(G[k]).map(function (x) { return G[k][x]; }).sort(function (x, y) { return y.v - x.v || (y.pf - y.pc) - (x.pf - x.pc) || y.pf - x.pf; }); });
    return out;
  }
  function scoreDialog(j, D) {
    formDialog('Lançar placar', [h('p', { class: 'muted', text: 'Pontos de cada dupla (não existe empate).' }), [{ name: 'pa', label: dname(D[j.a]), type: 'number', min: 0, required: true }, { name: 'pb', label: dname(D[j.b]), type: 'number', min: 0, required: true }]],
      { pa: j.pa, pb: j.pb }, async function (v) {
        if (v.pa == null || v.pb == null || v.pa < 0 || v.pb < 0 || v.pa > 99 || v.pb > 99) { toast('Placar inválido.'); return false; }
        if (Math.round(v.pa) === Math.round(v.pb)) { toast('Não pode haver empate.'); return false; }
        var pa = Math.round(v.pa), pb = Math.round(v.pb), venc = pa > pb ? j.a : j.b;
        var upd = await R.update('jogos', j.id, { pa: pa, pb: pb, vencedor: venc });
        if (j.fase === 'mata') await advance(upd);
        if (j.fase === 'mata' && j.rodada === j.total) toast('🏆 Campeões: ' + dname(D[venc]) + '!'); else toast('Placar salvo.');
        render();
      }, 'Salvar placar');
  }
  function campForm(c) {
    formDialog(c ? 'Editar campeonato' : 'Novo campeonato', [{ name: 'nome', label: 'Nome', required: true }, [{ name: 'data', label: 'Data', type: 'date', required: true }, { name: 'local', label: 'Local' }],
      { name: 'categorias', label: 'Categorias (separadas por vírgula)', required: true }, { name: 'formato', label: 'Formato', type: 'select', options: [['mata', 'Mata-mata'], ['grupos', 'Fase de grupos + mata-mata']] }],
      c ? Object.assign({}, c, { categorias: (c.categorias || []).join(', ') }) : { data: U.addDays(30), local: 'Areia do CT — Itacaré', categorias: 'Misto, Masculino, Feminino', formato: 'mata' }, async function (v) {
        v.categorias = v.categorias.split(',').map(function (s) { return s.trim().slice(0, 40); }).filter(Boolean).filter(function (s, i, a) { return a.indexOf(s) === i; }).slice(0, 10);
        if (!v.categorias.length) { toast('Informe ao menos uma categoria.'); return false; }
        toast('Campeonato salvo.');
        if (c) { await R.update('campeonatos', c.id, v); render(); }
        else { v.status = 'inscricoes'; var n = await R.create('campeonatos', v); location.hash = '#/campeonatos/' + n.id; }
      });
  }
  VIEWS.campeonatos = async function (id) {
    if (id) return campDetail(id);
    var camps = await R.list('campeonatos'), duplas = await R.list('duplas');
    var v = view('Campeonatos', 'Crie campeonatos, inscreva duplas e gere as chaves', h('button', { class: 'btn', type: 'button', id: 'novoCamp', text: '+ Novo campeonato', onclick: function () { campForm(); } }));
    var g = h('div', { class: 'grid g2' });
    sortBy(camps, function (c) { return c.data; }).reverse().forEach(function (c) {
      var n = duplas.filter(function (d) { return d.campeonato_id === c.id; }).length;
      g.appendChild(h('a', { class: 'card camp', href: '#/campeonatos/' + c.id }, pill(c.status, { inscricoes: 'inscrições abertas', andamento: 'em andamento', encerrado: 'encerrado' }[c.status] || c.status),
        h('h3', { text: '🏆 ' + c.nome }), h('p', { text: fdateW(c.data) + ' · ' + (c.local || '') }), h('p', { class: 'muted', text: n + ' dupla(s) · ' + (c.categorias || []).join(', ') + ' · ' + (c.formato === 'grupos' ? 'grupos + mata-mata' : 'mata-mata') })));
    });
    if (!camps.length) g.appendChild(empty('Nenhum campeonato ainda.'));
    v.appendChild(g); return v;
  };
  async function campDetail(id) {
    var c = await R.get('campeonatos', id);
    if (!c) return h('section', { class: 'view' }, empty('Campeonato não encontrado.'), h('p', { class: 'mt' }, h('a', { class: 'btn sm', href: '#/campeonatos', text: '← Voltar' })));
    var duplas = await R.list('duplas', { campeonato_id: id }), jogos = await R.list('jogos', { campeonato_id: id });
    var D = byId(duplas), cats = c.categorias || [];
    var cat = cats.indexOf(state.campCat[id]) >= 0 ? state.campCat[id] : cats[0];
    async function setStatus() {
      var all = await R.list('jogos', { campeonato_id: id }), st = all.length ? 'andamento' : 'inscricoes';
      if (all.length && cats.every(function (k) { return all.some(function (x) { return x.categoria === k && x.fase === 'mata' && x.rodada === x.total && x.vencedor; }); })) st = 'encerrado';
      if (st !== c.status) { c.status = st; await R.update('campeonatos', id, { status: st }); }
    }
    var v = view('🏆 ' + c.nome, fdateW(c.data) + ' · ' + (c.local || '') + ' · ' + (c.formato === 'grupos' ? 'grupos + mata-mata' : 'mata-mata'),
      [h('a', { class: 'btn sm ghost', href: '#/campeonatos', text: '← Voltar' }), h('button', { class: 'btn sm ghost', type: 'button', text: 'Editar', onclick: function () { campForm(c); } }),
        h('button', { class: 'btn sm danger', type: 'button', text: 'Excluir', onclick: async function () {
          if (!(await confirmDialog('Excluir campeonato', 'Excluir "' + c.nome + '" com todas as duplas e jogos?', 'Excluir'))) return;
          for (var i = 0; i < duplas.length; i++) await R.remove('duplas', duplas[i].id);
          for (i = 0; i < jogos.length; i++) await R.remove('jogos', jogos[i].id);
          await R.remove('campeonatos', c.id); toast('Campeonato excluído.'); location.hash = '#/campeonatos';
        } })]);
    v.appendChild(tabs(cats.map(function (k) { return [k, k + ' (' + duplas.filter(function (d) { return d.categoria === k; }).length + ')']; }), cat, function (k) { state.campCat[id] = k; render(); }));
    if (!cat) { v.appendChild(empty('Sem categorias.')); return v; }
    var cd = duplas.filter(function (d) { return d.categoria === cat; }), cj = jogos.filter(function (j) { return j.categoria === cat; });
    var gj = cj.filter(function (j) { return j.fase === 'grupo'; }), mj = cj.filter(function (j) { return j.fase === 'mata'; });
    var started = cj.length > 0;
    var dl = h('div', { class: 'list', id: 'duplas' }, cd.map(function (d, i) {
      return h('div', { class: 'row' }, h('div', { class: 'av', 'aria-hidden': 'true', text: String(i + 1) }), h('div', { class: 'main-c' }, h('b', { text: dname(d) })),
        started ? null : h('button', { class: 'btn sm danger', type: 'button', text: 'Remover', 'aria-label': 'Remover dupla ' + dname(d), onclick: async function () { await R.remove('duplas', d.id); render(); } }));
    }));
    if (!cd.length) dl.appendChild(empty('Nenhuma dupla inscrita.'));
    v.appendChild(h('div', { class: 'card' }, h('h3', { text: 'Duplas inscritas — ' + cat }),
      started ? h('p', { class: 'muted', text: 'Chaves geradas: inscrições fechadas nesta categoria.' }) : h('div', { class: 'tools' },
        h('button', { class: 'btn sm sec', type: 'button', id: 'addDupla', text: '+ Inscrever dupla', onclick: function () {
          formDialog('Inscrever dupla — ' + cat, [[{ name: 'jogador1', label: 'Jogador(a) 1', required: true }, { name: 'jogador2', label: 'Jogador(a) 2', required: true }]], {}, async function (val) {
            await R.create('duplas', { campeonato_id: id, categoria: cat, jogador1: val.jogador1, jogador2: val.jogador2 }); toast('Dupla inscrita!'); render();
          }, 'Inscrever');
        } }),
        h('button', { class: 'btn sm', type: 'button', id: 'gerarChaves', text: c.formato === 'grupos' ? '🎲 Gerar grupos' : '🎲 Gerar chaves', disabled: cd.length < 2, onclick: async function () {
          var ids = shuffle(cd.map(function (d) { return d.id; }));
          if (c.formato === 'grupos' && cd.length >= 3) await genGroups(id, cat, ids); else await genKnockout(id, cat, ids);
          await setStatus(); toast('Chaves sorteadas! 🎲'); render();
        } })), dl));
    if (started) v.querySelector('.tools-r').appendChild(h('button', { class: 'btn sm ghost', type: 'button', text: 'Refazer chaves', onclick: async function () {
      if (!(await confirmDialog('Refazer chaves', 'Apagar todos os jogos e placares da categoria ' + cat + '?', 'Apagar jogos'))) return;
      for (var i = 0; i < cj.length; i++) await R.remove('jogos', cj[i].id);
      await setStatus(); render();
    } }));
    if (gj.length) {
      var S = standings(gj), allDone = gj.every(function (j) { return j.vencedor; });
      var gw = h('div', { class: 'grid g2' });
      Object.keys(S).forEach(function (L) {
        gw.appendChild(h('div', { class: 'card' }, h('h3', { text: 'Grupo ' + L }),
          h('div', { class: 'tblw' }, h('table', { class: 'std' }, h('caption', { class: 'muted', text: 'Classificação (2 primeiros avançam)' }),
            h('thead', null, h('tr', null, ['Dupla', 'J', 'V', 'D', 'Saldo'].map(function (x) { return h('th', { scope: 'col', text: x }); }))),
            h('tbody', null, S[L].map(function (s, i) { return h('tr', { class: i < 2 ? 'q' : '' }, h('td', { text: (i + 1) + 'º ' + dname(D[s.id]) }), h('td', { text: String(s.j) }), h('td', { text: String(s.v) }), h('td', { text: String(s.d) }), h('td', { text: String(s.pf - s.pc) })); })))),
          h('div', { class: 'list mt' }, gj.filter(function (j) { return j.grupo === L; }).map(function (j) {
            return h('div', { class: 'row gjogo' }, h('div', { class: 'main-c' }, h('small', { text: dname(D[j.a]) + '  ×  ' + dname(D[j.b]) }), h('b', { text: j.vencedor ? j.pa + ' × ' + j.pb : '— × —' })),
              h('button', { class: 'btn sm ' + (j.vencedor ? 'ghost' : 'sec'), type: 'button', text: j.vencedor ? 'Editar' : 'Placar', disabled: mj.length > 0, onclick: function () { scoreDialog(j, D); } }));
          }))));
      });
      v.appendChild(h('h2', { class: 'sh', text: 'Fase de grupos' })); v.appendChild(gw);
      if (!mj.length) v.appendChild(h('p', { class: 'mt' }, h('button', { class: 'btn', type: 'button', id: 'gerarMata', disabled: !allDone, text: allDone ? 'Gerar mata-mata (2 melhores de cada grupo)' : 'Lance todos os placares dos grupos para gerar o mata-mata', onclick: async function () {
        var Ls = Object.keys(S), firsts = Ls.map(function (L) { return S[L][0] && S[L][0].id; }).filter(Boolean), seconds = Ls.map(function (L) { return S[L][1] && S[L][1].id; }).filter(Boolean);
        if (seconds.length > 1) seconds.push(seconds.shift());
        await genKnockout(id, cat, firsts.concat(seconds)); toast('Mata-mata gerado!'); render();
      } })));
    }
    if (mj.length) {
      var total = mj[0].total, br = h('div', { class: 'bracket', id: 'bracket', tabindex: '0', role: 'region', 'aria-label': 'Chaveamento mata-mata — ' + cat });
      for (var r = 1; r <= total; r++) {
        br.appendChild(h('div', { class: 'round' }, h('h4', { text: roundName(r, total) }), sortBy(mj.filter(function (j) { return j.rodada === r; }), function (j) { return j.pos; }).map(function (j, i) {
          var m = h('div', { class: 'match' + (j.vencedor ? ' done' : '') },
            h('div', { class: 't' + (j.vencedor && j.vencedor === j.a ? ' win' : '') }, h('span', { text: j.a ? dname(D[j.a]) : 'a definir' }), h('b', { text: j.pa != null ? String(j.pa) : '' })),
            h('div', { class: 't' + (j.vencedor && !j.bye && j.vencedor === j.b ? ' win' : '') + (j.bye ? ' bye' : '') }, h('span', { text: j.bye ? 'BYE (passa direto)' : j.b ? dname(D[j.b]) : 'a definir' }), h('b', { text: j.pb != null ? String(j.pb) : '' })),
            j.bye ? null : h('button', { class: 'edit', type: 'button', disabled: !(j.a && j.b), text: j.vencedor ? 'Editar placar' : 'Lançar placar', 'aria-label': 'Placar: ' + dname(D[j.a]) + ' contra ' + dname(D[j.b]), onclick: function () { scoreDialog(j, D); } }));
          m.style.animationDelay = (r * 80 + i * 40) + 'ms'; return m;
        })));
      }
      v.appendChild(h('h2', { class: 'sh', text: 'Mata-mata' })); v.appendChild(br);
      var fin = mj.filter(function (j) { return j.rodada === total; })[0];
      if (fin && fin.vencedor) {
        var vice = fin.vencedor === fin.a ? fin.b : fin.a;
        v.insertBefore(h('div', { class: 'champ', id: 'campeao', role: 'status' }, h('span', { text: '🏆 Campeões — ' + cat }), h('b', { text: dname(D[fin.vencedor]) }), h('small', { text: 'Vice: ' + dname(D[vice]) + ' · final ' + fin.pa + ' × ' + fin.pb })), v.children[2]);
      }
    }
    setStatus().catch(function () {});
    return v;
  }

  /* ---------- boot ---------- */
  if (session()) start(); else showLogin();
})();
