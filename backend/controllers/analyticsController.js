const db = require('../db-supabase');

const getOverview = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Fetch raw stats and recent messages from the database
        const { stats, recentMessages } = await db.getAnalyticsStats(userId);

        // Process recent messages to create the last 7 days chart data
        // Initialize last 7 days with 0 counts
        const last7Days = [];
        const today = new Date();
        today.setHours(23, 59, 59, 999); // End of today

        // Create an array representing the last 7 days
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            
            last7Days.push({
                dateKey: date.toISOString().split('T')[0], // YYYY-MM-DD
                day: date.toLocaleDateString('en-US', { weekday: 'short' }), // Mon, Tue, etc.
                count: 0
            });
        }

        // Group messages by date
        recentMessages.forEach(msg => {
            const msgDateStr = new Date(msg.timestamp).toISOString().split('T')[0];
            const dayEntry = last7Days.find(d => d.dateKey === msgDateStr);
            if (dayEntry) {
                dayEntry.count += 1;
            }
        });

        // Format the chart data to just include day and count, matching frontend expectations
        const chartData = last7Days.map(d => ({
            day: d.day,
            count: d.count
        }));

        res.json({
            stats,
            chartData
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
};

module.exports = {
    getOverview
};
