const express = require('express');
const { body, validationResult } = require('express-validator');

const { db } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const taskValidation = [
	body('title')
		.trim()
		.notEmpty().withMessage('Title is required.')
		.isLength({ min: 2, max: 100 }).withMessage('Title must be between 2 and 100 characters.'),
	body('description')
		.trim()
		.notEmpty().withMessage('Description is required.')
		.isLength({ min: 5, max: 500 }).withMessage('Description must be between 5 and 500 characters.'),
	body('due_date')
		.notEmpty().withMessage('Due date is required.')
		.isISO8601().withMessage('Please enter a valid due date.'),
	body('status')
		.optional()
		.isIn(['pending', 'completed']).withMessage('Invalid status selected.')
];

router.get('/dashboard', requireAuth, (req, res) => {
	const filter = req.query.filter || 'all';
	const allowedFilters = ['all', 'completed', 'pending'];
	const safeFilter = allowedFilters.includes(filter) ? filter : 'all';

	let query = 'SELECT * FROM tasks WHERE user_id = ?';
	const params = [req.session.user.id];

	if (safeFilter !== 'all') {
		query += ' AND status = ?';
		params.push(safeFilter);
	}

	query += ' ORDER BY due_date ASC, created_at DESC';

	db.all(query, params, (tasksError, tasks) => {
		if (tasksError) {
			return res.status(500).render('500', { title: 'Server Error' });
		}

		db.get(
			`SELECT
				COUNT(*) AS total,
				SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
				SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending
			 FROM tasks
			 WHERE user_id = ?`,
			[req.session.user.id],
			(summaryError, summary) => {
				if (summaryError) {
					return res.status(500).render('500', { title: 'Server Error' });
				}

				const total = summary.total || 0;
				const completed = summary.completed || 0;
				const pending = summary.pending || 0;
				const progressPercent = total === 0 ? 0 : Math.round((completed / total) * 100);

				res.render('dashboard', {
					title: 'Dashboard',
					tasks,
					filter: safeFilter,
					summary: {
						total,
						completed,
						pending,
						progressPercent
					}
				});
			}
		);
	});
});

router.post('/tasks', requireAuth, taskValidation, (req, res) => {
	const errors = validationResult(req);
	const { title, description, due_date } = req.body;

	if (!errors.isEmpty()) {
		req.session.validationErrors = errors.array();
		req.session.oldInput = { title, description, due_date };
		req.session.error = 'Please fix the task form errors.';
		return res.redirect('/dashboard');
	}

	db.run(
		'INSERT INTO tasks (user_id, title, description, due_date, status) VALUES (?, ?, ?, ?, ?)',
		[req.session.user.id, title.trim(), description.trim(), due_date, 'pending'],
		(insertError) => {
			if (insertError) {
				return res.status(500).render('500', { title: 'Server Error' });
			}

			req.session.success = 'Task created successfully.';
			res.redirect('/dashboard');
		}
	);
});

router.get('/tasks/:id/edit', requireAuth, (req, res) => {
	db.get(
		'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
		[req.params.id, req.session.user.id],
		(selectError, task) => {
			if (selectError) {
				return res.status(500).render('500', { title: 'Server Error' });
			}

			if (!task) {
				req.session.error = 'Task not found.';
				return res.redirect('/dashboard');
			}

			res.render('edit-task', {
				title: 'Edit Task',
				task
			});
		}
	);
});

router.put('/tasks/:id', requireAuth, taskValidation, (req, res) => {
	const errors = validationResult(req);
	const { title, description, due_date, status } = req.body;

	if (!errors.isEmpty()) {
		return db.get(
			'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
			[req.params.id, req.session.user.id],
			(selectError, task) => {
				if (selectError || !task) {
					return res.status(500).render('500', { title: 'Server Error' });
				}

				return res.status(400).render('edit-task', {
					title: 'Edit Task',
					task: {
						...task,
						title,
						description,
						due_date,
						status
					},
					validationErrors: errors.array()
				});
			}
		);
	}

	db.run(
		`UPDATE tasks
		 SET title = ?, description = ?, due_date = ?, status = ?, updated_at = CURRENT_TIMESTAMP
		 WHERE id = ? AND user_id = ?`,
		[title.trim(), description.trim(), due_date, status || 'pending', req.params.id, req.session.user.id],
		function(updateError) {
			if (updateError) {
				return res.status(500).render('500', { title: 'Server Error' });
			}

			if (this.changes === 0) {
				req.session.error = 'Task not found.';
				return res.redirect('/dashboard');
			}

			req.session.success = 'Task updated successfully.';
			res.redirect('/dashboard');
		}
	);
});

router.post('/tasks/:id/toggle', requireAuth, (req, res) => {
	db.get(
		'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
		[req.params.id, req.session.user.id],
		(selectError, task) => {
			if (selectError) {
				return res.status(500).render('500', { title: 'Server Error' });
			}

			if (!task) {
				req.session.error = 'Task not found.';
				return res.redirect('/dashboard');
			}

			const newStatus = task.status === 'completed' ? 'pending' : 'completed';

			db.run(
				'UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
				[newStatus, req.params.id, req.session.user.id],
				(updateError) => {
					if (updateError) {
						return res.status(500).render('500', { title: 'Server Error' });
					}

					req.session.success = `Task marked as ${newStatus}.`;
					res.redirect('/dashboard');
				}
			);
		}
	);
});

router.delete('/tasks/:id', requireAuth, (req, res) => {
	db.run(
		'DELETE FROM tasks WHERE id = ? AND user_id = ?',
		[req.params.id, req.session.user.id],
		function(deleteError) {
			if (deleteError) {
				return res.status(500).render('500', { title: 'Server Error' });
			}

			if (this.changes === 0) {
				req.session.error = 'Task not found.';
				return res.redirect('/dashboard');
			}

			req.session.success = 'Task deleted successfully.';
			res.redirect('/dashboard');
		}
	);
});

module.exports = router;
