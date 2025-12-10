const request = require('supertest');
const express = require('express');
const { body, param, validationResult } = require('express-validator');

// Mock the repository to prevent DB connection and model loading
jest.mock('../modules/classroom_management/repositories/classroomRepository', () => ({
    getClassroomById: jest.fn(),
    getStudentActiveAssignmentInYear: jest.fn(),
    assignStudentToClassroom: jest.fn()
}));

// Now require the controller
const classroomController = require('../modules/classroom_management/controllers/classroomController');

const app = express();
app.use(express.json());

// Setup a route to test the validation
app.post('/classrooms/:id/students',
    classroomController.assignStudentValidation,
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        res.status(200).json({ message: 'Validation passed' });
    }
);

describe('Classroom Validation', () => {
    it('should pass validation with valid UUID student_id', async () => {
        const res = await request(app)
            .post('/classrooms/1/students')
            .send({
                student_id: '123e4567-e89b-12d3-a456-426614174000',
                enrollment_number: 'EN123'
            });

        expect(res.status).toBe(200);
    });

    it('should fail validation with Integer student_id', async () => {
        const res = await request(app)
            .post('/classrooms/1/students')
            .send({
                student_id: 123,
                enrollment_number: 'EN123'
            });

        expect(res.status).toBe(400);
        expect(res.body.errors[0].msg).toBe('Invalid student ID');
    });
});
