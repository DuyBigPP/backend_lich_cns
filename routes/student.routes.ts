import express from 'express';
import * as StudentController from '../src/controllers/StudentController';
import { hashStudentPassword, authenticateStudent } from '../src/middleware/studentPasswordMiddleware';

const router = express.Router();

// Route đăng nhập cho sinh viên
router.post('/login', authenticateStudent, StudentController.loginStudent);

// Các route khác
router.get('/', StudentController.getAllStudents);
router.get('/:id', StudentController.getStudentById);
router.get('/studentId/:studentId', StudentController.getStudentByStudentId);
router.post('/', hashStudentPassword, StudentController.createStudent);
router.put('/:id', hashStudentPassword, StudentController.updateStudent);
router.delete('/:id', StudentController.deleteStudent);

export default router; 