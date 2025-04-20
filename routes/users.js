const { Router } = require("express");
const router = Router();
const User = require("../model/User");
const { generateAccessToken, generateRefreshToken } = require("../utils/auth");
const bcrypt = require("bcryptjs");

router.post('/login', async function login(req, res) {
    try {
        const { email, password } = req.body
        await User.findOne({ email }).then((user) => {
            if (user) {
                if (bcrypt.compareSync(password, user.password)) {
                    const { password, ...u } = user.toObject();
                    const accessToken = generateAccessToken(u);
                    const refreshToken = generateRefreshToken(u);

                    res.setHeader('x-access-token', accessToken);
                    res.setHeader('x-refresh-token', refreshToken);

                    return res.status(200).json({ message: 'Login successful' });
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



module.exports = router;