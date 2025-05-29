const { Router } = require("express");
const router = Router();
const User = require("../model/user");
const { generateAccessToken, generateRefreshToken } = require("../utils/auth");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

router.post('/login', async function login(req, res) {
    try {
        const { email, password } = req.body
        console.log({email,password});
        
        await User.findOne({ email }).then((user) => {
            if (user) {
                if (bcrypt.compareSync(password, user.password)) {
                    const { password, ...u } = user.toObject();
                    const accessToken = generateAccessToken(u);
                    const refreshToken = generateRefreshToken(u);

                    res.setHeader('x-access-token', accessToken);
                    res.setHeader('x-refresh-token', refreshToken);
                    return res.status(200).json(u);
                } else {
                    res.status(401).json({ error: 'Email ou mot de passe incorrect' });
                }
            } else {
                res.status(401).json({ error: 'Email ou mot de passe incorrect' });
            }
        }).catch((err) => {
            console.error(err);
            res.status(400).json({ "error": err.message })
        })
    } catch (error) {
        console.error(error);
        res.status(400).json({ "error": error.message })
    }
})

router.post("/refresh-token", async function refreshToken(req, res) {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ message: 'Refresh token required' });

    try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decoded._id);

        if (!user) return res.status(403).json({ message: 'User no longer exists' });

        const newAccessToken = generateAccessToken(user);
        res.json({ accessToken: newAccessToken });
    } catch (err) {
        return res.status(403).json({ message: 'Invalid or expired refresh token' });
    }
})

router.get("/", async function getAllUsers(req, res) {
    try {
        // console.log("get all users",req.query);
        const users = await User.find({
            roles : req.query.role
        });
        const data = users.map((user) => {
            const { password,roles, ...u } = user.toObject();
            return u;
        });
        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
})

router.post("/", async function createUser(req, res) {
    try {
        console.log("create user",req.body);
        const { email, password,password2, firstname, lastname,role } = req.body;
        if (password !== password2) {
            throw new Error("Les mots de passe ne correspondent pas");
        }
        const hashedPassword = bcrypt.hashSync(password,10);
        const hashedPassword2 = bcrypt.hashSync(password2,10);
        const newUser = new User({
            email,
            password: hashedPassword,
            firstname,
            lastname,
            password2: hashedPassword2,
            roles: [role]
        });
        await newUser.save();
        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ "error": error.message});
    }
})

router.put("/:id", async function updateUser(req, res) {
    try {
        const { id } = req.params;
        const { email, firstname, lastname, role, password,password2 } = req.body;

        const updateFields = {
            email,
            firstname,
            lastname,
            roles: [role]
        };
        if (password && password2) {
               if (password !== password2) {
                    throw new Error("Les mots de passe ne correspondent pas");
                }
            const hashedPassword = bcrypt.hashSync(password, 10);
            const hashedPassword2 = bcrypt.hashSync(password2,10);
            updateFields.password = hashedPassword;
            updateFields.password2 = hashedPassword2;
        }

        const updatedUser = await User.findByIdAndUpdate(id, updateFields, { new: true, runValidators: true });

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(updatedUser);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: error.message });
    }
});

router.delete("/:id", async function deleteUser(req, res) {
    try {
        const { id } = req.params;
        const deletedUser = await User.findByIdAndDelete(id);
        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: error.message });
    }
});

router.post("/send-email-forgot-password", async function (req, res) {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

        const token = jwt.sign(
            { _id: user._id, email: user.email },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "5m" }
        );

        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.MAIL,
                pass: process.env.MAIL_PASSWORD
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        await transporter.sendMail({
            from: process.env.MAIL,
            to: user.email,
            subject: "Réinitialisation de votre mot de passe",
            html: `<p>Pour réinitialiser votre mot de passe, cliquez sur ce lien : <a href="${resetLink}">${resetLink}</a></p>`
        });

        res.json({ message: "Email de réinitialisation envoyé" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erreur lors de l'envoi de l'email" });
    }
});

router.post("/reset-password", async function (req, res) {
    try {
        const { token, password, confirmPassword } = req.body;
        if (!token) return res.status(400).json({ error: "Token manquant" });
        if (password !== confirmPassword) return res.status(400).json({ error: "Les mots de passe ne correspondent pas" });

        let payload;
        try {
            payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        } catch (err) {
            return res.status(400).json({ error: "Token invalide ou expiré" });
        }

        const hashedPassword = bcrypt.hashSync(password, 10);
        const hashedconfirmPassword = bcrypt.hashSync(confirmPassword, 10);

        await User.findByIdAndUpdate(payload._id, {
            password: hashedPassword,
            password2: hashedconfirmPassword
        });

        res.json({ message: "Mot de passe réinitialisé avec succès" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erreur lors de la réinitialisation" });
    }
});



module.exports = router;