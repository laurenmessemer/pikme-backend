const { User, Wallet } = require('../models');
const jsonexport = require('jsonexport');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { Readable } = require('stream');
const moment = require('moment');
const { default: axios } = require('axios');
const { Op, Sequelize } = require('sequelize');
// ✅ Enhanced Get Users with More Debugging
const getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      where: {
        id: {
          [Op.ne]: 99999,
        },
      },
      attributes: [
        'id',
        'username',
        'email',
        'role',
        'referred_by_id',
        'referral_code',
        'referral_bonus_awarded',
        'is_verified',
        'suspended',
        'status',
        'is_uploaded',
      ],
      include: [
        {
          model: Wallet,
          attributes: ['token_balance'],
        },
      ],
    });

    const formattedUsers = users.map((user) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      token_balance: user.Wallet?.token_balance || 0,
      referred_by_id: user.referred_by_id,
      referral_code: user.referral_code,
      referral_bonus_awarded: user.referral_bonus_awarded,
      is_verified: user.is_verified,
      suspended: user.suspended,
      status: user.status,
      is_uploaded: user.is_uploaded,
    }));

    return res.status(200).json(formattedUsers);
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// download the template to upload the multiple users at a time
const downloadTemplate = async (req, res) => {
  try {
    let responseExport = [
      {
        username: 'pikme user',
        email: 'pikmeuser@gmail.com',
      },
    ];

    jsonexport(responseExport, function (err, csv) {
      if (err) {
        throw err;
      }
      fs.writeFile('user_list.csv', csv, function (err) {
        if (err) {
          throw err;
        }
        let readStream = fs.createReadStream('user_list.csv');
        res.setHeader(
          'Content-disposition',
          'attachment; filename=user_list.csv'
        );
        readStream.pipe(res.status(200).send(csv));
      });
    });
  } catch (error) {
    console.error('❌ Error uploading user:', error);
    res
      .status(500)
      .json({ message: 'Failed to upload user.', error: error.message });
  }
};

// upload the User with the csv file
const uploadUsers = async (req, res) => {
  try {
    const file = req.files.file;

    if (!file || file.mimetype !== 'text/csv') {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const readable = Readable.from(file.data);
    const results = [];

    const parsedData = await new Promise((resolve, reject) => {
      readable
        .pipe(csv())
        .on('data', (row) => {
          results.push(row);
        })
        .on('end', () => {
          resolve(results);
        })
        .on('error', (err) => {
          reject(err);
        });
    });

    const errorArr = [];

    const handleError = (line, email, message) => {
      errorArr.push({ line, email, message });
    };

    const findRandomUser = await User.findAll({
      where: {
        id: {
          [Op.ne]: 99999,
        },
        is_uploaded: false,
      },
      order: [Sequelize.literal('RANDOM()')],
      limit: 10,
    });

    let count = 0;
    for (let i = 0; i < parsedData.length; i++) {
      const user = parsedData[i];
      const targetDate = moment.utc().subtract(18, 'years').subtract(5, 'days');

      if (user.username && user.email) {
        try {
          const payload = {
            username: user.username.trim(),
            password: 'TestUser@123',
            email: user.email.trim(),
            dateOfBirth: targetDate.format('YYYY-MM-DD HH:mm:ssZ'),
          };

          if (i < 15) {
            payload['referralCode'] =
              findRandomUser[
                Math.floor(Math.random() * findRandomUser.length)
              ].referral_code;
          }
          const apiResponse = await axios.post(
            process.env.BACKEND_URL + 'api/auth/register', // target API
            payload,
            {
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );

          if (apiResponse.data.user.id) {
            const updateUser = await User.update(
              {
                is_verified: true,
                verification_token: null,
                is_uploaded: true,
              },
              {
                where: { id: apiResponse.data.user.id },
              }
            );
          }
          count++; // update the count
        } catch (error) {
          await handleError(i + 2, user?.email, error?.response?.data?.message);
        }
      } else if (user.username || user.email) {
        await handleError(i + 2, user?.email, 'Missing Required fields');
      } else {
        // do nothing
      }
    }

    return res.status(200).json({
      message:
        count === 0
          ? `No users uploaded.`
          : `${count} Users uploaded successfully.`,
      count,
      userErrorArr: errorArr,
    });
  } catch (err) {
    console.log('err: ', err);
    return res
      .status(500)
      .json({ message: 'error in the user upload', error: err.message });
  }
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  const {
    username,
    email,
    role,
    token_balance,
    referred_by_id,
    referral_code,
    referral_bonus_awarded,
    is_verified,
    verification_token,
    suspended,
    status,
  } = req.body;

  try {
    const user = await User.findByPk(id, {
      include: [{ model: Wallet }],
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // ✅ Update all user fields conditionally
    user.username = username ?? user.username;
    user.email = email ?? user.email;
    user.role = role ?? user.role;
    user.referred_by_id = referred_by_id ?? user.referred_by_id;
    user.referral_code = referral_code ?? user.referral_code;
    user.referral_bonus_awarded =
      referral_bonus_awarded ?? user.referral_bonus_awarded;
    user.is_verified = is_verified ?? user.is_verified;
    user.verification_token = verification_token ?? user.verification_token;
    user.suspended = suspended ?? user.suspended;
    user.status = status ?? user.status;

    // ✅ Update token balance in Wallet
    if (user.Wallet) {
      user.Wallet.token_balance = token_balance ?? user.Wallet.token_balance;
      await user.Wallet.save();
    } else {
      await Wallet.create({ user_id: id, token_balance: token_balance ?? 0 });
    }

    await user.save();

    res.json({ message: 'User updated successfully.', user });
  } catch (error) {
    console.error('❌ Error updating user:', error);
    res
      .status(500)
      .json({ message: 'Failed to update user.', error: error.message });
  }
};

const suspendUser = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.suspended = true;
    await user.save();

    res.status(200).json({ message: `User ${id} suspended successfully.` });
  } catch (error) {
    console.error('❌ Error suspending user:', error);
    res
      .status(500)
      .json({ message: 'Failed to suspend user', error: error.message });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    await user.destroy(); // Cascade will remove Wallet, Entries, etc.

    res.status(200).json({ message: `User ${id} deleted successfully.` });
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    res
      .status(500)
      .json({ message: 'Failed to delete user.', error: error.message });
  }
};

/**
 *
 * @param {Request} req
 * @param {Response} res
 * @description Close the user's verify age popUp
 * @routes (POST /verify-age)
 * @returns HTTP Response
 * @author Dhrumil Amrutiya (Zignuts)
 */
const verifyAge = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    user.age_verified = true;

    await user.save();

    return res
      .status(200)
      .json({ message: 'User updated successfully.', user });
  } catch (error) {
    console.error('❌ Error updating user:', error);
    res
      .status(500)
      .json({ message: 'Failed to update user.', error: error.message });
  }
};

/**
 *
 * @param {Request} req
 * @param {Response} res
 * @description Close the user's warning popUp
 * @routes (POST /close-warn-popup)
 * @returns HTTP Response
 * @author Dhrumil Amrutiya (Zignuts)
 */
const closeWarnPopUp = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    user.status = 'Normal';

    await user.save();

    let updatedUser = user.toJSON();
    delete updatedUser.password_hash;
    return res
      .status(200)
      .json({ message: 'User updated successfully.', user: updatedUser });
  } catch (error) {
    console.error('❌ Error updating user:', error);
    res
      .status(500)
      .json({ message: 'Failed to update user.', error: error.message });
  }
};

// ✅ Export functions
module.exports = {
  getUsers,
  downloadTemplate,
  updateUser,
  deleteUser,
  suspendUser,
  verifyAge,
  closeWarnPopUp,
  uploadUsers,
};
