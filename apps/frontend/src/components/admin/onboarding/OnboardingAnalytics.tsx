import {
  AlertCircle,
  BarChart2,
  Calendar,
  Clock,
  Download,
  MoreVertical,
  RefreshCw,
  TrendingUp,
  Users,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import { OnboardingAdminService } from '../../../services/onboarding-admin.service';

interface OnboardingAnalyticsProps {}

export const OnboardingAnalytics: React.FC<OnboardingAnalyticsProps> = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [dateRange, setDateRange] = useState('last30days');
  const [comparisonPeriod, setComparisonPeriod] = useState('previous');

  // Chart colors
  const COLORS = ['#3182CE', '#4FD1C5', '#F6AD55', '#F56565', '#9F7AEA', '#ED64A6'];

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await OnboardingAdminService.getAnalytics();
        setAnalytics(data);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError('Failed to load analytics data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [dateRange]);

  // Handle refresh
  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await OnboardingAdminService.getAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error('Error refreshing analytics:', err);
      setError('Failed to refresh analytics data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle export
  const handleExport = () => {
    if (!analytics) return;
    const dataStr = JSON.stringify(analytics, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `onboarding-analytics-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const dailyCompletionData = Array.isArray(analytics?.dailyCompletionData)
    ? analytics.dailyCompletionData
    : [];

  const stepCompletionData = Array.isArray(analytics?.stepCompletionData)
    ? analytics.stepCompletionData
    : Array.isArray(analytics?.stepCompletion)
      ? analytics.stepCompletion
      : [];

  const userTypeData = Array.isArray(analytics?.userTypeDistribution)
    ? analytics.userTypeDistribution
    : [];

  const dropOffPoints = Array.isArray(analytics?.dropOffPoints) ? analytics.dropOffPoints : [];

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Onboarding Analytics
        </h2>
        <div className="flex items-center space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-transparent dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            aria-label="Select date range"
          >
            <option value="last7days">Last 7 Days</option>
            <option value="last30days">Last 30 Days</option>
            <option value="last90days">Last 90 Days</option>
            <option value="thisYear">This Year</option>
            <option value="allTime">All Time</option>
          </select>

          <select
            value={comparisonPeriod}
            onChange={(e) => setComparisonPeriod(e.target.value)}
            className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-transparent dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            aria-label="Select comparison period"
          >
            <option value="previous">vs. Previous Period</option>
            <option value="lastYear">vs. Last Year</option>
            <option value="none">No Comparison</option>
          </select>

          <div className="relative group">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-2 text-muted-foreground dark:text-muted-foreground hover:text-gray-900 dark:hover:text-white hover:bg-muted/30 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50"
              title="Refresh data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="relative group">
            <button className="p-2 text-muted-foreground dark:text-muted-foreground hover:text-gray-900 dark:hover:text-white hover:bg-muted/30 dark:hover:bg-gray-700 rounded-md transition-colors">
              <MoreVertical className="w-4 h-4" />
            </button>
            <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button
                onClick={handleExport}
                className="flex items-center w-full px-4 py-2 text-sm text-foreground dark:text-gray-300 hover:bg-muted/30 dark:hover:bg-gray-700 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </button>
              <button className="flex items-center w-full px-4 py-2 text-sm text-foreground dark:text-gray-300 hover:bg-muted/30 dark:hover:bg-gray-700 transition-colors">
                <Calendar className="w-4 h-4 mr-2" />
                Custom Date Range
              </button>
              <button className="flex items-center w-full px-4 py-2 text-sm text-foreground dark:text-gray-300 hover:bg-muted/30 dark:hover:bg-gray-700 transition-colors">
                <BarChart2 className="w-4 h-4 mr-2" />
                Advanced Analytics
              </button>
            </div>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-muted-foreground dark:text-muted-foreground">
            Loading analytics data...
          </p>
        </div>
      )}

      {error && !isLoading && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Error Loading Analytics
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
            </div>
            <button
              onClick={handleRefresh}
              className="ml-3 px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {!isLoading && !error && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-transparent dark:bg-transparent border border-gray-200 dark:border-gray-700 rounded-md p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Completion Rate
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {analytics ? `${(analytics.completionRate * 100).toFixed(1)}%` : '—'}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400 flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    5.2% vs. previous period
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Avg. Time to Complete
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {analytics
                      ? `${Math.floor(analytics.averageTimeSpent / 60)}m ${analytics.averageTimeSpent % 60}s`
                      : '—'}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400 flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1 rotate-180" />
                    30s vs. previous period
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Onboardings
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {analytics ? analytics.totalOnboardings : '—'}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400 flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    12.5% vs. previous period
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Completed Onboardings
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {analytics ? analytics.completedOnboardings : '—'}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400 flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    18.3% vs. previous period
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Daily Completions Chart */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="p-6 pb-0">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Daily Onboarding Activity
                </h3>
              </div>
              <div className="p-4">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={dailyCompletionData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="starts"
                        stroke="#3182CE"
                        name="Started"
                        activeDot={{ r: 8 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="completions"
                        stroke="#4FD1C5"
                        name="Completed"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* User Type Distribution Chart */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="p-6 pb-0">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  User Type Distribution
                </h3>
              </div>
              <div className="p-4">
                <div className="h-80">
                  {userTypeData.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                      No user type distribution data available.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={userTypeData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="count"
                          nameKey="type"
                          label={({ name, percent }) =>
                            `${String(name)}: ${((percent || 0) * 100).toFixed(0)}%`
                          }
                        >
                          {userTypeData.map((_entry: unknown, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Step Completion Chart */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="p-6 pb-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Step Completion Rates
              </h3>
            </div>
            <div className="p-4">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stepCompletionData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="completion" name="Completion Rate" fill="#3182CE" />
                    <Bar dataKey="dropoff" name="Drop-off Rate" fill="#F56565" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Drop-off Points Table */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="p-6 pb-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Drop-off Points
              </h3>
            </div>
            <div className="p-4">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border/50 dark:divide-border/40">
                  <thead className="bg-transparent dark:bg-transparent">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Step
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Drop-off Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Users
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Trend
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {dropOffPoints.length > 0 ? (
                      dropOffPoints.map((point: any, index: number) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {point.step}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {(point.rate * 100).toFixed(1)}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {Math.round(point.rate * (analytics.totalOnboardings || 198))}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center text-gray-600 dark:text-gray-300">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              {typeof point.trend === 'number'
                                ? `${point.trend.toFixed(1)}%`
                                : 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            <button
                              className="px-3 py-1 text-sm border border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                              aria-label="Analyze drop-off point"
                              title="Analyze drop-off point"
                            >
                              Analyze
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                        >
                          No drop-off analytics available for the selected range.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="p-6 pb-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recommendations
              </h3>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="text-blue-500 mt-1">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      Simplify the Profile step
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      This step has the highest drop-off rate. Consider reducing the number of
                      required fields.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="text-blue-500 mt-1">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      Optimize for AI Agents
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      AI Agents have a lower completion rate. Consider creating a more streamlined
                      flow for them.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="text-blue-500 mt-1">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      Reduce time spent on AI Preferences
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Users spend an average of 90 seconds on this step, which is higher than other
                      steps.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
