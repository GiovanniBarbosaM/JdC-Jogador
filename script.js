// Configurações globais
let gameState = {
    isRacing: false,
    isPaused: false,
    currentLap: 1,
    totalLaps: 3,
    raceStartTime: 0,
    lapStartTime: 0,
    bestLapTime: Infinity,
    lapTimes: [],
    totalCheckpoints: 8,
    raceFinished: false
};

// Posições dos corredores com checkpoints individuais
let playerPos = { 
    x: 100, 
    y: 300, 
    speed: 0, 
    angle: 0, 
    currentCheckpoint: 0,
    currentLap: 1,
    lapStartTime: 0
};

let aiPos = { 
    x: 100, 
    y: 320, 
    speed: 0, 
    angle: 0, 
    currentCheckpoint: 0,
    currentLap: 1,
    lapStartTime: 0
};

// IA settings com sistema adaptativo
let aiSettings = {
    speed: 1.0,
    difficulty: 3,
    boostUsed: false,
    checkpointHistory: [],
    // Sistema de aprendizado
    learning: {
        lapTimes: [],
        bestLapTime: Infinity,
        averageSpeed: 2.3,
        speedAdjustments: [],
        boostStrategy: 'conservative', // conservative, moderate, aggressive
        adaptiveSpeed: 1.0,
        performanceHistory: [],
        currentStrategy: 'baseline'
    }
};

// Pista circular - checkpoints distribuídos
let trackCheckpoints = [];

// Elementos DOM
let elements = {};

// Trails
let trails = [];

function initializeGame() {
    // Cachear elementos DOM
    elements = {
        playerRacer: document.getElementById('playerRacer'),
        aiRacer: document.getElementById('aiRacer'),
        raceTrack: document.getElementById('raceTrack'),
        currentLap: document.getElementById('currentLap'),
        raceTime: document.getElementById('raceTime'),
        bestLap: document.getElementById('bestLap'),
        position: document.getElementById('position'),
        startBtn: document.getElementById('startBtn'),
        pauseBtn: document.getElementById('pauseBtn'),
        resetBtn: document.getElementById('resetBtn'),
        lapTimes: document.getElementById('lapTimes'),
        lapDisplay: document.getElementById('lapDisplay'),
        timerDisplay: document.getElementById('timerDisplay'),
        positionDisplay: document.getElementById('positionDisplay'),
        victoryScreen: document.getElementById('victoryScreen'),
        victoryTitle: document.getElementById('victoryTitle'),
        victoryStats: document.getElementById('victoryStats'),
        newRaceBtn: document.getElementById('newRaceBtn'),
        // AI Status elements
        aiStrategy: document.getElementById('aiStrategy'),
        aiSpeedStatus: document.getElementById('aiSpeedStatus'),
        aiBoostStatus: document.getElementById('aiBoostStatus'),
        // Sliders
        aiSpeed: document.getElementById('aiSpeed'),
        totalLaps: document.getElementById('totalLaps'),
        difficulty: document.getElementById('difficulty'),
        // Value displays
        aiSpeedVal: document.getElementById('aiSpeedVal'),
        totalLapsVal: document.getElementById('totalLapsVal'),
        difficultyVal: document.getElementById('difficultyVal')
    };

    // Adicionar event listeners
    elements.startBtn.addEventListener('click', startRace);
    elements.pauseBtn.addEventListener('click', pauseRace);
    elements.resetBtn.addEventListener('click', resetRace);
    elements.newRaceBtn.addEventListener('click', newRace);

    // Sliders event listeners
    elements.aiSpeed.addEventListener('input', () => updateSetting('aiSpeed'));
    elements.totalLaps.addEventListener('input', () => updateSetting('totalLaps'));
    elements.difficulty.addEventListener('input', () => updateSetting('difficulty'));

    generateTrackCheckpoints();
    resetRace();
}

function generateTrackCheckpoints() {
    // Limpar checkpoints existentes
    document.querySelectorAll('.checkpoint').forEach(cp => cp.remove());
    trackCheckpoints = [];

    const trackRect = elements.raceTrack.getBoundingClientRect();
    const centerX = trackRect.width / 2;
    const centerY = trackRect.height / 2;
    const radiusX = centerX - 120;
    const radiusY = centerY - 120;

    for (let i = 0; i < gameState.totalCheckpoints; i++) {
        const angle = (i / gameState.totalCheckpoints) * 2 * Math.PI;
        const x = centerX + radiusX * Math.cos(angle);
        const y = centerY + radiusY * Math.sin(angle);

        trackCheckpoints.push({ x, y });

        // Criar elemento visual
        const checkpoint = document.createElement('div');
        checkpoint.className = 'checkpoint';
        checkpoint.textContent = i + 1;
        checkpoint.style.left = (x - 15) + 'px';
        checkpoint.style.top = (y - 15) + 'px';
        checkpoint.id = `checkpoint${i}`;
        elements.raceTrack.appendChild(checkpoint);
    }

    updateCheckpointStates();
}

function updateCheckpointStates() {
    // Atualizar checkpoints baseado no jogador (para visualização)
    const leadingCheckpoint = Math.max(playerPos.currentCheckpoint, aiPos.currentCheckpoint);
    
    for (let i = 0; i < gameState.totalCheckpoints; i++) {
        const checkpoint = document.getElementById(`checkpoint${i}`);
        if (!checkpoint) continue;

        if (i === leadingCheckpoint) {
            checkpoint.className = 'checkpoint active';
        } else if (i < leadingCheckpoint) {
            checkpoint.className = 'checkpoint completed';
        } else {
            checkpoint.className = 'checkpoint';
        }
    }
}

function startRace() {
    if (gameState.raceFinished) {
        resetRace();
        return;
    }

    gameState.isRacing = true;
    gameState.isPaused = false;
    
    if (gameState.raceStartTime === 0) {
        gameState.raceStartTime = Date.now();
        gameState.lapStartTime = Date.now();
        playerPos.lapStartTime = Date.now();
        aiPos.lapStartTime = Date.now();
    }
    
    elements.startBtn.textContent = '⏸️ Pausar';

    raceLoop();
}

function pauseRace() {
    if (!gameState.isRacing) return;

    gameState.isPaused = !gameState.isPaused;
    
    if (gameState.isPaused) {
        elements.startBtn.textContent = '▶️ Continuar';
    } else {
        elements.startBtn.textContent = '⏸️ Pausar';
        raceLoop();
    }
}

function resetRace() {
    gameState = {
        isRacing: false,
        isPaused: false,
        currentLap: 1,
        totalLaps: parseInt(elements.totalLaps.value),
        raceStartTime: 0,
        lapStartTime: 0,
        bestLapTime: Infinity,
        lapTimes: [],
        totalCheckpoints: 8,
        raceFinished: false
    };

    // Reset IA mas manter histórico de aprendizado
    aiSettings.boostUsed = false;
    aiSettings.checkpointHistory = [];
    // Manter learning data para próximas corridas

    // Reset posições com checkpoints individuais
    playerPos = { 
        x: 100, 
        y: 300, 
        speed: 0, 
        angle: 0, 
        currentCheckpoint: 0,
        currentLap: 1,
        lapStartTime: 0
    };
    
    aiPos = { 
        x: 100, 
        y: 320, 
        speed: 0, 
        angle: 0, 
        currentCheckpoint: 0,
        currentLap: 1,
        lapStartTime: 0
    };

    // Limpar trails
    trails.forEach(trail => {
        if (trail.parentNode) {
            trail.parentNode.removeChild(trail);
        }
    });
    trails = [];

    elements.startBtn.textContent = '🚀 Iniciar Corrida';
    elements.victoryScreen.style.display = 'none';

    updateDisplay();
    updateCheckpointStates();
    generateTrackCheckpoints();
}

function newRace() {
    elements.victoryScreen.style.display = 'none';
    resetRace();
}

function raceLoop() {
    if (!gameState.isRacing || gameState.isPaused || gameState.raceFinished) return;

    // Mover corredores
    movePlayer();
    moveAI();

    // Verificar checkpoints
    checkCheckpoints();

    // Atualizar display
    updateDisplay();

    // Adicionar trails
    addTrail(playerPos.x, playerPos.y, 'player-trail');
    addTrail(aiPos.x, aiPos.y, 'ai-trail');

    // Continuar loop
    requestAnimationFrame(raceLoop);
}

function movePlayer() {
    // Algoritmo de movimento do jogador (IA inteligente)
    const targetCheckpoint = trackCheckpoints[playerPos.currentCheckpoint];
    if (!targetCheckpoint) return;

    const dx = targetCheckpoint.x - playerPos.x;
    const dy = targetCheckpoint.y - playerPos.y;
    const distance = Math.hypot(dx, dy);
    const targetAngle = Math.atan2(dy, dx);

    // Movimento suave em direção ao checkpoint
    const moveSpeed = 2.5;
    playerPos.x += Math.cos(targetAngle) * moveSpeed;
    playerPos.y += Math.sin(targetAngle) * moveSpeed;

    // Atualizar posição visual
    elements.playerRacer.style.left = (playerPos.x - 8) + 'px';
    elements.playerRacer.style.top = (playerPos.y - 8) + 'px';
}

function moveAI() {
    // IA mais avançada com sistema de aprendizado
    const targetCheckpoint = trackCheckpoints[aiPos.currentCheckpoint];
    if (!targetCheckpoint) return;

    const dx = targetCheckpoint.x - aiPos.x;
    const dy = targetCheckpoint.y - aiPos.y;
    const distance = Math.hypot(dx, dy);
    const targetAngle = Math.atan2(dy, dx);

    // Velocidade base da IA com adaptação
    let baseSpeed = 2.3 * aiSettings.speed;
    let adaptiveMultiplier = aiSettings.learning.adaptiveSpeed;
    
    // Aplicar aprendizado baseado no desempenho anterior
    let moveSpeed = baseSpeed * adaptiveMultiplier;

    // Ajuste baseado na dificuldade
    moveSpeed += (aiSettings.difficulty - 3) * 0.3;

    // Sistema de boost adaptativo melhorado
    const shouldUseBoost = shouldAIUseBoost(distance, aiPos.currentCheckpoint);
    if (shouldUseBoost && !aiSettings.boostUsed) {
        let boostMultiplier = 1.5;
        
        // Boost mais agressivo baseado na estratégia aprendida
        switch(aiSettings.learning.boostStrategy) {
            case 'aggressive':
                boostMultiplier = 1.8;
                break;
            case 'moderate':
                boostMultiplier = 1.6;
                break;
            default:
                boostMultiplier = 1.5;
        }
        
        moveSpeed *= boostMultiplier;
        aiSettings.boostUsed = true;
        showBoostEffect(aiPos.x, aiPos.y);
        
        // Tempo de cooldown adaptativo
        const cooldownTime = aiSettings.learning.boostStrategy === 'aggressive' ? 2000 : 3000;
        setTimeout(() => aiSettings.boostUsed = false, cooldownTime);
    }

    // Movimento da IA com micro-ajustes aprendidos
    const smoothingFactor = Math.max(0.8, 1.0 - (aiSettings.learning.lapTimes.length * 0.1));
    aiPos.x += Math.cos(targetAngle) * moveSpeed * smoothingFactor;
    aiPos.y += Math.sin(targetAngle) * moveSpeed * smoothingFactor;

    // Registrar dados para aprendizado
    recordAIPerformanceData(distance, moveSpeed);

    // Atualizar posição visual
    elements.aiRacer.style.left = (aiPos.x - 8) + 'px';
    elements.aiRacer.style.top = (aiPos.y - 8) + 'px';
}

function shouldAIUseBoost(distance, checkpoint) {
    // Lógica adaptativa para uso de boost
    const strategy = aiSettings.learning.boostStrategy;
    const baseChance = 0.01;
    
    let shouldBoost = false;
    
    switch(strategy) {
        case 'aggressive':
            shouldBoost = distance > 150 && Math.random() < baseChance * 2;
            break;
        case 'moderate':
            shouldBoost = distance > 180 && Math.random() < baseChance * 1.5;
            break;
        case 'conservative':
        default:
            shouldBoost = distance > 200 && Math.random() < baseChance;
    }
    
    // Boost estratégico em checkpoints específicos aprendidos
    const criticalCheckpoints = aiSettings.learning.performanceHistory
        .filter(p => p.checkpoint === checkpoint && p.timeSpent > 1000)
        .length > 0;
    
    if (criticalCheckpoints) {
        shouldBoost = shouldBoost || Math.random() < baseChance * 3;
    }
    
    return shouldBoost;
}

function recordAIPerformanceData(distance, speed) {
    // Registrar dados de performance para análise
    const currentTime = Date.now();
    aiSettings.learning.performanceHistory.push({
        checkpoint: aiPos.currentCheckpoint,
        distance: distance,
        speed: speed,
        timestamp: currentTime
    });
    
    // Limitar histórico para evitar overflow
    if (aiSettings.learning.performanceHistory.length > 500) {
        aiSettings.learning.performanceHistory = aiSettings.learning.performanceHistory.slice(-400);
    }
}

function checkCheckpoints() {
    // Verificar checkpoint do jogador
    const playerCheckpoint = trackCheckpoints[playerPos.currentCheckpoint];
    if (playerCheckpoint) {
        const playerDist = Math.hypot(playerPos.x - playerCheckpoint.x, playerPos.y - playerCheckpoint.y);
        if (playerDist < 25) {
            playerPos.currentCheckpoint++;
            
            // Completou a volta?
            if (playerPos.currentCheckpoint >= gameState.totalCheckpoints) {
                playerCompleteLap();
            }
        }
    }
    
    // Verificar checkpoint da IA
    const aiCheckpoint = trackCheckpoints[aiPos.currentCheckpoint];
    if (aiCheckpoint) {
        const aiDist = Math.hypot(aiPos.x - aiCheckpoint.x, aiPos.y - aiCheckpoint.y);
        if (aiDist < 25) {
            aiPos.currentCheckpoint++;
            
            // Completou a volta?
            if (aiPos.currentCheckpoint >= gameState.totalCheckpoints) {
                aiCompleteLap();
            }
        }
    }
    
    updateCheckpointStates();
}

function playerCompleteLap() {
    playerPos.currentCheckpoint = 0;
    playerPos.currentLap++;

    const lapTime = Date.now() - playerPos.lapStartTime;
    gameState.lapTimes.push(lapTime);

    if (lapTime < gameState.bestLapTime) {
        gameState.bestLapTime = lapTime;
    }

    playerPos.lapStartTime = Date.now();

    // Atualizar lap principal baseado no líder
    updateMainLapCounter();

    // Jogador terminou a corrida?
    if (playerPos.currentLap > gameState.totalLaps) {
        checkRaceFinish();
    }
}

function aiCompleteLap() {
    const lapTime = Date.now() - aiPos.lapStartTime;
    
    // Registrar tempo da volta para aprendizado
    aiSettings.learning.lapTimes.push(lapTime);
    
    // Analisar performance e adaptar estratégia
    analyzeAIPerformance(lapTime);
    
    aiPos.currentCheckpoint = 0;
    aiPos.currentLap++;
    aiPos.lapStartTime = Date.now();

    // Atualizar lap principal baseado no líder
    updateMainLapCounter();

    // IA terminou a corrida?
    if (aiPos.currentLap > gameState.totalLaps) {
        checkRaceFinish();
    }
}

function analyzeAIPerformance(currentLapTime) {
    const learning = aiSettings.learning;
    
    // Atualizar melhor tempo
    if (currentLapTime < learning.bestLapTime) {
        learning.bestLapTime = currentLapTime;
    }
    
    // Calcular média de tempos
    const avgTime = learning.lapTimes.reduce((a, b) => a + b, 0) / learning.lapTimes.length;
    
    // Analisar tendência de melhoria
    const lastThreeAvg = learning.lapTimes.length >= 3 ? 
        learning.lapTimes.slice(-3).reduce((a, b) => a + b, 0) / 3 : currentLapTime;
    
    console.log(`🤖 IA Lap ${aiPos.currentLap - 1}: ${formatTime(currentLapTime)} | Best: ${formatTime(learning.bestLapTime)} | Strategy: ${learning.currentStrategy}`);
    
    // Adaptar velocidade baseada no desempenho
    adaptAISpeed(currentLapTime, avgTime);
    
    // Adaptar estratégia de boost
    adaptBoostStrategy(currentLapTime, lastThreeAvg);
    
    // Evoluir estratégia geral
    evolveAIStrategy(currentLapTime);
}

function adaptAISpeed(currentLapTime, avgTime) {
    const learning = aiSettings.learning;
    
    // Se o tempo atual for pior que a média, aumentar velocidade
    if (currentLapTime > avgTime * 1.05) {
        learning.adaptiveSpeed = Math.min(learning.adaptiveSpeed * 1.1, 1.8);
        console.log(`🚀 IA aumentando velocidade: ${(learning.adaptiveSpeed * 100).toFixed(0)}%`);
    } 
    // Se muito melhor, manter ou reduzir levemente para economizar energia
    else if (currentLapTime < avgTime * 0.95) {
        learning.adaptiveSpeed = Math.max(learning.adaptiveSpeed * 0.98, 0.8);
        console.log(`🐌 IA otimizando velocidade: ${(learning.adaptiveSpeed * 100).toFixed(0)}%`);
    }
}

function adaptBoostStrategy(currentLapTime, recentAvg) {
    const learning = aiSettings.learning;
    
    // Analisar efetividade da estratégia atual de boost
    if (learning.lapTimes.length >= 2) {
        const improvement = (learning.lapTimes[learning.lapTimes.length - 2] - currentLapTime) / 1000;
        
        if (improvement > 0.5) {
            // Melhorou significativamente, manter ou intensificar
            if (learning.boostStrategy === 'conservative') {
                learning.boostStrategy = 'moderate';
                console.log('🔥 IA mudando para boost moderado');
            } else if (learning.boostStrategy === 'moderate') {
                learning.boostStrategy = 'aggressive';
                console.log('⚡ IA mudando para boost agressivo');
            }
        } else if (improvement < -0.5) {
            // Piorou, ser mais conservativo
            if (learning.boostStrategy === 'aggressive') {
                learning.boostStrategy = 'moderate';
                console.log('🛡️ IA mudando para boost moderado');
            } else if (learning.boostStrategy === 'moderate') {
                learning.boostStrategy = 'conservative';
                console.log('🐢 IA mudando para boost conservativo');
            }
        }
    }
}

function evolveAIStrategy(currentLapTime) {
    const learning = aiSettings.learning;
    const lapNumber = learning.lapTimes.length;
    
    // Estratégias baseadas no número da volta
    if (lapNumber === 1) {
        learning.currentStrategy = 'learning';
        console.log('🧠 IA em modo aprendizado');
    } else if (lapNumber === 2) {
        learning.currentStrategy = 'adapting';
        console.log('🔧 IA adaptando estratégia');
    } else if (lapNumber >= 3) {
        // Determinar se está melhorando consistentemente
        const isImproving = learning.lapTimes.length >= 2 && 
            currentLapTime < learning.lapTimes[learning.lapTimes.length - 2];
        
        if (isImproving) {
            learning.currentStrategy = 'aggressive';
            console.log('🏃‍♂️ IA em modo agressivo');
        } else {
            learning.currentStrategy = 'optimized';
            console.log('🎯 IA em modo otimizado');
        }
    }
    
    // Ajuste dinâmico baseado na posição relativa
    adjustStrategyBasedOnPosition();
}

function adjustStrategyBasedOnPosition() {
    const playerProgress = (playerPos.currentLap - 1) * gameState.totalCheckpoints + playerPos.currentCheckpoint;
    const aiProgress = (aiPos.currentLap - 1) * gameState.totalCheckpoints + aiPos.currentCheckpoint;
    
    if (playerProgress > aiProgress + 2) {
        // IA está perdendo, ficar mais agressivo
        aiSettings.learning.adaptiveSpeed = Math.min(aiSettings.learning.adaptiveSpeed * 1.15, 2.0);
        aiSettings.learning.boostStrategy = 'aggressive';
        console.log('🔥 IA detectou desvantagem - modo ultra agressivo!');
    } else if (aiProgress > playerProgress + 2) {
        // IA está ganhando, pode ser mais conservativo
        aiSettings.learning.adaptiveSpeed = Math.max(aiSettings.learning.adaptiveSpeed * 0.95, 1.0);
        console.log('😎 IA na frente - mantendo vantagem');
    }
}

function updateMainLapCounter() {
    // Atualizar o contador principal baseado no corredor mais avançado
    const leadingLap = Math.max(playerPos.currentLap, aiPos.currentLap);
    gameState.currentLap = Math.min(leadingLap, gameState.totalLaps);
}

function checkRaceFinish() {
    // Verificar se ambos os corredores terminaram ou se alguém já ganhou
    if (playerPos.currentLap > gameState.totalLaps && aiPos.currentLap > gameState.totalLaps) {
        finishRace();
    } else if (playerPos.currentLap > gameState.totalLaps || aiPos.currentLap > gameState.totalLaps) {
        // Um dos corredores terminou, dar tempo para o outro
        setTimeout(() => {
            finishRace();
        }, 2000);
    }
}

function finishRace() {
    gameState.raceFinished = true;
    gameState.isRacing = false;

    const totalTime = Date.now() - gameState.raceStartTime;
    showVictoryScreen(totalTime);
}

function showVictoryScreen(totalTime) {
    const totalTimeStr = formatTime(totalTime);
    const bestLapStr = gameState.bestLapTime < Infinity ? formatTime(gameState.bestLapTime) : '--:--.--';
    
    // Determinar vencedor
    let winner = '';
    if (playerPos.currentLap > aiPos.currentLap) {
        winner = '🏆 JOGADOR VENCEU!';
    } else if (aiPos.currentLap > playerPos.currentLap) {
        winner = '🤖 IA VENCEU!';
    } else {
        // Mesmo número de voltas, verificar checkpoint
        if (playerPos.currentCheckpoint > aiPos.currentCheckpoint) {
            winner = '🏆 JOGADOR VENCEU!';
        } else if (aiPos.currentCheckpoint > playerPos.currentCheckpoint) {
            winner = '🤖 IA VENCEU!';
        } else {
            winner = '🤝 EMPATE!';
        }
    }

    elements.victoryTitle.textContent = winner;
    elements.victoryStats.innerHTML = `
        <div class="victory-stats">Tempo Total: ${totalTimeStr}</div>
        <div class="victory-stats">Melhor Volta: ${bestLapStr}</div>
        <div class="victory-stats">Voltas Completadas: ${gameState.totalLaps}</div>
        <div class="victory-stats">Jogador: Volta ${Math.min(playerPos.currentLap, gameState.totalLaps + 1)}</div>
        <div class="victory-stats">IA: Volta ${Math.min(aiPos.currentLap, gameState.totalLaps + 1)}</div>
    `;

    elements.victoryScreen.style.display = 'flex';
}

function updateDisplay() {
    const currentTime = gameState.isRacing && gameState.raceStartTime > 0 ? Date.now() - gameState.raceStartTime : 0;
    
    elements.currentLap.textContent = `${Math.min(gameState.currentLap, gameState.totalLaps)} / ${gameState.totalLaps}`;
    elements.raceTime.textContent = formatTime(currentTime);
    elements.bestLap.textContent = gameState.bestLapTime < Infinity ? formatTime(gameState.bestLapTime) : '--:--.--';
    
    elements.lapDisplay.textContent = `Volta ${Math.min(gameState.currentLap, gameState.totalLaps)}/${gameState.totalLaps}`;
    elements.timerDisplay.textContent = formatTime(currentTime);
    
    // Determinar posição baseado em volta e checkpoint
    const playerProgress = (playerPos.currentLap - 1) * gameState.totalCheckpoints + playerPos.currentCheckpoint;
    const aiProgress = (aiPos.currentLap - 1) * gameState.totalCheckpoints + aiPos.currentCheckpoint;
    
    elements.position.textContent = playerProgress >= aiProgress ? '1º / 2' : '2º / 2';
    elements.positionDisplay.textContent = playerProgress >= aiProgress ? '1º Lugar' : '2º Lugar';

    // Atualizar status da IA
    updateAIStatus();

    updateLapTimesList();
}

function updateAIStatus() {
    if (!elements.aiStrategy) return;
    
    const learning = aiSettings.learning;
    
    // Atualizar estratégia
    let strategyText = learning.currentStrategy || 'baseline';
    strategyText = strategyText.charAt(0).toUpperCase() + strategyText.slice(1);
    elements.aiStrategy.textContent = strategyText;
    
    // Atualizar velocidade adaptativa
    const speedPercent = Math.round(learning.adaptiveSpeed * 100);
    elements.aiSpeedStatus.textContent = `${speedPercent}%`;
    
    // Atualizar estratégia de boost
    let boostText = learning.boostStrategy || 'conservative';
    switch(boostText) {
        case 'conservative': boostText = 'Conservativo'; break;
        case 'moderate': boostText = 'Moderado'; break;
        case 'aggressive': boostText = 'Agressivo'; break;
    }
    elements.aiBoostStatus.textContent = boostText;
}

function updateLapTimesList() {
    let html = '';
    gameState.lapTimes.forEach((time, index) => {
        const isBest = time === gameState.bestLapTime;
        const isCurrent = index === gameState.lapTimes.length - 1;
        
        let className = '';
        if (isBest) className = 'best-lap';
        else if (isCurrent) className = 'current-lap';

        html += `<div class="lap-time ${className}">
            <span>Volta ${index + 1}</span>
            <span>${formatTime(time)}</span>
        </div>`;
    });
    
    elements.lapTimes.innerHTML = html;
}

function addTrail(x, y, className) {
    const trail = document.createElement('div');
    trail.className = `trail ${className}`;
    trail.style.left = (x - 1.5) + 'px';
    trail.style.top = (y - 1.5) + 'px';
    elements.raceTrack.appendChild(trail);

    trails.push(trail);

    // Limitar número de trails para performance
    if (trails.length > 200) {
        const oldTrail = trails.shift();
        if (oldTrail && oldTrail.parentNode) {
            oldTrail.parentNode.removeChild(oldTrail);
        }
    }

    // Remover trail após um tempo
    setTimeout(() => {
        if (trail && trail.parentNode) {
            trail.parentNode.removeChild(trail);
            const index = trails.indexOf(trail);
            if (index > -1) {
                trails.splice(index, 1);
            }
        }
    }, 1500);
}

function showBoostEffect(x, y) {
    const effect = document.createElement('div');
    effect.className = 'boost-effect';
    effect.textContent = '🚀';
    effect.style.left = x + 'px';
    effect.style.top = y + 'px';
    elements.raceTrack.appendChild(effect);

    setTimeout(() => {
        if (effect && effect.parentNode) {
            effect.parentNode.removeChild(effect);
        }
    }, 1000);
}

function formatTime(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
}

function updateSetting(settingName) {
    const slider = document.getElementById(settingName);
    const valueDisplay = document.getElementById(settingName + 'Val');
    
    switch(settingName) {
        case 'aiSpeed':
            aiSettings.speed = parseFloat(slider.value);
            valueDisplay.textContent = Math.round(aiSettings.speed * 100) + '%';
            break;
        case 'totalLaps':
            gameState.totalLaps = parseInt(slider.value);
            valueDisplay.textContent = gameState.totalLaps;
            // Atualizar display se não estiver correndo
            if (!gameState.isRacing) {
                updateDisplay();
            }
            break;
        case 'difficulty':
            aiSettings.difficulty = parseInt(slider.value);
            const difficultyNames = ['Muito Fácil', 'Fácil', 'Normal', 'Difícil', 'Muito Difícil'];
            valueDisplay.textContent = difficultyNames[aiSettings.difficulty - 1];
            break;
    }
}

// Controles de teclado para uma experiência mais interativa
document.addEventListener('keydown', (event) => {
    switch(event.code) {
        case 'Space':
            event.preventDefault();
            if (!gameState.isRacing) {
                startRace();
            } else {
                pauseRace();
            }
            break;
        case 'KeyR':
            event.preventDefault();
            resetRace();
            break;
        case 'Escape':
            if (elements.victoryScreen.style.display === 'flex') {
                newRace();
            }
            break;
    }
});

// Inicializar jogo quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    initializeGame();
    
    // Atualizar valores iniciais dos sliders
    updateSetting('aiSpeed');
    updateSetting('totalLaps');
    updateSetting('difficulty');
});

// Redimensionar checkpoints quando a janela for redimensionada
window.addEventListener('resize', () => {
    if (!gameState.isRacing) {
        generateTrackCheckpoints();
    }
});