const express = require("express");
const mongoose = require("mongoose");

const Task = require("../models/Task");
const User = require("../models/User");

const router = express.Router();


// ==========================================
// GET ALL TASKS ASSIGNED TO A MEMBER
// GET /api/member/tasks/:userId
// ==========================================

router.get("/tasks/:userId", async (req, res) => {

    try {

        const { userId } = req.params;

        // Check whether userId is a valid MongoDB ID
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                message: "Invalid user ID"
            });
        }

        // Check whether the user exists
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        // Make sure this is a member
        if (user.role !== "member") {
            return res.status(403).json({
                message: "User is not a team member"
            });
        }

        // Find all tasks assigned to this member
        const tasks = await Task.find({
            assignedTo: userId,
            isDeleted: false
        })
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 });

        res.status(200).json({
            message: "Member tasks retrieved successfully",
            tasks: tasks
        });

    } catch (error) {

        console.error("Error fetching member tasks:", error);

        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
});


// ==========================================
// GET ONE TASK
// GET /api/member/tasks/task/:taskId
// ==========================================

router.get("/tasks/task/:taskId", async (req, res) => {

    try {

        const { taskId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(taskId)) {
            return res.status(400).json({
                message: "Invalid task ID"
            });
        }

        const task = await Task.findOne({
            _id: taskId,
            isDeleted: false
        })
        .populate("createdBy", "name email")
        .populate("assignedTo", "name email");

        if (!task) {
            return res.status(404).json({
                message: "Task not found"
            });
        }

        res.status(200).json({
            message: "Task retrieved successfully",
            task: task
        });

    } catch (error) {

        console.error("Error fetching task:", error);

        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
});


// ==========================================
// SUBMIT TASK UPDATE
// PATCH /api/member/tasks/:taskId/update
// ==========================================

router.patch("/tasks/:taskId/update", async (req, res) => {

    try {

        const { taskId } = req.params;

        const {
            status,
            updateDescription,
            userId
        } = req.body;


        // Validate task ID
        if (!mongoose.Types.ObjectId.isValid(taskId)) {
            return res.status(400).json({
                message: "Invalid task ID"
            });
        }


        // Validate status
        const allowedStatuses = [
            "pending",
            "in_progress",
            "completed",
            "overdue"
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid status"
            });
        }


        // Validate member ID
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                message: "Invalid user ID"
            });
        }


        // Find task
        const task = await Task.findOne({
            _id: taskId,
            isDeleted: false
        });

        if (!task) {
            return res.status(404).json({
                message: "Task not found"
            });
        }


        // IMPORTANT:
        // Make sure this member actually owns the task

        if (task.assignedTo.toString() !== userId) {
            return res.status(403).json({
                message: "You are not allowed to update this task"
            });
        }


        // Update task
        task.status = status;
        task.updateDescription = updateDescription || "";

        await task.save();


        // Return updated task
        const updatedTask = await Task.findById(taskId)
            .populate("createdBy", "name email")
            .populate("assignedTo", "name email");


        res.status(200).json({
            message: "Task updated successfully",
            task: updatedTask
        });


    } catch (error) {

        console.error("Error updating task:", error);

        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
});


module.exports = router;