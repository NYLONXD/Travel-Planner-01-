const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const { authMiddleware } = require('../middleware/authMiddleware');

// Middleware to protect routes
router.use(authMiddleware);

// Add a new expense
router.post('/add', async (req, res) => {
    const { amount, description, date } = req.body;
    const userId = req.user.uid; // Get user ID from auth middleware

    try {
        const newExpense = new Expense({
            userId, // Associate expense with user ID
            amount,
            description,
            date
        });
        await newExpense.save();
        res.status(201).json(newExpense);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add expense' });
    }
});

// Get all expenses for the authenticated user
router.get('/all', async (req, res) => {
    const userId = req.user.uid; // Get user ID from auth middleware

    try {
        const expenses = await Expense.find({ userId }); // Query by user ID
        res.status(200).json(expenses);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve expenses' });
    }
});

module.exports = router;