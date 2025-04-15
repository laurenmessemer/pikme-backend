const { Wallet } = require("../models"); // ✅ Import Wallet model

// ✅ Fetch Wallet Data Without Authentication
const getWallet = async (req, res) => {
  try {
    const userId = req.query.user_id;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required." });
    }

    const wallet = await Wallet.findOne({ where: { user_id: userId } });

    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found for this user." });
    }

    // ✅ Ensure all transactions have required fields
    const safeTransactions = (wallet.transaction_history || []).map((tx) => ({
      type: tx.type || "unknown",
      description: tx.description || "PikMe Token Transaction",
      timestamp: tx.timestamp || new Date().toISOString(),
      amount: typeof tx.amount === "number" ? tx.amount : 0,
      currency: tx.currency || "🟠",
    }));

    // ✅ Sort by most recent first
    const sortedTransactions = safeTransactions.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );

    return res.json({
      balance: wallet.token_balance,
      prizeHistory: sortedTransactions,
    });
  } catch (error) {
    console.error("❌ Error fetching wallet:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = { getWallet };
