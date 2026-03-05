export function getHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Godos</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#1a1a2e;--surface:#16213e;--surface2:#0f3460;
  --text:#e0e0e0;--text2:#a0a0a0;--accent:#00d2ff;
  --red:#ff6b6b;--yellow:#ffd93d;--green:#6bcb77;--blue:#4d96ff;
  --radius:8px;
}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:var(--bg);color:var(--text);min-height:100vh}
a{color:var(--accent);text-decoration:none}
button{cursor:pointer;border:none;border-radius:var(--radius);font-size:14px;padding:6px 14px;transition:opacity .15s}
button:hover{opacity:.85}
input,textarea,select{background:var(--surface);color:var(--text);border:1px solid var(--surface2);border-radius:var(--radius);padding:8px 12px;font-size:14px;width:100%}
input:focus,textarea:focus,select:focus{outline:none;border-color:var(--accent)}

/* Layout */
.container{max-width:720px;margin:0 auto;padding:16px}
header{display:flex;align-items:center;justify-content:space-between;padding:16px 0;border-bottom:1px solid var(--surface2);margin-bottom:16px}
header h1{font-size:24px;color:var(--accent)}
.stats-bar{display:flex;gap:16px;font-size:13px;color:var(--text2)}
.stat{display:flex;align-items:center;gap:4px}
.stat .dot{width:8px;height:8px;border-radius:50%;display:inline-block}

/* Filters */
.filters{display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;align-items:center}
.filter-btn{background:var(--surface);color:var(--text2);padding:6px 12px;font-size:13px}
.filter-btn.active{background:var(--surface2);color:var(--text)}
.search-input{flex:1;min-width:150px;padding:6px 12px;font-size:13px}
.btn-add{background:var(--accent);color:#000;font-weight:600;padding:8px 16px}
.btn-clear{background:var(--surface);color:var(--red);font-size:13px}

/* Todo list */
.todo-list{display:flex;flex-direction:column;gap:6px}
.todo-item{display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--surface);border-radius:var(--radius);transition:background .15s}
.todo-item:hover{background:var(--surface2)}
.todo-item.done{opacity:.55}
.todo-item.done .todo-title{text-decoration:line-through}

.todo-check{width:20px;height:20px;border-radius:50%;border:2px solid var(--text2);cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:12px;transition:all .15s}
.todo-check:hover{border-color:var(--green)}
.todo-check.checked{border-color:var(--green);background:var(--green);color:#000}

.todo-body{flex:1;min-width:0}
.todo-title{font-size:15px;line-height:1.3}
.todo-meta{display:flex;gap:8px;margin-top:3px;font-size:12px;color:var(--text2);flex-wrap:wrap}
.todo-meta span{display:flex;align-items:center;gap:2px}

.priority-badge{font-size:11px;font-weight:600;padding:2px 8px;border-radius:10px;cursor:pointer;transition:all .15s;text-transform:uppercase;letter-spacing:.5px}
.priority-badge:hover{opacity:.8}
.priority-high{background:rgba(255,107,107,.2);color:var(--red)}
.priority-medium{background:rgba(255,217,61,.2);color:var(--yellow)}
.priority-low{background:rgba(107,203,119,.15);color:var(--green)}

.tag{background:var(--surface2);padding:1px 6px;border-radius:4px;font-size:11px}

.todo-actions{display:flex;gap:4px;opacity:0;transition:opacity .15s}
.todo-item:hover .todo-actions{opacity:1}
.action-btn{background:none;color:var(--text2);padding:4px 6px;font-size:14px}
.action-btn:hover{color:var(--text)}
.action-btn.delete:hover{color:var(--red)}

/* Tabs */
.tabs{display:flex;border-bottom:1px solid var(--surface2);margin-bottom:16px;gap:0}
.tab{padding:8px 16px;color:var(--text2);cursor:pointer;border-bottom:2px solid transparent;font-size:14px;transition:all .15s}
.tab:hover{color:var(--text)}
.tab.active{color:var(--accent);border-bottom-color:var(--accent)}

/* Modal */
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:100;opacity:0;pointer-events:none;transition:opacity .2s}
.modal-overlay.open{opacity:1;pointer-events:auto}
.modal{background:var(--surface);border-radius:12px;padding:24px;width:90%;max-width:480px;max-height:90vh;overflow-y:auto}
.modal h2{margin-bottom:16px;font-size:18px}
.form-group{margin-bottom:12px}
.form-group label{display:block;font-size:13px;color:var(--text2);margin-bottom:4px}
.form-row{display:flex;gap:8px}
.form-row .form-group{flex:1}
.form-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}
.btn-cancel{background:var(--surface2);color:var(--text)}
.btn-save{background:var(--accent);color:#000;font-weight:600}

/* Completed section */
.completed-list{margin-top:8px}
.completed-item{padding:8px 14px;background:var(--surface);border-radius:var(--radius);margin-bottom:4px;opacity:.6;font-size:14px}
.completed-item .todo-title{text-decoration:line-through}

/* Empty state */
.empty{text-align:center;padding:40px;color:var(--text2)}

/* Responsive */
@media(max-width:600px){
  header{flex-direction:column;gap:12px;align-items:flex-start}
  .filters{flex-direction:column}
  .search-input{min-width:100%}
  .todo-actions{opacity:1}
}
</style>
</head>
<body>
<div class="container">
  <header>
    <h1>Godos</h1>
    <div class="stats-bar" id="stats-bar"></div>
  </header>

  <div class="tabs">
    <div class="tab active" data-tab="todos">Todos</div>
    <div class="tab" data-tab="completed">Completed</div>
  </div>

  <!-- Todos Tab -->
  <div id="tab-todos">
    <div class="filters">
      <button class="filter-btn active" data-status="all">All</button>
      <button class="filter-btn" data-status="pending">Pending</button>
      <button class="filter-btn" data-status="in_progress">In Progress</button>
      <button class="filter-btn" data-status="done">Done</button>
      <input class="search-input" type="text" placeholder="Search..." id="search">
      <button class="btn-add" onclick="openAddModal()">+ Add</button>
    </div>
    <div class="todo-list" id="todo-list"></div>
    <div style="margin-top:12px;display:flex;justify-content:flex-end">
      <button class="btn-clear" id="btn-clear" onclick="clearCompleted()" style="display:none">Clear completed</button>
    </div>
  </div>

  <!-- Completed Tab -->
  <div id="tab-completed" style="display:none">
    <div class="completed-list" id="completed-list"></div>
  </div>
</div>

<!-- Modal -->
<div class="modal-overlay" id="modal-overlay" onclick="if(event.target===this)closeModal()">
  <div class="modal">
    <h2 id="modal-title">Add Todo</h2>
    <input type="hidden" id="edit-id">
    <div class="form-group">
      <label>Title *</label>
      <input type="text" id="f-title" placeholder="What needs to be done?" maxlength="200">
    </div>
    <div class="form-group">
      <label>Description</label>
      <textarea id="f-desc" rows="2" placeholder="Optional details..." maxlength="1000"></textarea>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Priority</label>
        <select id="f-priority">
          <option value="low">Low</option>
          <option value="medium" selected>Medium</option>
          <option value="high">High</option>
        </select>
      </div>
      <div class="form-group">
        <label>Project</label>
        <input type="text" id="f-project" placeholder="Project name">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Jira</label>
        <input type="text" id="f-jira" placeholder="PROJ-123">
      </div>
      <div class="form-group">
        <label>Worktree</label>
        <input type="text" id="f-worktree" placeholder="/path/to/worktree">
      </div>
    </div>
    <div class="form-group">
      <label>Tags</label>
      <input type="text" id="f-tags" placeholder="Comma-separated tags">
    </div>
    <div class="form-actions">
      <button class="btn-cancel" onclick="closeModal()">Cancel</button>
      <button class="btn-save" onclick="saveTodo()">Save</button>
    </div>
  </div>
</div>

<script>
let todos = [];
let filter = { status: 'all', search: '' };
let activeTab = 'todos';

// --- API ---
const api = {
  async get(url) { const r = await fetch(url); return r.json(); },
  async post(url, body) { const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); return r.json(); },
  async patch(url, body) { const r = await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); return r.json(); },
  async del(url) { const r = await fetch(url, { method: 'DELETE' }); return r.json(); },
};

// --- Data ---
async function loadTodos() {
  todos = await api.get('/api/todos');
  render();
}

async function loadStats() {
  const s = await api.get('/api/stats');
  document.getElementById('stats-bar').innerHTML =
    '<div class="stat"><span class="dot" style="background:var(--yellow)"></span>' + s.pending + ' pending</div>' +
    '<div class="stat"><span class="dot" style="background:var(--blue)"></span>' + s.in_progress + ' in progress</div>' +
    '<div class="stat"><span class="dot" style="background:var(--green)"></span>' + s.done + ' done</div>' +
    '<div class="stat">' + s.completedCount + ' cleared</div>' +
    '<div class="stat">' + s.rate + '% complete</div>';
}

async function loadCompleted() {
  const list = await api.get('/api/completed');
  const el = document.getElementById('completed-list');
  if (list.length === 0) {
    el.innerHTML = '<div class="empty">No completed todos yet.</div>';
    return;
  }
  el.innerHTML = list.map(t =>
    '<div class="completed-item"><span class="todo-title">' + esc(t.title) + '</span>' +
    (t.project ? ' <span style="color:var(--yellow)">[' + esc(t.project) + ']</span>' : '') +
    '</div>'
  ).join('');
}

// --- Actions ---
async function toggleTodo(id) {
  await api.post('/api/todos/' + id + '/toggle');
  await refresh();
}

async function cyclePriority(id) {
  await api.post('/api/todos/' + id + '/priority');
  await refresh();
}

async function deleteTodo(id) {
  if (!confirm('Delete this todo?')) return;
  await api.del('/api/todos/' + id);
  await refresh();
}

async function clearCompleted() {
  const done = todos.filter(t => t.status === 'done');
  if (done.length === 0) return;
  if (!confirm('Remove ' + done.length + ' completed todo(s)?')) return;
  await api.post('/api/todos/clear-completed');
  await refresh();
}

// --- Modal ---
function openAddModal() {
  document.getElementById('modal-title').textContent = 'Add Todo';
  document.getElementById('edit-id').value = '';
  document.getElementById('f-title').value = '';
  document.getElementById('f-desc').value = '';
  document.getElementById('f-priority').value = 'medium';
  document.getElementById('f-project').value = '';
  document.getElementById('f-jira').value = '';
  document.getElementById('f-worktree').value = '';
  document.getElementById('f-tags').value = '';
  document.getElementById('modal-overlay').classList.add('open');
  document.getElementById('f-title').focus();
}

function openEditModal(id) {
  const t = todos.find(x => x.id === id);
  if (!t) return;
  document.getElementById('modal-title').textContent = 'Edit Todo';
  document.getElementById('edit-id').value = t.id;
  document.getElementById('f-title').value = t.title;
  document.getElementById('f-desc').value = t.description || '';
  document.getElementById('f-priority').value = t.priority;
  document.getElementById('f-project').value = t.project || '';
  document.getElementById('f-jira').value = t.jira || '';
  document.getElementById('f-worktree').value = t.worktree || '';
  document.getElementById('f-tags').value = (t.tags || []).join(', ');
  document.getElementById('modal-overlay').classList.add('open');
  document.getElementById('f-title').focus();
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}

async function saveTodo() {
  const title = document.getElementById('f-title').value.trim();
  if (!title) { document.getElementById('f-title').focus(); return; }

  const body = {
    title,
    description: document.getElementById('f-desc').value.trim(),
    priority: document.getElementById('f-priority').value,
    project: document.getElementById('f-project').value.trim() || undefined,
    jira: document.getElementById('f-jira').value.trim() || undefined,
    worktree: document.getElementById('f-worktree').value.trim() || undefined,
    tags: document.getElementById('f-tags').value.split(',').map(s => s.trim()).filter(Boolean),
  };

  const editId = document.getElementById('edit-id').value;
  if (editId) {
    await api.patch('/api/todos/' + editId, body);
  } else {
    await api.post('/api/todos', body);
  }

  closeModal();
  await refresh();
}

// --- Render ---
function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

function getFiltered() {
  let list = [...todos];
  if (filter.status !== 'all') list = list.filter(t => t.status === filter.status);
  if (filter.search) {
    const q = filter.search.toLowerCase();
    list = list.filter(t =>
      t.title.toLowerCase().includes(q) ||
      (t.description || '').toLowerCase().includes(q) ||
      (t.tags || []).some(tag => tag.toLowerCase().includes(q))
    );
  }
  const po = { high: 0, medium: 1, low: 2 };
  list.sort((a, b) => {
    if (a.status === 'done' && b.status !== 'done') return 1;
    if (a.status !== 'done' && b.status === 'done') return -1;
    if (po[a.priority] !== po[b.priority]) return po[a.priority] - po[b.priority];
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
  return list;
}

function renderTodo(t) {
  const isDone = t.status === 'done';
  const pClass = 'priority-' + t.priority;
  let meta = '';
  if (t.project) meta += '<span style="color:var(--yellow)">[' + esc(t.project) + ']</span>';
  if (t.jira) meta += '<span style="color:#c084fc">' + esc(t.jira) + '</span>';
  if (t.worktree) meta += '<span style="color:var(--blue)">' + esc(t.worktree.split('/').pop() || t.worktree) + '</span>';
  if (t.tags && t.tags.length) meta += t.tags.map(tag => '<span class="tag">' + esc(tag) + '</span>').join('');

  return '<div class="todo-item' + (isDone ? ' done' : '') + '">' +
    '<div class="todo-check' + (isDone ? ' checked' : '') + '" onclick="toggleTodo(\\''+t.id+'\\')">'+
      (isDone ? '&#10003;' : '') + '</div>' +
    '<div class="todo-body">' +
      '<div class="todo-title">' + esc(t.title) + '</div>' +
      (meta ? '<div class="todo-meta">' + meta + '</div>' : '') +
    '</div>' +
    '<span class="priority-badge ' + pClass + '" onclick="cyclePriority(\\''+t.id+'\\')">'+t.priority+'</span>' +
    '<div class="todo-actions">' +
      '<button class="action-btn" onclick="openEditModal(\\''+t.id+'\\')">&#9998;</button>' +
      '<button class="action-btn delete" onclick="deleteTodo(\\''+t.id+'\\')">&#128465;</button>' +
    '</div>' +
  '</div>';
}

function render() {
  const list = getFiltered();
  const el = document.getElementById('todo-list');
  if (list.length === 0) {
    el.innerHTML = '<div class="empty">' + (todos.length === 0 ? 'No todos yet. Click "+ Add" to create one.' : 'No matching todos.') + '</div>';
  } else {
    el.innerHTML = list.map(renderTodo).join('');
  }
  const hasDone = todos.some(t => t.status === 'done');
  document.getElementById('btn-clear').style.display = hasDone ? '' : 'none';
}

// --- Tabs ---
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    activeTab = tab.dataset.tab;
    document.getElementById('tab-todos').style.display = activeTab === 'todos' ? '' : 'none';
    document.getElementById('tab-completed').style.display = activeTab === 'completed' ? '' : 'none';
    if (activeTab === 'completed') loadCompleted();
  });
});

// --- Filters ---
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    filter.status = btn.dataset.status;
    render();
  });
});

document.getElementById('search').addEventListener('input', (e) => {
  filter.search = e.target.value;
  render();
});

// --- Keyboard ---
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// --- Polling & Init ---
async function refresh() {
  await Promise.all([loadTodos(), loadStats()]);
}

refresh();
setInterval(refresh, 2000);
</script>
</body>
</html>`;
}
