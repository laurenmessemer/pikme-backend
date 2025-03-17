const { Wallet } = require("../models"); // ✅ Import Wallet model

// ✅ Fetch Wallet Data Without Authentication
const getWallet = async (req, res) => {
    try {
        const userId = req.query.user_id; // ✅ Get user ID from request query

        if (!userId) {
            return res.status(400).json({ error: "User ID is required." });
        }

        // ✅ Find the user's wallet
        const wallet = await Wallet.findOne({
            where: { user_id: userId },
        });

        if (!wallet) {
            return res.status(404).json({ error: "Wallet not found for this user." });
        }

        return res.json({
            balance: wallet.token_balance,
            prizeHistory: wallet.transaction_history || [],
        });
    } catch (error) {
        console.error("❌ Error fetching wallet:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = { getWallet };
