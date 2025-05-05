const mongoose = require('mongoose');
const validator = require('validator');
const { Schema, model } = mongoose;
require("./role");
const { Grade } = require('./schemas');

const UserSchema = new Schema({
    lastname: {
        type: String,
        required: [true, "Nom obligatoire"],
        unique: true
    },
    firstname: {
        type: String,
    },
    email: {
        type: String,
        required: [true, 'Email manquant'],
        validate: {
            validator: validator.isEmail,
            message: '{VALUE} n\'est pas un email valide'
        }
    },
    password: {
        type: String,
        required: [true, 'Mot de passe obligatoire']
    },
    password2: {
        type: String,
        select: false,
        required: [true, 'Veuillez resaisir votre mot de passe'],
    },
    roles: [{
        type: String,
        ref: 'roles'
    }],
});

// Function to calculate student rank
UserSchema.statics.getStudentRank = async function (studentId, year=null) {
    try {
        if (!studentId) {
            throw new Error('Student ID is required');
        }

        if (year){
            const startDate = new Date(`${year}-01-01`);
            const endDate = new Date(`${year}-12-31`);
            query = { date: { $gte: startDate, $lte: endDate } }
        }

        // Query grades for all students within the year
        const grades = await Grade.find(query);

        // Calculate total grades for each student
        const studentTotals = {};
        grades.forEach(grade => {
            const student = grade.student.toString();
            if (!studentTotals[student]) {
                studentTotals[student] = 0;
            }
            studentTotals[student] += grade.grade;
        });

        // Sort students by total grades in descending order
        const rankedStudents = Object.entries(studentTotals)
            .sort(([, totalA], [, totalB]) => totalB - totalA)
            .map(([studentId], index) => ({ studentId, rank: index + 1 }));

        // Find the rank of the specific student
        const studentRank = rankedStudents.find(s => s.studentId === studentId);

        if (studentRank) {
            return { rank: studentRank.rank, total: studentTotals[studentId] };
        }
    } catch (err) {
        throw new Error(`Failed to calculate rank: ${err.message}`);
    }
};

const User = model('User', UserSchema);

module.exports = User;