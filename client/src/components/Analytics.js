import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut, Line, Bar } from 'react-chartjs-2';
import '../styles/Analytics.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const defaultAnalyticsData = {
  spendingByCategory: [],
  spendingTrend: [],
  topExpenses: [],
  summary: {
    totalSpent: 0,
    averageTransaction: 0,
    totalTransactions: 0,
    savingsRate: 0
  }
};

const Analytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('month');
  const [analyticsData, setAnalyticsData] = useState(defaultAnalyticsData);
  const doughnutRef = useRef();
  const lineRef = useRef();
  const barRef = useRef();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(`/api/transactions/analytics?timeRange=${timeRange}`);
        
        // Validate and sanitize the response data
        const data = response.data || defaultAnalyticsData;
        setAnalyticsData({
          spendingByCategory: Array.isArray(data.spendingByCategory) ? data.spendingByCategory : [],
          spendingTrend: Array.isArray(data.spendingTrend) ? data.spendingTrend : [],
          topExpenses: Array.isArray(data.topExpenses) ? data.topExpenses : [],
          summary: {
            totalSpent: Number(data.summary?.totalSpent) || 0,
            averageTransaction: Number(data.summary?.averageTransaction) || 0,
            totalTransactions: Number(data.summary?.totalTransactions) || 0,
            savingsRate: Number(data.summary?.savingsRate) || 0
          }
        });
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError('Failed to load analytics data. Please try again later.');
        setAnalyticsData(defaultAnalyticsData);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeRange]);

  useEffect(() => {
    // Helper to observe and resize chart on container resize
    function observeResize(containerSelector, chartRef) {
      const container = document.querySelector(containerSelector);
      if (!container || !chartRef.current) return;
      const ro = new window.ResizeObserver(() => {
        if (chartRef.current && chartRef.current.resize) {
          chartRef.current.resize();
        }
      });
      ro.observe(container);
      return ro;
    }
    const ros = [
      observeResize('.charts-grid .chart-card:nth-child(1) .chart-container', doughnutRef),
      observeResize('.charts-grid .chart-card:nth-child(2) .chart-container', lineRef),
      observeResize('.charts-grid .chart-card:nth-child(3) .chart-container', barRef)
    ];
    return () => ros.forEach(ro => ro && ro.disconnect());
  }, [analyticsData, timeRange]);

  const categoryData = {
    labels: analyticsData.spendingByCategory.map(item => item.category || ''),
    datasets: [{
      data: analyticsData.spendingByCategory.map(item => Number(item.amount) || 0),
      backgroundColor: [
        '#FF6384',
        '#36A2EB',
        '#FFCE56',
        '#4BC0C0',
        '#9966FF',
        '#FF9F40'
      ],
      borderWidth: 1
    }]
  };

  const trendData = {
    labels: analyticsData.spendingTrend.map(item => item.date || ''),
    datasets: [{
      label: 'Daily Spending',
      data: analyticsData.spendingTrend.map(item => Number(item.amount) || 0),
      borderColor: '#4a90e2',
      tension: 0.4,
      fill: false
    }]
  };

  const topExpensesData = {
    labels: analyticsData.topExpenses.map(item => item.description || ''),
    datasets: [{
      label: 'Amount',
      data: analyticsData.topExpenses.map(item => Number(item.amount) || 0),
      backgroundColor: '#4a90e2'
    }]
  };

  if (loading) {
    return (
      <div className="analytics-container">
        <div className="loading">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="main-page-wrap">
      <svg className="main-side-svg left" width="120" height="320" viewBox="0 0 120 320" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="60" cy="160" rx="60" ry="160" fill="#e3eafc" fillOpacity="0.35"/>
      </svg>
      <svg className="main-side-svg right" width="120" height="320" viewBox="0 0 120 320" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="60" cy="160" rx="60" ry="160" fill="#b6d0ff" fillOpacity="0.25"/>
      </svg>
      <div className="analytics-container">
        <div className="analytics-header">
          <h1>Spending Analytics</h1>
          <div className="time-range-selector">
            <button
              className={timeRange === 'week' ? 'active' : ''}
              onClick={() => setTimeRange('week')}
            >
              Week
            </button>
            <button
              className={timeRange === 'month' ? 'active' : ''}
              onClick={() => setTimeRange('month')}
            >
              Month
            </button>
            <button
              className={timeRange === 'year' ? 'active' : ''}
              onClick={() => setTimeRange('year')}
            >
              Year
            </button>
          </div>
        </div>

        <div className="summary-cards">
          <div className="summary-card">
            <h3>Total Spent</h3>
            <p>${analyticsData.summary.totalSpent.toFixed(2)}</p>
          </div>
          <div className="summary-card">
            <h3>Average Transaction</h3>
            <p>${analyticsData.summary.averageTransaction.toFixed(2)}</p>
          </div>
          <div className="summary-card">
            <h3>Total Transactions</h3>
            <p>{analyticsData.summary.totalTransactions}</p>
          </div>
          <div className="summary-card">
            <h3>Savings Rate</h3>
            <p>{analyticsData.summary.savingsRate.toFixed(1)}%</p>
          </div>
        </div>

        <div className="charts-grid">
          <div className="chart-card">
            <h3>Spending by Category</h3>
            <div className="chart-container">
              <Doughnut ref={doughnutRef} data={categoryData} options={{ maintainAspectRatio: false, responsive: true }} />
            </div>
          </div>
          <div className="chart-card">
            <h3>Spending Trend</h3>
            <div className="chart-container">
              <Line ref={lineRef} data={trendData} options={{ maintainAspectRatio: false, responsive: true }} />
            </div>
          </div>
          <div className="chart-card">
            <h3>Top Expenses</h3>
            <div className="chart-container">
              <Bar ref={barRef} data={topExpensesData} options={{ maintainAspectRatio: false, responsive: true }} />
            </div>
          </div>
        </div>

        <div className="top-expenses">
          <h3>Recent Large Expenses</h3>
          {analyticsData.topExpenses.length > 0 ? (
            <div className="expenses-list">
              {analyticsData.topExpenses.map((expense, index) => (
                <div key={index} className="expense-item">
                  <div className="expense-info">
                    <span className="expense-description">{expense.description || 'No description'}</span>
                    <span className="expense-date">{expense.date || 'No date'}</span>
                  </div>
                  <span className="expense-amount">${Number(expense.amount || 0).toFixed(2)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">No recent expenses to display</p>
          )}
        </div>
      </div>
      <svg className="main-bg-svg bottom-fixed" width="100%" height="120" viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,80 C480,160 960,0 1440,80 L1440,120 L0,120 Z" fill="#e3eafc"/>
      </svg>
    </div>
  );
};

export default Analytics; 