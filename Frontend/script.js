/* ============================================
   TaskFlow — Multi-Page App Logic
   Login, Admin, and Team Member are separate
   HTML pages. Shared task/session data is stored
   in localStorage so all pages stay synchronized.
   ============================================ */

const STORAGE_KEY = "taskflow_tasks_v1";
const SESSION_KEY = "taskflow_session_v1";

/* ---------- Seed data (first run only) ---------- */

const SEED_TASKS = [
  {
    id: "t1",
    title: "Redesign landing page",
    assignedTo: "Sara Chen",
    assignedBy: "Alex Morgan",
    deadline: "2026-07-18",
    priority: "High",
    status: "In Progress",
    description:
      "Refresh the marketing landing page with the new brand palette, updated hero copy, and a clearer call to action above the fold.",
  },
  {
    id: "t2",
    title: "Fix authentication bug",
    assignedTo: "James Park",
    assignedBy: "Alex Morgan",
    deadline: "2026-07-15",
    priority: "Critical",
    status: "Overdue",
    description:
      "Users are occasionally logged out mid-session. Investigate the token refresh flow and ship a fix with regression tests.",
  },
  {
    id: "t3",
    title: "Redesign landing page",
    assignedTo: "Sara Chen",
    assignedBy: "Alex Morgan",
    deadline: "2026-07-18",
    priority: "High",
    status: "Pending",
    description: "Second pass on the landing page: revise the pricing section layout.",
  },
  {
    id: "t4",
    title: "Redesign landing page",
    assignedTo: "Sara Chen",
    assignedBy: "Alex Morgan",
    deadline: "2026-07-18",
    priority: "Low",
    status: "Pending",
    description: "Swap in the new footer illustration once the asset is ready.",
  },
  {
    id: "t5",
    title: "Redesign landing page",
    assignedTo: "Sara Chen",
    assignedBy: "Alex Morgan",
    deadline: "2026-07-18",
    priority: "High",
    status: "Completed",
    description: "Initial wireframe review with the design team.",
  },
  {
    id: "t6",
    title: "Redesign landing page",
    assignedTo: "Sara Chen",
    assignedBy: "Alex Morgan",
    deadline: "2026-07-18",
    priority: "High",
    status: "Completed",
    description: "Finalize typography scale for the landing page.",
  },
  {
    id: "t7",
    title: "Redesign landing page",
    assignedTo: "Sara Chen",
    assignedBy: "Alex Morgan",
    deadline: "2026-07-18",
    priority: "High",
    status: "In Progress",
    description: "Build the responsive nav bar for the landing page.",
  },
];

/* ---------- Storage helpers ---------- */

function loadTasks() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_TASKS));
    return [...SEED_TASKS];
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_TASKS));
    return [...SEED_TASKS];
  }
}

function saveTasks(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch (e) {
    return null;
  }
}

function setSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

/* ---------- Small utilities ---------- */

function initials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
}

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d)) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function todayLabel() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function priorityClass(priority) {
  return "priority-" + priority.toLowerCase();
}

function statusClass(status) {
  return "status-" + status.toLowerCase().replace(/\s+/g, "");
}

function showToast(message) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove("visible"), 2400);
}

function escapeAttr(str) {
  return String(str).replace(/"/g, "&quot;");
}

/* ---------- Inline icon set (kept small & dependency-free) ---------- */

const ICONS = {
  eye: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>`,
  eyeSmall: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px;margin-right:2px;"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>`,
  edit: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>`,
  trash: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
};

/* ============================================
   MULTI-PAGE APP ENTRY POINT
   ============================================ */

function initApp() {
  const session = getSession();

  // LOGIN PAGE
  if (document.getElementById("login-form")) {
    if (session && session.role === "Administrator") {
      window.location.href = "admin.html";
      return;
    }

    if (session && session.role === "Team Member") {
      window.location.href = "member.html";
      return;
    }

    wireLoginView();
    return;
  }

  // ADMIN PAGE
  if (document.getElementById("admin-task-table-body")) {
    if (!session || session.role !== "Administrator") {
      window.location.href = "login.html";
      return;
    }

    wireAdminView();
    renderAdminView();
    return;
  }

  // TEAM MEMBER PAGE
  if (document.getElementById("member-task-table-body")) {
    if (!session || session.role !== "Team Member") {
      window.location.href = "login.html";
      return;
    }

    wireMemberView();
    renderMemberView();
    return;
  }
}

/* ============================================
   LOGIN VIEW
   ============================================ */


function wireLoginView() {
  const form = document.getElementById("login-form");
  const errorBox = document.getElementById("login-error");

  // Prevent Enter from submitting — require clicking a role button.
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    errorBox.textContent = "Please click 'Sign in as Admin' or 'Sign in as Team Member' to sign in.";
    errorBox.classList.add("visible");
  });

  function doLogin(role) {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const emailPattern = /^\S+@\S+\.\S+$/;

    if (!email || !password) {
      errorBox.textContent = "Please enter both your email address and password.";
      errorBox.classList.add("visible");
      return;
    }
    if (!emailPattern.test(email)) {
      errorBox.textContent = "Please enter a valid email address (e.g. you@company.com).";
      errorBox.classList.add("visible");
      return;
    }

    errorBox.classList.remove("visible");
    form.reset();

    if (role === "admin") {
      setSession({ name: "Alex Morgan", role: "Administrator", initials: "AM" });
      window.location.href = "admin.html";
    } else {
      setSession({ name: "Sara Chen", role: "Team Member", initials: "SC" });
      window.location.href = "member.html";
    }
  }

  const btnAdmin = document.getElementById("btn-signin-admin");
  const btnMember = document.getElementById("btn-signin-member");
  if (btnAdmin) btnAdmin.addEventListener("click", () => doLogin("admin"));
  if (btnMember) btnMember.addEventListener("click", () => doLogin("member"));
}

/* ============================================
   ADMIN VIEW
   ============================================ */

let adminTasks = [];

function wireAdminView() {
  document.getElementById("admin-logout-btn").addEventListener("click", () => {
    clearSession();
    window.location.href = "login.html";
  });

  const modal = document.getElementById("task-modal");
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeAdminModal();
  });

  document.getElementById("allocate-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const session = getSession() || { name: "Alex Morgan" };
    const title = document.getElementById("task-title").value.trim();
    const assignee = document.getElementById("assign-user").value;
    const priority = document.getElementById("task-priority").value;
    const deadline = document.getElementById("task-deadline").value;
    const description = document.getElementById("task-description").value.trim();

    if (!title || !assignee || !deadline) {
      showToast("Please fill in title, assignee, and deadline");
      return;
    }

    adminTasks.unshift({
      id: "t" + Date.now(),
      title,
      assignedTo: assignee,
      assignedBy: session.name,
      deadline,
      priority,
      status: "Pending",
      description,
    });
    saveTasks(adminTasks);
    renderAdminView();
    e.target.reset();
    showToast("Task allocated to " + assignee);
  });

  document.getElementById("admin-task-table-body").addEventListener("click", (e) => {
    const viewId = e.target.closest("[data-view]")?.getAttribute("data-view");
    const editId = e.target.closest("[data-edit]")?.getAttribute("data-edit");
    const delId = e.target.closest("[data-delete]")?.getAttribute("data-delete");

    if (viewId) openAdminViewModal(viewId);
    if (editId) openAdminEditModal(editId);
    if (delId) openAdminDeleteModal(delId);
  });
}

function renderAdminView() {
  const session = getSession() || { name: "Alex Morgan", role: "Administrator", initials: "AM" };
  document.getElementById("admin-name").textContent = session.name;
  document.getElementById("admin-avatar").textContent = session.initials;
  document.getElementById("admin-welcome-name").textContent = session.name.split(" ")[0];
  document.getElementById("admin-today-label").textContent = todayLabel();

  adminTasks = loadTasks();
  renderAdminStats();
  renderAdminTable();
  populateAssigneeSelect();
}

function renderAdminStats() {
  const total = adminTasks.length;
  const completed = adminTasks.filter((t) => t.status === "Completed").length;
  const pending = adminTasks.filter((t) => t.status === "Pending").length;
  const overdue = adminTasks.filter((t) => t.status === "Overdue").length;

  document.getElementById("stat-total").textContent = total;
  document.getElementById("stat-completed").textContent = completed;
  document.getElementById("stat-pending").textContent = pending;
  document.getElementById("stat-overdue").textContent = overdue;

  document.getElementById("stat-completed-rate").textContent =
    total ? ((completed / total) * 100).toFixed(1) + "% completion rate" : "0% completion rate";
  document.getElementById("stat-pending-rate").textContent =
    total ? ((pending / total) * 100).toFixed(1) + "% of total tasks" : "0% of total tasks";
}

function renderAdminTable() {
  const tbody = document.getElementById("admin-task-table-body");
  tbody.innerHTML = "";
  if (!adminTasks.length) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state">No tasks yet. Allocate one using the form on the right.</div></td></tr>`;
    return;
  }
  adminTasks.forEach((task) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${task.title}</td>
      <td>
        <div class="person-cell">
          <span class="avatar">${initials(task.assignedTo)}</span>
          <span>${task.assignedTo}</span>
        </div>
      </td>
      <td>${formatDate(task.deadline)}</td>
      <td><span class="chip ${priorityClass(task.priority)}">${task.priority}</span></td>
      <td><span class="chip ${statusClass(task.status)}">${task.status}</span></td>
      <td>
        <div class="action-cell">
          <button class="icon-action view" data-view="${task.id}" title="View" aria-label="View task">${ICONS.eye}</button>
          <button class="icon-action edit" data-edit="${task.id}" title="Edit" aria-label="Edit task">${ICONS.edit}</button>
          <button class="icon-action delete" data-delete="${task.id}" title="Delete" aria-label="Delete task">${ICONS.trash}</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function populateAssigneeSelect() {
  const select = document.getElementById("assign-user");
  const people = Array.from(new Set(adminTasks.map((t) => t.assignedTo))).concat([
    "Sara Chen",
    "James Park",
    "Priya Nair",
    "Diego Alvarez",
  ]);
  const unique = Array.from(new Set(people));
  const current = select.value;
  select.innerHTML = `<option value="" disabled selected>Select team member</option>`;
  unique.forEach((name) => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    select.appendChild(opt);
  });
  if (unique.includes(current)) select.value = current;
}

function openAdminViewModal(id) {
  const modal = document.getElementById("task-modal");
  const task = adminTasks.find((t) => t.id === id);
  if (!task) return;
  modal.querySelector("#modal-title").textContent = task.title;
  modal.querySelector("#modal-body").innerHTML = `
    <div class="chip-row">
      <span class="chip ${priorityClass(task.priority)}">${task.priority}</span>
      <span class="chip ${statusClass(task.status)}">${task.status}</span>
    </div>
    <div class="desc-box">
      <span class="label-caps">Description</span>
      ${task.description || "No description provided."}
    </div>
    <div class="meta-grid">
      <div class="meta-box"><span class="label-caps">Assigned to</span><span class="value">${task.assignedTo}</span></div>
      <div class="meta-box"><span class="label-caps">Deadline</span><span class="value">${formatDate(task.deadline)}</span></div>
    </div>
  `;
  modal.querySelector("#modal-actions").innerHTML = `<button class="btn btn-outline" id="modal-close-btn">Close</button>`;
  modal.classList.add("visible");
  modal.querySelector("#modal-close-btn").addEventListener("click", closeAdminModal);
}

function openAdminEditModal(id) {
  const modal = document.getElementById("task-modal");
  const task = adminTasks.find((t) => t.id === id);
  if (!task) return;
  modal.querySelector("#modal-title").textContent = "Edit Task";
  modal.querySelector("#modal-body").innerHTML = `
    <div class="field">
      <label for="edit-title">Task Title</label>
      <input type="text" id="edit-title" value="${escapeAttr(task.title)}">
    </div>
    <div class="field-grid-2">
      <div class="field">
        <label for="edit-priority">Priority</label>
        <select id="edit-priority">
          ${["Low", "Medium", "High", "Critical"]
            .map((p) => `<option value="${p}" ${p === task.priority ? "selected" : ""}>${p}</option>`)
            .join("")}
        </select>
      </div>
      <div class="field">
        <label for="edit-status">Status</label>
        <select id="edit-status">
          ${["Pending", "In Progress", "Completed", "Overdue"]
            .map((s) => `<option value="${s}" ${s === task.status ? "selected" : ""}>${s}</option>`)
            .join("")}
        </select>
      </div>
    </div>
    <div class="field">
      <label for="edit-deadline">Deadline</label>
      <input type="date" id="edit-deadline" value="${task.deadline}">
    </div>
  `;
  modal.querySelector("#modal-actions").innerHTML = `
    <button class="btn btn-outline" id="modal-cancel-btn">Cancel</button>
    <button class="btn btn-primary small" id="modal-save-btn">Save Changes</button>
  `;
  modal.classList.add("visible");
  modal.querySelector("#modal-cancel-btn").addEventListener("click", closeAdminModal);
  modal.querySelector("#modal-save-btn").addEventListener("click", () => {
    task.title = document.getElementById("edit-title").value.trim() || task.title;
    task.priority = document.getElementById("edit-priority").value;
    task.status = document.getElementById("edit-status").value;
    task.deadline = document.getElementById("edit-deadline").value;
    saveTasks(adminTasks);
    renderAdminStats();
    renderAdminTable();
    closeAdminModal();
    showToast("Task updated");
  });
}

function openAdminDeleteModal(id) {
  const modal = document.getElementById("task-modal");
  const task = adminTasks.find((t) => t.id === id);
  if (!task) return;
  modal.querySelector("#modal-title").textContent = "Delete Task";
  modal.querySelector("#modal-body").innerHTML = `<p style="color: var(--ink-700); margin: 0;">Delete "<strong>${task.title}</strong>" assigned to ${task.assignedTo}? This can't be undone.</p>`;
  modal.querySelector("#modal-actions").innerHTML = `
    <button class="btn btn-outline" id="modal-cancel-btn">Cancel</button>
    <button class="btn btn-primary small" id="modal-delete-btn" style="background: var(--red-600);">Delete</button>
  `;
  modal.classList.add("visible");
  modal.querySelector("#modal-cancel-btn").addEventListener("click", closeAdminModal);
  modal.querySelector("#modal-delete-btn").addEventListener("click", () => {
    adminTasks = adminTasks.filter((t) => t.id !== id);
    saveTasks(adminTasks);
    renderAdminStats();
    renderAdminTable();
    closeAdminModal();
    showToast("Task deleted");
  });
}

function closeAdminModal() {
  document.getElementById("task-modal").classList.remove("visible");
}

/* ============================================
   TEAM MEMBER VIEW
   ============================================ */

let memberTasks = [];
let memberSelectedId = null;

function wireMemberView() {
  document.getElementById("member-logout-btn").addEventListener("click", () => {
    clearSession();
    window.location.href = "login.html";
  });

  document.getElementById("member-task-table-body").addEventListener("click", (e) => {
    const id = e.target.closest("[data-select]")?.getAttribute("data-select");
    if (!id) return;
    memberSelectedId = id;
    renderMemberTable();
    renderMemberDetails();
  });

  document.getElementById("update-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("update-text");
    const text = input.value.trim();
    if (!text) {
      showToast("Write an update before submitting");
      return;
    }
    input.value = "";
    showToast("Update submitted");
  });
}

function renderMemberView() {
  const session = getSession() || { name: "Sara Chen", role: "Team Member", initials: "SC" };
  document.getElementById("member-name").textContent = session.name;
  document.getElementById("member-avatar").textContent = session.initials;
  document.getElementById("member-today-label").textContent = todayLabel();

  const allTasks = loadTasks();
  memberTasks = allTasks.filter((t) => t.assignedTo === session.name);
  memberSelectedId = memberTasks[0] ? memberTasks[0].id : null;

  renderMemberHead();
  renderMemberTable();
  renderMemberDetails();
}

function renderMemberHead() {
  document.getElementById("task-count").textContent = memberTasks.length;
  const inProgress = memberTasks.filter((t) => t.status === "In Progress").length;
  const pending = memberTasks.filter((t) => t.status === "Pending").length;
  document.getElementById("badge-inprogress").textContent = inProgress + " in progress";
  document.getElementById("badge-pending").textContent = pending + " pending";
}

function renderMemberTable() {
  const tbody = document.getElementById("member-task-table-body");
  tbody.innerHTML = "";
  if (!memberTasks.length) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state">No tasks assigned to you yet.</div></td></tr>`;
    return;
  }
  memberTasks.forEach((task) => {
    const tr = document.createElement("tr");
    tr.className = task.id === memberSelectedId ? "row-selected" : "";
    tr.innerHTML = `
      <td>${task.title}</td>
      <td>Admin (${task.assignedBy})</td>
      <td>${formatDate(task.deadline)}</td>
      <td><span class="chip ${priorityClass(task.priority)}">${task.priority}</span></td>
      <td><span class="chip ${statusClass(task.status)}">${task.status}</span></td>
      <td><button class="link-action" data-select="${task.id}">${ICONS.eyeSmall} View</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function renderMemberDetails() {
  const panel = document.getElementById("details-panel");
  const task = memberTasks.find((t) => t.id === memberSelectedId);
  if (!task) {
    panel.innerHTML = `<div class="empty-state">Select a task to view its details.</div>`;
    document.getElementById("update-panel").style.display = "none";
    return;
  }
  document.getElementById("update-panel").style.display = "";
  panel.innerHTML = `
    <h3 style="margin: 0 0 12px; font-size: 1.05rem;">${task.title}</h3>
    <div class="chip-row">
      <span class="chip ${priorityClass(task.priority)}">${task.priority}</span>
      <span class="chip ${statusClass(task.status)}">${task.status}</span>
    </div>
    <div class="desc-box">
      <span class="label-caps">Description</span>
      ${task.description || "No description provided."}
    </div>
    <div class="meta-grid">
      <div class="meta-box"><span class="label-caps">Assigned By</span><span class="value">${task.assignedBy}</span></div>
      <div class="meta-box"><span class="label-caps">Deadline</span><span class="value">${formatDate(task.deadline)}</span></div>
    </div>
  `;
}
