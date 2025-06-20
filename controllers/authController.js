const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Wallet } = require('../models');
const crypto = require('crypto');
const sendConfirmationEmail = require('../utils/sendConfirmationEmail'); // ✅ Add this line
const addAlerts = require('../utils/addAlerts');
const moment = require('moment');

// ✅ Generate JWT Token
const generateToken = (user) => {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '2d',
  });
};

exports.registerUser = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      referralCode,
      inviteCode = null,
      dateOfBirth = null,
    } = req.body;

    function is18OrOlder(dateOfBirthStr) {
      const dob = moment(dateOfBirthStr);
      const today = moment();

      // Get age in full years
      const age = today.diff(dob, 'years');

      return age >= 18 ? true : false;
    }

    if (!dateOfBirth) {
      return res.status(400).json({ message: 'Date of Birth is required' });
    }

    const userAge = await is18OrOlder(dateOfBirth);

    if (!userAge) {
      return res.status(400).json({ message: 'User Age is less than 18' });
    }

    // ✅ Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    let referredByUser = null;

    // ✅ Validate referral code if provided
    if (referralCode) {
      referredByUser = await User.findOne({
        where: { referral_code: referralCode },
      });
      if (!referredByUser) {
        return res.status(400).json({ message: 'Invalid referral code.' });
      }
    }

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // ✅ Create new user
    const newUser = await User.create({
      username,
      email,
      password_hash: hashedPassword,
      role: 'participant',
      referred_by_id: referredByUser ? referredByUser.id : null,
      date_of_birth: dateOfBirth,
      age_verified: dateOfBirth ? true : false,
    });

    // ✅ Generate referral code
    newUser.referral_code = `PIK${String(newUser.id).padStart(6, '0')}`;
    newUser.referral_bonus_awarded = referredByUser ? false : null;

    // ✅ Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    newUser.verification_token = verificationToken;

    await newUser.save();

    // ✅ Build transaction history for new user's wallet
    const transactionHistory = [
      {
        type: 'Joining Bonus',
        description: 'Joining Bonus: +10 tokens',
        amount: 10,
        timestamp: new Date(),
      },
    ];

    let startingBalance = 10;

    // ✅ If referred, apply referral bonus
    if (referredByUser) {
      transactionHistory.push({
        type: 'Referral Bonus',
        description: 'Used referral code: +10 tokens',
        amount: 10,
        timestamp: new Date(),
      });

      startingBalance += 10;

      // ✅ Update referring user's wallet
      const refWallet = await Wallet.findOne({
        where: { user_id: referredByUser.id },
      });
      if (refWallet) {
        refWallet.token_balance += 10;
        refWallet.transaction_history = [
          ...(refWallet.transaction_history || []),
          {
            type: 'Referral Reward',
            description: `Referral reward for inviting ${username}: +10 tokens`,
            amount: 10,
            timestamp: new Date(),
          },
        ];
        await refWallet.save();
      }

      newUser.referral_bonus_awarded = true;
      await newUser.save();
    }

    // ✅ Create wallet for new user
    await Wallet.create({
      user_id: newUser.id,
      token_balance: startingBalance,
      transaction_history: transactionHistory,
    });

    try {
      await sendConfirmationEmail(
        newUser.email,
        newUser.username,
        verificationToken,
        inviteCode
      );
    } catch (emailError) {
      console.error('❌ Email send failed:', emailError.message);
      // optionally continue without blocking registration
    }

    // ✅ Return response
    res.status(201).json({
      message:
        'User registered successfully. Please check your email to verify your account.',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        referral_code: newUser.referral_code,
        referred_by_id: newUser.referred_by_id,
      },
    });
  } catch (err) {
    console.error('❌ Registration Error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ✅ Login User or Admin
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      where: { email },
      attributes: [
        'id',
        'username',
        'email',
        'role',
        'password_hash',
        'is_verified',
        'suspended',
      ],
    });

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!user.is_verified) {
      return res
        .status(403)
        .json({ message: 'Please verify your email before logging in.' });
    }

    if (user.suspended) {
      return res
        .status(403)
        .json({ message: 'Your account has been suspended.' });
    }

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('❌ Login Error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ✅ Get Logged-in User Profile
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password_hash'] },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error('❌ Fetch User Error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.verifyEmail = async (req, res) => {
  const { token, inviteCode = null } = req.query;

  const user = await User.findOne({ where: { verification_token: token } });

  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired token.' });
  }

  user.is_verified = true;
  user.verification_token = null;

  const newToken = generateToken(user);

  await user.save();

  // add alerts
  await addAlerts({
    user_id: user.id,
    title: 'Welcome to PikMe!',
    message: `We're excited to have you on board. Start exploring and get the most out of your experience.`,
  });

  await addAlerts({
    user_id: user.id,
    title: `You've Got 10 Free Tokens!`,
    message: `Thanks for signing up with PikMe! We've added 10 free tokens to your wallet to get you started.`,
  });
  res.status(200).json({
    // message: 'Email verified successfully!',
    token: newToken,
    inviteCode: inviteCode ? inviteCode : null,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
  });
};

exports.resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.is_verified) {
      return res.status(400).json({ message: 'Email is already verified.' });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.verification_token = verificationToken;
    await user.save();

    await sendConfirmationEmail(user.email, user.username, verificationToken);

    res.json({ message: 'Verification email resent successfully.' });
  } catch (err) {
    console.error('❌ Resend Email Error:', err.message);
    res
      .status(500)
      .json({ message: 'Failed to resend email.', error: err.message });
  }
};
