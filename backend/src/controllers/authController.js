const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../utils/prisma');
const { logAction } = require('../utils/auditLogger');

function generateToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// Student Self-Registration
async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Please provide full name, email, and password.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password_hash: hashedPassword,
        role: 'STUDENT',
        status: 'ACTIVE'
      }
    });

    // Generate unique application number ADM-2026-XXXX
    const appCount = await prisma.application.count();
    const appNumber = `ADM-2026-${String(appCount + 101).padStart(4, '0')}`;

    // Get current policy
    const policy = await prisma.systemPolicy.findFirst();

    // Create initial Application record in DRAFT status
    const application = await prisma.application.create({
      data: {
        application_number: appNumber,
        student_id: newUser.id,
        course_applied: 'Bachelor of Computer Science',
        academic_year: policy ? policy.academic_year : '2026-2027',
        status: 'DRAFT',
        personal_info: JSON.stringify({
          fullName: newUser.name,
          dob: '',
          gender: '',
          phone: '',
          address: '',
          guardianName: '',
          guardianPhone: ''
        }),
        academic_info: JSON.stringify({
          highSchool: '',
          board: '',
          graduationYear: '',
          gpaOrPercentage: '',
          majorStream: '',
          achievements: ''
        })
      }
    });

    // Create initial entrance test record
    await prisma.entranceTest.create({
      data: {
        application_id: application.id,
        test_name: 'Undergraduate Academic Aptitude Test (UAAT)',
        status: 'SCHEDULED',
        max_score: 100,
        passing_score: policy ? policy.passing_score : 60
      }
    });

    await logAction({
      userId: newUser.id,
      userName: newUser.name,
      userRole: newUser.role,
      action: 'USER_REGISTERED',
      details: `New student account created with application ${appNumber}`,
      req
    });

    const token = generateToken(newUser);

    return res.status(201).json({
      message: 'Registration successful! Welcome to the admission portal.',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status
      },
      applicationId: application.id
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Failed to complete registration. Please try again.' });
  }
}

// Universal Login (Student, Officer, Admin)
async function login(req, res) {
  try {
    const { email, password, requestedRole } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please enter both email and password.' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials. User not found.' });
    }

    if (user.status === 'INACTIVE') {
      return res.status(403).json({
        error: 'Your account has been deactivated by the system administrator. Please contact admissions support.'
      });
    }

    // Optional role check if logging in via dedicated tab/route
    if (requestedRole && user.role !== requestedRole) {
      return res.status(403).json({
        error: `Access restricted. Your account is assigned role "${user.role}", not "${requestedRole}".`
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials. Incorrect password.' });
    }

    const token = generateToken(user);

    await logAction({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'USER_LOGIN',
      details: `User successfully logged in with role ${user.role}`,
      req
    });

    return res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        permissions: user.permissions ? JSON.parse(user.permissions) : {}
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Authentication failed. Please try again.' });
  }
}

// Forgot Password Flow
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email address is required.' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (!user) {
      // Return success even if not found to prevent user enumeration
      return res.json({
        message: 'If an account matches that email, a password recovery link has been prepared.'
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        reset_token: resetToken,
        reset_token_expiry: resetExpires
      }
    });

    await logAction({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'PASSWORD_RESET_REQUESTED',
      details: 'Password reset token generated',
      req
    });

    return res.json({
      message: 'Password reset token generated successfully.',
      resetToken, // Provided for instant demo recovery testing
      instructions: `In production an email is sent. For demo convenience, your reset token is: ${resetToken}`
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ error: 'Could not process password reset request.' });
  }
}

// Reset Password with Token
async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Reset token and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    const user = await prisma.user.findFirst({
      where: {
        reset_token: token,
        reset_token_expiry: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({ error: 'Password reset token is invalid or has expired.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password_hash: hashedPassword,
        reset_token: null,
        reset_token_expiry: null
      }
    });

    await logAction({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'PASSWORD_RESET_COMPLETED',
      details: 'Password was updated successfully via reset token',
      req
    });

    return res.json({ message: 'Password has been successfully updated! You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ error: 'Failed to reset password.' });
  }
}

// Get Current User Profile
async function getMe(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        permissions: true,
        created_at: true
      }
    });

    let extraData = {};
    if (user.role === 'STUDENT') {
      const app = await prisma.application.findFirst({
        where: { student_id: user.id },
        include: {
          documents: true,
          payment: true,
          entrance_test: true
        }
      });
      extraData.application = app;
    }

    return res.json({
      user: {
        ...user,
        permissions: user.permissions ? JSON.parse(user.permissions) : {}
      },
      ...extraData
    });
  } catch (error) {
    console.error('getMe error:', error);
    return res.status(500).json({ error: 'Failed to retrieve profile.' });
  }
}

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  getMe
};
