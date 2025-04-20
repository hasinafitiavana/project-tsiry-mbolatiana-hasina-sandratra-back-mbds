const mongoose = require('mongoose');

const { Schema, model } = mongoose;

const permissionSchema = new Schema({
  action: {
    type: String,
    enum: ['read', 'write', 'assign_role', 'delete', 'read_own'],
    required: true
  },
  resource: {
    type: String,
    required: true
  }
});

const roleSchema = new Schema({
  _id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    unique: true
  },
  permissions: {
    type: [permissionSchema],
    required: true
  }
});

const roleCache = {
  roles: null,
  timestamp: 0,
  ttl: 60 * 1000 // 1 minute
};

roleSchema.statics.getCachedRoles = async function () {
  const now = Date.now();
  if (!roleCache.roles || now - roleCache.timestamp > roleCache.ttl) {
    roleCache.roles = await this.find({});
    roleCache.timestamp = now;
  }
  return roleCache.roles;
};

const Role = model('roles', roleSchema);

module.exports = Role;  