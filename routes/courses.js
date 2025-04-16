let { Course } = require('../model/schemas');

function getAll(req, res) {
    Course.find().then((classes) => {
        res.send(classes);
    }).catch((err) => {
        res.send(err);
    });
}


function create(req, res) {
    let course = new Course();
    course.name = req.body.name;
    course.code = req.body.code;

    course.save()
        .then((course) => {
            res.json({ message: `course saved with id ${course.id}!` });
        }
        ).catch((err) => {
            res.send('cant post course ', err);
        });
}

function deleteCourse(req, res) {
    Course.findByIdAndDelete(req.params.id)
        .then((course) => {
            if (course) {
                res.json({ message: `Course with id ${req.params.id} deleted!` });
            } else {
                res.status(404).send({ message: 'Course not found' });
            }
        })
        .catch((err) => {
            res.status(500).send(err);
        });
}

function updateCourse(req, res) {
    Course.findByIdAndUpdate(req.params.id, req.body, {new: true, runValidators: true})
        .then((course) => {
            if (course) {
                res.json({message: `Course with id ${req.params.id} updated!`, course});
            } else {
                res.status(404).send({message: 'Course not found'});
            }
        })
        .catch((err) => {
            res.status(500).send({error: 'Failed to update course', details: err.message});
        });
}

module.exports = { getAll, create, updateCourse, deleteCourse };
