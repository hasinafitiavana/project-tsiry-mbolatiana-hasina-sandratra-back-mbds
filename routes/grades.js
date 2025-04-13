let {Grade, Student, Course} = require('../model/schemas');

function getAll(req, res) {
    Grade.find()
        .populate('student')
        .populate('course')
        .then((grades) => {
            res.send(grades);
        }).catch((err) => {
        res.send(err);
    });
}


function create(req, res) {
    let grade = new Grade();

    grade.student = req.body.student;
    grade.course = req.body.course;
    grade.grade = req.body.grade;
    grade.date = req.body.date;

    grade.save()
        .then((grade) => {
                res.json({message: `grade saved with id ${grade.id}!`});
            }
        ).catch((err) => {
        console.log(err);
        res.status(400).send('cant post grade ', err.message);
    });
}
function update(req, res) {
    const gradeId = req.params.id;

    Grade.findByIdAndUpdate(
        gradeId,
        {
            student: req.body.student,
            course: req.body.course,
            grade: req.body.grade,
            date: req.body.date
        },
        { new: true, runValidators: true }
    )
    .then((updatedGrade) => {
        if (!updatedGrade) {
            return res.status(404).send({ message: 'Grade not found' });
        }
        res.send(updatedGrade);
    })
    .catch((err) => {
        console.error(err);
        res.status(400).send({ message: 'Unable to update grade', error: err.message });
    });
}
function deleteGrade(req, res) {
    const gradeId = req.params.id;

    Grade.findByIdAndDelete(gradeId)
        .then((deletedGrade) => {
            if (!deletedGrade) {
                return res.status(404).send({ message: 'Grade not found' });
            }
            res.send({ message: `Grade with id ${gradeId} deleted successfully.` });
        })
        .catch((err) => {
            console.error(err);
            res.status(400).send({ message: 'Unable to delete grade', error: err.message });
        });
}

module.exports = {getAll, create, update, deleteGrade};
