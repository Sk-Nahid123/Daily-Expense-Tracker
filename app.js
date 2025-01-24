class ExpenseTracker {
    constructor() {
        this.expenses = [];
        this.budget = 0;
        this.categories = [
            'Food', 'Transport', 'Entertainment', 'Utilities', 
            'Housing', 'Healthcare', 'Personal Care', 
            'Education', 'Shopping', 'Gifts', 'Investments', 'Other'
        ];
        this.colors = [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
            '#9966FF', '#FF9F40', '#FF5733', '#33FF57', 
            '#3357FF', '#FF33F1', '#33FFF1', '#F1FF33'
        ];
        this.charts = {};
        this.initEventListeners();
    }

    initEventListeners() {
        document.getElementById('add-expense-btn').addEventListener('click', () => this.addExpense());
        document.getElementById('monthly-budget').addEventListener('change', () => this.setBudget());
        document.getElementById('toggle-analytics-btn').addEventListener('click', () => this.toggleAnalytics());
        this.populateCategoryDropdown();
    }

    toggleAnalytics() {
        const analyticsSection = document.getElementById('analytics');
        const toggleButton = document.getElementById('toggle-analytics-btn');

        if (analyticsSection.classList.contains('hidden')) {
            analyticsSection.classList.remove('hidden');
            toggleButton.textContent = 'Hide Analytics';
            this.updateCharts();
        } else {
            analyticsSection.classList.add('hidden');
            toggleButton.textContent = 'Show Analytics';
        }
    }

    populateCategoryDropdown() {
        const categorySelect = document.getElementById('expense-category');
        categorySelect.innerHTML = '<option value="">Select Category</option>';
        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.toLowerCase();
            option.textContent = category;
            categorySelect.appendChild(option);
        });
    }

    addExpense() {
        const category = this.capitalizeFirstLetter(document.getElementById('expense-category').value);
        const amount = parseFloat(document.getElementById('expense-amount').value);
        const date = document.getElementById('expense-date').value;
        const description = document.getElementById('expense-description').value;

        if (category && amount && date) {
            const expense = { category, amount, date, description };
            this.expenses.push(expense);
            this.renderExpenses();
            this.updateBudgetProgress();
            this.updateCharts();
            this.clearExpenseForm();
        }
    }

    renderExpenses() {
        const container = document.getElementById('expense-container');
        container.innerHTML = '';
        this.expenses.slice(-5).reverse().forEach(expense => {
            const expenseElement = document.createElement('div');
            expenseElement.classList.add('expense-item');
            expenseElement.innerHTML = `
                <span>${expense.category}</span>
                <span>$${expense.amount.toFixed(2)}</span>
                <span>${expense.date}</span>
            `;
            container.appendChild(expenseElement);
        });
    }

    setBudget() {
        this.budget = parseFloat(document.getElementById('monthly-budget').value);
        this.updateBudgetProgress();
    }

    updateBudgetProgress() {
        const totalExpenses = this.expenses.reduce((sum, expense) => sum + expense.amount, 0);
        const progressBar = document.getElementById('budget-bar');
        const remainingBudget = document.getElementById('remaining-budget');
        
        const percentage = this.budget > 0 ? (totalExpenses / this.budget) * 100 : 0;
        progressBar.style.width = `${Math.min(percentage, 100)}%`;
        
        const remaining = Math.max(this.budget - totalExpenses, 0);
        remainingBudget.textContent = `Remaining: $${remaining.toFixed(2)}`;
        
        // Change color based on budget usage
        progressBar.style.backgroundColor = 
            percentage < 50 ? '#2ecc71' :  // Green
            percentage < 75 ? '#f39c12' :  // Yellow
            '#e74c3c';  // Red
    }

    updateCharts() {
        if (this.expenses.length > 0) {
            this.createPieChart();
            this.createBarChart();
        }
    }

    createPieChart() {
        const ctx = document.getElementById('pie-chart').getContext('2d');
        
        // Initialize categories with zero amounts
        const categoriesData = this.categories.reduce((acc, category) => {
            acc[category] = 0;
            return acc;
        }, {});

        // Sum expenses by category
        this.expenses.forEach(expense => {
            categoriesData[expense.category] += expense.amount;
        });

        // Prepare data for chart
        const chartData = {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: []
            }]
        };

        this.categories.forEach((category, index) => {
            // Include all categories
            chartData.labels.push(category);
            chartData.datasets[0].data.push(categoriesData[category]);
            chartData.datasets[0].backgroundColor.push(this.colors[index % this.colors.length]);
        });

        // Destroy existing chart if it exists
        if (this.charts.pieChart) {
            this.charts.pieChart.destroy();
        }

        // Create new pie chart
        this.charts.pieChart = new Chart(ctx, {
            type: 'pie',
            data: chartData,
            options: {
                responsive: true,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `$${value.toFixed(2)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    createBarChart() {
        const ctx = document.getElementById('bar-chart').getContext('2d');
        const monthlyExpenses = {};
        
        // Group expenses by month
        this.expenses.forEach(expense => {
            const date = new Date(expense.date);
            const month = date.toLocaleString('default', { month: 'short', year: 'numeric' });
            monthlyExpenses[month] = (monthlyExpenses[month] || 0) + expense.amount;
        });

        // Sort months chronologically
        const sortedMonths = Object.keys(monthlyExpenses).sort((a, b) => 
            new Date(a) - new Date(b)
        );

        // Destroy existing chart if it exists
        if (this.charts.barChart) {
            this.charts.barChart.destroy();
        }

        // Create new bar chart
        this.charts.barChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sortedMonths,
                datasets: [{
                    label: 'Monthly Expenses',
                    data: sortedMonths.map(month => monthlyExpenses[month]),
                    backgroundColor: '#36A2EB'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Amount ($)'
                        }
                    }
                }
            }
        });
    }

    capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    clearExpenseForm() {
        document.getElementById('expense-category').value = '';
        document.getElementById('expense-amount').value = '';
        document.getElementById('expense-date').value = '';
        document.getElementById('expense-description').value = '';
    }
}

// Initialize the expense tracker when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ExpenseTracker();
});