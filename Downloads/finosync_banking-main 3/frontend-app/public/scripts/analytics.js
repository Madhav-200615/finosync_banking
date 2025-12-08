// 🟦 Dummy data (you can replace with backend API later)
const credit = 12000;
const debit = 8000;

const categoryLabels = ["FD", "Shopping", "Food", "Bills"];
const categoryValues = [2000, 5000, 1500, 1000];

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
const monthlyFlow = [5000, 6500, 4000, 7000, 6000, 7500];

// ------------------ CREDIT vs DEBIT PIE ------------------
new Chart(document.getElementById("creditDebitChart"), {
    type: "pie",
    data: {
        labels: ["Credit", "Debit"],
        datasets: [{
            data: [credit, debit],
            backgroundColor: ["#4CAF50", "#FF5252"]
        }]
    }
});

// ------------------ CATEGORY BAR ------------------
new Chart(document.getElementById("categoryChart"), {
    type: "bar",
    data: {
        labels: categoryLabels,
        datasets: [{
            label: "Amount Spent",
            data: categoryValues,
            backgroundColor: "#4287f5"
        }]
    }
});

// ------------------ MONTHLY FLOW LINE ------------------
new Chart(document.getElementById("monthlyFlowChart"), {
    type: "line",
    data: {
        labels: months,
        datasets: [{
            label: "Monthly Flow",
            data: monthlyFlow,
            borderWidth: 2
        }]
    }
});
