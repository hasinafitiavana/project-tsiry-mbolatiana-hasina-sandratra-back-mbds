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

UserSchema.statics.getAllStudentsRanks = async function (year = null) {
    try {
        let query = {};
        if (year) {
            const startDate = new Date(`${year}-01-01`);
            const endDate = new Date(`${year}-12-31`);
            query = { date: { $gte: startDate, $lte: endDate } };
        }

        const grades = await Grade.find(query).populate('student', 'firstname lastname');

        const studentTotals = {};
        grades.forEach(grade => {
            const student = grade.student._id.toString();
            if (!studentTotals[student]) {
                studentTotals[student] = {
                    total: 0,
                    firstname: grade.student.firstname,
                    lastname: grade.student.lastname
                };
            }
            studentTotals[student].total += grade.grade;
        });

        // Sort students by total grades in descending order
        const rankedStudents = Object.entries(studentTotals)
            .sort(([, a], [, b]) => b.total - a.total)
            .map(([studentId, data], index) => ({
                _id:studentId,
                firstname: data.firstname,
                lastname: data.lastname,
                rank: index + 1,
                total: data.total
            }));


        return rankedStudents;
    } catch (err) {
        throw new Error(`Failed to calculate ranks: ${err.message}`);
    }
};

UserSchema.statics.getStudentRank = async function (studentId, year = null) {
    try {
        if (!studentId) {
            throw new Error('Student ID is required');
        }

        const allRanks = await this.getAllStudentsRanks(year);
        const studentRank = allRanks.find(s => s._id === studentId);
        
        if (studentRank) {
            return { rank: studentRank.rank, total: studentRank.total };
        } else {
            // Return default values instead of throwing an error
            return { rank: null, total: 0 };
        }
    } catch (err) {
        throw new Error(`Failed to calculate student rank: ${err.message}`);
    }
};

const User = model('User', UserSchema);

module.exports = User;