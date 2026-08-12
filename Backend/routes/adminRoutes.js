const express = require("express");
const router = express.Router();

const User = require("../models/User");
const Task = require("../models/Task");

// ======================================
// GET ALL MEMBERS
// ======================================
router.get("/members", async (req, res) => {
    try {
        const members = await User.find({ role: "member" });

        res.status(200).json(members);
    } catch (error) {
        res.status(500).json({
            message: "Failed to get members",
            error: error.message
        });
    }
});


// ======================================
// CREATE NEW MEMBER
// ======================================
router.post("/members", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists"
            });
        }

        const member = await User.create({
            name,
            email,
            password,
            role: "member"
        });

        res.status(201).json({
            message: "Member created successfully",
            member
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to create member",
            error: error.message
        });
    }
});


// ======================================
// GET ALL TASKS
// ======================================
router.get("/tasks", async (req, res) => {
    try {
        const tasks = await Task.find({ isDeleted: false })
            .populate("assignedTo", "name email")
            .populate("createdBy", "name email");

        res.status(200).json(tasks);

    } catch (error) {
        res.status(500).json({
            message: "Failed to get tasks",
            error: error.message
        });
    }
});


// ======================================
// CREATE TASK
// ======================================
router.post("/tasks", async (req, res) => {
    try {
        const {
            title,
            description,
            assignedTo,
            createdBy,
            priority,
            deadline
        } = req.body;

        const task = await Task.create({
            title,
            description,
            assignedTo,
            createdBy,
            priority,
            deadline
        });

        res.status(201).json({
            message: "Task created successfully",
            task
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to create task",
            error: error.message
        });
    }
});


// ======================================
// UPDATE TASK
// ======================================
router.put("/tasks/:id", async (req, res) => {
    try {
        const task = await Task.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!task) {
            return res.status(404).json({
                message: "Task not found"
            });
        }

        res.status(200).json({
            message: "Task updated successfully",
            task
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to update task",
            error: error.message
        });
    }
});


// ======================================
// DELETE TASK
// ======================================
router.delete("/tasks/:id", async (req, res) => {
    try {
        const task = await Task.findByIdAndUpdate(
            req.params.id,
            { isDeleted: true },
            { new: true }
        );

        if (!task) {
            return res.status(404).json({
                message: "Task not found"
            });
        }

        res.status(200).json({
            message: "Task deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to delete task",
            error: error.message
        });
    }
});


// ======================================
// DASHBOARD STATISTICS
// ======================================
router.get("/dashboard", async (req, res) => {
    try {
        const totalMembers = await User.countDocuments({
            role: "member"
        });

        const totalTasks = await Task.countDocuments({
            isDeleted: false
        });

        const completedTasks = await Task.countDocuments({
            status: "completed",
            isDeleted: false
        });

        const pendingTasks = await Task.countDocuments({
            status: "pending",
            isDeleted: false
        });

        const inProgressTasks = await Task.countDocuments({
            status: "in_progress",
            isDeleted: false
        });

        const overdueTasks = await Task.countDocuments({
            status: "overdue",
            isDeleted: false
        });

        res.status(200).json({
            totalMembers,
            totalTasks,
            completedTasks,
            pendingTasks,
            inProgressTasks,
            overdueTasks
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to get dashboard statistics",
            error: error.message
        });
    }
});


module.exports = router;