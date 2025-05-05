let { Grade } = require('../model/schemas');
let User = require('../model/user');


function getAll(req, res) {
    User.find().then((students) => {
        res.send(students);
    }).catch((err) => {
        res.send(err);
    });
}

function get(req, res) {
    User.findById(req.params.id).then((student) => {
        if (student) {
            res.send(student);
        } else {
            res.status(404).send({ message: 'Student not found' });
        }
    })
}


function create(req, res) {
    let student = new User();
    student.firstName = req.body.firstName;
    student.lastName = req.body.lastName;

    User.save()
        .then((student) => {
            res.json({ message: `student saved with id ${student.id}!` });
        }
        ).catch((err) => {
            res.send('cant post student ', err);
        });
}

function deleteStudent(req, res) {
    console.log("ID reçu pour suppression :", req.params.id);
    User.findByIdAndDelete(req.params.id)
        .then((student) => {
            if (student) {
                res.json({ message: `Student with id ${req.params.id} deleted!` });
            } else {
                res.status(404).send({ message: 'Student not found' });
            }
        })
        .catch((err) => {
            res.status(500).send(err);
        });
}

function updateStudent(req, res) {
    console.log("ID reçu pour mise à jour :", req.params.id);
    User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
        .then((student) => {
            if (student) {
                res.json({ message: `Student with id ${req.params.id} updated!`, student });
            } else {
                res.status(404).send({ message: 'Student not found' });
            }
        })
        .catch((err) => {
            res.status(500).send({ error: 'Failed to update student', details: err.message });
        });
}

async function getStudentFolder(req, res) {
    query = { student: req.params.id };

    if (req.params.id) {
        if (req.query.year) {
            const startDate = new Date(`${req.query.year}-01-01`);
            const endDate = new Date(`${req.query.year}-12-31`);
            query.date = { $gte: startDate, $lte: endDate };
        }

        const grades = await Grade.find(query).populate('student').populate('course');

        const total = grades.reduce((acc, g) => acc + g.grade, 0);
        const average = grades.length > 0 ? total / grades.length : 0;
        const rank = await User.getStudentRank(req.params.id, req.query.year);
        
        let result = ({
            grades: grades,
            average: average,
            total: total,
            rank: rank
        })

        res.send(result);
    }
    else {
        res.status(400).send({ message: 'Student ID is required' });
    }
}

async function getStudiedYears(req, res) {
    query = { student: req.params.id };

    if (req.params.id) {
        const grades = await Grade.find(query);
        
        const years = [...new Set(grades.map(grade => grade.date.getFullYear()))].sort((a, b) => b - a);

        res.send(years);
    }
    else {
        res.status(400).send({ message: 'Student ID is required' });
    }
}

module.exports = { getAll, get, create, deleteStudent, updateStudent, getStudentFolder, getStudiedYears };
