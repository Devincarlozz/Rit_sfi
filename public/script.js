/**
 * KEAM Mock Test - Final Production Logic
 */

const CONFIG = {
    TOTAL_TIME: 150 * 60,
    SUBJECTS: { Physics: { start: 1, end: 45 }, Chemistry: { start: 46, end: 75 }, Mathematics: { start: 76, end: 150 } },
    SUPABASE: { 
        URL: 'https://jtgxtwjbsuoeuqjhpzbu.supabase.co', 
        KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0Z3h0d2pic3VvZXVxamhwemJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1ODM1NDEsImV4cCI6MjA5MTE1OTU0MX0.a-yHJeS-ljUugBOrwNz2cA5SglpYikj_Dyizx4ajpHs'
    }
};

let state = { 
    questions: [], 
    currentIdx: 0, 
    responses: {}, 
    timeRemaining: CONFIG.TOTAL_TIME, 
    activeSubject: 'Physics',
    timerInterval: null 
};

function init() {
    try {
        if (typeof lucide !== 'undefined') lucide.createIcons();
    } catch (e) {
        console.error("Lucide Error:", e);
    }
    
    // Declaration Logic
    const check = document.getElementById('declaration-check');
    const startBtn = document.getElementById('start-btn');
    let declared = false;

    if (check && startBtn) {
        check.onclick = () => {
            declared = !declared;
            const checkbox = check.querySelector('.custom-checkbox');
            if (checkbox) checkbox.classList.toggle('checked', declared);
            startBtn.disabled = !declared;
            startBtn.style.opacity = declared ? '1' : '0.5';
            startBtn.style.cursor = declared ? 'pointer' : 'not-allowed';
        };
    }

    // Generate Fallback Data (Overwritten if fetch succeeds)
    state.questions = [];
    Object.entries(CONFIG.SUBJECTS).forEach(([sub, info]) => {
        for (let i = info.start; i <= info.end; i++) {
            state.questions.push({ 
                id: i, 
                subject: sub, 
                text: `[${sub} Q${i}] Loading real question from database...`, 
                options: ["Option A", "Option B", "Option C", "Option D", "Option E"] 
            });
        }
    });
    state.questions.forEach((_, i) => state.responses[i] = { status: 'unvisited', selectedOption: null });
    
    if (startBtn) {
        startBtn.onclick = () => {
            // Prioritize timer and screen switch
            startTimer();
            document.getElementById('instruction-screen').classList.remove('active');
            document.getElementById('test-screen').classList.add('active');
            
            try {
                render(); 
            } catch (e) {
                console.error("Initial Render Error:", e);
            }
        };
    }

    document.getElementById('save-btn').onclick = () => {
        state.responses[state.currentIdx].status = (state.responses[state.currentIdx].selectedOption !== null) ? 'answered' : 'viewed';
        if (state.currentIdx < state.questions.length - 1) { 
            state.currentIdx++; 
            state.activeSubject = state.questions[state.currentIdx].subject;
            render(); 
        }
    };

    document.getElementById('mark-btn').onclick = () => {
        state.responses[state.currentIdx].status = 'marked';
        if (state.currentIdx < state.questions.length - 1) { 
            state.currentIdx++; 
            state.activeSubject = state.questions[state.currentIdx].subject;
            render(); 
        }
    };

    document.getElementById('clear-btn').onclick = () => { 
        state.responses[state.currentIdx].selectedOption = null; 
        state.responses[state.currentIdx].status = 'viewed';
        render(); 
    };

    document.getElementById('prev-btn').onclick = () => { 
        if (state.currentIdx > 0) { 
            state.currentIdx--; 
            state.activeSubject = state.questions[state.currentIdx].subject;
            render(); 
        } 
    };

    document.getElementById('submit-btn').onclick = () => { 
        if(confirm("Are you sure you want to submit the examination? This action cannot be undone.")) {
            clearInterval(state.timerInterval);
            alert("Examination Submitted Successfully!");
            location.reload(); 
        }
    };
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.onclick = () => { 
            state.activeSubject = btn.dataset.subject; 
            const firstInSub = state.questions.findIndex(q => q.subject.toLowerCase() === state.activeSubject.toLowerCase());
            if (firstInSub !== -1) state.currentIdx = firstInSub;
            render(); 
        };
    });

    const mobileToggle = document.getElementById('mobile-palette-toggle');
    const sidebar = document.getElementById('test-sidebar');
    const overlay = document.getElementById('mobile-overlay');

    if (mobileToggle && sidebar && overlay) {
        const openPalette = () => {
            sidebar.classList.remove('hidden', 'translate-x-full');
            overlay.classList.remove('hidden');
        };

        const closePalette = () => {
            sidebar.classList.add('translate-x-full');
            overlay.classList.add('hidden');
            setTimeout(() => sidebar.classList.add('hidden'), 300);
        };

        mobileToggle.onclick = () => {
            const isClosed = sidebar.classList.contains('translate-x-full') || sidebar.classList.contains('hidden');
            if (isClosed) openPalette(); else closePalette();
        };

        overlay.onclick = closePalette;
    }

    try {
        if (CONFIG.SUPABASE.URL && CONFIG.SUPABASE.KEY) fetchSupabase();
    } catch (e) {
        console.error("Supabase Init Error:", e);
    }
}

async function fetchSupabase() {
    try {
        const res = await fetch(`${CONFIG.SUPABASE.URL}/rest/v1/KEAM%20Mock%20Test?select=*&order=id.asc`, { 
            headers: { 
                'apikey': CONFIG.SUPABASE.KEY, 
                'Authorization': `Bearer ${CONFIG.SUPABASE.KEY}` 
            } 
        });
        if (!res.ok) throw new Error("Fetch failed");
        const rawData = await res.json();
        if (rawData.length > 0) {
            state.questions = rawData.map(q => ({
                id: q.id,
                subject: q.subject,
                text: q.question_text,
                options: [q.option_a, q.option_b, q.option_c, q.option_d, q.option_e],
                correct: q.correct_answer
            }));
            render();
        }
    } catch (e) { console.error("Supabase Error:", e); }
}

function render() {
    const q = state.questions[state.currentIdx];
    if (!q) return;

    document.getElementById('current-q-num').innerText = (state.currentIdx + 1).toString().padStart(2, '0');
    document.getElementById('current-subject').innerText = q.subject.toUpperCase();
    document.getElementById('question-text').innerText = q.text;
    
    const optCont = document.getElementById('options-container');
    optCont.innerHTML = '';
    q.options.forEach((opt, i) => {
        if (!opt) return;
        const div = document.createElement('div');
        div.className = `option-item ${state.responses[state.currentIdx].selectedOption === i ? 'selected' : ''}`;
        div.innerHTML = `<div class="option-circle">${String.fromCharCode(65+i)}</div><div>${opt}</div>`;
        div.onclick = () => { 
            state.responses[state.currentIdx].selectedOption = i; 
            render(); 
        };
        optCont.appendChild(div);
    });

    const grid = document.getElementById('palette-grid');
    grid.innerHTML = '';
    state.questions.forEach((q, i) => {
        if (q.subject.toLowerCase() === state.activeSubject.toLowerCase()) {
            const btn = document.createElement('button');
            btn.className = `palette-btn ${state.responses[i].status}`;
            if (i === state.currentIdx) btn.classList.add('current');
            btn.innerText = i + 1;
            btn.onclick = () => { 
                state.currentIdx = i; 
                state.activeSubject = state.questions[i].subject;
                render(); 
            };
            grid.appendChild(btn);
        }
    });

    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.subject.toLowerCase() === state.activeSubject.toLowerCase()));
    if (state.responses[state.currentIdx].status === 'unvisited') state.responses[state.currentIdx].status = 'viewed';
    
    updateSummary();
}

function updateSummary() {
    const counts = { answered: 0, viewed: 0, marked: 0, unvisited: 0 };
    Object.values(state.responses).forEach(r => counts[r.status]++);
    document.getElementById('count-answered').innerText = counts.answered;
    document.getElementById('count-viewed').innerText = counts.viewed;
    document.getElementById('count-marked').innerText = counts.marked;
    document.getElementById('count-unvisited').innerText = counts.unvisited;
}

function startTimer() {
    if (state.timerInterval) clearInterval(state.timerInterval);
    
    const display = document.getElementById('timer-display');
    const progressBar = document.getElementById('timer-progress');
    
    const updateUI = () => {
        if (state.timeRemaining <= 0) {
            clearInterval(state.timerInterval);
            alert("Time is up! Your test is being submitted.");
            location.reload();
            return;
        }

        const m = Math.floor(state.timeRemaining / 60);
        const s = state.timeRemaining % 60;
        if (display) display.innerText = `${m}:${s.toString().padStart(2, '0')}`;
        
        if (progressBar) {
            const percent = (state.timeRemaining / CONFIG.TOTAL_TIME) * 100;
            progressBar.style.width = `${percent}%`;
            
            if (state.timeRemaining < 300) { // Last 5 minutes
                if (display && display.parentElement) display.parentElement.style.color = '#EF4444';
                progressBar.style.background = '#EF4444';
            }
        }
    };

    // Initial update
    updateUI();

    state.timerInterval = setInterval(() => {
        state.timeRemaining--;
        updateUI();
    }, 1000);
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);