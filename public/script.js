/**
 * KEAM Mock Test - Final Production Link
 * Linked to Supabase: jtgxtwjbsuoeuqjhpzbu
 */

const CONFIG = {
    TOTAL_TIME: 150 * 60,
    SUPABASE: {
        URL: 'https://jtgxtwjbsuoeuqjhpzbu.supabase.co',
        KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0Z3h0d2pic3VvZXVxamhwemJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1ODM1NDEsImV4cCI6MjA5MTE1OTU0MX0.a-yHJeS-ljUugBOrwNz2cA5SglpYikj_Dyizx4ajpHs'
    }
};

const { createClient } = supabase;
const _supabase = createClient(CONFIG.SUPABASE.URL, CONFIG.SUPABASE.KEY);

let state = {
    questions: [],
    currentIdx: 0,
    responses: {}, 
    timeRemaining: CONFIG.TOTAL_TIME,
    activeSubject: 'Physics',
    timerInterval: null,
    isReady: false
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
    lucide.createIcons();
    setupButtonListeners();
    await fetchQuestionsFromSupabase();
});

async function fetchQuestionsFromSupabase() {
    const startBtn = document.getElementById('start-btn');
    try {
        // This calls the 'get_keam_test' SQL function in your Supabase Editor
        const { data, error } = await _supabase.rpc('get_keam_test');
        
        if (error) throw error;

        state.questions = data;
        state.questions.forEach((_, i) => {
            state.responses[i] = { status: 'unvisited', selectedOption: null };
        });

        state.isReady = true;
        startBtn.innerText = "I AM READY TO BEGIN";
        startBtn.style.opacity = "1";
    } catch (err) {
        console.error("Link Error:", err.message);
        startBtn.innerText = "DATABASE LINK ERROR";
    }
}

function setupButtonListeners() {
    document.getElementById('start-btn').onclick = () => {
        if(!state.isReady) return;
        document.getElementById('instruction-screen').style.display = 'none';
        document.getElementById('test-screen').style.display = 'flex';
        renderQuestion();
        startTimer();
    };

    document.getElementById('save-btn').onclick = () => {
        state.responses[state.currentIdx].status = state.responses[state.currentIdx].selectedOption ? 'answered' : 'viewed';
        navigate(1);
    };

    document.getElementById('mark-btn').onclick = () => {
        state.responses[state.currentIdx].status = 'marked';
        navigate(1);
    };

    document.getElementById('clear-btn').onclick = () => {
        state.responses[state.currentIdx].selectedOption = null;
        renderQuestion();
    };

    document.getElementById('prev-btn').onclick = () => navigate(-1);
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.onclick = () => {
            state.activeSubject = btn.dataset.subject;
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.currentIdx = state.questions.findIndex(q => q.subject.toLowerCase() === state.activeSubject.toLowerCase());
            renderQuestion();
        };
    });
}

function renderQuestion() {
    const q = state.questions[state.currentIdx];
    const resp = state.responses[state.currentIdx];

    document.getElementById('current-q-num').innerText = (state.currentIdx + 1).toString().padStart(2, '0');
    document.getElementById('current-subject').innerText = q.subject.toUpperCase();
    document.getElementById('question-text').innerText = q.question_text; // Matches your CSV

    const container = document.getElementById('options-container');
    container.innerHTML = '';

    // Mapping exactly to your CSV columns
    const keys = ['option_a', 'option_b', 'option_c', 'option_d', 'option_e'];
    keys.forEach((key, i) => {
        const div = document.createElement('div');
        div.className = `option-item ${resp.selectedOption === key ? 'selected' : ''}`;
        div.innerHTML = `
            <div class="option-circle">${String.fromCharCode(65 + i)}</div>
            <div class="option-text">${q[key]}</div>
        `;
        div.onclick = () => {
            state.responses[state.currentIdx].selectedOption = key;
            renderQuestion();
        };
        container.appendChild(div);
    });

    if (resp.status === 'unvisited') resp.status = 'viewed';
    renderPalette();
    updateSummary();
}

function navigate(step) {
    const next = state.currentIdx + step;
    if (next >= 0 && next < state.questions.length) {
        state.currentIdx = next;
        state.activeSubject = state.questions[next].subject;
        renderQuestion();
    }
}

function renderPalette() {
    const grid = document.getElementById('palette-grid');
    grid.innerHTML = '';
    state.questions.forEach((q, i) => {
        if (q.subject.toLowerCase() === state.activeSubject.toLowerCase()) {
            const btn = document.createElement('button');
            btn.className = `palette-btn ${state.responses[i].status}`;
            if (i === state.currentIdx) btn.classList.add('current');
            btn.innerText = i + 1;
            btn.onclick = () => { state.currentIdx = i; renderQuestion(); };
            grid.appendChild(btn);
        }
    });
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
    const display = document.getElementById('timer-display');
    state.timerInterval = setInterval(() => {
        state.timeRemaining--;
        const m = Math.floor(state.timeRemaining / 60), s = state.timeRemaining % 60;
        display.innerText = `${m}:${s.toString().padStart(2, '0')}`;
    }, 1000);
}