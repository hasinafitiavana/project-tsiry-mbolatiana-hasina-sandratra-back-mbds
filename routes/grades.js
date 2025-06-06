let { Grade, Student, Course } = require('../model/schemas');

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
            res.json({ message: `grade saved with id ${grade.id}!` });
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

function getScolarityYears(req, res) {
    Grade.find()
        .distinct('date')
        .then((years) => {
            const uniqueYears = [...new Set(years.map(date => date.getFullYear()))].sort((a, b) => b - a);;
            res.send(uniqueYears);
        })
        .catch((err) => {
            res.status(500).send({ message: 'Unable to fetch years', error: err.message });
        });
}

async function getAvgGradePerSubjectPerYear(req, res) {
    try {
        const results = await Grade.aggregate([
            {
                $group: {
                    _id: {
                        year: { $year: "$date" },
                        subject: "$course"
                    },
                    averageGrade: { $avg: "$grade" }
                }
            },
            {
                $lookup: {
                    from: "courses", 
                    localField: "_id.subject",
                    foreignField: "_id",
                    as: "courseDetails"
                }
            },
            {
                $project: {
                    year: "$_id.year",
                    subject: { $arrayElemAt: ["$courseDetails.name", 0] },
                    averageGrade: 1
                }
            },
            { $sort: { year: 1, subject: 1 } }
        ]);

        res.status(200).send(results);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Failed to fetch average grades", error: err.message });
    }
}

async function getMostAndLeastTakenCourses(req, res) {
    try {
        const results = await Grade.aggregate([
            {
                $group: {
                    _id: {
                        year: { $year: "$date" }, // Extract the year from the date
                        course: "$course"        // Group by course
                    },
                    count: { $sum: 1 }          // Count the number of grades for each course
                }
            },
            {
                $lookup: {
                    from: "courses",            // Join with the Course collection
                    localField: "_id.course",
                    foreignField: "_id",
                    as: "courseDetails"
                }
            },
            {
                $project: {
                    year: "$_id.year",
                    course: { $arrayElemAt: ["$courseDetails.name", 0] }, // Extract course name
                    count: 1
                }
            },
            { $sort: { year: 1, count: -1 } } // Sort by year and count (descending)
        ]);

        // Group results by year and find most and least taken courses
        const groupedResults = results.reduce((acc, curr) => {
            const year = curr.year;
            if (!acc[year]) {
                acc[year] = { mostTaken: [], leastTaken: [], maxCount: 0, minCount: Infinity };
            }

            if (curr.count > acc[year].maxCount) {
                acc[year].mostTaken = [curr];
                acc[year].maxCount = curr.count;
            } else if (curr.count === acc[year].maxCount) {
                acc[year].mostTaken.push(curr);
            }

            if (curr.count < acc[year].minCount) {
                acc[year].leastTaken = [curr];
                acc[year].minCount = curr.count;
            } else if (curr.count === acc[year].minCount) {
                acc[year].leastTaken.push(curr);
            }

            return acc;
        }, {});

        // Format the response
        const response = Object.entries(groupedResults).map(([year, data]) => ({
            year: parseInt(year),
            mostTaken: data.mostTaken.map(course => ({ course: course.course, count: course.count })),
            leastTaken: data.leastTaken.map(course => ({ course: course.course, count: course.count }))
        }));

        console.log(response)
        res.status(200).send(response);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Failed to fetch most and least taken courses", error: err.message });
    }
}

module.exports = { getAll, create, update, deleteGrade, getScolarityYears, getAvgGradePerSubjectPerYear, getMostAndLeastTakenCourses };
