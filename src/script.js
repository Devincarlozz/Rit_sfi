// Import the secure AI engine
import { fetchAIExplanation } from './ai_explanation.js';

// Attach to window so our HTML buttons can still find it if needed
window.fetchAIExplanation = fetchAIExplanation;

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
    timerInterval: null,
    questionScale: 1.0,
    isReviewMode: false
};

function checkIfCorrect(q, optIdx) {
    if (!q || !q.correct || optIdx === null) return false;
    const correctStr = String(q.correct).trim().toUpperCase();
    const selectedText = (q.options[optIdx] || "").trim().toUpperCase();
    if (correctStr.length === 1 && correctStr >= 'A' && correctStr <= 'E') {
        return optIdx === (correctStr.charCodeAt(0) - 65);
    }
    if (correctStr === selectedText) return true;
    if (correctStr.includes(selectedText) || selectedText.includes(correctStr)) return true;
    return false;
}

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
            showResultAnalysis();
        }
    };

    document.getElementById('next-btn').onclick = () => {
        if (state.currentIdx < state.questions.length - 1) {
            state.currentIdx++;
            state.activeSubject = state.questions[state.currentIdx].subject;
            render();
        }
    };

    document.getElementById('exit-review-btn').onclick = () => {
        showResultAnalysis();
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

    // Zoom System
    const updateZoom = () => {
        document.documentElement.style.setProperty('--question-scale', state.questionScale);
        render();
    };

    const zoomIn = document.getElementById('zoom-in');
    const zoomOut = document.getElementById('zoom-out');
    if (zoomIn) zoomIn.onclick = () => { if (state.questionScale < 1.5) { state.questionScale += 0.1; updateZoom(); } };
    if (zoomOut) zoomOut.onclick = () => { if (state.questionScale > 0.8) { state.questionScale -= 0.1; updateZoom(); } };

    try {
        if (CONFIG.SUPABASE.URL && CONFIG.SUPABASE.KEY) fetchSupabase();
    } catch (e) {
        console.error("Supabase Init Error:", e);
    }
}

async function fetchSupabase() {
    try {
        const res = await fetch(`${CONFIG.SUPABASE.URL}/rest/v1/KEAM%20Mock%20Test?select=*`, { 
            headers: { 
                'apikey': CONFIG.SUPABASE.KEY, 
                'Authorization': `Bearer ${CONFIG.SUPABASE.KEY}` 
            } 
        });
        if (!res.ok) throw new Error("Fetch failed");
        let allQuestions = await res.json();
        
        // Group by subject
        const grouped = { Physics: [], Chemistry: [], Mathematics: [] };
        allQuestions.forEach(q => {
            if (grouped[q.subject]) grouped[q.subject].push(q);
        });

        // Shuffle helper
        const shuffle = (array) => array.sort(() => Math.random() - 0.5);

        // Select required counts
        const selected = [
            ...shuffle(grouped.Physics).slice(0, 45),
            ...shuffle(grouped.Chemistry).slice(0, 30),
            ...shuffle(grouped.Mathematics).slice(0, 75)
        ];

        if (selected.length > 0) {
            const cleanText = (str) => {
                if (!str) return "";
                return str
                    .replace(/\[cite:\s*\d+\]/g, '') // Remove [cite: 1]
                    .replace(/\\AA/g, 'Å')            // Convert Angstrom
                    .replace(/\\circ/g, '°')          // Convert degree
                    .trim();
            };

            state.questions = selected.map((q, i) => ({
                id: i + 1,
                subject: q.subject,
                text: cleanText(q.question_text),
                options: [
                    cleanText(q.option_a), 
                    cleanText(q.option_b), 
                    cleanText(q.option_c), 
                    cleanText(q.option_d), 
                    cleanText(q.option_e)
                ],
                correct: q.correct_answer,
                explanation: cleanText(q.explanation || q.solution)
            }));
            state.responses = {};
            state.questions.forEach((_, i) => state.responses[i] = { status: 'unvisited', selectedOption: null });
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
        const isSel = (state.responses[state.currentIdx].selectedOption === i);
        div.className = `option-item ${isSel && !state.isReviewMode ? 'selected' : ''}`;
        div.innerHTML = `<div class="option-circle">${String.fromCharCode(65+i)}</div><div>${opt}</div>`;
        
        if (state.isReviewMode) {
            const isCorr = checkIfCorrect(q, i);
            if (isCorr) {
                div.style.borderColor = '#22C55E';
                div.style.backgroundColor = 'rgba(34, 197, 94, 0.2)';
                div.style.color = '#22C55E';
            } else if (isSel && !isCorr) {
                div.style.borderColor = '#EF4444';
                div.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
                div.style.color = '#EF4444';
            }
        }
        
        div.onclick = () => { 
            if (state.isReviewMode) return;
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
            
            if (state.isReviewMode && state.responses[i].status === 'answered') {
                const sel = state.responses[i].selectedOption;
                const isCorr = checkIfCorrect(state.questions[i], sel);
                btn.style.backgroundColor = isCorr ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)';
                btn.style.borderColor = isCorr ? '#22C55E' : '#EF4444';
                btn.style.color = isCorr ? '#22C55E' : '#EF4444';
            }
            
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
    if (state.responses[state.currentIdx].status === 'unvisited' && !state.isReviewMode) {
        state.responses[state.currentIdx].status = 'viewed';
    }
    
    // Handle Explanation
    const expCont = document.getElementById('explanation-container');
    const expText = document.getElementById('explanation-text');
    if (expCont && expText) {
        if (state.isReviewMode) {
            const sel = state.responses[state.currentIdx].selectedOption;
            const isCorr = checkIfCorrect(q, sel);
            
            let correctOptLabel = String.fromCharCode(65 + (state.questions[state.currentIdx].correct.charCodeAt(0) - 65));
            let header = `<div class="mb-4">The correct answer is Option <strong>${correctOptLabel}</strong>.</div>`;
            
            if (q.ai_explanation) {
                expText.innerHTML = header + q.ai_explanation;
                expCont.classList.remove('hidden');
            } else if (q.explanation && q.explanation.length > 20) {
                expText.innerHTML = header + q.explanation;
                expCont.classList.remove('hidden');
            } else {
                expText.innerHTML = header + `<div class="flex items-center gap-2 text-white/40"><span class="w-4 h-4 border-2 border-t-transparent border-sfi-red rounded-full animate-spin"></span> Generating AI Explanation...</div>`;
                expCont.classList.remove('hidden');
                fetchAIExplanation(q, () => {
                    if (state.questions[state.currentIdx].id === q.id && state.isReviewMode) {
                        render();
                    }
                });
            }
        } else {
            expCont.classList.add('hidden');
        }
    }

    // Render Math
    try {
        if (window.MathJax && window.MathJax.typesetPromise) {
            MathJax.typesetPromise();
        }
    } catch (e) { console.error("MathJax error:", e); }

    try {
        updateSummary();
    } catch (e) { console.error("Stats update failed:", e); }
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
    
    const timerHeader = document.getElementById('timer-container');
    if (timerHeader) timerHeader.style.display = 'flex';
    const timerBar = document.getElementById('timer-progress');
    if (timerBar && timerBar.parentElement) timerBar.parentElement.style.opacity = '1';

    const display = document.getElementById('timer-display');
    const progressBar = document.getElementById('timer-progress');
    
    const updateUI = () => {
        if (state.timeRemaining <= 0) {
            alert("Time is up! Your test is being submitted.");
            showResultAnalysis();
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

    updateUI();
    state.timerInterval = setInterval(() => {
        state.timeRemaining--;
        updateUI();
    }, 1000);
}

function showResultAnalysis() {
    clearInterval(state.timerInterval);
    document.getElementById('test-screen').classList.remove('active');
    
    let totalScore = 0;
    let attempted = 0;
    let correct = 0;
    let incorrect = 0;
    
    const subjectsStats = {
        Physics: { attempted: 0, correct: 0, incorrect: 0, score: 0 },
        Chemistry: { attempted: 0, correct: 0, incorrect: 0, score: 0 },
        Mathematics: { attempted: 0, correct: 0, incorrect: 0, score: 0 }
    };

    state.questions.forEach((q, i) => {
        const response = state.responses[i];
        if (response && response.selectedOption !== null) {
            attempted++;
            if (subjectsStats[q.subject]) subjectsStats[q.subject].attempted++;
            
            let isCorrect = checkIfCorrect(q, response.selectedOption);

            if (isCorrect) {
                correct++;
                totalScore += 4;
                if (subjectsStats[q.subject]) {
                    subjectsStats[q.subject].correct++;
                    subjectsStats[q.subject].score += 4;
                }
            } else {
                incorrect++;
                totalScore -= 1;
                if (subjectsStats[q.subject]) {
                    subjectsStats[q.subject].incorrect++;
                    subjectsStats[q.subject].score -= 1;
                }
            }
        }
    });

    const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;

    document.getElementById('stat-attempted').innerText = attempted;
    document.getElementById('stat-correct').innerText = correct;
    document.getElementById('stat-incorrect').innerText = incorrect;
    document.getElementById('stat-accuracy').innerText = accuracy + '%';
    
    const scoreEl = document.getElementById('final-score');
    let currentScore = 0;
    const targetScore = totalScore;
    
    if (targetScore <= 0) {
        scoreEl.innerText = targetScore + " / 600";
    } else {
        const interval = setInterval(() => {
            if (currentScore < targetScore) {
                currentScore += Math.ceil(targetScore / 50) || 1;
                if (currentScore >= targetScore) { currentScore = targetScore; clearInterval(interval); }
                scoreEl.innerText = currentScore + " / 600";
            } else if (currentScore > targetScore) {
                currentScore -= Math.ceil(Math.abs(targetScore) / 50) || 1;
                if (currentScore <= targetScore) { currentScore = targetScore; clearInterval(interval); }
                scoreEl.innerText = currentScore + " / 600";
            }
        }, 20);
    }

    const breakdownEl = document.getElementById('subject-breakdown');
    if (breakdownEl) {
        breakdownEl.innerHTML = '';
        Object.entries(subjectsStats).forEach(([sub, stats]) => {
            breakdownEl.innerHTML += `
                <div class="flex items-center justify-between p-3 rounded-lg bg-white/5 flex-wrap gap-2">
                    <div class="font-bold text-white/80">${sub}</div>
                    <div class="flex gap-3 md:gap-4 text-[10px] md:text-xs font-medium">
                        <span class="text-white/40">Attempted: ${stats.attempted}</span>
                        <span class="text-[#22C55E]">Correct: ${stats.correct}</span>
                        <span class="text-[#EF4444]">Wrong: ${stats.incorrect}</span>
                        <span class="text-white font-bold ml-1 md:ml-2">Score: ${stats.score}</span>
                    </div>
                </div>
            `;
        });
    }

    const ctx = document.getElementById('resultChart');
    if (ctx && window.Chart) {
        if (window.myResultChart) window.myResultChart.destroy();
        window.myResultChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Correct', 'Incorrect', 'Skipped'],
                datasets: [{
                    data: [correct, incorrect, state.questions.length - attempted],
                    backgroundColor: ['#22C55E', '#EF4444', '#374151'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: 'rgba(255, 255, 255, 0.7)', font: { family: 'Inter', size: 10 } }
                    }
                },
                cutout: '75%'
            }
        });
    }

    const ctxComp = document.getElementById('subjectComparisonChart');
    if (ctxComp && window.Chart) {
        if (window.myCompChart) window.myCompChart.destroy();
        const subLabels = Object.keys(subjectsStats);
        const subScores = subLabels.map(s => subjectsStats[s].score);
        const maxPossible = subLabels.map(s => state.questions.filter(q => q.subject === s).length * 4);

        window.myCompChart = new Chart(ctxComp, {
            type: 'bar',
            data: {
                labels: subLabels,
                datasets: [
                    { label: 'Your Score', data: subScores, backgroundColor: '#22C55E', borderRadius: 8, barThickness: 12 },
                    { label: 'Max Possible', data: maxPossible, backgroundColor: 'rgba(239, 68, 68, 0.2)', borderRadius: 8, barThickness: 12 }
                ]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 10 } } },
                    y: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.7)', font: { size: 11, weight: 'bold' } } }
                }
            }
        });
    }

    const rs = document.getElementById('result-screen');
    if (rs) {
        document.getElementById('test-screen').classList.add('hidden');
        rs.classList.remove('hidden');
        rs.classList.add('active');
    }

    const reviewBtn = document.getElementById('review-btn');
    if (reviewBtn) {
        reviewBtn.onclick = () => {
            state.isReviewMode = true;
            document.getElementById('result-screen').classList.add('hidden');
            document.getElementById('result-screen').classList.remove('active');
            document.getElementById('test-screen').classList.add('active');
            
            const timerContainer = document.getElementById('timer-container');
            if (timerContainer) timerContainer.style.display = 'none';
            const progressBar = document.getElementById('timer-progress');
            if (progressBar && progressBar.parentElement) progressBar.parentElement.style.opacity = '0';

            const saveBtn = document.getElementById('save-btn');
            if(saveBtn) saveBtn.style.display = 'none';
            const markBtn = document.getElementById('mark-btn');
            if(markBtn) markBtn.style.display = 'none';
            const clearBtn = document.getElementById('clear-btn');
            if(clearBtn) clearBtn.style.display = 'none';
            const submitBtn = document.getElementById('submit-btn');
            if(submitBtn) submitBtn.style.display = 'none';
            
            const nextBtn = document.getElementById('next-btn');
            if(nextBtn) nextBtn.classList.remove('hidden');
            const exitBtn = document.getElementById('exit-review-btn');
            if(exitBtn) exitBtn.classList.remove('hidden');
            
            state.currentIdx = 0;
            state.activeSubject = state.questions[0].subject;
            render();
        };
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
