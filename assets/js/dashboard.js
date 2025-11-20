const BASE_URL = "https://affiliates-measured-needed-every.trycloudflare.com";

document.addEventListener("DOMContentLoaded", function() {
  async function getUserInfo() {
    try {
      const response = await fetch(`${BASE_URL}/me`, { credentials: "include" });
      if (response.ok) {
        const user = await response.json();
        document.getElementById("welcome").innerText = `Welcome, ${user.name || "User"}!`;
        document.getElementById("role").innerText = `Role: ${user.role || "guest"}`;
      }
      if (user.role === "secretary" || user.role === "treasurer") {
            document.getElementById("admin-panel").style.display = "block";
        }
    } catch (err){
      console.log("Error loading user", err);
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

