import { useEffect, useState } from "react";
import API from "../services/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
function Dashboard() {
    const [selectedDate, setSelectedDate] = useState(
  new Date().toISOString().split("T")[0]
);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
  const [summary, setSummary] = useState({
    totalCredit: 0,
    totalDebit: 0,
    balance: 0,
  });
const [transactions, setTransactions] = useState([]);
  useEffect(() => {
    fetchTransactions();
    fetchLedgerSummary();
  }, [selectedDate]);


  const fetchSummary = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await API.get(
        "/transactions/summary",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSummary(res.data);
    } catch (error) {
      console.log(error);
    }
  };
const handleEdit = (item) => {
  setEditingId(item._id);

  setForm({
    type: item.type,
    amount: item.amount,
    description: item.description,
    date: item.date
      ? item.date.split("T")[0]
      : new Date().toISOString().split("T")[0],
  });
    setShowEditModal(true);

};
const [ledgerSummary, setLedgerSummary] = useState({
  openingBalance: 0,
  totalCredit: 0,
  totalDebit: 0,
  closingBalance: 0,
});
const fetchLedgerSummary = async () => {
  try {
    const token = localStorage.getItem("token");

    const res = await API.get(
      `/transactions/ledger-summary?date=${selectedDate}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setLedgerSummary(res.data);
  } catch (error) {
    console.log(error);
  }
};
const [form, setForm] = useState({
  type: "credit",
  amount: "",
  description: "",
  date: new Date().toISOString().split("T")[0], // Default to today's date
});

const handleSave = async () => {
  try {
    setLoading(true);

    const token = localStorage.getItem("token");

    if (editingId) {
      await API.put(
        `/transactions/${editingId}`,
        form,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } else {
      await API.post(
        "/transactions",
        form,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    }

    setForm({
      date: new Date().toISOString().split("T")[0],
      type: "credit",
      amount: "",
      description: "",
    });

    setEditingId(null);
    setShowEditModal(false);
    // fetchSummary();
    fetchTransactions();
    fetchLedgerSummary();
  } catch (error) {
    console.log(error);
  } finally {
    setLoading(false);
  }
};
const fetchTransactions = async () => {
  try {
    const token = localStorage.getItem("token");

  const res = await API.get(
  `/transactions?date=${selectedDate}`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

    setTransactions(res.data.transactions);
  } catch (error) {
    console.log(error);
  }
};
const creditTransactions = transactions.filter(
  (item) => item.type === "credit"
);

const debitTransactions = transactions.filter(
  (item) => item.type === "debit"
);
const handleDelete = async (id) => {
  const confirmDelete = window.confirm(
    "Delete this transaction?"
  );

  if (!confirmDelete) return;

  try {
    const token = localStorage.getItem("token");

    await API.delete(`/transactions/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    fetchTransactions();
    fetchLedgerSummary();
  } catch (error) {
    console.log(error);
  }
};


const downloadPDF = () => {
  const doc = generatePDF();

  doc.save(
    `HisabKitab_${selectedDate}.pdf`
  );
};
const sharePDF = async () => {
  try {
    const doc = generatePDF();

    const pdfBlob = doc.output("blob");

    const file = new File(
      [pdfBlob],
      `HisabKitab_${selectedDate}.pdf`,
      {
        type: "application/pdf",
      }
    );

    if (
      navigator.share &&
      navigator.canShare({
        files: [file],
      })
    ) {
      await navigator.share({
        title: "HisabKitab Ledger",
        text: `Ledger ${selectedDate}`,
        files: [file],
      });
    } else {
      doc.save(
        `HisabKitab_${selectedDate}.pdf`
      );
    }
  } catch (error) {
    console.log(error);
  }
};
const generatePDF = () => {
  const doc = new jsPDF();

  const creditEntries = transactions.filter(
    (item) => item.type === "credit"
  );

  const debitEntries = transactions.filter(
    (item) => item.type === "debit"
  );
  // Title
  doc.setFontSize(22);
  doc.setTextColor(40, 40, 40);
  doc.text("HisabKitab Ledger", 14, 20);

  doc.setFontSize(12);
  doc.setTextColor(80, 80, 80);
  doc.text(`Date: ${selectedDate}`, 14, 30);

  // Summary Boxes
  doc.setFillColor(255, 193, 7); // Yellow
  doc.rect(14, 40, 40, 20, "F");
  doc.setTextColor(0, 0, 0);
  doc.text("Opening", 18, 48);
  doc.text(`${ledgerSummary.openingBalance}`, 18, 56);

  doc.setFillColor(40, 167, 69); // Green
  doc.rect(60, 40, 40, 20, "F");
  doc.setTextColor(255, 255, 255);
  doc.text("Credit", 68, 48);
  doc.text(`${ledgerSummary.totalCredit}`, 68, 56);

  doc.setFillColor(220, 53, 69); // Red
  doc.rect(106, 40, 40, 20, "F");
  doc.text("Debit", 115, 48);
  doc.text(`${ledgerSummary.totalDebit}`, 115, 56);

  doc.setFillColor(0, 123, 255); // Blue
  doc.rect(152, 40, 45, 20, "F");
  doc.text("Closing", 160, 48);
  doc.text(`${ledgerSummary.closingBalance}`, 160, 56);

  // CREDIT TABLE
  doc.setFontSize(16);
  doc.setTextColor(40, 167, 69);
  doc.text("CREDIT ENTRIES", 14, 80);

  autoTable(doc, {
    startY: 85,
    head: [["Date", "Description","Amount"]],
    body: creditEntries.map((item) => [
      new Date(item.date).toLocaleDateString("en-IN"),
      item.description,
        `${item.amount}`,
    ]),
    headStyles: {
      fillColor: [40, 167, 69],
    },
    //   columnStyles: {
    // 2: { halign: "right" }, // Amount column
  // },
  });

  // DEBIT TABLE
  const finalY = doc.lastAutoTable.finalY + 15;

  doc.setFontSize(16);
  doc.setTextColor(220, 53, 69);
  doc.text("DEBIT ENTRIES", 14, finalY);

  autoTable(doc, {
    startY: finalY + 5,
    head: [["Date", "Description", "Amount"]],
    body: debitEntries.map((item) => [
      new Date(item.date).toLocaleDateString("en-IN"),
      item.description,
        `${item.amount}`,
      
    ]),
    headStyles: {
      fillColor: [220, 53, 69],
    },
  });

  const endingY = doc.lastAutoTable.finalY + 15;

  doc.setFontSize(18);
  doc.setTextColor(0, 123, 255);

doc.text(
  `Closing Balance : ${ledgerSummary.closingBalance}`,
  14,
  endingY
);

return doc;
};
  return (
    <>
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-4xl font-bold mb-8">
        HisabKitab Dashboard
      </h1>
   <div className="bg-white p-4 rounded-xl shadow mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">

  <div>
    <label className="block mb-2 font-semibold">
      Select Ledger Date
    </label>

    <p className="text-gray-600 mb-2">
      Showing ledger for {selectedDate}
    </p>

    <input
      type="date"
      value={selectedDate}
      onChange={(e) => setSelectedDate(e.target.value)}
      className="border p-2 rounded"
    />
  </div>
<button
  onClick={sharePDF}
  className="bg-green-600 text-white px-6 py-3 rounded-lg"
>
  Share PDF
</button>
<button
  onClick={downloadPDF}
  className="bg-purple-600 text-white px-6 py-3 rounded-lg"
>
  Download PDF
</button>

</div>
    <div className="grid md:grid-cols-4 gap-6">

  <div className="bg-yellow-500 text-white p-6 rounded-xl">
    <h2 className="text-xl">Opening Balance</h2>
    <p className="text-3xl font-bold">
      ₹{ledgerSummary.openingBalance}
    </p>
  </div>

  <div className="bg-green-500 text-white p-6 rounded-xl">
    <h2 className="text-xl">Credit</h2>
    <p className="text-3xl font-bold">
      ₹{ledgerSummary.totalCredit}
    </p>
  </div>

  <div className="bg-red-500 text-white p-6 rounded-xl">
    <h2 className="text-xl">Debit</h2>
    <p className="text-3xl font-bold">
      ₹{ledgerSummary.totalDebit}
    </p>
  </div>

  <div className="bg-blue-500 text-white p-6 rounded-xl">
    <h2 className="text-xl">Closing Balance</h2>
    <p className="text-3xl font-bold">
      ₹{ledgerSummary.closingBalance}
    </p>
  </div>

</div>
  <div className="bg-white p-6 rounded-xl shadow mt-8">
  <h2 className="text-2xl font-bold mb-4">
    Add Entry
  </h2>

  <select
    value={form.type}
    onChange={(e) =>
      setForm({ ...form, type: e.target.value })
    }
    className="border p-3 rounded w-full mb-4"
  >
    <option value="credit">Credit</option>
    <option value="debit">Debit</option>
  </select>

  <input
    type="number"
    placeholder="Amount"
    value={form.amount}
    onChange={(e) =>
      setForm({ ...form, amount: e.target.value })
    }
    className="border p-3 rounded w-full mb-4"
  />
<input
  type="date"
  value={form.date}
  onChange={(e) =>
    setForm({
      ...form,
      date: e.target.value,
    })
  }
  className="border p-3 rounded w-full mb-4"
/>
  <input
    type="text"
    placeholder="Description"
    value={form.description}
    onChange={(e) =>
      setForm({
        ...form,
        description: e.target.value,
      })
    }
    className="border p-3 rounded w-full mb-4"
  />

  <button
    onClick={handleSave}
    disabled={loading}
    className="bg-green-600 text-white px-6 py-3 rounded"
  >
    {loading ? "Saving..." : editingId ? "Update Entry" :  "Save Entry"}
  </button>
</div>

       <div className="grid md:grid-cols-2 gap-6 mt-8">

  {/* Credit Side */}

  <div className="bg-white p-6 rounded-xl shadow">
    <h2 className="text-2xl font-bold text-green-600 mb-4">
      Credit
    </h2>

    <table className="w-full">
      <thead>
        <tr className="border-b">
          <th className="text-left p-2">Date</th>
          <th className="text-left p-2">Description</th>
            <th className="text-left p-2">Amount</th>
          
          <th className="text-left p-2">Action</th>
        </tr>
      </thead>

      <tbody>
        {creditTransactions.map((item) => (
          <tr key={item._id} className="border-b">
            <td className="p-2">
              {new Date(item.date).toLocaleDateString("en-IN")}
            </td>
 <td className="p-2">
              {item.description}
            </td>
            <td className="p-2">
              ₹{item.amount}
            </td>

           

          <td className="p-2">
  <div className="flex gap-2">
    <button
      onClick={() => handleEdit(item)}
      className="bg-blue-500 text-white px-3 py-1 rounded"
    >
      Edit
    </button>

    <button
      onClick={() => handleDelete(item._id)}
      className="bg-red-500 text-white px-3 py-1 rounded"
    >
      Delete
    </button>
  </div>
</td>

          </tr>
        ))}
      </tbody>
    </table>
    
    <div className="mt-4 font-bold text-green-600">
  Total Credit: ₹{ledgerSummary.totalCredit}
</div>
  </div>

  {/* Debit Side */}

  <div className="bg-white p-6 rounded-xl shadow">
    <h2 className="text-2xl font-bold text-red-600 mb-4">
      Debit
    </h2>

    <table className="w-full">
      <thead>
        <tr className="border-b">
          <th className="text-left p-2">Date</th>
          <th className="text-left p-2">Description</th>
            <th className="text-left p-2">Amount</th>
          
          <th className="text-left p-2">Action</th>
        </tr>
      </thead>

      <tbody>
        {debitTransactions.map((item) => (
          <tr key={item._id} className="border-b">
            <td className="p-2">
              {new Date(item.date).toLocaleDateString("en-IN")}
            </td>
             <td className="p-2">
              {item.description}
            </td>
            <td className="p-2">
              ₹{item.amount}
            </td>

           

            <td className="p-2">
  <div className="flex gap-2">
    <button
      onClick={() => handleEdit(item)}
      className="bg-blue-500 text-white px-3 py-1 rounded"
    >
      Edit
    </button>

    <button
      onClick={() => handleDelete(item._id)}
      className="bg-red-500 text-white px-3 py-1 rounded"
    >
      Delete
    </button>
  </div>
</td>
          </tr>
        ))}
      </tbody>
    </table>
    <div className="mt-4 font-bold text-red-600">
  Total Debit: ₹{ledgerSummary.totalDebit}
</div>
  </div>

</div> 

    </div>
    {showEditModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

    <div className="bg-white p-6 rounded-xl w-full max-w-md">

      <h2 className="text-2xl font-bold mb-4">
        Edit Entry
      </h2>

      <select
        value={form.type}
        onChange={(e) =>
          setForm({ ...form, type: e.target.value })
        }
        className="border p-3 rounded w-full mb-3"
      >
        <option value="credit">Credit</option>
        <option value="debit">Debit</option>
      </select>

      <input
        type="number"
        value={form.amount}
        onChange={(e) =>
          setForm({ ...form, amount: e.target.value })
        }
        className="border p-3 rounded w-full mb-3"
      />

      <input
        type="date"
        value={form.date}
        onChange={(e) =>
          setForm({ ...form, date: e.target.value })
        }
        className="border p-3 rounded w-full mb-3"
      />

      <input
        type="text"
        value={form.description}
        onChange={(e) =>
          setForm({
            ...form,
            description: e.target.value,
          })
        }
        className="border p-3 rounded w-full mb-4"
      />

      <div className="flex gap-3 justify-end">

        <button
          onClick={() => {
            setShowEditModal(false);
            setEditingId(null);
          }}
          className="bg-gray-500 text-white px-4 py-2 rounded"
        >
          Cancel
        </button>

        <button
          onClick={handleSave}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Update
        </button>

      </div>

    </div>
  </div>
)}
</>
  );
}

export default Dashboard;
