const BASE_URL = "https://described-occasionally-break-group.trycloudflare.com";

document.addEventListener("DOMContentLoaded", function() {
  const adminRoles = ["secretary", "treasurer"];
  let userRole = "guest";

  async function getUserInfo() {
    try {
      const response = await fetch(`${BASE_URL}/me`, { credentials: "include" });
      if (response.ok) {
        const user = await response.json();
        userRole = user.role || "guest";
        document.getElementById("welcome").innerText = `Welcome, ${user.name || "User"}!`;
        document.getElementById("role").innerText = `Role: ${userRole}`;
        applyRoleVisibility();
      } else {
        console.log("Failed to fetch user info");
      }
    } catch (err) {
      console.log("Error loading user", err);
    }
  }

  function applyRoleVisibility() {
    const adminPanel = document.getElementById("admin-panel");
    if (adminPanel) {
      if (adminRoles.includes(userRole)) {
        adminPanel.classList.remove("hidden");
      } else {
        adminPanel.classList.add("hidden");
      }
    }
  }

  getUserInfo();

  // Navigation for Expenses and Income
  const expensesBtn = document.querySelector("a[href='/expense.html']");
  const incomeBtn = document.querySelector("a[href='/income.html']");
  if (expensesBtn) {
    expensesBtn.onclick = function(e) {
      e.preventDefault();
      window.location.href = "/expense.html";
    };
  }
  if (incomeBtn) {
    incomeBtn.onclick = function(e) {
      e.preventDefault();
      window.location.href = "/income.html";
    };
  }

  document.getElementById('logoutBtn').onclick = async function() {
      await fetch('https://calls-blend-prayer-pour.trycloudflare.com/auth/logout', { method: 'POST', credentials: 'include' });
      window.location.href = '/';
  };
});


