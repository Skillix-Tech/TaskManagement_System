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

    if (!user || user.role !== "member") {

        window.location.href = "/";

        return;
    }


    console.log(
        "Logged in member:",
        user
    );


    // If your member page has an element
    // with id="member-name"

    const memberName =
        document.getElementById(
            "member-name"
        );

    if (memberName) {
        memberName.textContent =
            user.name;
    }


    try {

        const response =
            await fetch(
                `/api/member/tasks/${user.id}`
            );


        const data =
            await response.json();


        if (!response.ok) {

            console.error(
                data.message
            );

            return;
        }


        console.log(
            "Member tasks:",
            data.tasks
        );


        // You can render member tasks here
        // based on your member.html structure.

    } catch (error) {

        console.error(
            "Member task error:",
            error
        );
    }
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