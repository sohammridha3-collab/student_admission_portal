const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');
const { logAction } = require('../utils/auditLogger');

// 1. Get All Users (with filter by role, status, search)
async function getUsers(req, res) {
  try {
    const { role, status, search } = req.query;

    const where = {};
    if (role && role !== 'ALL') {
      where.role = role;
    }
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } }
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        permissions: true,
        created_at: true,
        updated_at: true,
        _count: {
          select: {
            applications: true,
            verified_documents: true,
            conducted_tests: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    const formatted = users.map((u) => ({
      ...u,
      permissions: u.permissions ? JSON.parse(u.permissions) : {}
    }));

    return res.json({ users: formatted });
  } catch (error) {
    console.error('getUsers error:', error);
    return res.status(500).json({ error: 'Failed to retrieve users.' });
  }
}

// 2. Create User (Admin creates Officer, Student, or Admin)
async function createUser(req, res) {
  try {
    const { name, email, password, role = 'OFFICER', permissions } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and initial password are required.' });
    }

    if (!['STUDENT', 'OFFICER', 'ADMIN'].includes(role)) {
      return res.status(400).json({ error: 'Role must be STUDENT, OFFICER, or ADMIN.' });
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (existing) {
      return res.status(400).json({ error: 'A user with this email address already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Default permissions per role
    let rolePermissions = {};
    if (role === 'OFFICER') {
      rolePermissions = permissions || {
        canVerifyDocs: true,
        canGradeTest: true,
        canMakeDecision: true,
        canExportReports: true
      };
    } else if (role === 'ADMIN') {
      rolePermissions = {
        canManageUsers: true,
        canManageRoles: true,
        canConfigureSettings: true,
        canViewAudit: true,
        canExportReports: true
      };
    }

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password_hash: hashedPassword,
        role,
        status: 'ACTIVE',
        permissions: JSON.stringify(rolePermissions)
      }
    });

    // If student was created by admin, create application record
    if (role === 'STUDENT') {
      const policy = await prisma.systemPolicy.findFirst();
      const appCount = await prisma.application.count();
      const appNumber = `ADM-2026-${String(appCount + 101).padStart(4, '0')}`;

      await prisma.application.create({
        data: {
          application_number: appNumber,
          student_id: newUser.id,
          course_applied: 'Bachelor of Computer Science',
          academic_year: policy ? policy.academic_year : '2026-2027',
          status: 'DRAFT',
          personal_info: JSON.stringify({ fullName: newUser.name }),
          academic_info: JSON.stringify({})
        }
      });
    }

    await logAction({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'USER_CREATED_BY_ADMIN',
      details: `Created ${role} account: ${newUser.name} (${newUser.email})`,
      req
    });

    return res.status(201).json({
      message: `User ${newUser.name} created successfully as ${role}!`,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
        permissions: rolePermissions
      }
    });
  } catch (error) {
    console.error('createUser error:', error);
    return res.status(500).json({ error: 'Failed to create user.' });
  }
}

// 3. Edit User Details (Name, Email, Role)
async function updateUser(req, res) {
  try {
    const userId = parseInt(req.params.id, 10);
    const { name, email, role, permissions } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const dataToUpdate = {};
    if (name) dataToUpdate.name = name.trim();
    if (email) dataToUpdate.email = email.toLowerCase().trim();
    if (role) dataToUpdate.role = role;
    if (permissions) {
      dataToUpdate.permissions = typeof permissions === 'object' ? JSON.stringify(permissions) : permissions;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        permissions: true,
        updated_at: true
      }
    });

    await logAction({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'USER_UPDATED_BY_ADMIN',
      details: `Updated details for ${updated.name} (${updated.email})`,
      req
    });

    return res.json({
      message: 'User details updated successfully!',
      user: {
        ...updated,
        permissions: updated.permissions ? JSON.parse(updated.permissions) : {}
      }
    });
  } catch (error) {
    console.error('updateUser error:', error);
    return res.status(500).json({ error: 'Failed to update user.' });
  }
}

// 4. Toggle User Deactivation / Reactivation
async function toggleUserStatus(req, res) {
  try {
    const userId = parseInt(req.params.id, 10);

    // Prevent admin from self-deactivating
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'You cannot deactivate your own administrative account.' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { status: newStatus }
    });

    await logAction({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: newStatus === 'ACTIVE' ? 'USER_REACTIVATED' : 'USER_DEACTIVATED',
      details: `${newStatus === 'ACTIVE' ? 'Reactivated' : 'Deactivated'} account: ${user.name} (${user.email})`,
      req
    });

    return res.json({
      message: `User account is now ${newStatus}.`,
      status: newStatus
    });
  } catch (error) {
    console.error('toggleUserStatus error:', error);
    return res.status(500).json({ error: 'Failed to update user status.' });
  }
}

// 5. Admin Direct Password Reset
async function resetUserPassword(req, res) {
  try {
    const userId = parseInt(req.params.id, 10);
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: {
        password_hash: hashedPassword,
        reset_token: null,
        reset_token_expiry: null
      }
    });

    await logAction({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'ADMIN_RESET_PASSWORD',
      details: `Administrator manually reset password for user: ${user.name} (${user.email})`,
      req
    });

    return res.json({ message: `Password for ${user.name} was successfully reset!` });
  } catch (error) {
    console.error('resetUserPassword error:', error);
    return res.status(500).json({ error: 'Failed to reset user password.' });
  }
}

// 6. Role & Permissions Management
async function updatePermissions(req, res) {
  try {
    const userId = parseInt(req.params.id, 10);
    const { permissions, role } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const dataToUpdate = {};
    if (role) dataToUpdate.role = role;
    if (permissions) {
      dataToUpdate.permissions = typeof permissions === 'object' ? JSON.stringify(permissions) : permissions;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate
    });

    await logAction({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'PERMISSIONS_UPDATED',
      details: `Updated RBAC permissions for ${user.name}`,
      req
    });

    return res.json({
      message: 'Role permissions updated successfully!',
      user: {
        id: updated.id,
        name: updated.name,
        role: updated.role,
        permissions: JSON.parse(updated.permissions || '{}')
      }
    });
  } catch (error) {
    console.error('updatePermissions error:', error);
    return res.status(500).json({ error: 'Failed to update permissions.' });
  }
}

// 7. System Policy / Settings
async function getSystemPolicy(req, res) {
  try {
    let policy = await prisma.systemPolicy.findFirst();

    if (!policy) {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 30);
      policy = await prisma.systemPolicy.create({
        data: {
          application_deadline: deadline,
          application_fee: 75.0,
          academic_year: '2026-2027',
          portal_status: 'OPEN',
          required_documents: JSON.stringify([
            'High School Transcript',
            'Government ID',
            'Passport Photo'
          ]),
          passing_score: 60.0,
          announcement: 'Admissions are open.'
        }
      });
    }

    return res.json({
      ...policy,
      required_documents: JSON.parse(policy.required_documents || '[]')
    });
  } catch (error) {
    console.error('getSystemPolicy error:', error);
    return res.status(500).json({ error: 'Failed to retrieve system policies.' });
  }
}

async function updateSystemPolicy(req, res) {
  try {
    const {
      application_deadline,
      application_fee,
      academic_year,
      portal_status,
      required_documents,
      passing_score,
      announcement
    } = req.body;

    let policy = await prisma.systemPolicy.findFirst();

    const dataToSave = {};
    if (application_deadline) dataToSave.application_deadline = new Date(application_deadline);
    if (application_fee !== undefined) dataToSave.application_fee = parseFloat(application_fee);
    if (academic_year) dataToSave.academic_year = academic_year;
    if (portal_status) dataToSave.portal_status = portal_status;
    if (passing_score !== undefined) dataToSave.passing_score = parseFloat(passing_score);
    if (announcement !== undefined) dataToSave.announcement = announcement;
    if (required_documents) {
      dataToSave.required_documents = typeof required_documents === 'object'
        ? JSON.stringify(required_documents)
        : required_documents;
    }

    if (policy) {
      policy = await prisma.systemPolicy.update({
        where: { id: policy.id },
        data: dataToSave
      });
    } else {
      policy = await prisma.systemPolicy.create({
        data: {
          application_deadline: new Date(application_deadline || Date.now() + 30 * 86400000),
          application_fee: parseFloat(application_fee || 75),
          academic_year: academic_year || '2026-2027',
          portal_status: portal_status || 'OPEN',
          required_documents: JSON.stringify(required_documents || ['High School Transcript', 'Government ID', 'Passport Photo']),
          passing_score: parseFloat(passing_score || 60),
          announcement: announcement || ''
        }
      });
    }

    await logAction({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'SYSTEM_SETTINGS_UPDATED',
      details: `Updated admission policy: Fee=$${policy.application_fee}, Status=${policy.portal_status}, Deadline=${policy.application_deadline}`,
      req
    });

    return res.json({
      message: 'System policy configurations successfully saved!',
      policy: {
        ...policy,
        required_documents: JSON.parse(policy.required_documents)
      }
    });
  } catch (error) {
    console.error('updateSystemPolicy error:', error);
    return res.status(500).json({ error: 'Failed to update system policy.' });
  }
}

// 8. Audit Logs
async function getAuditLogs(req, res) {
  try {
    const { action, role, search, limit = 100 } = req.query;

    const where = {};
    if (action && action !== 'ALL') where.action = action;
    if (role && role !== 'ALL') where.user_role = role;
    if (search) {
      where.OR = [
        { user_name: { contains: search } },
        { action: { contains: search } },
        { details: { contains: search } }
      ];
    }

    const logs = await prisma.systemLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit, 10)
    });

    return res.json({ logs });
  } catch (error) {
    console.error('getAuditLogs error:', error);
    return res.status(500).json({ error: 'Failed to retrieve audit logs.' });
  }
}

// 9. System-Wide Reports & Analytics
async function getSystemReports(req, res) {
  try {
    const totalUsers = await prisma.user.count();
    const totalStudents = await prisma.user.count({ where: { role: 'STUDENT' } });
    const totalOfficers = await prisma.user.count({ where: { role: 'OFFICER' } });
    const totalApplications = await prisma.application.count();

    const statusCounts = {
      DRAFT: await prisma.application.count({ where: { status: 'DRAFT' } }),
      SUBMITTED: await prisma.application.count({ where: { status: 'SUBMITTED' } }),
      UNDER_REVIEW: await prisma.application.count({ where: { status: 'UNDER_REVIEW' } }),
      TEST_SCHEDULED: await prisma.application.count({ where: { status: 'TEST_SCHEDULED' } }),
      APPROVED: await prisma.application.count({ where: { status: 'APPROVED' } }),
      REJECTED: await prisma.application.count({ where: { status: 'REJECTED' } })
    };

    const completedPayments = await prisma.payment.findMany({
      where: { status: 'COMPLETED' },
      select: { amount: true }
    });

    const totalRevenue = completedPayments.reduce((sum, p) => sum + p.amount, 0);

    const conversionRate = totalApplications > 0
      ? ((statusCounts.APPROVED / totalApplications) * 100).toFixed(1)
      : '0.0';

    return res.json({
      summary: {
        totalRevenue,
        totalUsers,
        totalStudents,
        totalOfficers,
        totalApplications,
        conversionRate: `${conversionRate}%`
      },
      statusDistribution: statusCounts
    });
  } catch (error) {
    console.error('getSystemReports error:', error);
    return res.status(500).json({ error: 'Failed to generate system analytics.' });
  }
}

module.exports = {
  getUsers,
  createUser,
  updateUser,
  toggleUserStatus,
  resetUserPassword,
  updatePermissions,
  getSystemPolicy,
  updateSystemPolicy,
  getAuditLogs,
  getSystemReports
};
