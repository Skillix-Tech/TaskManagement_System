const express = require("express");
const mongoose = require("mongoose");

const Task = require("../models/Task");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();


// =====================================================
// GET TASKS OF LOGGED-IN MEMBER
// GET /api/member/tasks
// =====================================================

router.get("/tasks", authMiddleware, async (req, res) => {

    try {

        if (req.user.role !== "member") {
            return res.status(403).json({
                success: false,
                message: "Only team members can access this route"
            });
        }

        const tasks = await Task.find({
            assignedTo: req.user.id,
            isDeleted: false
        })
        .populate("createdBy", "name email")
        .populate("assignedTo", "name email")
        .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            message: "Member tasks retrieved successfully",
            tasks
        });

    } catch (error) {

        console.error(
            "Error fetching member tasks:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to fetch member tasks",
            error: error.message
        });
    }
});


// =====================================================
// GET ONE TASK
// GET /api/member/tasks/:taskId
// =====================================================

router.get(
    "/tasks/:taskId",
    authMiddleware,
    async (req, res) => {

        try {

            const { taskId } = req.params;

            if (!mongoose.Types.ObjectId.isValid(taskId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid task ID"
                });
            }

            if (req.user.role !== "member") {
                return res.status(403).json({
                    success: false,
                    message: "Only team members can access this route"
                });
            }

            const task = await Task.findOne({
                _id: taskId,
                assignedTo: req.user.id,
                isDeleted: false
            })
            .populate("createdBy", "name email")
            .populate("assignedTo", "name email");

            if (!task) {
                return res.status(404).json({
                    success: false,
                    message: "Task not found or not assigned to you"
                });
            }

            res.status(200).json({
                success: true,
                message: "Task retrieved successfully",
                task
            });

        } catch (error) {

            console.error(
                "Error fetching task:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Failed to fetch task",
                error: error.message
            });
        }
    }
);


// =====================================================
// SUBMIT TASK UPDATE
// PATCH /api/member/tasks/:taskId/update
// =====================================================

router.patch(
    "/tasks/:taskId/update",
    authMiddleware,
    async (req, res) => {

        try {

            const { taskId } = req.params;

            const {
                status,
                updateDescription
            } = req.body;

            if (!mongoose.Types.ObjectId.isValid(taskId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid task ID"
                });
            }

            if (req.user.role !== "member") {
                return res.status(403).json({
                    success: false,
                    message: "Only team members can update tasks"
                });
            }

            const allowedStatuses = [
                "pending",
                "in_progress",
                "completed",
                "overdue"
            ];

            if (!allowedStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid status"
                });
            }

            const task = await Task.findOne({
                _id: taskId,
                assignedTo: req.user.id,
                isDeleted: false
            });

            if (!task) {
                return res.status(404).json({
                    success: false,
                    message: "Task not found or not assigned to you"
                });
            }

            task.status = status;

            task.updateDescription =
                updateDescription
                    ? updateDescription.trim()
                    : "";

            await task.save();

            const updatedTask =
                await Task.findById(taskId)
                    .populate("createdBy", "name email")
                    .populate("assignedTo", "name email");

            res.status(200).json({
                success: true,
                message: "Task updated successfully",
                task: updatedTask
            });

        } catch (error) {

            console.error(
                "Error updating task:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Failed to update task",
                error: error.message
            });
        }
    }
);


module.exports = router;