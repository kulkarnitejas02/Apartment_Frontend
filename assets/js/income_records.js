let currentYear = 2025;
let selectedMonth = null;
let username = null;
let role = "guest";
const BASE_URL = "https://fame-street-florida-specification.trycloudflare.com";

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
            
            // Update the user info display
            const userInfoElement = document.getElementById('userInfo');
            if (userInfoElement) {
                const roleCapitalized = role.charAt(0).toUpperCase() + role.slice(1);
                userInfoElement.innerHTML = `Welcome, <strong>${user.name}</strong> (${roleCapitalized})`;
            }
            
            console.log("User info loaded:", username, role);
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

// Make this function global
window.loadYearSummary = async function() {
    currentYear = document.getElementById('yearSelect').value;
    
    if (!username) {
        alert("User not loaded. Please refresh the page.");
        return;
    }
    
    try {
        const response = await fetch(`${BASE_URL}/income_records/?username=${encodeURIComponent(username)}&year=${currentYear}`, {
            method: 'GET',
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            displaySummary(data);
        } else {
            console.error('Failed to load summary data');
            alert('Failed to load summary data. Please try again.');
        }
    } catch (error) {
        console.error('Error loading summary:', error);
        alert('Error loading summary data. Please check your connection.');
    }
}

function displaySummary(data) {
    // Update summary cards
    document.getElementById('yearlyTotal').textContent = `₹${data.yearly_total.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
    document.getElementById('yearlyCount').textContent = `${data.yearly_count} records`;
    
    // Reset monthly total
    document.getElementById('monthlyTotal').textContent = '₹0';
    document.getElementById('monthlyCount').textContent = 'Click a month to view';
    
    // Create monthly grid
    const monthlyGrid = document.getElementById('monthlyGrid');
    monthlyGrid.innerHTML = '';
    
    months.forEach(month => {
        const monthData = data.monthly_summary[month];
        const monthCard = document.createElement('div');
        monthCard.className = 'month-card';
        
        // Pass event properly
        monthCard.onclick = function(e) {
            selectMonth(month, monthData.total, monthData.count, e);
        };
        
        monthCard.innerHTML = `
            <div class="month-name">${month}</div>
            <div class="month-amount">₹${monthData.total.toLocaleString('en-IN')}</div>
            <small>${monthData.count} records</small>
        `;
        
        monthlyGrid.appendChild(monthCard);
    });
    
    // Hide records section when year changes
    document.getElementById('recordsSection').style.display = 'none';
    selectedMonth = null;
}

async function selectMonth(month, monthTotal, recordCount, event) {
    selectedMonth = month;
    
    console.log("=== SELECT MONTH DEBUG ===");
    console.log("Month:", month);
    console.log("Month Total:", monthTotal);
    console.log("Record Count:", recordCount);
    
    // Update UI - highlight selected month
    document.querySelectorAll('.month-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Highlight clicked card
    if (event && event.target) {
        const clickedCard = event.target.closest('.month-card');
        if (clickedCard) {
            clickedCard.classList.add('selected');
            console.log("Card highlighted");
        }
    }
    
    // Update month total display
    const monthlyTotalElement = document.getElementById('monthlyTotal');
    const monthlyCountElement = document.getElementById('monthlyCount');
    
    if (monthlyTotalElement) {
        const formattedTotal = `₹${monthTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
        monthlyTotalElement.textContent = formattedTotal;
        console.log("Updated monthlyTotal to:", formattedTotal);
    } else {
        console.error("ERROR: monthlyTotal element not found!");
    }
    
    if (monthlyCountElement) {
        const countText = `${recordCount} records`;
        monthlyCountElement.textContent = countText;
        console.log("Updated monthlyCount to:", countText);
    } else {
        console.error("ERROR: monthlyCount element not found!");
    }
    
    // Load detailed records
    try {
        const url = `${BASE_URL}/income_records/?username=${encodeURIComponent(username)}&year=${currentYear}&month=${month}`;
        console.log("Fetching URL:", url);
        
        const response = await fetch(url, {
            method: 'GET',
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log("Month data received:", data);
            displayMonthRecords(data.month_records, data.month_total);
        } else {
            console.error('Failed to load month records. Status:', response.status);
            alert('Failed to load month records. Please try again.');
        }
    } catch (error) {
        console.error('Error loading month records:', error);
        alert('Error loading month records. Please check your connection.');
    }
    
    console.log("=== END SELECT MONTH DEBUG ===");
}

function displayMonthRecords(records, total) {
    const recordsSection = document.getElementById('recordsSection');
    const recordsTitle = document.getElementById('recordsTitle');
    const tableBody = document.getElementById('recordsTableBody');
    
    recordsTitle.textContent = `📋 Records for ${selectedMonth} ${currentYear}`;
    recordsSection.style.display = 'block';
    
    // Clear existing rows
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
    
    // Add record rows
    records.forEach(record => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${new Date(record.date).toLocaleDateString('en-IN')}</td>
            <td>${record.owner_name || 'N/A'}</td>
            <td>${record.paid_by}</td>
            <td>₹${record.amount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
            <td>User ID: ${record.created_by}</td>
        `;
        tableBody.appendChild(row);
    });
    
    // Add total row
    const totalRow = document.createElement('tr');
    totalRow.className = 'total-row';
    totalRow.innerHTML = `
        <td colspan="3"><strong>📊 TOTAL</strong></td>
        <td><strong>₹${total.toLocaleString('en-IN', {minimumFractionDigits: 2})}</strong></td>
        <td><strong>${records.length} records</strong></td>
    `;
    tableBody.appendChild(totalRow);
    
    // Scroll to records section
    recordsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", async function() {
    const userLoaded = await getUserInfo();
    if (userLoaded) {
        loadYearSummary();
    } else {
        alert("Please login first");
        window.location.href = "/index.html";
    }
});
