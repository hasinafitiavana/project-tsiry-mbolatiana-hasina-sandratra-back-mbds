let express = require('express');
let app = express();
let bodyParser = require('body-parser');
let student = require('./routes/students');
let course = require('./routes/courses');
let grade = require('./routes/grades');

require('dotenv').config();


const userRouter=require("./routes/users");

let mongoose = require('mongoose');
const { authenticateTokenMiddleware } = require('./middlewares/authMiddleware');
const { permissionMiddleware } = require('./middlewares/permissionMiddleware');

const passport = require('./utils/googleAuth');
const { generateAccessToken, generateRefreshToken } = require('./utils/auth');

mongoose.Promise = global.Promise;
//mongoose.set('debug', true);

const uri = process.env.DATABASE_URL;

const options = {};

mongoose.connect(uri, options)
    .then(() => {
        console.log("Connexion à la base OK");
    },
        err => {
            console.log('Erreur de connexion: ', err);
        });

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Expose-Headers","x-access-token, x-refresh-token",
    );
    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }
    next();
});

// Pour les formulaires
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

let port = process.env.PORT || 8010;

// les routes
const prefix = '/api';

app.use(prefix+"/users",userRouter);

// app.use(authenticateTokenMiddleware, permissionMiddleware);
app.use(authenticateTokenMiddleware);

app.route(prefix + '/students')
    .get(student.getAll)
    .post(student.create);

app.route(prefix + '/students/ranks')
    .get(student.getAllStudentsRanks);

app.route(prefix + '/students/:id')
    .get(student.get)
    .put(student.updateStudent)
    .delete(student.deleteStudent);

app.route(prefix + '/students/:id/folder')
    .get(student.getStudentFolder);
    
app.route(prefix + '/students/:id/years')
    .get(student.getStudiedYears);

app.route(prefix + '/courses')
    .get(course.getAll)
    .post(course.create);

app.route(prefix + '/courses/:id')
    .put(course.updateCourse)
    .delete(course.deleteCourse);


app.route(prefix + '/grades')
    .get(grade.getAll)
    .post(grade.create);

app.route(prefix + '/grades/least-most-taken-courses')
    .get(grade.getMostAndLeastTakenCourses);

app.route(prefix + '/grades/years')
    .get(grade.getScolarityYears);

app.route(prefix + '/grades/avg-per-course')
    .get(grade.getAvgGradePerSubjectPerYear);

app.route(prefix + '/grades/:id')
    .put(grade.update)
    .delete(grade.deleteGrade);

app.get('/auth/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  prompt: 'select_account' 
}));

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/', session: false }),
  function(req, res) {
    const user = req.user;

    const { password, ...u } = user.toObject();
    const accessToken = generateAccessToken(u);
    const refreshToken = generateRefreshToken(u);
    res.redirect(`${process.env.FRONTEND_URL}/oauth-callback?accessToken=${accessToken}&refreshToken=${refreshToken}`);
  });

app.route(prefix + '/grades/years')
    .get(grade.getScolarityYears);
    
app.use(function(req, res, next) {
    next(createError(404));
});

app.listen(port, "0.0.0.0");
console.log('Serveur démarré sur http://localhost:' + port);

module.exports = app;


