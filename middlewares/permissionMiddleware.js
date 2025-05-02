const Role = require("../model/role");
const { METHOD_TO_PERMISSION } = require("../utils/constant");

function extractResourceFromPath(path) {
    const segments = path.split('/').filter(Boolean);
    return segments[1] || segments[0]; // e.g. "/api/students/123" → "students"
}


function isOwnResource(req, user) {
    const userId = user._id.toString();
    return req.params.id === userId || req.body?.userId === userId;
}

async function permissionMiddleware(req, res, next) {
    const {user}=req;
    // console.log({user, roles:user.roles});
    
    const NON_SECURE_PATH = ["/api/users/login","/auth/google","/auth/google/callback"];
    if (NON_SECURE_PATH.includes(req.path)) {
        return next();
    }
    if (!user || !user.roles) {
        return res.status(403).json({ message: "Access denied. No roles assigned." });
    }
    console.log({user, roles:user.roles});
    const action = METHOD_TO_PERMISSION[req.method];
    const resource = extractResourceFromPath(req.path);
    const roles = await Role.getCachedRoles();

    const hasPermission = req.user.roles.some(roleId => {
        const role = roles.find(r => r._id === roleId);
        if (!role) return false;

        return role.permissions.some(perm => {
            const allowedResources = perm.resource.split(",");
            const matchesAction = perm.action === action || perm.action === "*";
            const matchesResource = allowedResources.includes(resource) || allowedResources.includes("*");

            if (matchesAction && matchesResource) return true;

            // Handle read_own
            if (
                perm.action === "read_own" &&
                action === "read" &&
                (allowedResources.includes(resource) || allowedResources.includes("*"))
            ) {
                return isOwnResource(req, user) === true;
            }

            return false;
        });
    });

    if (!hasPermission) {
        return res.status(403).json({ message: "Access denied. Insufficient permissions." });
    }

    next();
};



module.exports = { permissionMiddleware }