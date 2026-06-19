const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const {
  addTransaction,getTransactions,getSummary,updateTransaction,deleteTransaction,getLedgerSummary,
} = require("../controllers/transactionController");

router.post("/", protect, addTransaction);
router.get("/", protect, getTransactions);
router.get("/summary", protect, getSummary);
router.get("/ledger-summary", protect, getLedgerSummary);
router.put("/:id", protect, updateTransaction);
router.delete("/:id", protect, deleteTransaction);
module.exports = router;