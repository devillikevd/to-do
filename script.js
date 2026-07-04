/* =============================================
   ProTrack — Advanced To-Do + Fitness Tracker
   Complete JavaScript Logic
   ============================================= */

'use strict';

// =================== USERS (Hardcoded) ===================
const USERS = {
  "user1": { password: "pass1", name: "Alex Johnson" },
  "user2": { password: "pass2", name: "Sam Rivera" }
};

// =================== STATE ===================
let currentUser = null;
let tasks = [];
let fitnessData = [];
let goals = { steps: 10000, workout: 45 };
let categories = ["Work", "Personal", "Health", "Study", "Finance", "Other"];
let editingTaskId = null;
let editingSubtasks = [];
let chartInstances = {};
let currentTab = 'dashboard';

// =================== MOTIVATIONAL QUOTES ===================
const QUOTES = [
  "Push yourself, because no one else is going to do it for you.",
  "Great things never come from comfort zones.",
  "Dream it. Wish it. Do it.",
  "Success doesn't just find you. You have to go out and get it.",
  "The harder you work for something, the greater you'll feel when you achieve it.",
  "Don't stop when you're tired. Stop when you're done.",
  "Wake up with determination. Go to bed with satisfaction.",
  "Do something today that your future self will thank you for.",
  "Little things make big days.",
  "It's going to be hard, but hard does not mean impossible.",
  "Don't wait for opportunity. Create it.",
  "Sometimes we're tested not to show our weaknesses, but to discover our strengths.",
  "The key to success is to focus on goals, not obstacles.",
  "Dream bigger. Do bigger.",
  "Your limitation—it's only your imagination.",
  "Sometimes later becomes never. Do it now.",
  "Great things take time. Be patient.",
  "Believe you can and you're halfway there.",
  "Fitness is not about being better than someone else. It's about being better than you used to be.",
  "Take care of your body. It's the only place you have to live."
];

// =================== UTILS ===================
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function dateKey(dateStr) {
  return dateStr ? dateStr.slice(0, 10) : todayStr();
}

function clamp(val, min, max) { return Math.min(Math.max(val, min), max); }

function pct(val, total) {
  if (!total) return 0;
  return Math.round(clamp((val / total) * 100, 0, 100));
}

function showToast(msg, type = 'info', icon = '') {
  const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', info: 'fa-circle-info', warning: 'fa-triangle-exclamation' };
  const container = document.getElementById('toastContainer');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<i class="fa-solid ${icon || icons[type]}"></i> ${msg}`;
  container.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(30px)'; t.style.transition = '0.3s'; setTimeout(() => t.remove(), 300); }, 3000);
}

function destroyChart(id) {
  if (chartInstances[id]) { chartInstances[id].destroy(); delete chartInstances[id]; }
}

// =================== LOCALSTORAGE ===================
function lsKey(type) { return `${type}_${currentUser}`; }

function saveTasksLS() { localStorage.setItem(lsKey('todo_data'), JSON.stringify(tasks)); }
function loadTasksLS() { tasks = JSON.parse(localStorage.getItem(lsKey('todo_data')) || '[]'); }

function saveFitnessLS() { localStorage.setItem(lsKey('fitness_data'), JSON.stringify(fitnessData)); }
function loadFitnessLS() { fitnessData = JSON.parse(localStorage.getItem(lsKey('fitness_data')) || '[]'); }

function saveGoalsLS() { localStorage.setItem(lsKey('goals'), JSON.stringify(goals)); }
function loadGoalsLS() { goals = JSON.parse(localStorage.getItem(lsKey('goals')) || JSON.stringify(goals)); }

function saveCategoriesLS() { localStorage.setItem(lsKey('categories'), JSON.stringify(categories)); }
function loadCategoriesLS() { categories = JSON.parse(localStorage.getItem(lsKey('categories')) || JSON.stringify(categories)); }

// =================== AUTH ===================
document.getElementById('loginForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const uname = document.getElementById('loginUsername').value.trim();
  const pwd = document.getElementById('loginPassword').value;
  if (USERS[uname] && USERS[uname].password === pwd) {
    currentUser = uname;
    localStorage.setItem('currentUser', uname);
    loginSuccess();
  } else {
    document.getElementById('loginError').classList.remove('hidden');
  }
});

function togglePw() {
  const inp = document.getElementById('loginPassword');
  const ico = document.getElementById('pwEyeIcon');
  if (inp.type === 'password') { inp.type = 'text'; ico.className = 'fa-solid fa-eye-slash'; }
  else { inp.type = 'password'; ico.className = 'fa-solid fa-eye'; }
}

function loginSuccess() {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('mainApp').classList.remove('hidden');
  initApp();
}

function logout() {
  localStorage.removeItem('currentUser');
  currentUser = null;
  tasks = []; fitnessData = []; goals = { steps: 10000, workout: 45 }; categories = ["Work", "Personal", "Health", "Study", "Finance", "Other"];
  Object.values(chartInstances).forEach(c => c.destroy());
  chartInstances = {};
  document.getElementById('mainApp').classList.add('hidden');
  document.getElementById('loginScreen').classList.remove('hidden');
  document.getElementById('loginUsername').value = '';
  document.getElementById('loginPassword').value = '';
  document.getElementById('loginError').classList.add('hidden');
  showToast('Logged out successfully.', 'info');
}

// =================== APP INIT ===================
function initApp() {
  loadTasksLS();
  loadFitnessLS();
  loadGoalsLS();
  loadCategoriesLS();

  const userName = USERS[currentUser].name;
  document.getElementById('sidebarUserName').textContent = userName;
  document.getElementById('topbarUserName').textContent = userName;
  document.getElementById('sidebarAvatar').textContent = userName.charAt(0).toUpperCase();
  document.getElementById('topbarAvatar').textContent = userName.charAt(0).toUpperCase();

  setGreeting();
  setDailyQuote();
  updateCategorySelects();
  populateGoalInputs();
  renderCategories();
  processRecurringTasks();
  switchTab('dashboard');

  // Notification check
  if (Notification.permission === 'granted') scheduleNotifications();
}

function setGreeting() {
  const h = new Date().getHours();
  let g = h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : 'Evening';
  const el = document.getElementById('greetingTime');
  if (el) el.textContent = g;
  const el2 = document.getElementById('greetingName');
  if (el2) el2.textContent = USERS[currentUser].name.split(' ')[0];
}

function setDailyQuote() {
  const q = QUOTES[new Date().getDate() % QUOTES.length];
  const el = document.getElementById('motivationalQuote');
  if (el) el.innerHTML = `<i class="fa-solid fa-quote-left" style="opacity:0.5;margin-right:0.5rem;"></i>${q}`;
  const ticker = document.getElementById('quoteTicker');
  if (ticker) ticker.textContent = q;
}

// =================== SIDEBAR & TABS ===================
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  sidebar.classList.toggle('open');
  overlay.classList.toggle('show');
}

function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab-content').forEach(el => { el.classList.add('hidden'); el.classList.remove('active'); });
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const content = document.getElementById(`tab-${tab}`);
  if (content) { content.classList.remove('hidden'); content.classList.add('active'); }
  const navItem = document.querySelector(`.nav-item[data-tab="${tab}"]`);
  if (navItem) navItem.classList.add('active');

  const titles = { dashboard: 'Dashboard', todo: 'To-Do List', fitness: 'Fitness Tracker', weekly: 'Weekly Report', monthly: 'Monthly Report', settings: 'Settings' };
  document.getElementById('pageTitle').textContent = titles[tab] || tab;

  // Close sidebar on mobile
  if (window.innerWidth <= 900) {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('show');
  }

  // Render tab-specific content
  if (tab === 'dashboard') renderDashboard();
  if (tab === 'todo') renderTasks();
  if (tab === 'fitness') renderFitnessTab();
  if (tab === 'weekly') renderWeeklyReport();
  if (tab === 'monthly') renderMonthlyReport();
  if (tab === 'settings') { populateGoalInputs(); renderCategories(); updateNotifStatus(); }
}

function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.getAttribute('data-theme') === 'dark';
  html.setAttribute('data-theme', isDark ? 'light' : 'dark');
  document.getElementById('themeIcon').className = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
  document.getElementById('themeText').textContent = isDark ? 'Dark Mode' : 'Light Mode';
  localStorage.setItem('theme', isDark ? 'light' : 'dark');
  // Re-render charts after theme change
  setTimeout(() => {
    if (currentTab === 'dashboard') renderDashboard();
    if (currentTab === 'fitness') renderFitnessTab();
    if (currentTab === 'weekly') renderWeeklyReport();
    if (currentTab === 'monthly') renderMonthlyReport();
  }, 50);
}

// Load saved theme
(function loadTheme() {
  const saved = localStorage.getItem('theme');
  if (saved) {
    document.documentElement.setAttribute('data-theme', saved);
    if (saved === 'light') {
      document.getElementById('themeIcon').className = 'fa-solid fa-sun';
      document.getElementById('themeText').textContent = 'Dark Mode';
    }
  }
  // Check existing session
  const cu = localStorage.getItem('currentUser');
  if (cu && USERS[cu]) {
    currentUser = cu;
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    initApp();
  }
})();

// =================== DASHBOARD ===================
function renderDashboard() {
  setGreeting();
  setDailyQuote();

  // Stat Cards
  const today = todayStr();
  const pending = tasks.filter(t => t.status !== 'Completed').length;
  const completedToday = tasks.filter(t => t.status === 'Completed' && dateKey(t.completedAt) === today).length;
  document.getElementById('dashTotalTasks').textContent = tasks.length;
  document.getElementById('dashCompletedTasks').textContent = completedToday;

  const todayFit = fitnessData.find(f => f.date === today);
  document.getElementById('dashSteps').textContent = todayFit ? todayFit.steps.toLocaleString() : '—';
  document.getElementById('dashWorkout').textContent = todayFit ? todayFit.workout : '—';

  // Progress bars
  const stepsGoal = goals.steps || 10000;
  const workoutGoal = goals.workout || 45;
  const stepsToday = todayFit ? todayFit.steps : 0;
  const workoutToday = todayFit ? todayFit.workout : 0;
  const tasksDue = tasks.filter(t => dateKey(t.dueDate) === today).length;
  const tasksDone = tasks.filter(t => dateKey(t.dueDate) === today && t.status === 'Completed').length;

  const stepsPct = pct(stepsToday, stepsGoal);
  const workoutPct = pct(workoutToday, workoutGoal);
  const tasksPct = tasksDue > 0 ? pct(tasksDone, tasksDue) : 0;

  document.getElementById('dashStepsProgress').textContent = `${stepsToday.toLocaleString()} / ${stepsGoal.toLocaleString()}`;
  document.getElementById('dashWorkoutProgress').textContent = `${workoutToday} / ${workoutGoal} min`;
  document.getElementById('dashTasksProgress').textContent = `${tasksDone} / ${tasksDue}`;
  document.getElementById('dashStepsBar').style.width = stepsPct + '%';
  document.getElementById('dashWorkoutBar').style.width = workoutPct + '%';
  document.getElementById('dashTasksBar').style.width = tasksPct + '%';

  // Streaks & Trends
  const { stepStreak, workoutStreak } = calcStreaks();
  document.getElementById('dashStepStreak').textContent = stepStreak;
  document.getElementById('dashWorkoutStreak').textContent = workoutStreak;

  const trendEl = document.getElementById('dashStepTrend');
  const wTrendEl = document.getElementById('dashWorkoutTrend');
  const comp = compareYesterday(today);
  if (trendEl) trendEl.innerHTML = comp.stepsHtml;
  if (wTrendEl) wTrendEl.innerHTML = comp.workoutHtml;

  // Update badge
  const pendingCount = tasks.filter(t => t.status === 'Pending').length;
  document.getElementById('todoBadge').textContent = pendingCount;

  // Pending tasks list
  renderDashPendingTasks();

  // 7-day steps chart
  renderDashStepsChart();

  // Heatmap
  renderHeatmap();
}

function renderDashPendingTasks() {
  const container = document.getElementById('dashPendingTasks');
  const pending = tasks.filter(t => t.status !== 'Completed').slice(0, 6);
  if (!pending.length) {
    container.innerHTML = '<div class="empty-state"><i class="fa-regular fa-face-smile"></i> All clear! No pending tasks.</div>';
    return;
  }
  container.innerHTML = pending.map(t => {
    const pr = t.priority ? t.priority.toLowerCase() : 'low';
    return `<div class="dash-task-item ${pr}">
      <i class="fa-solid fa-circle-dot" style="color:var(--${pr === 'high' ? 'red' : pr === 'medium' ? 'yellow' : 'green'})"></i>
      <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${t.title}</span>
      <span style="font-size:0.7rem;color:var(--text3)">${t.category || ''}</span>
    </div>`;
  }).join('');
}

function renderDashStepsChart() {
  destroyChart('dashStepsChart');
  const labels = [], data = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const dk = d.toISOString().slice(0, 10);
    const entry = fitnessData.find(f => f.date === dk);
    labels.push(d.toLocaleDateString('en-IN', { weekday: 'short' }));
    data.push(entry ? entry.steps : 0);
  }
  const ctx = document.getElementById('dashStepsChart');
  if (!ctx) return;
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  chartInstances['dashStepsChart'] = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Steps',
        data,
        borderColor: '#6c63ff',
        backgroundColor: 'rgba(108,99,255,0.15)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#a78bfa',
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }, ticks: { color: isDark ? '#9ba3c7' : '#4a5080' } },
        y: { grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }, ticks: { color: isDark ? '#9ba3c7' : '#4a5080' }, beginAtZero: true }
      }
    }
  });
}

// =================== HEATMAP ===================
function renderHeatmap() {
  const container = document.getElementById('heatmapContainer');
  if (!container) return;
  container.innerHTML = '';
  const weeks = 12;
  const today = new Date(); today.setHours(0,0,0,0);
  // Find first Monday of the range
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - (weeks * 7 - 1));

  const maxSteps = Math.max(...fitnessData.map(f => f.steps), 1);

  for (let w = 0; w < weeks; w++) {
    const weekDiv = document.createElement('div');
    weekDiv.className = 'heatmap-week';
    for (let d = 0; d < 7; d++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + w * 7 + d);
      if (date > today) { const empty = document.createElement('div'); empty.className = 'heatmap-cell lv0'; weekDiv.appendChild(empty); continue; }
      const dk = date.toISOString().slice(0, 10);
      const entry = fitnessData.find(f => f.date === dk);
      const steps = entry ? entry.steps : 0;
      const ratio = steps / maxSteps;
      let lv = 0;
      if (ratio > 0.75) lv = 4;
      else if (ratio > 0.5) lv = 3;
      else if (ratio > 0.25) lv = 2;
      else if (ratio > 0) lv = 1;
      const cell = document.createElement('div');
      cell.className = `heatmap-cell lv${lv}`;
      cell.title = `${dk}: ${steps.toLocaleString()} steps${entry && entry.workout ? ', ' + entry.workout + ' min workout' : ''}`;
      weekDiv.appendChild(cell);
    }
    container.appendChild(weekDiv);
  }
}

// =================== TASKS ===================
function updateCategorySelects() {
  const selects = ['taskCategory', 'filterCategory'];
  selects.forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    const cur = sel.value;
    sel.innerHTML = id === 'filterCategory' ? '<option value="">All Categories</option>' : '';
    categories.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c; opt.textContent = c;
      sel.appendChild(opt);
    });
    if (cur) sel.value = cur;
  });
}

function openTaskModal(id = null) {
  editingTaskId = id;
  editingSubtasks = [];
  document.getElementById('taskModal').classList.remove('hidden');
  document.getElementById('modalTitle').textContent = id ? 'Edit Task' : 'Add Task';
  updateCategorySelects();

  if (id) {
    const t = tasks.find(tk => tk.id === id);
    if (!t) return;
    document.getElementById('taskId').value = t.id;
    document.getElementById('taskTitle').value = t.title || '';
    document.getElementById('taskDesc').value = t.description || '';
    document.getElementById('taskCategory').value = t.category || '';
    document.getElementById('taskPriority').value = t.priority || 'Medium';
    document.getElementById('taskDueDate').value = t.dueDate || '';
    document.getElementById('taskStatus').value = t.status || 'Pending';
    document.getElementById('taskRecurring').value = t.recurring || 'none';
    editingSubtasks = (t.subtasks || []).map(s => ({ ...s }));
  } else {
    document.getElementById('taskId').value = '';
    document.getElementById('taskTitle').value = '';
    document.getElementById('taskDesc').value = '';
    document.getElementById('taskCategory').value = '';
    document.getElementById('taskPriority').value = 'Medium';
    document.getElementById('taskDueDate').value = '';
    document.getElementById('taskStatus').value = 'Pending';
    document.getElementById('taskRecurring').value = 'none';
    editingSubtasks = [];
  }
  renderSubtaskList();
}

function closeTaskModal() { document.getElementById('taskModal').classList.add('hidden'); }

function addSubtask() {
  const inp = document.getElementById('subtaskInput');
  const val = inp.value.trim();
  if (!val) return;
  editingSubtasks.push({ id: generateId(), text: val, done: false });
  inp.value = '';
  renderSubtaskList();
}

function renderSubtaskList() {
  const container = document.getElementById('subtaskList');
  if (!editingSubtasks.length) { container.innerHTML = ''; return; }
  container.innerHTML = editingSubtasks.map((s, i) => `
    <div class="subtask-item">
      <input type="checkbox" ${s.done ? 'checked' : ''} onchange="toggleSubtaskEdit(${i})" />
      <span style="${s.done ? 'text-decoration:line-through;opacity:0.5' : ''}">${s.text}</span>
      <button onclick="removeSubtaskEdit(${i})"><i class="fa-solid fa-xmark"></i></button>
    </div>
  `).join('');
}

function toggleSubtaskEdit(i) { editingSubtasks[i].done = !editingSubtasks[i].done; renderSubtaskList(); }
function removeSubtaskEdit(i) { editingSubtasks.splice(i, 1); renderSubtaskList(); }

function saveTask() {
  const title = document.getElementById('taskTitle').value.trim();
  if (!title) { showToast('Please enter a task title.', 'warning'); return; }

  const id = document.getElementById('taskId').value || generateId();
  const existing = tasks.find(t => t.id === id);

  const taskData = {
    id,
    title,
    description: document.getElementById('taskDesc').value.trim(),
    category: document.getElementById('taskCategory').value,
    priority: document.getElementById('taskPriority').value,
    dueDate: document.getElementById('taskDueDate').value,
    status: document.getElementById('taskStatus').value,
    recurring: document.getElementById('taskRecurring').value,
    subtasks: [...editingSubtasks],
    createdAt: existing ? existing.createdAt : new Date().toISOString(),
    completedAt: document.getElementById('taskStatus').value === 'Completed'
      ? (existing?.completedAt || new Date().toISOString())
      : null
  };

  if (existing) {
    const idx = tasks.indexOf(existing);
    tasks[idx] = taskData;
    showToast('Task updated!', 'success');
  } else {
    tasks.unshift(taskData);
    showToast('Task added!', 'success');
  }

  saveTasksLS();
  closeTaskModal();
  renderTasks();
  updateDashboardBadge();
}

function deleteTask(id) {
  if (!confirm('Delete this task?')) return;
  tasks = tasks.filter(t => t.id !== id);
  saveTasksLS();
  renderTasks();
  updateDashboardBadge();
  showToast('Task deleted.', 'info');
}

function changeTaskStatus(id, status) {
  const t = tasks.find(tk => tk.id === id);
  if (!t) return;
  t.status = status;
  t.completedAt = status === 'Completed' ? new Date().toISOString() : null;
  saveTasksLS();
  renderTasks();
  updateDashboardBadge();
  showToast(`Task marked as ${status}!`, 'success');
}

function updateDashboardBadge() {
  const pendingCount = tasks.filter(t => t.status === 'Pending').length;
  document.getElementById('todoBadge').textContent = pendingCount;
}

function filterTasks() {
  renderTasks();
}

function renderTasks() {
  const search = (document.getElementById('taskSearch')?.value || '').toLowerCase();
  const statusF = document.getElementById('filterStatus')?.value || '';
  const priorityF = document.getElementById('filterPriority')?.value || '';
  const categoryF = document.getElementById('filterCategory')?.value || '';
  const sortBy = document.getElementById('sortTasks')?.value || 'created';
  const now = new Date();

  let filtered = tasks.filter(t => {
    if (search && !t.title.toLowerCase().includes(search) && !(t.description || '').toLowerCase().includes(search)) return false;
    if (statusF && t.status !== statusF) return false;
    if (priorityF && t.priority !== priorityF) return false;
    if (categoryF && t.category !== categoryF) return false;
    return true;
  });

  filtered.sort((a, b) => {
    if (sortBy === 'dueDate') return new Date(a.dueDate || '9999') - new Date(b.dueDate || '9999');
    if (sortBy === 'priority') { const p = { High: 0, Medium: 1, Low: 2 }; return p[a.priority] - p[b.priority]; }
    if (sortBy === 'status') { const s = { Pending: 0, 'In Progress': 1, Completed: 2 }; return s[a.status] - s[b.status]; }
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  // Group by status
  const statuses = ['Pending', 'In Progress', 'Completed'];
  statuses.forEach(st => {
    const container = document.getElementById(`tasks-${st}`);
    if (!container) return;
    const colTasks = filtered.filter(t => t.status === st);
    const countEl = document.getElementById(`count-${st}`);
    if (countEl) countEl.textContent = colTasks.length;
    if (!colTasks.length) {
      container.innerHTML = '<div style="text-align:center;color:var(--text3);font-size:0.8rem;padding:1rem;">No tasks</div>';
      return;
    }
    container.innerHTML = colTasks.map(t => renderTaskCard(t, now)).join('');
  });

  // Progress
  const total = tasks.length;
  const done = tasks.filter(t => t.status === 'Completed').length;
  const progress = pct(done, total);
  const bar = document.getElementById('taskProgressBar');
  const pText = document.getElementById('taskProgressText');
  if (bar) bar.style.width = progress + '%';
  if (pText) pText.textContent = `${done}/${total} (${progress}%)`;

  // Badge
  updateDashboardBadge();
}

function renderTaskCard(t, now) {
  const isOverdue = t.dueDate && t.status !== 'Completed' && new Date(t.dueDate) < now;
  const pr = t.priority ? t.priority.toLowerCase() : 'low';
  const priorityColors = { high: 'var(--red)', medium: 'var(--yellow)', low: 'var(--green)' };
  const subtasksDone = (t.subtasks || []).filter(s => s.done).length;
  const subtasksTotal = (t.subtasks || []).length;
  const subtaskPct = pct(subtasksDone, subtasksTotal);

  const statusOptions = ['Pending', 'In Progress', 'Completed'].filter(s => s !== t.status)
    .map(s => `<button onclick="changeTaskStatus('${t.id}','${s}')"><i class="fa-solid fa-arrow-right"></i> ${s}</button>`).join('');

  return `<div class="task-card ${pr}-priority ${isOverdue ? 'overdue' : ''}" draggable="true"
    ondragstart="dragStart(event,'${t.id}')" ondragend="dragEnd(event)">
    <div class="task-card-title">${escHtml(t.title)}</div>
    ${t.description ? `<div class="task-card-desc">${escHtml(t.description)}</div>` : ''}
    <div class="task-card-meta">
      <span class="badge ${pr}">${t.priority || 'Low'}</span>
      ${t.category ? `<span class="badge category">${t.category}</span>` : ''}
      ${isOverdue ? '<span class="badge overdue"><i class="fa-solid fa-clock"></i> Overdue</span>' : ''}
      ${t.recurring && t.recurring !== 'none' ? `<span class="badge recurring"><i class="fa-solid fa-rotate"></i> ${t.recurring}</span>` : ''}
    </div>
    ${t.dueDate ? `<div class="task-due ${isOverdue ? 'overdue' : ''}"><i class="fa-regular fa-clock"></i> ${formatDateTime(t.dueDate)}</div>` : ''}
    ${subtasksTotal > 0 ? `
      <div class="subtask-progress">
        <div class="subtask-label">${subtasksDone}/${subtasksTotal} subtasks</div>
        <div class="subtask-bar-wrap"><div class="subtask-bar" style="width:${subtaskPct}%"></div></div>
      </div>
    ` : ''}
    <div class="task-actions">
      ${statusOptions}
      <button onclick="openTaskModal('${t.id}')"><i class="fa-solid fa-pen"></i></button>
      <button class="btn-del" onclick="deleteTask('${t.id}')"><i class="fa-solid fa-trash"></i></button>
    </div>
  </div>`;
}

function escHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// =================== DRAG & DROP ===================
let draggedTaskId = null;

function dragStart(e, id) {
  draggedTaskId = id;
  e.dataTransfer.effectAllowed = 'move';
  setTimeout(() => { const el = e.target; if (el) el.classList.add('dragging'); }, 0);
}

function dragEnd(e) {
  const el = e.target; if (el) el.classList.remove('dragging');
  draggedTaskId = null;
}

function allowDrop(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }

function dropTask(e, newStatus) {
  e.preventDefault();
  if (!draggedTaskId) return;
  const t = tasks.find(tk => tk.id === draggedTaskId);
  if (t && t.status !== newStatus) {
    t.status = newStatus;
    t.completedAt = newStatus === 'Completed' ? new Date().toISOString() : null;
    saveTasksLS();
    renderTasks();
    showToast(`Task moved to ${newStatus}`, 'success');
  }
}

// =================== RECURRING TASKS ===================
function processRecurringTasks() {
  const today = todayStr();
  const processed = localStorage.getItem(lsKey('recurring_processed')) || '';
  if (processed === today) return;

  let added = 0;
  tasks.forEach(t => {
    if (!t.recurring || t.recurring === 'none') return;
    if (t.status !== 'Completed') return;
    const lastCompleted = t.completedAt ? dateKey(t.completedAt) : null;
    if (!lastCompleted) return;
    const daysDiff = Math.floor((new Date(today) - new Date(lastCompleted)) / 86400000);
    const shouldRepeat = (t.recurring === 'daily' && daysDiff >= 1) || (t.recurring === 'weekly' && daysDiff >= 7);
    if (shouldRepeat) {
      const newTask = { ...t, id: generateId(), status: 'Pending', completedAt: null, createdAt: new Date().toISOString() };
      tasks.push(newTask);
      added++;
    }
  });

  if (added) { saveTasksLS(); showToast(`${added} recurring task(s) added for today!`, 'info'); }
  localStorage.setItem(lsKey('recurring_processed'), today);
}

// =================== FITNESS ===================
document.getElementById('fitnessForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const date = document.getElementById('fitnessDate').value || todayStr();
  const steps = parseInt(document.getElementById('fitnessSteps').value) || 0;
  const workout = parseInt(document.getElementById('fitnessWorkout').value) || 0;
  const type = document.getElementById('fitnessType').value;
  const notes = document.getElementById('fitnessNotes').value.trim();

  if (!steps && !workout) { showToast('Please enter steps or workout duration.', 'warning'); return; }

  const existing = fitnessData.findIndex(f => f.date === date);
  const entry = { date, steps, workout, type, notes, savedAt: new Date().toISOString() };

  if (existing >= 0) fitnessData[existing] = entry;
  else fitnessData.push(entry);

  fitnessData.sort((a, b) => b.date.localeCompare(a.date));
  saveFitnessLS();
  showToast('Fitness data saved!', 'success');
  renderFitnessTab();
  if (currentTab === 'dashboard') renderDashboard();

  // Reset form
  this.reset();
  document.getElementById('fitnessDate').value = todayStr();
});

function renderFitnessTab() {
  // Set default date
  const dateInput = document.getElementById('fitnessDate');
  dateInput.value = dateInput.value || todayStr();

  // Analysis
  renderFitnessAnalysis();
  // Charts
  renderFitnessCharts();
  // History Table
  renderFitnessHistory();
}

function renderFitnessAnalysis() {
  const today = todayStr();
  const todayFit = fitnessData.find(f => f.date === today);
  const steps = todayFit ? todayFit.steps : 0;
  const workout = todayFit ? todayFit.workout : 0;
  const stepGoal = goals.steps || 10000;
  const workoutGoal = goals.workout || 45;

  const stepsPct = pct(steps, stepGoal);
  const workoutPct = pct(workout, workoutGoal);

  document.getElementById('stepsRingLabel').textContent = stepsPct + '%';
  document.getElementById('workoutRingLabel').textContent = workoutPct + '%';
  document.getElementById('stepsAnalysisVal').textContent = `${steps.toLocaleString()} / ${stepGoal.toLocaleString()}`;
  document.getElementById('workoutAnalysisVal').textContent = `${workout} / ${workoutGoal} min`;

  renderRingChart('stepsRing', stepsPct, '#6c63ff');
  renderRingChart('workoutRing', workoutPct, '#a855f7');

  // Comparison
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  const ydk = yesterday.toISOString().slice(0, 10);
  const yFit = fitnessData.find(f => f.date === ydk);
  const ySteps = yFit ? yFit.steps : null;
  const yWorkout = yFit ? yFit.workout : null;

  const stepsComp = document.getElementById('compSteps');
  const workoutComp = document.getElementById('compWorkout');

  if (stepsComp) stepsComp.innerHTML = `<i class="fa-solid fa-person-walking"></i> Steps: <span class="${getChangeClass(steps, ySteps)}">${getChangeText(steps, ySteps)}</span>`;
  if (workoutComp) workoutComp.innerHTML = `<i class="fa-solid fa-dumbbell"></i> Workout: <span class="${getChangeClass(workout, yWorkout)}">${getChangeText(workout, yWorkout)}</span>`;
}

function renderRingChart(id, pct, color) {
  destroyChart(id);
  const canvas = document.getElementById(id);
  if (!canvas) return;
  chartInstances[id] = new Chart(canvas, {
    type: 'doughnut',
    data: {
      datasets: [{
        data: [pct, 100 - pct],
        backgroundColor: [color, 'rgba(255,255,255,0.05)'],
        borderWidth: 0,
        circumference: 360,
      }]
    },
    options: {
      cutout: '75%',
      responsive: false,
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      animation: { animateRotate: true, duration: 800 }
    }
  });
}

function getChangeClass(today, yesterday) {
  if (yesterday === null) return 'same';
  if (today > yesterday) return 'up';
  if (today < yesterday) return 'down';
  return 'same';
}

function getChangeText(today, yesterday) {
  if (yesterday === null) return 'No data for yesterday';
  if (today === yesterday) return '➖ Same as yesterday';
  const diff = today - yesterday;
  const pctChange = yesterday > 0 ? Math.abs(Math.round((diff / yesterday) * 100)) : 100;
  return diff > 0 ? `📈 +${pctChange}% (${diff > 0 ? '+' : ''}${diff.toLocaleString()})` : `📉 ${pctChange}% (${diff.toLocaleString()})`;
}

function renderFitnessCharts() {
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  const tickColor = isDark ? '#9ba3c7' : '#4a5080';

  const last14 = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const dk = d.toISOString().slice(0, 10);
    const e = fitnessData.find(f => f.date === dk);
    last14.push({ label: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }), steps: e ? e.steps : 0, workout: e ? e.workout : 0 });
  }

  // Steps chart
  destroyChart('fitnessStepsChart');
  const stepsCtx = document.getElementById('fitnessStepsChart');
  if (stepsCtx) {
    chartInstances['fitnessStepsChart'] = new Chart(stepsCtx, {
      type: 'line',
      data: {
        labels: last14.map(d => d.label),
        datasets: [{
          label: 'Steps',
          data: last14.map(d => d.steps),
          borderColor: '#6c63ff',
          backgroundColor: 'rgba(108,99,255,0.12)',
          fill: true, tension: 0.4, pointBackgroundColor: '#a78bfa', pointRadius: 4
        }, {
          label: 'Goal',
          data: Array(14).fill(goals.steps || 10000),
          borderColor: 'rgba(234,179,8,0.5)',
          borderDash: [5, 5], pointRadius: 0, fill: false
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { labels: { color: tickColor } } },
        scales: { x: { grid: { color: gridColor }, ticks: { color: tickColor } }, y: { grid: { color: gridColor }, ticks: { color: tickColor }, beginAtZero: true } }
      }
    });
  }

  // Workout chart
  destroyChart('fitnessWorkoutChart');
  const workoutCtx = document.getElementById('fitnessWorkoutChart');
  if (workoutCtx) {
    chartInstances['fitnessWorkoutChart'] = new Chart(workoutCtx, {
      type: 'bar',
      data: {
        labels: last14.map(d => d.label),
        datasets: [{
          label: 'Workout (min)',
          data: last14.map(d => d.workout),
          backgroundColor: 'rgba(168,85,247,0.7)',
          borderColor: '#a855f7',
          borderWidth: 1, borderRadius: 6
        }, {
          label: 'Goal',
          data: Array(14).fill(goals.workout || 45),
          type: 'line',
          borderColor: 'rgba(234,179,8,0.5)',
          borderDash: [5, 5], pointRadius: 0, fill: false
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { labels: { color: tickColor } } },
        scales: { x: { grid: { color: gridColor }, ticks: { color: tickColor } }, y: { grid: { color: gridColor }, ticks: { color: tickColor }, beginAtZero: true } }
      }
    });
  }
}

function renderFitnessHistory() {
  const tbody = document.getElementById('fitnessHistoryBody');
  if (!tbody) return;
  if (!fitnessData.length) { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text3);padding:2rem;">No data yet. Log your first activity!</td></tr>'; return; }
  tbody.innerHTML = fitnessData.slice(0, 30).map(f => `
    <tr>
      <td>${formatDate(f.date)}</td>
      <td><strong>${(f.steps || 0).toLocaleString()}</strong> ${f.steps >= (goals.steps || 10000) ? '✅' : ''}</td>
      <td><strong>${f.workout || 0}</strong> ${f.workout >= (goals.workout || 45) ? '✅' : ''}</td>
      <td>${f.type ? `<span class="badge category">${f.type}</span>` : '—'}</td>
      <td style="max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${f.notes || '—'}</td>
      <td>
        <button class="btn-icon" onclick="deleteFitnessEntry('${f.date}')"><i class="fa-solid fa-trash"></i></button>
      </td>
    </tr>
  `).join('');
}

function deleteFitnessEntry(date) {
  if (!confirm(`Delete entry for ${formatDate(date)}?`)) return;
  fitnessData = fitnessData.filter(f => f.date !== date);
  saveFitnessLS();
  renderFitnessTab();
  if (currentTab === 'dashboard') renderDashboard();
  showToast('Entry deleted.', 'info');
}

// =================== ANALYSIS HELPERS ===================
function calcStreaks() {
  const today = new Date(); today.setHours(0,0,0,0);
  let stepStreak = 0, workoutStreak = 0;

  for (let i = 0; i < 365; i++) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const dk = d.toISOString().slice(0, 10);
    const e = fitnessData.find(f => f.date === dk);
    if (!e) { if (i === 0) continue; break; }
    if (e.steps >= (goals.steps || 10000)) stepStreak++;
    else if (i > 0) stepStreak = 0;
    if (e.workout >= (goals.workout || 45)) workoutStreak++;
    else if (i > 0) workoutStreak = 0;
    if (i > 0 && !e) break;
  }

  // Better streak calculation
  stepStreak = 0; workoutStreak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const dk = d.toISOString().slice(0, 10);
    const e = fitnessData.find(f => f.date === dk);
    if (!e) break;
    if (e.steps >= (goals.steps || 10000)) stepStreak++;
    else break;
  }
  for (let i = 0; i < 365; i++) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const dk = d.toISOString().slice(0, 10);
    const e = fitnessData.find(f => f.date === dk);
    if (!e) break;
    if (e.workout >= (goals.workout || 45)) workoutStreak++;
    else break;
  }

  return { stepStreak, workoutStreak };
}

function compareYesterday(today) {
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  const ydk = yesterday.toISOString().slice(0, 10);
  const todayFit = fitnessData.find(f => f.date === today);
  const yFit = fitnessData.find(f => f.date === ydk);

  const stepsToday = todayFit ? todayFit.steps : 0;
  const stepsYest = yFit ? yFit.steps : null;
  const workoutToday = todayFit ? todayFit.workout : 0;
  const workoutYest = yFit ? yFit.workout : null;

  const stepsIcon = stepsYest === null ? '➖' : stepsToday > stepsYest ? '📈' : stepsToday < stepsYest ? '📉' : '➖';
  const workoutIcon = workoutYest === null ? '➖' : workoutToday > workoutYest ? '📈' : workoutToday < workoutYest ? '📉' : '➖';

  return {
    stepsHtml: `<span class="trend-icon">${stepsIcon}</span> Steps: ${getChangeText(stepsToday, stepsYest)}`,
    workoutHtml: `<span class="trend-icon">${workoutIcon}</span> Workout: ${getChangeText(workoutToday, workoutYest)}`
  };
}

// =================== WEEKLY REPORT ===================
function getWeekData(weekOffset = 0) {
  // Get Monday-Sunday for given offset (0 = current week, -1 = last week)
  const today = new Date(); today.setHours(0,0,0,0);
  const dayOfWeek = today.getDay() || 7; // 1=Mon...7=Sun
  const monday = new Date(today); monday.setDate(today.getDate() - (dayOfWeek - 1) + (weekOffset * 7));
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday); d.setDate(monday.getDate() + i);
    const dk = d.toISOString().slice(0, 10);
    const entry = fitnessData.find(f => f.date === dk);
    days.push({ date: dk, label: d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' }), steps: entry ? entry.steps : 0, workout: entry ? entry.workout : 0, hasData: !!entry });
  }

  const totalSteps = days.reduce((s, d) => s + d.steps, 0);
  const totalWorkout = days.reduce((s, d) => s + d.workout, 0);
  const avgSteps = Math.round(totalSteps / 7);
  const avgWorkout = Math.round(totalWorkout / 7);
  const daysWithData = days.filter(d => d.hasData);
  const bestDay = daysWithData.sort((a, b) => b.steps - a.steps)[0] || null;
  const worstDay = daysWithData.sort((a, b) => a.steps - b.steps)[0] || null;
  const goalDays = days.filter(d => d.steps >= (goals.steps || 10000)).length;
  const workoutGoalDays = days.filter(d => d.workout >= (goals.workout || 45)).length;
  const daysOriginal = [];
  for (let i = 0; i < 7; i++) { const d = new Date(monday); d.setDate(monday.getDate() + i); const dk = d.toISOString().slice(0, 10); const entry = fitnessData.find(f => f.date === dk); daysOriginal.push({ date: dk, label: d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' }), steps: entry ? entry.steps : 0, workout: entry ? entry.workout : 0, hasData: !!entry }); }

  return { days: daysOriginal, totalSteps, totalWorkout, avgSteps, avgWorkout, bestDay: daysOriginal.slice().sort((a,b)=>b.steps-a.steps)[0], worstDay: daysOriginal.slice().sort((a,b)=>a.steps-b.steps).filter(d=>d.hasData)[0] || daysOriginal[0], goalDays, workoutGoalDays, monday, sunday };
}

function renderWeeklyReport() {
  const container = document.getElementById('weeklyReportContent');
  if (!container) return;
  destroyChart('weeklyCompareChart');

  const thisWeek = getWeekData(0);
  const lastWeek = getWeekData(-1);

  const stepsChange = lastWeek.totalSteps > 0 ? Math.round(((thisWeek.totalSteps - lastWeek.totalSteps) / lastWeek.totalSteps) * 100) : null;
  const workoutChange = lastWeek.totalWorkout > 0 ? Math.round(((thisWeek.totalWorkout - lastWeek.totalWorkout) / lastWeek.totalWorkout) * 100) : null;

  const stepsSummary = stepsChange !== null ? (stepsChange > 0 ? `Is hafte aapne pichle hafte se <strong>${stepsChange}% zyada</strong> chala hai — great improvement! 🎉` : stepsChange < 0 ? `Is hafte steps <strong>${Math.abs(stepsChange)}% kam</strong> rahe pichle hafte se. Thoda aur chalte hain! 💪` : `Steps <strong>same</strong> rahe pichle hafte ki tarah.`) : `Is hafte steps data available hai: <strong>${thisWeek.totalSteps.toLocaleString()}</strong> total steps.`;
  const workoutSummary = workoutChange !== null ? (workoutChange > 0 ? `Workout time <strong>${workoutChange}% badha</strong> hai — consistency achhi hai! 💯` : workoutChange < 0 ? `Workout time <strong>${Math.abs(workoutChange)}% ghata</strong> hai, isko improve karo.` : `Workout time <strong>same</strong> raha.`) : `Total workout: <strong>${thisWeek.totalWorkout}</strong> minutes.`;

  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  const tickColor = isDark ? '#9ba3c7' : '#4a5080';
  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

  container.innerHTML = `
    <div class="summary-box">${stepsSummary} ${workoutSummary}</div>

    <div class="report-grid">
      <div class="report-stat-card">
        <div class="report-stat-val" style="color:var(--accent)">${thisWeek.totalSteps.toLocaleString()}</div>
        <div class="report-stat-lbl">Total Steps This Week</div>
        ${stepsChange !== null ? `<div class="report-stat-change ${stepsChange >= 0 ? 'up' : 'down'}">${stepsChange >= 0 ? '▲' : '▼'} ${Math.abs(stepsChange)}% vs last week</div>` : ''}
      </div>
      <div class="report-stat-card">
        <div class="report-stat-val" style="color:var(--purple)">${thisWeek.totalWorkout} min</div>
        <div class="report-stat-lbl">Total Workout This Week</div>
        ${workoutChange !== null ? `<div class="report-stat-change ${workoutChange >= 0 ? 'up' : 'down'}">${workoutChange >= 0 ? '▲' : '▼'} ${Math.abs(workoutChange)}% vs last week</div>` : ''}
      </div>
      <div class="report-stat-card">
        <div class="report-stat-val" style="color:var(--green)">${thisWeek.avgSteps.toLocaleString()}</div>
        <div class="report-stat-lbl">Avg Steps/Day</div>
      </div>
      <div class="report-stat-card">
        <div class="report-stat-val" style="color:var(--orange)">${thisWeek.avgWorkout} min</div>
        <div class="report-stat-lbl">Avg Workout/Day</div>
      </div>
      <div class="report-stat-card">
        <div class="report-stat-val" style="color:var(--yellow)">${thisWeek.goalDays}/7</div>
        <div class="report-stat-lbl">Step Goal Days Met</div>
      </div>
      <div class="report-stat-card">
        <div class="report-stat-val" style="color:var(--cyan)">${thisWeek.workoutGoalDays}/7</div>
        <div class="report-stat-lbl">Workout Goal Days Met</div>
      </div>
    </div>

    <div class="best-worst-row">
      <div class="bw-card best">
        <div class="bw-title">🏆 Best Day</div>
        <div class="bw-val">${thisWeek.bestDay?.label || '—'}</div>
        <div style="font-size:0.82rem;color:var(--text2);margin-top:0.2rem">${thisWeek.bestDay?.steps.toLocaleString() || 0} steps, ${thisWeek.bestDay?.workout || 0} min</div>
      </div>
      <div class="bw-card worst">
        <div class="bw-title">📉 Needs Improvement</div>
        <div class="bw-val">${thisWeek.worstDay?.label || '—'}</div>
        <div style="font-size:0.82rem;color:var(--text2);margin-top:0.2rem">${thisWeek.worstDay?.steps.toLocaleString() || 0} steps, ${thisWeek.worstDay?.workout || 0} min</div>
      </div>
    </div>

    <div class="goal-rate-bar">
      <div class="goal-rate-label">Step Goal Achievement Rate: ${thisWeek.goalDays}/7 days (${Math.round((thisWeek.goalDays/7)*100)}%)</div>
      <div class="progress-bar-wrap"><div class="progress-bar blue" style="width:${Math.round((thisWeek.goalDays/7)*100)}%"></div></div>
    </div>

    <div class="card" style="margin-bottom:1rem;">
      <div class="card-header"><i class="fa-solid fa-chart-bar"></i> This Week vs Last Week</div>
      <canvas id="weeklyCompareChart" height="200"></canvas>
    </div>
  `;

  // Render chart after DOM update
  setTimeout(() => {
    const ctx = document.getElementById('weeklyCompareChart');
    if (!ctx) return;
    destroyChart('weeklyCompareChart');
    chartInstances['weeklyCompareChart'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: thisWeek.days.map(d => d.label.split(',')[0]),
        datasets: [
          { label: 'This Week Steps', data: thisWeek.days.map(d => d.steps), backgroundColor: 'rgba(108,99,255,0.7)', borderColor: '#6c63ff', borderWidth: 1, borderRadius: 4 },
          { label: 'Last Week Steps', data: lastWeek.days.map(d => d.steps), backgroundColor: 'rgba(108,99,255,0.25)', borderColor: '#6c63ff', borderWidth: 1, borderRadius: 4 }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { labels: { color: tickColor } } },
        scales: { x: { grid: { color: gridColor }, ticks: { color: tickColor } }, y: { grid: { color: gridColor }, ticks: { color: tickColor }, beginAtZero: true } }
      }
    });
  }, 100);
}

// =================== MONTHLY REPORT ===================
function renderMonthlyReport() {
  const container = document.getElementById('monthlyReportContent');
  if (!container) return;
  destroyChart('monthlyStepsChart');
  destroyChart('monthlyWorkoutChart');

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthDays = [];
  let totalSteps = 0, totalWorkout = 0, goalDays = 0, workoutGoalDays = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const dk = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const e = fitnessData.find(f => f.date === dk);
    const steps = e ? e.steps : 0;
    const workout = e ? e.workout : 0;
    totalSteps += steps; totalWorkout += workout;
    if (e && steps >= (goals.steps || 10000)) goalDays++;
    if (e && workout >= (goals.workout || 45)) workoutGoalDays++;
    monthDays.push({ day: d, dk, steps, workout, hasData: !!e });
  }

  const avgSteps = Math.round(totalSteps / daysInMonth);
  const avgWorkout = Math.round(totalWorkout / daysInMonth);
  const bestDay = monthDays.slice().sort((a, b) => b.steps - a.steps)[0];
  const worstDay = monthDays.filter(d => d.hasData).sort((a, b) => a.steps - b.steps)[0] || monthDays[0];
  const monthName = today.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  const tickColor = isDark ? '#9ba3c7' : '#4a5080';
  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

  container.innerHTML = `
    <div class="summary-box">
      📅 <strong>${monthName}</strong> — Total: <strong>${totalSteps.toLocaleString()} steps</strong> & <strong>${totalWorkout} min workout</strong>.
      Step goal achieved on <strong>${goalDays} out of ${daysInMonth} days</strong>.
      ${goalDays >= 20 ? '🏆 Excellent month!' : goalDays >= 14 ? '👍 Good effort!' : '💪 Keep pushing!'}
    </div>

    <div class="report-grid">
      <div class="report-stat-card"><div class="report-stat-val" style="color:var(--accent)">${totalSteps.toLocaleString()}</div><div class="report-stat-lbl">Total Steps</div></div>
      <div class="report-stat-card"><div class="report-stat-val" style="color:var(--purple)">${totalWorkout} min</div><div class="report-stat-lbl">Total Workout</div></div>
      <div class="report-stat-card"><div class="report-stat-val" style="color:var(--green)">${avgSteps.toLocaleString()}</div><div class="report-stat-lbl">Avg Steps/Day</div></div>
      <div class="report-stat-card"><div class="report-stat-val" style="color:var(--orange)">${avgWorkout} min</div><div class="report-stat-lbl">Avg Workout/Day</div></div>
      <div class="report-stat-card"><div class="report-stat-val" style="color:var(--yellow)">${goalDays}/${daysInMonth}</div><div class="report-stat-lbl">Step Goal Days</div></div>
      <div class="report-stat-card"><div class="report-stat-val" style="color:var(--cyan)">${workoutGoalDays}/${daysInMonth}</div><div class="report-stat-lbl">Workout Goal Days</div></div>
    </div>

    <div class="best-worst-row">
      <div class="bw-card best"><div class="bw-title">🏆 Best Day</div><div class="bw-val">Day ${bestDay.day}</div><div style="font-size:0.82rem;color:var(--text2)">${bestDay.steps.toLocaleString()} steps</div></div>
      <div class="bw-card worst"><div class="bw-title">📉 Lowest Active Day</div><div class="bw-val">Day ${worstDay.day}</div><div style="font-size:0.82rem;color:var(--text2)">${worstDay.steps.toLocaleString()} steps</div></div>
    </div>

    <div class="goal-rate-bar">
      <div class="goal-rate-label">Monthly Step Goal Rate: ${goalDays}/${daysInMonth} days (${Math.round((goalDays/daysInMonth)*100)}%)</div>
      <div class="progress-bar-wrap"><div class="progress-bar green" style="width:${Math.round((goalDays/daysInMonth)*100)}%"></div></div>
    </div>

    <div class="card" style="margin-bottom:1rem;">
      <div class="card-header"><i class="fa-solid fa-chart-line"></i> Monthly Steps</div>
      <canvas id="monthlyStepsChart" height="200"></canvas>
    </div>
    <div class="card">
      <div class="card-header"><i class="fa-solid fa-chart-column"></i> Monthly Workout</div>
      <canvas id="monthlyWorkoutChart" height="200"></canvas>
    </div>
  `;

  setTimeout(() => {
    const stepsCtx = document.getElementById('monthlyStepsChart');
    if (stepsCtx) {
      destroyChart('monthlyStepsChart');
      chartInstances['monthlyStepsChart'] = new Chart(stepsCtx, {
        type: 'line',
        data: {
          labels: monthDays.map(d => `${d.day}`),
          datasets: [
            { label: 'Steps', data: monthDays.map(d => d.steps), borderColor: '#6c63ff', backgroundColor: 'rgba(108,99,255,0.1)', fill: true, tension: 0.3, pointRadius: 2 },
            { label: 'Goal', data: Array(daysInMonth).fill(goals.steps || 10000), borderColor: 'rgba(234,179,8,0.5)', borderDash: [5, 5], pointRadius: 0, fill: false }
          ]
        },
        options: { responsive: true, plugins: { legend: { labels: { color: tickColor } } }, scales: { x: { grid: { color: gridColor }, ticks: { color: tickColor, maxTicksLimit: 10 } }, y: { grid: { color: gridColor }, ticks: { color: tickColor }, beginAtZero: true } } }
      });
    }
    const workoutCtx = document.getElementById('monthlyWorkoutChart');
    if (workoutCtx) {
      destroyChart('monthlyWorkoutChart');
      chartInstances['monthlyWorkoutChart'] = new Chart(workoutCtx, {
        type: 'bar',
        data: {
          labels: monthDays.map(d => `${d.day}`),
          datasets: [{ label: 'Workout (min)', data: monthDays.map(d => d.workout), backgroundColor: 'rgba(168,85,247,0.65)', borderColor: '#a855f7', borderWidth: 1, borderRadius: 4 }]
        },
        options: { responsive: true, plugins: { legend: { labels: { color: tickColor } } }, scales: { x: { grid: { color: gridColor }, ticks: { color: tickColor, maxTicksLimit: 10 } }, y: { grid: { color: gridColor }, ticks: { color: tickColor }, beginAtZero: true } } }
      });
    }
  }, 100);
}

// =================== SETTINGS ===================
function saveGoals() {
  const s = parseInt(document.getElementById('goalSteps').value);
  const w = parseInt(document.getElementById('goalWorkout').value);
  if (s > 0) goals.steps = s;
  if (w > 0) goals.workout = w;
  saveGoalsLS();
  showToast('Goals saved!', 'success');
  renderFitnessAnalysis();
}

function populateGoalInputs() {
  const gs = document.getElementById('goalSteps');
  const gw = document.getElementById('goalWorkout');
  if (gs) gs.value = goals.steps || 10000;
  if (gw) gw.value = goals.workout || 45;
}

function addCategory() {
  const inp = document.getElementById('newCategoryInput');
  const val = inp.value.trim();
  if (!val) return;
  if (categories.includes(val)) { showToast('Category already exists!', 'warning'); return; }
  categories.push(val);
  saveCategoriesLS();
  inp.value = '';
  renderCategories();
  updateCategorySelects();
  showToast('Category added!', 'success');
}

function removeCategory(name) {
  categories = categories.filter(c => c !== name);
  saveCategoriesLS();
  renderCategories();
  updateCategorySelects();
  showToast('Category removed.', 'info');
}

function renderCategories() {
  const container = document.getElementById('categoryList');
  if (!container) return;
  container.innerHTML = categories.map(c => `
    <div class="category-chip">
      <span>${c}</span>
      <button onclick="removeCategory('${c}')"><i class="fa-solid fa-xmark"></i></button>
    </div>
  `).join('');
}

// =================== BACKUP & RESTORE ===================
function exportData() {
  const data = {
    version: '1.0',
    user: currentUser,
    exportedAt: new Date().toISOString(),
    tasks,
    fitnessData,
    goals,
    categories
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `protrack_backup_${currentUser}_${todayStr()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Data exported successfully!', 'success');
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const data = JSON.parse(e.target.result);
      if (!confirm('This will overwrite your current data. Continue?')) return;
      if (data.tasks) { tasks = data.tasks; saveTasksLS(); }
      if (data.fitnessData) { fitnessData = data.fitnessData; saveFitnessLS(); }
      if (data.goals) { goals = data.goals; saveGoalsLS(); }
      if (data.categories) { categories = data.categories; saveCategoriesLS(); }
      showToast('Data imported successfully!', 'success');
      switchTab(currentTab);
    } catch (err) {
      showToast('Invalid file format. Please use a valid ProTrack backup file.', 'error');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

// =================== NOTIFICATIONS ===================
function requestNotificationPermission() {
  if (!('Notification' in window)) { showToast('Notifications not supported in this browser.', 'warning'); return; }
  Notification.requestPermission().then(permission => {
    updateNotifStatus();
    if (permission === 'granted') {
      showToast('Notifications enabled!', 'success');
      scheduleNotifications();
    } else {
      showToast('Notification permission denied.', 'warning');
    }
  });
}

function updateNotifStatus() {
  const el = document.getElementById('notifStatus');
  if (!el) return;
  if (!('Notification' in window)) { el.textContent = 'Not supported'; el.style.color = 'var(--text3)'; return; }
  const status = Notification.permission;
  el.textContent = `Status: ${status.charAt(0).toUpperCase() + status.slice(1)}`;
  el.style.color = status === 'granted' ? 'var(--green)' : status === 'denied' ? 'var(--red)' : 'var(--text3)';
}

function scheduleNotifications() {
  const now = new Date();
  // Check for tasks due today
  const todayTasks = tasks.filter(t => t.status !== 'Completed' && t.dueDate && dateKey(t.dueDate) === todayStr());
  if (todayTasks.length > 0 && Notification.permission === 'granted') {
    new Notification('ProTrack Reminder 📋', {
      body: `You have ${todayTasks.length} task(s) due today!`,
      icon: '⚡'
    });
  }
}

// =================== KEYBOARD SHORTCUTS ===================
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    closeTaskModal();
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('show');
  }
  if (e.ctrlKey && e.key === 'n' && !document.getElementById('taskModal').classList.contains('hidden') === false) {
    e.preventDefault(); openTaskModal();
  }
});

// =================== ENTER KEY for subtask input ===================
document.getElementById('subtaskInput').addEventListener('keypress', function (e) {
  if (e.key === 'Enter') { e.preventDefault(); addSubtask(); }
});

// Close modal on overlay click
document.getElementById('taskModal').addEventListener('click', function (e) {
  if (e.target === this) closeTaskModal();
});

// =================== RESPONSIVE HANDLING ===================
window.addEventListener('resize', function () {
  if (window.innerWidth > 900) {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('show');
  }
});
