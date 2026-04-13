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

    function extractDriveId(url) {
        if (!url) return '';
        const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
        return match ? match[1] : url;
    }

    async function fetchMaterials() {
        const client = initSupabase();
        if (!client) return;

        try {
            console.log('SFI Materials Engine: Fetching data...');
            const [nRes, fRes, pRes] = await Promise.all([
                client.from('study_notes').select('*').order('created_at', { ascending: false }),
                client.from('formula_sheets').select('*').order('created_at', { ascending: false }),
                client.from('pyqs').select('*').order('created_at', { ascending: false })
            ]);

            console.log('Database Results:', {
                study_notes: nRes.data,
                formula_sheets: fRes.data,
                pyqs: pRes.data
            });

            if (!window.DB) window.DB = { notes: {}, pyqs: {}, formulae: {} };
            
            window.DB.notes = { physics: [], chemistry: [], maths: [] };
            window.DB.formulae = { physics: [], chemistry: [], maths: [] };
            window.DB.pyqs = { physics: [], chemistry: [], maths: [] };

            const normalizeSubject = (sub) => {
                const s = (sub || '').toLowerCase();
                if (s.includes('physic')) return 'physics';
                if (s.includes('chemist')) return 'chemistry';
                if (s.includes('math')) return 'maths';
                return null;
            };

            nRes.data?.forEach(item => {
                const sub = normalizeSubject(item.subject);
                if (sub) window.DB.notes[sub].push({ name: item.title || 'Note', url: extractDriveId(item.file_url) });
            });

            fRes.data?.forEach(item => {
                const sub = normalizeSubject(item.subject);
                if (sub) window.DB.formulae[sub].push({ name: item.title || 'Sheet', url: extractDriveId(item.file_url) });
            });

            pRes.data?.forEach(item => {
                const sub = normalizeSubject(item.subject);
                if (sub) window.DB.pyqs[sub].push({ name: item.title || 'PYQ', url: extractDriveId(item.file_url) });
            });

            console.log('SFI Materials Engine: Sync complete.', window.DB);
        } catch (err) {
            console.error('SFI Materials Engine critical failure:', err);
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        fetchMaterials();
    });
})();
