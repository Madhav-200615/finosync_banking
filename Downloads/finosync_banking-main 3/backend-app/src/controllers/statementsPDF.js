const PDFDocument = require("pdfkit");
const Transaction = require("../models/Transaction");

exports.exportStatementsPDF = async (req, res) => {
  try {
    const userId = req.user.id;

    const tx = await Transaction.find({ user: userId }).sort({
      createdAt: 1,
    });

    if (tx.length === 0)
      return res.status(400).json({ error: "No transactions found" });

    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="monthly_statements.pdf"'
    );

    doc.pipe(res);

    doc.fontSize(22).text("Monthly Statements", { align: "center" });
    doc.moveDown(1);

    let currentMonth = "";

    tx.forEach((t) => {
      const date = new Date(t.createdAt);
      const monthName = date.toLocaleString("default", {
        month: "long",
        year: "numeric",
      });

      if (monthName !== currentMonth) {
        currentMonth = monthName;

        doc.moveDown(1);
        doc.fontSize(16).text(monthName, { underline: true });
      }

      doc.fontSize(12).text(
        `${date.toLocaleDateString()} — ${t.type.toUpperCase()} — ₹${
          t.amount
        } — ${t.description}`
      );
    });

    doc.end();
  } catch (err) {
    console.error("PDF EXPORT ERROR:", err);
    res.status(500).json({ error: "Failed to export PDF" });
  }
};
