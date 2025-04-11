let {Student} = require('../model/schemas');

function getAll(req, res) {
    Student.find().then((students) => {
        res.send(students);
    }).catch((err) => {
        res.send(err);
    });
}


function create(req, res) {
    let student = new Student();
    student.firstName = req.body.firstName;
    student.lastName = req.body.lastName;

    student.save()
        .then((student) => {
                res.json({message: `student saved with id ${student.id}!`});
            }
        ).catch((err) => {
        res.send('cant post student ', err);
    });
}

function deleteStudent(req, res) {
    console.log("ID reçu pour suppression :", req.params.id);
    Student.findByIdAndDelete(req.params.id)
        .then((student) => {
            if (student) {
                res.json({message: `Student with id ${req.params.id} deleted!`});
            } else {
                res.status(404).send({message: 'Student not found'});
            }
        })
        .catch((err) => {
            res.status(500).send(err);
        });
}

function updateStudent(req, res) {
    console.log("ID reçu pour mise à jour :", req.params.id);
    Student.findByIdAndUpdate(req.params.id, req.body, {new: true, runValidators: true})
        .then((student) => {
            if (student) {
                res.json({message: `Student with id ${req.params.id} updated!`, student});
            } else {
                res.status(404).send({message: 'Student not found'});
            }
        })
        .catch((err) => {
            res.status(500).send({error: 'Failed to update student', details: err.message});
        });
}

module.exports = {getAll, create, deleteStudent, updateStudent};
