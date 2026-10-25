/* FUT.VECO — camada de dados (DEMO).
 * Interface assíncrona única: FV.repo.list/get/create/update/remove(colecao, ...)
 * Implementação atual: localStorage (navegador). Para usar Supabase, veja SUPABASE.md:
 * basta criar um objeto com os mesmos métodos e chamar FV.useRepo(supabaseRepo).
 */
(function (g) {
  'use strict';
  var KEY = 'fv_demo_v1';
  var COLS = ['alunos', 'planos', 'matriculas', 'pagamentos', 'turmas', 'presencas', 'agendamentos', 'experimentais', 'campeonatos', 'duplas', 'jogos'];

  function uid() {
    if (g.crypto && crypto.randomUUID) return crypto.randomUUID();
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function addDays(n) { var d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + n); return iso(d); }
  function ym(offset) { var d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + offset); return d.getFullYear() + '-' + pad(d.getMonth() + 1); }
  function clone(o) { return o == null ? o : JSON.parse(JSON.stringify(o)); }

  /* ---------- Dados de exemplo (fictícios) ---------- */
  function seed() {
    var d = {}; COLS.forEach(function (c) { d[c] = []; });
    var now = new Date().toISOString();
    function add(c, o) { o.id = uid(); o.criado_em = now; d[c].push(o); return o; }
    var nomes = [['Ana Clara Souza', 'iniciante'], ['Bruno Santana', 'intermediário'], ['Camila Rocha', 'avançado'], ['Diego Matos', 'iniciante'], ['Elisa Ferreira', 'intermediário'], ['Felipe Andrade', 'avançado'], ['Gabriela Lima', 'iniciante'], ['Henrique Costa', 'intermediário'], ['Isabela Nunes', 'iniciante'], ['João Pedro Alves', 'avançado'], ['Larissa Melo', 'intermediário'], ['Marcos Vinícius', 'iniciante'], ['Natália Prado', 'avançado'], ['Otávio Reis', 'intermediário']];
    var alunos = nomes.map(function (n, i) {
      return add('alunos', { nome: n[0], telefone: '(73) 90000-00' + pad(i + 10), email: n[0].split(' ')[0].toLowerCase() + '@exemplo.com', nivel: n[1], status: i === 13 ? 'inativo' : 'ativo', desde: addDays(-20 * (i + 1)), observacoes: '' });
    });
    var planos = [
      add('planos', { nome: '1x por semana (exemplo)', aulas_semana: 1, valor: 100 }),
      add('planos', { nome: '2x por semana (exemplo)', aulas_semana: 2, valor: 160 }),
      add('planos', { nome: '3x por semana (exemplo)', aulas_semana: 3, valor: 210 })
    ];
    alunos.forEach(function (a, i) {
      var p = planos[i % 3];
      var m = add('matriculas', { aluno_id: a.id, plano_id: p.id, inicio: a.desde, dia_vencimento: [5, 10, 15][i % 3], status: a.status === 'ativo' ? 'ativa' : 'cancelada' });
      if (m.status !== 'ativa') return;
      for (var k = -2; k <= 0; k++) {
        var ref = ym(k), pago = k < 0 || i % 3 !== 0;
        if (k === -1 && i === 4) pago = false;
        add('pagamentos', { matricula_id: m.id, aluno_id: a.id, referencia: ref, valor: p.valor, vencimento: ref + '-' + pad(m.dia_vencimento), status: pago ? 'pago' : 'aberto', pago_em: pago ? ref + '-' + pad(m.dia_vencimento) : null });
      }
    });
    var prof = ['@veveco.ftv', '@jpzin__19', '@mar.1aac'];
    var turmas = [
      ['Futevôlei Iniciante', 'futevôlei', 1, '06:30', 0, 'iniciante'], ['Futevôlei Iniciante', 'futevôlei', 3, '06:30', 0, 'iniciante'],
      ['Futevôlei Intermediário', 'futevôlei', 2, '17:00', 1, 'intermediário'], ['Futevôlei Avançado', 'futevôlei', 4, '17:00', 0, 'avançado'],
      ['Altinha na Praia', 'altinha', 6, '08:00', 2, 'todos'], ['Trick & Técnica', 'futevôlei', 5, '16:30', 1, 'intermediário']
    ].map(function (t) {
      var ids = alunos.filter(function (a) { return a.status === 'ativo' && (t[5] === 'todos' || a.nivel === t[5]); }).map(function (a) { return a.id; });
      return add('turmas', { nome: t[0], modalidade: t[1], dia_semana: t[2], hora: t[3], duracao: 60, professor: prof[t[4]], vagas: 10, nivel: t[5], aluno_ids: ids });
    });
    add('presencas', { turma_id: turmas[0].id, data: addDays(-7), presentes: turmas[0].aluno_ids.slice(0, 3) });
    add('agendamentos', { nome: 'Rafael Dias (exemplo)', telefone: '(73) 90000-0091', data: addDays(2), hora: '09:00', professor: prof[1], tipo: 'avulsa', status: 'confirmado', obs: 'Turista, quer aula de altinha' });
    add('agendamentos', { nome: alunos[2].nome, aluno_id: alunos[2].id, data: addDays(4), hora: '15:00', professor: prof[0], tipo: 'particular', status: 'agendado', obs: '' });
    [['Paula Brito (exemplo)', 'iniciante', 1, 'pendente'], ['Thiago Ramos (exemplo)', 'intermediário', 3, 'pendente'], ['Sofia Albuquerque (exemplo)', 'iniciante', -2, 'confirmada'], ['Lucas Moreira (exemplo)', 'avançado', -5, 'compareceu']].forEach(function (e, i) {
      add('experimentais', { nome: e[0], telefone: '(73) 90000-007' + i, nivel: e[1], data: addDays(e[2]), status: e[3], origem: i % 2 ? 'site' : 'instagram', obs: '' });
    });
    var c = add('campeonatos', { nome: '2º Campeonato Interno (exemplo)', data: addDays(18), local: 'Areia do CT — Itacaré', categorias: ['Misto', 'Masculino'], formato: 'mata', status: 'inscricoes' });
    var ds = [['Ana Clara', 'Bruno'], ['Camila', 'Diego'], ['Elisa', 'Felipe'], ['Gabriela', 'Henrique'], ['Isabela', 'João Pedro'], ['Larissa', 'Marcos'], ['Natália', 'Otávio']];
    ds.forEach(function (p) { add('duplas', { campeonato_id: c.id, categoria: 'Misto', jogador1: p[0], jogador2: p[1] }); });
    [['Bruno', 'Felipe'], ['Diego', 'Henrique'], ['João Pedro', 'Marcos'], ['Otávio', 'Rafael']].forEach(function (p) { add('duplas', { campeonato_id: c.id, categoria: 'Masculino', jogador1: p[0], jogador2: p[1] }); });
    d._meta = { versao: 1, exemplo: true, criado_em: now };
    return d;
  }

  /* ---------- Implementação localStorage ---------- */
  var mem = null;
  function db() {
    if (mem) return mem;
    try { var d = JSON.parse(localStorage.getItem(KEY)); if (d && Array.isArray(d.alunos)) { mem = d; return d; } } catch (e) { /* corrompido */ }
    mem = seed(); save(); return mem;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) { console.warn('Não foi possível salvar', e); } }
  function col(c) { if (COLS.indexOf(c) < 0) throw new Error('Coleção inválida: ' + c); var d = db(); return d[c] || (d[c] = []); }
  function match(o, f) { return !f || Object.keys(f).every(function (k) { return o[k] === f[k]; }); }
  var BLOCK = { id: 1, criado_em: 1, __proto__: 1, constructor: 1, prototype: 1 };
  function cleanPatch(p) { var o = {}; Object.keys(p || {}).forEach(function (k) { if (!BLOCK[k]) o[k] = p[k]; }); return o; }

  var localRepo = {
    name: 'localStorage',
    list: async function (c, filter) { return clone(col(c).filter(function (o) { return match(o, filter); })); },
    get: async function (c, id) { return clone(col(c).find(function (o) { return o.id === id; }) || null); },
    create: async function (c, obj) { var o = cleanPatch(obj); o.id = uid(); o.criado_em = new Date().toISOString(); col(c).push(o); save(); return clone(o); },
    update: async function (c, id, patch) {
      var o = col(c).find(function (x) { return x.id === id; }); if (!o) throw new Error('Registro não encontrado');
      Object.assign(o, cleanPatch(patch)); save(); return clone(o);
    },
    remove: async function (c, id) { var a = col(c), i = a.findIndex(function (x) { return x.id === id; }); if (i >= 0) { a.splice(i, 1); save(); } return i >= 0; },
    reset: async function () { mem = seed(); save(); },
    exportAll: async function () { return clone(db()); },
    importAll: async function (data) {
      if (!data || typeof data !== 'object' || !Array.isArray(data.alunos)) throw new Error('Arquivo de backup inválido');
      var d = {}; COLS.forEach(function (c) {
        d[c] = (Array.isArray(data[c]) ? data[c] : []).filter(function (o) { return o && typeof o === 'object' && typeof o.id === 'string'; })
          .map(function (o) { var x = cleanPatch(o); x.id = o.id; x.criado_em = typeof o.criado_em === 'string' ? o.criado_em : new Date().toISOString(); return x; });
      });
      d._meta = { versao: 1, importado_em: new Date().toISOString() }; mem = d; save();
    }
  };

  var current = localRepo;
  var api = {};
  ['list', 'get', 'create', 'update', 'remove', 'reset', 'exportAll', 'importAll'].forEach(function (m) {
    api[m] = function () { return current[m].apply(current, arguments); };
  });
  g.FV = { repo: api, useRepo: function (r) { current = r; }, collections: COLS.slice(), util: { uid: uid, iso: iso, addDays: addDays, ym: ym, pad: pad }, backend: function () { return current.name; } };
})(window);
