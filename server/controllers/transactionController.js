const Transaction = require("../models/Transaction");

const addTransaction = async (req, res) => {
  try {
    const { type, amount, description, date } = req.body;

    const transaction = await Transaction.create({
      userId: req.user._id,
      type,
      amount,
      description,
      date,
    });

    res.status(201).json({
      success: true,
      transaction,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getTransactions = async (req, res) => {
  try {
    const { date } = req.query;

let query = {
  userId: req.user._id,
};

if (date) {
  const startDate = new Date(date);
  const endDate = new Date(date);

  endDate.setDate(endDate.getDate() + 1);

  query.date = {
    $gte: startDate,
    $lt: endDate,
  };
}

const transactions = await Transaction.find(query)
  .sort({ date: -1 });

    res.json({
      success: true,
      count: transactions.length,
      transactions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getLedgerSummary = async (req, res) => {
  try {
    const { date } = req.query;

    const selectedDate = new Date(date);

    const previousTransactions =
      await Transaction.find({
        userId: req.user._id,
        date: { $lt: selectedDate },
      });

    let openingBalance = 0;

    previousTransactions.forEach((t) => {
      if (t.type === "credit")
        openingBalance += t.amount;
      else openingBalance -= t.amount;
    });

    const endDate = new Date(selectedDate);
    endDate.setDate(endDate.getDate() + 1);

    const currentTransactions =
      await Transaction.find({
        userId: req.user._id,
        date: {
          $gte: selectedDate,
          $lt: endDate,
        },
      });

    let totalCredit = 0;
    let totalDebit = 0;

    currentTransactions.forEach((t) => {
      if (t.type === "credit")
        totalCredit += t.amount;
      else totalDebit += t.amount;
    });

    const closingBalance =
      openingBalance +
      totalCredit -
      totalDebit;

    res.json({
      openingBalance,
      totalCredit,
      totalDebit,
      closingBalance,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
const getSummary = async (req, res) => {
  try {
    const transactions = await Transaction.find({
      userId: req.user._id,
    });

    let totalCredit = 0;
    let totalDebit = 0;

    transactions.forEach((item) => {
      if (item.type === "credit") {
        totalCredit += item.amount;
      } else {
        totalDebit += item.amount;
      }
    });

    const balance = totalCredit - totalDebit;

    res.json({
      success: true,
      totalCredit,
      totalDebit,
      balance,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    const updated = await Transaction.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json({
      success: true,
      transaction: updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    await Transaction.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Transaction deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  addTransaction,
  getTransactions,
  getSummary,
  updateTransaction,
  deleteTransaction,
  getLedgerSummary,
};