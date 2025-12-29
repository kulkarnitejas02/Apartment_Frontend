let currentYear = 2025;
let selectedMonth = null;
let username = null;
let role = "guest";
const BASE_URL = "https://tear-luggage-invitations-bytes.trycloudflare.com";

const months = ["January", "February", "March", "April", "May", "June",
               "July", "August", "September", "October", "November", "December"];

// Fetch user info first
async function getUserInfo() {
    try {
        const response = await fetch(`${BASE_URL}/me`, { 
            credentials: "include" 
        });
        if (response.ok) {
            const user = await response.json();
            username = user.username;
            role = user.role || "guest";
            console.log("User loaded:", username, role);
            return true;
        } else {
            console.error("Failed to fetch user info");
            return false;
        }
    } catch (error) {
        console.error("Error fetching user info:", error);
        return false;
    }
}

document.addEventListener("DOMContentLoaded", async function() {
    // Get user info first, then load data
    const userLoaded = await getUserInfo();
    if (userLoaded) {
        loadYearSummaryExpense();
    } else {
        alert("Please login first");
        window.location.href = "/index.html";
    }
});

async function loadYearSummaryExpense() {
    currentYear = document.getElementById('yearSelect').value;

    try {
        const response = await fetch(`${BASE_URL}/expense_records/?username=${encodeURIComponent(username)}&year=${currentYear}`, {
            method: 'GET',
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            displaySummaryExpense(data);
        } else {
            console.error('Failed to load summary data');
            alert('Failed to load summary data. Please try again.');
        }
    } catch (error) {
        console.error('Error loading summary:', error);
        alert('Error loading summary data. Please check your connection.');
    }
}

function displaySummaryExpense(data) {
    // Update summary cards
    document.getElementById('yearlyTotalExpense').textContent = `₹${data.yearly_total.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
    document.getElementById('yearlyCountExpense').textContent = `${data.yearly_count} records`;

    // Reset monthly total
    document.getElementById('monthlyTotalExpense').textContent = '₹0';
    document.getElementById('monthlyCountExpense').textContent = 'Click a month to view';   

    // Create monthly grid
    const monthlyGrid = document.getElementById('monthlyGridExpense');
    monthlyGrid.innerHTML = '';

    months.forEach(month => {
        const monthData = data.monthly_summary[month];
        const monthCard = document.createElement('div');
        monthCard.className = 'month-card';
        monthCard.onclick = () => selectMonthExpense(month, monthData.total, monthData.count);

        monthCard.innerHTML = `
            <h3>${month}</h3>
            <p>Total: ₹${monthData.total.toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
            <p>Count: ${monthData.count} records</p>
        `;
        monthlyGrid.appendChild(monthCard);
    });
}

async function selectMonthExpense(month, monthTotal, count) {
    selectedMonth = month;

    // Update UI
    document.querySelectorAll('.month-card').forEach(card => {
        card.classList.remove('selected-month');
    });
    event.target.closest('.month-card').classList.add('selected-month');

    // Update month total
    document.getElementById('monthlyTotalExpense').textContent = `₹${monthTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
    document.getElementById('monthlyCountExpense').textContent = `${count} records`;
    
    // Load detailed expense records for the selected month
    try {
        const response = await fetch(`${BASE_URL}/expense_records/?username=${encodeURIComponent(username)}&year=${currentYear}&month=${month}`, {
            method: 'GET',
            credentials: 'include'
        });
        if (response.ok) {
            const data = await response.json();
            displayExpenseMonthRecords(data.month_records, data.month_total);
        } else {
            console.error('Failed to load monthly records');
            alert('Failed to load monthly records. Please try again.');
        }
    } catch (error) {
        console.error('Error loading monthly records:', error);
        alert('Error loading monthly records. Please check your connection.');
    }
}

function displayExpenseMonthRecords(records, monthTotal) {
    const recordsSection = document.getElementById('expenseRecordsSection');
    const recordsTitle = document.getElementById('expenseRecordsTitle');
    const tableBody = document.getElementById('expenseRecordsTableBody');

    // Update title
    recordsTitle.textContent = `Records for ${selectedMonth} ${currentYear}`;
    recordsSection.style.display = 'block';
    
    // Clear previous records
    tableBody.innerHTML = '';

    if (records.length === 0) {
        const noDataRow = document.createElement('tr');
        noDataRow.innerHTML = `
            <td colspan="5" style="text-align: center; color: #6c757d; font-style: italic;">
                No records found for ${selectedMonth} ${currentYear}
            </td>
        `;
        tableBody.appendChild(noDataRow);
        return;
    }

    // Populate table with new records
    records.forEach(record => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${record.date}</td>
            <td>${record.expense_name}</td>
            <td>${record.description}</td>
            <td>₹${record.amount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
            <td>${record.created_by}</td>
        `;
        tableBody.appendChild(row);
    });

    // Add total row
    const totalRow = document.createElement('tr');
    totalRow.className = 'total-row';
    totalRow.innerHTML = `
        <td colspan="3"><strong>📊 TOTAL</strong></td>
        <td><strong>₹${monthTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</strong></td>
        <td><strong>${records.length} records</strong></td>
    `;
    tableBody.appendChild(totalRow);
    
    recordsSection.style.display = 'block';
    recordsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function applyRoleVisibility() {
    const adminPanel = document.getElementById("admin-panel");
    if (adminPanel) {
        const adminRoles = ["secretary", "treasurer"];
        if (adminRoles.includes(role)) {
            adminPanel.classList.remove("hidden");
        } else {
            adminPanel.classList.add("hidden");
        }
    }
}
