const { User, Wallet } = require("../models");

// ✅ Enhanced Get Users with More Debugging
const getUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ["id", "username", "email", "role"], // Remove "referred_by_id"
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
        }));

        res.json(formattedUsers);
    } catch (error) {
        console.error("❌ Error fetching users:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};


const updateUser = async (req, res) => {
    const { id } = req.params;
    const { username, email, role, token_balance } = req.body;

    try {
        console.log(`🔄 Updating user ${id}...`);

        // ✅ Ensure user exists
        const user = await User.findByPk(id, {
            include: [{ model: Wallet }],
        });

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        // ✅ Update fields
        user.username = username ?? user.username;
        user.email = email ?? user.email;
        user.role = role ?? user.role;

        // ✅ Update token balance (if wallet exists)
        if (user.Wallet) {
            user.Wallet.token_balance = token_balance ?? user.Wallet.token_balance;
            await user.Wallet.save();
        } else {
            await Wallet.create({ user_id: id, token_balance: token_balance ?? 0 });
        }

        await user.save(); // ✅ Save user changes

        console.log(`✅ User ${id} updated successfully.`);
        res.json({ message: "User updated successfully.", user });
    } catch (error) {
        console.error("❌ Error updating user:", error);
        res.status(500).json({ message: "Failed to update user.", error: error.message });
    }
};


// ✅ Export functions
module.exports = {
  getUsers,
  updateUser,
};
