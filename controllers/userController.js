const { User, Wallet } = require("../models");

// ✅ Enhanced Get Users with More Debugging
const getUsers = async (req, res) => {
    try {
      const users = await User.findAll({
        attributes: [
          "id",
          "username",
          "email",
          "role",
          "referred_by_id",
          "referral_code",
          "referral_bonus_awarded",
          "is_verified",
          "suspended",
        ],
        include: [
          {
            model: Wallet,
            attributes: ["token_balance"],
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
      }));
  
      res.json(formattedUsers);
    } catch (error) {
      console.error("❌ Error fetching users:", error);
      res.status(500).json({ error: "Internal Server Error" });
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
} = req.body;

try {
    console.log(`🔄 Updating user ${id}...`);

    const user = await User.findByPk(id, {
    include: [{ model: Wallet }],
    });

    if (!user) {
    return res.status(404).json({ message: "User not found." });
    }

    // ✅ Update all user fields conditionally
    user.username = username ?? user.username;
    user.email = email ?? user.email;
    user.role = role ?? user.role;
    user.referred_by_id = referred_by_id ?? user.referred_by_id;
    user.referral_code = referral_code ?? user.referral_code;
    user.referral_bonus_awarded = referral_bonus_awarded ?? user.referral_bonus_awarded;
    user.is_verified = is_verified ?? user.is_verified;
    user.verification_token = verification_token ?? user.verification_token;
    user.suspended = suspended ?? user.suspended;

    // ✅ Update token balance in Wallet
    if (user.Wallet) {
    user.Wallet.token_balance = token_balance ?? user.Wallet.token_balance;
    await user.Wallet.save();
    } else {
    await Wallet.create({ user_id: id, token_balance: token_balance ?? 0 });
    }

    await user.save();

    console.log(`✅ User ${id} updated successfully.`);
    res.json({ message: "User updated successfully.", user });
} catch (error) {
    console.error("❌ Error updating user:", error);
    res.status(500).json({ message: "Failed to update user.", error: error.message });
}
};

const suspendUser = async (req, res) => {
    const { id } = req.params;
  
    try {
      const user = await User.findByPk(id);
      if (!user) return res.status(404).json({ message: "User not found" });
  
      user.suspended = true;
      await user.save();
  
      res.status(200).json({ message: `User ${id} suspended successfully.` });
    } catch (error) {
      console.error("❌ Error suspending user:", error);
      res.status(500).json({ message: "Failed to suspend user", error: error.message });
    }
  };
  

  
const deleteUser = async (req, res) => {
    const { id } = req.params;
  
    try {
      const user = await User.findByPk(id);
  
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }
  
      await user.destroy(); // Cascade will remove Wallet, Entries, etc.
  
      res.status(200).json({ message: `User ${id} deleted successfully.` });
    } catch (error) {
      console.error("❌ Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user.", error: error.message });
    }
  };

// ✅ Export functions
module.exports = {
  getUsers,
  updateUser,
  deleteUser,
  suspendUser
};
