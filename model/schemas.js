let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let courseSchema = Schema({
    name: String,
    code: String,
});


let Course = mongoose.model('Course', courseSchema);

let gradeSchema = Schema({
    student: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    course: {type: mongoose.Schema.Types.ObjectId, ref: 'Course'},
    grade: Number,
    date: Date,
});
let Grade = mongoose.model('Grade', gradeSchema);

// Exports the modeles
module.exports = {
    Course: Course,
    Grade: Grade,
}
