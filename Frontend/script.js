// =====================================================
// TASKFLOW FRONTEND JAVASCRIPT
// =====================================================

document.addEventListener("DOMContentLoaded", () => {

    console.log("TaskFlow frontend loaded");

    // =================================================
    // LOGIN PAGE
    // =================================================

    const adminLoginButton = document.getElementById("btn-signin-admin");
    const memberLoginButton = document.getElementById("btn-signin-member");

    if (adminLoginButton) {
        adminLoginButton.addEventListener("click", () => {
            login("admin");
        });
    }

    if (memberLoginButton) {
        memberLoginButton.addEventListener("click", () => {
            login("member");
        });
    }


    // =================================================
    // ADMIN PAGE
    // =================================================

    if (document.getElementById("allocate-form")) {

        console.log("Admin page detected");

        loadAdminMembers();
        loadAdminTasks();
        loadDashboard();

        setupTaskForm();
        setupAdminLogout();
    }


    // =================================================
    // MEMBER PAGE
    // =================================================

    if (window.location.pathname.includes("member.html")) {

        console.log("Member page detected");

        loadMemberPage();

        setupMemberLogout();

        setupMemberUpdate();
    }

});


// =====================================================
// LOGIN FUNCTION
// =====================================================

async function login(role) {

    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const errorBox = document.getElementById("login-error");

    if (!emailInput || !passwordInput) {
        console.error("Login fields not found");
        return;
    }

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    // Clear previous error
    if (errorBox) {
        errorBox.textContent = "";
    }

    // Validation
    if (!email || !password) {

        if (errorBox) {
            errorBox.textContent =
                "Please enter email and password.";
        }

        return;
    }

    try {

        console.log(`Logging in as ${role}...`);

        const response = await fetch("/api/auth/login", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                email: email,
                password: password,
                role: role
            })
        });


        const data = await response.json();

        console.log("Login response:", data);


        // Login failed
        if (!response.ok || !data.success) {

            if (errorBox) {
                errorBox.textContent =
                    data.message || "Login failed.";
            }

            return;
        }


        // =================================================
        // SAVE LOGIN INFORMATION
        // =================================================

        localStorage.setItem(
            "taskflow_token",
            data.token
        );

        localStorage.setItem(
            "taskflow_user",
            JSON.stringify(data.user)
        );


        // =================================================
        // REDIRECT
        // =================================================

        if (data.user.role === "admin") {

            console.log("Redirecting to admin page...");

            window.location.href = "/admin.html";

        } else if (data.user.role === "member") {

            console.log("Redirecting to member page...");

            window.location.href = "/member.html";
        }

    } catch (error) {

        console.error("Login error:", error);

        if (errorBox) {
            errorBox.textContent =
                "Unable to connect to server.";
        }
    }
}


// =====================================================
// GET LOGGED-IN USER
// =====================================================

function getLoggedInUser() {

    const user = localStorage.getItem("taskflow_user");

    if (!user) {
        return null;
    }

    try {
        return JSON.parse(user);
    } catch (error) {
        console.error("Invalid stored user:", error);
        return null;
    }
}


// =====================================================
// ADMIN - LOAD MEMBERS
// =====================================================

const API_BASE_URL = "/api";

async function apiRequest(endpoint, options = {}) {

    const token = getToken();

    const response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
            ...options,

            headers: {
                "Content-Type": "application/json",

                ...(token
                    ? {
                        Authorization:
                            `Bearer ${token}`
                    }
                    : {}),

                ...(options.headers || {})
            }
        }
    );

    const data =
        await response.json();

    if (!response.ok) {

        throw new Error(
            data.message ||
            "Request failed"
        );
    }

    return data;
}loadMemberPage

async function loadAdminMembers() {

    const select = document.getElementById("assign-user");

    if (!select) {
        console.error("assign-user select not found");
        return;
    }

    try {

        console.log("Loading members...");

        const response = await fetch("/api/admin/members");

        const members = await response.json();

        console.log("Members received:", members);


        if (!response.ok) {

            throw new Error(
                members.message || "Failed to load members"
            );
        }


        // Clear current options

        select.innerHTML = "";

        // Default option

        const defaultOption =
            document.createElement("option");

        defaultOption.value = "";
        defaultOption.textContent =
            "Select team member";
        defaultOption.disabled = true;
        defaultOption.selected = true;

        select.appendChild(defaultOption);


        // No members

        if (members.length === 0) {

            const option =
                document.createElement("option");

            option.value = "";
            option.textContent =
                "No active members found";

            option.disabled = true;

            select.appendChild(option);

            return;
        }


        // Add members

        members.forEach(member => {

            const option =
                document.createElement("option");

            option.value = member._id;

            option.textContent =
                `${member.name} (${member.email})`;

            select.appendChild(option);
        });


        console.log(
            `${members.length} members loaded`
        );

    } catch (error) {

        console.error(
            "Error loading members:",
            error
        );

        select.innerHTML = "";

        const option =
            document.createElement("option");

        option.textContent =
            "Failed to load members";

        option.disabled = true;

        select.appendChild(option);
    }
}


// =====================================================
// ADMIN - LOAD DASHBOARD
// =====================================================

async function loadDashboard() {

    try {

        const response =
            await fetch("/api/admin/dashboard");

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Failed to load dashboard"
            );
        }


        const total =
            document.getElementById("stat-total");

        const completed =
            document.getElementById("stat-completed");

        const pending =
            document.getElementById("stat-pending");

        const overdue =
            document.getElementById("stat-overdue");


        if (total) {
            total.textContent =
                data.totalTasks;
        }

        if (completed) {
            completed.textContent =
                data.completedTasks;
        }

        if (pending) {
            pending.textContent =
                data.pendingTasks;
        }

        if (overdue) {
            overdue.textContent =
                data.overdueTasks;
        }


        // Completion percentage

        const completedRate =
            document.getElementById(
                "stat-completed-rate"
            );

        if (completedRate) {

            const rate =
                data.totalTasks > 0
                    ? Math.round(
                        (data.completedTasks /
                            data.totalTasks) *
                        100
                    )
                    : 0;

            completedRate.textContent =
                `${rate}% completion rate`;
        }


        // Pending percentage

        const pendingRate =
            document.getElementById(
                "stat-pending-rate"
            );

        if (pendingRate) {

            const rate =
                data.totalTasks > 0
                    ? Math.round(
                        (data.pendingTasks /
                            data.totalTasks) *
                        100
                    )
                    : 0;

            pendingRate.textContent =
                `${rate}% of total tasks`;
        }

    } catch (error) {

        console.error(
            "Dashboard loading error:",
            error
        );
    }
}


// =====================================================
// ADMIN - LOAD TASKS
// =====================================================

async function loadAdminTasks() {

    const tableBody =
        document.getElementById(
            "admin-task-table-body"
        );

    if (!tableBody) {
        return;
    }

    try {

        const response =
            await fetch("/api/admin/tasks");

        const tasks =
            await response.json();

        if (!response.ok) {
            throw new Error(
                tasks.message ||
                "Failed to load tasks"
            );
        }


        tableBody.innerHTML = "";


        if (tasks.length === 0) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="6">
                        No tasks found
                    </td>
                </tr>
            `;

            return;
        }


        tasks.forEach(task => {

            const row =
                document.createElement("tr");


            const assignedName =
                task.assignedTo
                    ? task.assignedTo.name
                    : "Not assigned";


            const deadline =
                task.deadline
                    ? new Date(
                        task.deadline
                    ).toLocaleDateString()
                    : "-";


            row.innerHTML = `

                <td>
                    ${escapeHtml(task.title)}
                </td>

                <td>
                    ${escapeHtml(assignedName)}
                </td>

                <td>
                    ${deadline}
                </td>

                <td>
                    ${escapeHtml(
                        task.priority || "-"
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        task.status || "pending"
                    )}
                </td>

                <td>
                    <button
                        class="delete-task-btn"
                        data-id="${task._id}"
                    >
                        Delete
                    </button>
                </td>

            `;

            tableBody.appendChild(row);
        });


        // Delete buttons

        document
            .querySelectorAll(".delete-task-btn")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        deleteTask(
                            button.dataset.id
                        );

                    }
                );

            });

    } catch (error) {

        console.error(
            "Error loading tasks:",
            error
        );
    }
}


// =====================================================
// ADMIN - CREATE TASK
// =====================================================

function setupTaskForm() {

    const form =
        document.getElementById(
            "allocate-form"
        );

    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const title =
                document.getElementById(
                    "task-title"
                ).value.trim();


            const assignedTo =
                document.getElementById(
                    "assign-user"
                ).value;


            const priority =
                document.getElementById(
                    "task-priority"
                ).value.toLowerCase();


            const deadline =
                document.getElementById(
                    "task-deadline"
                ).value;


            const description =
                document.getElementById(
                    "task-description"
                ).value.trim();


            const user =
                getLoggedInUser();


            // ==========================================
            // VALIDATION
            // ==========================================

            if (!title) {
                alert("Please enter task title.");
                return;
            }

            if (!assignedTo) {
                alert("Please select a team member.");
                return;
            }

            if (!deadline) {
                alert("Please select a deadline.");
                return;
            }

            if (!user || user.role !== "admin") {

                alert(
                    "Admin login information not found."
                );

                return;
            }


            // ==========================================
            // CREATE TASK
            // ==========================================

            try {

                const response =
                    await fetch(
                        "/api/admin/tasks",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({

                                title,

                                description,

                                assignedTo,

                                createdBy:
                                    user.id,

                                priority,

                                deadline

                            })
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    alert(
                        data.message ||
                        "Failed to create task."
                    );

                    return;
                }


                alert(
                    "Task allocated successfully!"
                );


                // Clear form

                form.reset();


                // Reload data

                await loadAdminTasks();

                await loadDashboard();

            } catch (error) {

                console.error(
                    "Create task error:",
                    error
                );

                alert(
                    "Unable to connect to server."
                );
            }

        }
    );
}


// =====================================================
// ADMIN - DELETE TASK
// =====================================================

async function deleteTask(taskId) {

    const confirmDelete =
        confirm(
            "Are you sure you want to delete this task?"
        );

    if (!confirmDelete) {
        return;
    }


    try {

        const response =
            await fetch(
                `/api/admin/tasks/${taskId}`,
                {
                    method: "DELETE"
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            alert(
                data.message ||
                "Failed to delete task."
            );

            return;
        }


        alert(
            "Task deleted successfully."
        );


        await loadAdminTasks();

        await loadDashboard();

    } catch (error) {

        console.error(
            "Delete task error:",
            error
        );

        alert(
            "Unable to connect to server."
        );
    }
}


// =====================================================
// ADMIN LOGOUT
// =====================================================

function setupAdminLogout() {

    const logoutButton =
        document.getElementById(
            "admin-logout-btn"
        );

    if (!logoutButton) {
        return;
    }


    logoutButton.addEventListener(
        "click",
        () => {

            localStorage.removeItem(
                "taskflow_token"
            );

            localStorage.removeItem(
                "taskflow_user"
            );

            window.location.href = "/";
        }
    );


    // Display admin name

    const user =
        getLoggedInUser();


    if (user) {

        const adminName =
            document.getElementById(
                "admin-name"
            );

        const welcomeName =
            document.getElementById(
                "admin-welcome-name"
            );

        const avatar =
            document.getElementById(
                "admin-avatar"
            );


        if (adminName) {
            adminName.textContent =
                user.name;
        }

        if (welcomeName) {
            welcomeName.textContent =
                user.name.split(" ")[0];
        }

        if (avatar) {

            const parts =
                user.name
                    .trim()
                    .split(" ");

            let initials =
                parts[0]
                    ? parts[0][0]
                    : "";

            if (parts.length > 1) {

                initials +=
                    parts[
                        parts.length - 1
                    ][0];
            }

            avatar.textContent =
                initials.toUpperCase();
        }
    }
}


// =====================================================
// MEMBER PAGE
// =====================================================

async function loadMemberPage() {

    const user =
        getLoggedInUser();


    // -----------------------------------------
    // Check login
    // -----------------------------------------

    if (!user || user.role !== "member") {

        clearSession();

        window.location.href = "/";

        return;
    }


    console.log(
        "Logged in member:",
        user
    );


    // -----------------------------------------
    // Header information
    // -----------------------------------------

    const memberName =
        document.getElementById(
            "member-name"
        );

    const memberAvatar =
        document.getElementById(
            "member-avatar"
        );

    const today =
        document.getElementById(
            "member-today-label"
        );


    if (memberName) {
        memberName.textContent =
            user.name;
    }


    if (memberAvatar) {

        const parts =
            user.name
                .trim()
                .split(" ");

        let initials =
            parts[0]
                ? parts[0][0]
                : "";

        if (parts.length > 1) {

            initials +=
                parts[parts.length - 1][0];
        }

        memberAvatar.textContent =
            initials.toUpperCase();
    }


    if (today) {
        today.textContent =
            todayLabel();
    }


    // -----------------------------------------
    // Load tasks from MongoDB
    // -----------------------------------------

    try {

        const data =
            await apiRequest(
                "/member/tasks"
            );


        console.log(
            "Member tasks:",
            data.tasks
        );


        renderMemberTasks(
            data.tasks || []
        );


    } catch (error) {

        console.error(
            "Member task error:",
            error
        );


        showToast(
            error.message ||
            "Unable to load your tasks"
        );
    }
}

function formatPriority(priority) {

    if (!priority) {
        return "Medium";
    }

    return priority
        .charAt(0)
        .toUpperCase()
        + priority.slice(1);
}


function formatStatus(status) {

    if (!status) {
        return "Pending";
    }

    return status
        .split("_")
        .map(word =>
            word
                .charAt(0)
                .toUpperCase()
            + word.slice(1)
        )
        .join(" ");
}


function priorityClass(priority) {

    return "priority-" +
        priority
            .toLowerCase();
}


function statusClass(status) {

    return "status-" +
        status
            .toLowerCase()
            .replace(/\s+/g, "");
}

function updateMemberStats(tasks) {

    const count =
        document.getElementById(
            "task-count"
        );

    const inProgress =
        document.getElementById(
            "badge-inprogress"
        );

    const pending =
        document.getElementById(
            "badge-pending"
        );


    const progressCount =
        tasks.filter(
            task =>
                task.status ===
                "in_progress"
        ).length;


    const pendingCount =
        tasks.filter(
            task =>
                task.status ===
                "pending"
        ).length;


    if (count) {
        count.textContent =
            tasks.length;
    }


    if (inProgress) {
        inProgress.textContent =
            `${progressCount} in progress`;
    }


    if (pending) {
        pending.textContent =
            `${pendingCount} pending`;
    }
}



function renderTaskDetails(task) {

    const panel =
        document.getElementById("details-panel");


    if (!panel || !task) {
        return;
    }


    // ==========================================
    // STORE SELECTED TASK
    // ==========================================

    window.selectedMemberTaskId =
        task._id;


    // ==========================================
    // FORMAT DATA
    // ==========================================

    const priority =
        formatPriority(task.priority);


    const status =
        formatStatus(task.status);


    const assignedBy =
        task.createdBy
            ? task.createdBy.name
            : "Admin";


    const deadline =
        task.deadline
            ? new Date(task.deadline)
                .toLocaleDateString(
                    "en-US",
                    {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                    }
                )
            : "-";


    // ==========================================
    // DISPLAY TASK DETAILS
    // ==========================================

    panel.innerHTML = `

        <h3
            style="
                margin: 0 0 12px;
                font-size: 1.05rem;
            "
        >
            ${escapeHtml(task.title)}
        </h3>


        <div class="chip-row">

            <span class="chip ${priorityClass(priority)}">
                ${escapeHtml(priority)}
            </span>

            <span class="chip ${statusClass(status)}">
                ${escapeHtml(status)}
            </span>

        </div>


        <div class="desc-box">

            <span class="label-caps">
                Description
            </span>

            ${escapeHtml(
                task.description ||
                "No description provided."
            )}

        </div>


        <div class="meta-grid">

            <div class="meta-box">

                <span class="label-caps">
                    Assigned By
                </span>

                <span class="value">
                    ${escapeHtml(assignedBy)}
                </span>

            </div>


            <div class="meta-box">

                <span class="label-caps">
                    Deadline
                </span>

                <span class="value">
                    ${deadline}
                </span>

            </div>

        </div>


        ${
            task.updateDescription
                ? `
                    <div class="desc-box">

                        <span class="label-caps">
                            Latest Update
                        </span>

                        ${escapeHtml(
                            task.updateDescription
                        )}

                    </div>
                `
                : ""
        }

    `;


    // ==========================================
    // SHOW UPDATE PANEL
    // ==========================================

    const updatePanel =
        document.getElementById("update-panel");


    if (updatePanel) {
        updatePanel.style.display = "";
    }


    // ==========================================
    // SET CURRENT STATUS
    // ==========================================

    const statusSelect =
        document.getElementById("update-status");


    if (statusSelect) {

        // Convert backend status directly

        statusSelect.value =
            task.status || "pending";
    }


    console.log(
        "Task selected successfully:",
        task._id
    );
}

function setupMemberUpdate() {

    const form =
        document.getElementById(
            "update-form"
        );


    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            // ==========================================
            // GET SELECTED TASK
            // ==========================================

            const taskId =
                window.selectedMemberTaskId;


            if (!taskId) {

                showToast(
                    "Please select a task first."
                );

                return;
            }


            const status =
                document.getElementById(
                    "update-status"
                ).value;


            const updateDescription =
                document.getElementById(
                    "update-text"
                ).value.trim();


            if (!updateDescription) {

                showToast(
                    "Please enter your work update."
                );

                return;
            }


            console.log(
                "Submitting update for task:",
                taskId
            );


            try {

                const data =
                    await apiRequest(
                        `/member/tasks/${taskId}/update`,
                        {
                            method: "PATCH",

                            body: JSON.stringify({

                                status:
                                    status,

                                updateDescription:
                                    updateDescription
                            })
                        }
                    );


                console.log(
                    "Updated task:",
                    data.task
                );


                // Clear description

                document.getElementById(
                    "update-text"
                ).value = "";


                showToast(
                    "Task update submitted successfully!"
                );


                // Keep same task selected

                window.selectedMemberTaskId =
                    data.task._id;


                // Show updated details

                renderTaskDetails(
                    data.task
                );


                // Reload task list

                const taskData =
                    await apiRequest(
                        "/member/tasks"
                    );


                renderMemberTasks(
                    taskData.tasks || []
                );


            } catch (error) {

                console.error(
                    "Update submission error:",
                    error
                );


                showToast(
                    error.message ||
                    "Failed to submit update"
                );
            }
        }
    );
}

function renderMemberTasks(tasks) {

    const tableBody =
        document.getElementById("member-task-table-body");

    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = "";

    updateMemberStats(tasks);


    // ==========================================
    // NO TASKS
    // ==========================================

    if (!tasks || tasks.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        No tasks assigned to you yet.
                    </div>
                </td>
            </tr>
        `;

        // Clear details
        const detailsPanel =
            document.getElementById("details-panel");

        if (detailsPanel) {
            detailsPanel.innerHTML = `
                <div class="empty-state">
                    No task selected.
                </div>
            `;
        }

        // Hide update panel
        const updatePanel =
            document.getElementById("update-panel");

        if (updatePanel) {
            updatePanel.style.display = "none";
        }

        window.selectedMemberTaskId = null;

        return;
    }


    // ==========================================
    // CREATE TASK ROWS
    // ==========================================

    tasks.forEach(task => {

        const row =
            document.createElement("tr");


        // Highlight selected task

        if (
            window.selectedMemberTaskId &&
            window.selectedMemberTaskId === task._id
        ) {
            row.classList.add("selected-task");
        }


        const assignedBy =
            task.createdBy
                ? task.createdBy.name
                : "Admin";


        const priority =
            formatPriority(task.priority);


        const status =
            formatStatus(task.status);


        const deadline =
            task.deadline
                ? new Date(task.deadline)
                    .toLocaleDateString(
                        "en-US",
                        {
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                        }
                    )
                : "-";


        row.innerHTML = `

            <td>
                ${escapeHtml(task.title)}
            </td>

            <td>
                ${escapeHtml(assignedBy)}
            </td>

            <td>
                ${deadline}
            </td>

            <td>
                <span class="chip ${priorityClass(priority)}">
                    ${escapeHtml(priority)}
                </span>
            </td>

            <td>
                <span class="chip ${statusClass(status)}">
                    ${escapeHtml(status)}
                </span>
            </td>

            <td>

                <button
                    type="button"
                    class="link-action select-task-btn"
                    data-task-id="${task._id}"
                >
                    View
                </button>

            </td>

        `;


        tableBody.appendChild(row);
    });


    // ==========================================
    // SELECT TASK
    // ==========================================

    tableBody
        .querySelectorAll(".select-task-btn")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const taskId =
                        button.dataset.taskId;


                    // Find the task that was clicked

                    const selectedTask =
                        tasks.find(
                            task =>
                                task._id === taskId
                        );


                    if (!selectedTask) {

                        console.error(
                            "Selected task not found:",
                            taskId
                        );

                        return;
                    }


                    // ==================================
                    // STORE SELECTED TASK
                    // ==================================

                    window.selectedMemberTaskId =
                        selectedTask._id;


                    console.log(
                        "Selected task:",
                        selectedTask
                    );


                    // ==================================
                    // SHOW DETAILS IMMEDIATELY
                    // ==================================

                    renderTaskDetails(
                        selectedTask
                    );


                    // ==================================
                    // HIGHLIGHT SELECTED ROW
                    // ==================================

                    renderMemberTasks(tasks);

                }
            );
        });


    updateMemberStats(tasks);
}

// =====================================================
// TOKEN
// =====================================================


function getToken() {

    return localStorage.getItem(
        "taskflow_token"
    );
}


// =====================================================
// LOGOUT / CLEAR SESSION
// =====================================================

function clearSession() {

    localStorage.removeItem(
        "taskflow_token"
    );

    localStorage.removeItem(
        "taskflow_user"
    );
}


// =====================================================
// TODAY LABEL
// =====================================================

function todayLabel() {

    return new Date().toLocaleDateString(
        "en-US",
        {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric"
        }
    );
}


// =====================================================
// TOAST
// =====================================================

function showToast(message) {

    let toast =
        document.querySelector(".toast");

    if (!toast) {

        toast =
            document.createElement("div");

        toast.className = "toast";

        document.body.appendChild(toast);
    }

    toast.textContent = message;

    toast.classList.add("visible");

    setTimeout(() => {
        toast.classList.remove("visible");
    }, 2500);
}


// =====================================================
// MEMBER LOGOUT
// =====================================================

function setupMemberLogout() {

    const logoutButton =
        document.getElementById(
            "member-logout-btn"
        );

    if (!logoutButton) {
        return;
    }


    logoutButton.addEventListener(
        "click",
        () => {

            localStorage.removeItem(
                "taskflow_token"
            );

            localStorage.removeItem(
                "taskflow_user"
            );

            window.location.href = "/";
        }
    );
}


// =====================================================
// HTML ESCAPE
// =====================================================

function escapeHtml(value) {

    if (value === null ||
        value === undefined) {

        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}