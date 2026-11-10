const User = require('../models/User');
const bcrypt = require('bcryptjs');
const memoryStore = require('../config/memoryStore');

const getUsers = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;

    if (global.useMemoryStore) {
      const users = memoryStore.users
        .filter((u) => !tenantId || u.tenantId === tenantId)
        .map((u) => {
          const copy = { ...u };
          delete copy.password;
          return copy;
        });
      return res.status(200).json({ success: true, count: users.length, users });
    }

    const query = tenantId ? { tenantId } : {};
    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: users.length, users });
  } catch (error) {
    next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role = 'CASHIER', phone, status = 'active' } = req.body;
    const tenantId = req.user.tenantId;

    const normalizedRole = role.toUpperCase() === 'STORE_ADMIN' ? 'STORE_ADMIN' : 'CASHIER';

    if (global.useMemoryStore) {
      const existing = memoryStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (existing) {
        return res.status(400).json({ success: false, message: 'A user with this email already exists' });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = {
        _id: `usr_${Date.now()}`,
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        tenantId,
        role: normalizedRole,
        phone: phone || '',
        status,
        isActive: status === 'active',
        createdAt: new Date(),
        matchPassword: async function (p) {
          return bcrypt.compare(p, this.password);
        },
      };
      memoryStore.users.unshift(newUser);
      const resp = { ...newUser };
      delete resp.password;
      return res.status(201).json({ success: true, message: 'Staff member created successfully', user: resp });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'A user with this email already exists' });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      tenantId,
      role: normalizedRole,
      phone: phone || '',
      status,
      isActive: status === 'active',
    });

    const userResponse = user.toObject();
    delete userResponse.password;
    res.status(201).json({ success: true, message: 'Staff member created successfully', user: userResponse });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { name, email, role, phone, status, password } = req.body;
    const tenantId = req.user.tenantId;

    if (global.useMemoryStore) {
      const user = memoryStore.users.find(
        (u) => u._id === req.params.id && (!tenantId || u.tenantId === tenantId)
      );
      if (!user) return res.status(404).json({ success: false, message: 'Staff member not found' });
      if (name) user.name = name;
      if (email) user.email = email.toLowerCase();
      if (role) user.role = role.toUpperCase();
      if (phone !== undefined) user.phone = phone;
      if (status) {
        user.status = status;
        user.isActive = status === 'active';
      }
      if (password && password.length >= 6) {
        user.password = await bcrypt.hash(password, 10);
      }
      const resp = { ...user };
      delete resp.password;
      return res.status(200).json({ success: true, message: 'Staff member updated', user: resp });
    }

    const query = tenantId ? { _id: req.params.id, tenantId } : { _id: req.params.id };
    let user = await User.findOne(query);
    if (!user) return res.status(404).json({ success: false, message: 'Staff member not found' });
    if (name) user.name = name;
    if (email) user.email = email.toLowerCase();
    if (role) user.role = role.toUpperCase();
    if (phone !== undefined) user.phone = phone;
    if (status) {
      user.status = status;
      user.isActive = status === 'active';
    }
    if (password && password.length >= 6) user.password = password;
    await user.save();
    const userResponse = user.toObject();
    delete userResponse.password;
    res.status(200).json({ success: true, message: 'Staff member updated', user: userResponse });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;

    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }

    if (global.useMemoryStore) {
      const idx = memoryStore.users.findIndex(
        (u) => u._id === req.params.id && (!tenantId || u.tenantId === tenantId)
      );
      if (idx === -1) return res.status(404).json({ success: false, message: 'Staff member not found' });
      memoryStore.users.splice(idx, 1);
      return res.status(200).json({ success: true, message: 'Staff member deleted' });
    }

    const query = tenantId ? { _id: req.params.id, tenantId } : { _id: req.params.id };
    const user = await User.findOne(query);
    if (!user) return res.status(404).json({ success: false, message: 'Staff member not found' });
    await user.deleteOne();
    res.status(200).json({ success: true, message: 'Staff member deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
};
