(() => {
    const SUPABASE_CONFIG = {
        URL: 'https://ufrvwlhtpcpcciwpskpe.supabase.co',
        KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmcnZ3bGh0cGNwY2Npd3Bza3BlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MDk5MzUsImV4cCI6MjA5MTQ4NTkzNX0.Xba1FZ2ptG7g08HwTXmhM-PBNqnY0CXDU2WLrMiOV4Y'
    };

    let supabaseClient;

    function initSupabase() {
        if (supabaseClient) return supabaseClient;
        if (typeof window.supabase === 'undefined') {
            console.error('Supabase library not loaded.');
            return null;
        }
        supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.KEY);
        return supabaseClient;
    }

    function isLatest(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);
        return diffInHours < 48;
    }

    async function fetchLiveAlerts() {
        const client = initSupabase();
        if (!client) return;

        const container = document.getElementById('live-alerts-container');
        if (!container) return;

        try {
            const { data, error } = await client
                .from('notifications')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(3);

            if (data && data.length > 0) {
                container.innerHTML = '';
                data.forEach((note, index) => {
                    const isNew = (index === 0);
                    const title = note.title || note.heading || '';
                    const text = note.text || note.content || note.message || '';
                    const link = note.link || note.url || '#';
                    const category = isNew ? '🔴 LATEST UPDATE' : (note.category || '');
                    
                    const alertHtml = `
                        <a href="${link}" target="_blank"
                            class="block pl-4 border-l-2 ${index === 0 ? 'border-sfi-red' : 'border-white/20'} relative hover:border-sfi-red/70 transition-colors group">
                            <div class="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-sfi-dark border-2 ${index === 0 ? 'border-sfi-red animate-pulse' : 'border-white/20 group-hover:border-white/40'}">
                            </div>
                            ${category ? `<span class="text-[10px] font-bold ${index === 0 ? 'text-sfi-red' : 'text-white/40'} tracking-widest uppercase block mb-1">${category}</span>` : ''}
                            <p class="text-sm text-white/90 font-semibold mb-1 leading-snug group-hover:text-sfi-red transition-colors">
                                ${title || text.substring(0, 50) + (text.length > 50 ? '...' : '')}
                            </p>
                            ${title && text ? `<p class="text-xs text-white/60 leading-relaxed">${text}</p>` : ''}
                        </a>
                    `;
                    container.insertAdjacentHTML('beforeend', alertHtml);
                });
            }
        } catch (err) {
            console.error('Error fetching live alerts:', err);
        }
    }

    async function fetchCEEUpdates() {
        const client = initSupabase();
        if (!client) return;

        const container = document.getElementById('cee-updates-container');
        if (!container) return;

        try {
            const { data, error } = await client
                .from('notifications')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(4);

            if (data && data.length > 0) {
                container.innerHTML = '';
                data.forEach((note, index) => {
                    const isNew = (index === 0);
                    const text = note.text || note.content || note.message || note.title || '';
                    const link = note.link || note.url || '#';
                    const category = isNew ? 'LATEST' : (note.category || '');
                    
                    const noteHtml = `
                        <div style="border-left: 2px solid ${isNew ? 'var(--sfi-red)' : '#555'}; padding-left: 12px; cursor: pointer;" onclick="window.open('${link}', '_blank')">
                            ${category ? `<div style="color: ${isNew ? 'var(--sfi-red)' : 'var(--text-gray)'}; font-size: 0.8rem; font-weight: bold;">${category}</div>` : ''}
                            <p style="margin: 5px 0 0; font-size: 0.95rem; line-height: 1.4; color: ${isNew ? 'white' : 'var(--text-gray)'};">
                                ${text}
                            </p>
                        </div>
                    `;
                    container.insertAdjacentHTML('beforeend', noteHtml);
                });

                if (data.length <= 2) {
                    container.style.animation = 'none';
                }
            }
        } catch (err) {
            console.error('Error fetching CEE updates:', err);
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        const path = window.location.pathname;
        const page = path.split('/').pop() || 'index.html';

        if (page === 'index.html' || page === '') {
            fetchLiveAlerts();
        } else if (page === 'keamportal.html') {
            fetchCEEUpdates();
        }
    });
})();
