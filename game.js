document.addEventListener('DOMContentLoaded', () => {
    // Элементы DOM
    const gameContainer = document.getElementById('game-container');
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const startScreen = document.getElementById('start-screen');
    const gameOverScreen = document.getElementById('game-over');
    const startBtn = document.getElementById('start-btn');
    const name = document.getElementById('name');
    const eBtn = document.getElementById('easy-btn');
    const mBtn = document.getElementById('med-btn');
    const hBtn = document.getElementById('hard-btn');
    const restartBtn = document.getElementById('restart-btn');
    const scoreElement = document.getElementById('score');
    const highscoreElement = document.getElementById('highscore');
    const finalScoreElement = document.getElementById('final-score');

    // Размеры canvas
    function resizeCanvas() {
        canvas.width = gameContainer.clientWidth;
        canvas.height = gameContainer.clientHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Состояние игры
    const gameState = {
        score: 0,
        highScore: localStorage.getItem('doodleHighScore') || 0,
        isGameRunning: false,
        difficulty: 0,
        timeLeft: 0, 
        timerInterval: null,
        player: {
            x: canvas.width / 2,
            y: canvas.height / 2,
            width: 40,
            height: 40,
            speed: 5,
            dx: 0,
            dy: 0,
            gravity: 0.2,
            jumpForce: -15,
            isJumping: false
        },
        platforms: [],
        springs: [],
        monsters: [],
        bullets: [],
        cameraOffset: 0,
        platformCount: 372,
        lastPlatformY: canvas.height,
        keys: {
            left: false,
            right: false
        }
    };

    // Звуки
    const sounds = {
        jump: new Audio('https://assets.codepen.io/21542/howler-push.mp3'),
        spring: new Audio('https://assets.codepen.io/21542/howler-level-up.mp3'),
        monster: new Audio('https://assets.codepen.io/21542/howler-lose.mp3'),
        gameOver: new Audio('https://assets.codepen.io/21542/howler-lose.mp3')
    };

    // Обновление UI
    function updateUI() {
        scoreElement.textContent = `Очки: ${Math.floor(gameState.score)}`;
        highscoreElement.textContent = `Рекорд: ${gameState.highScore}`;
    }

    // Генерация платформ
    function generatePlatforms() {
        gameState.platforms = [];
        gameState.springs = [];
        gameState.monsters = [];
        
        // Первая платформа под игроком
        gameState.platforms.push({
            x: gameState.player.x - 25,
            y: gameState.player.y + 50,
            width: 70,
            height: 15,
            type: 'normal'
        });
        
        // Генерация остальных платформ
        for (let i = 0; i < gameState.platformCount; i++) {
            createPlatform();
        }
    }

    // Создание одной платформы
    function createPlatform() {
        const platformTypes = ['normal', 'normal', 'normal', 'normal', 'spring', 'breaking'];
        const type = platformTypes[Math.floor(Math.random() * platformTypes.length)];
        const width = type === 'breaking' ? 50 : 70;
        
        const platform = {
            x: Math.random() * (canvas.width - width),
            y: gameState.lastPlatformY - (100 + Math.random() * 150),
            width: width,
            height: 15,
            type: type,
            isBreaking: false,
            breakTimer: 0
        };
        
        gameState.platforms.push(platform);
        gameState.lastPlatformY = platform.y;
        
        // Добавление пружины на некоторые платформы
        if (type === 'normal' && Math.random() < 0.2) {
            gameState.springs.push({
                x: platform.x + platform.width / 2 - 10,
                y: platform.y - 20,
                width: 20,
                height: 20
            });
        }
        
        // Добавление монстров на некоторые платформы
        if (Math.random() < (0.5 * gameState.difficulty)) {
            gameState.monsters.push({
                x: platform.x + platform.width / 2 - 15,
                y: platform.y - 30,
                width: 30,
                height: 30,
                direction: Math.random() < 0.5 ? -1 : 1,
                speed: 1 + Math.random()
            });
        }
    }

    // Обработка ввода
    function setupControls() {
        // Клавиатура
        document.addEventListener('keydown', (e) => {
            if (!gameState.isGameRunning) return;
            
            if (e.key === 'ArrowLeft' || e.key === 'a') {
                gameState.keys.left = true;
            } else if (e.key === 'ArrowRight' || e.key === 'd') {
                gameState.keys.right = true;
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'a') {
                gameState.keys.left = false;
            } else if (e.key === 'ArrowRight' || e.key === 'd') {
                gameState.keys.right = false;
            }
        });
        
        // Касания для мобильных
        let touchStartX = 0;
        
        document.addEventListener('touchstart', (e) => {
            if (!gameState.isGameRunning) return;
            touchStartX = e.touches[0].clientX;
        });
        
        document.addEventListener('touchmove', (e) => {
            if (!gameState.isGameRunning) return;
            e.preventDefault();
            const touchX = e.touches[0].clientX;
            gameState.keys.left = touchX < touchStartX;
            gameState.keys.right = touchX > touchStartX;
        });
        
        document.addEventListener('touchend', () => {
            gameState.keys.left = false;
            gameState.keys.right = false;
        });
        
    }

    // Обновление игрового состояния
    function update() {
        if (!gameState.isGameRunning) return;
        
        // Движение игрока
        if (gameState.keys.left) {
            gameState.player.dx = -gameState.player.speed;
        } else if (gameState.keys.right) {
            gameState.player.dx = gameState.player.speed;
        } else {
            gameState.player.dx = 0;
        }
        
        // Применение гравитации
        gameState.player.dy += gameState.player.gravity;
        
        // Обновление позиции игрока
        gameState.player.x += gameState.player.dx;
        gameState.player.y += gameState.player.dy;
        
        // Ограничение движения по горизонтали (телепортация через края)
        if (gameState.player.x < -gameState.player.width) {
            gameState.player.x = canvas.width;
        } else if (gameState.player.x > canvas.width) {
            gameState.player.x = -gameState.player.width;
        }
        
        // Проверка столкновений с платформами
        let isOnPlatform = false;
        
        for (let i = 0; i < gameState.platforms.length; i++) {
            const platform = gameState.platforms[i];
            
            if (
                gameState.player.y + gameState.player.height >= platform.y &&
                gameState.player.y + gameState.player.height <= platform.y + 10 &&
                gameState.player.x + gameState.player.width > platform.x &&
                gameState.player.x < platform.x + platform.width &&
                gameState.player.dy > 0
            ) {
                // Разные типы платформ
                if (platform.type === 'normal') {
                    gameState.player.dy = gameState.player.jumpForce;
                    gameState.player.isJumping = true;
                    sounds.jump.play();
                    isOnPlatform = true;
                } else if (platform.type === 'spring') {
                    gameState.player.dy = gameState.player.jumpForce * 1.5;
                    gameState.player.isJumping = true;
                    sounds.spring.play();
                    isOnPlatform = true;
                } else if (platform.type === 'breaking' && !platform.isBreaking) {
                    platform.isBreaking = true;
                    platform.breakTimer = 30;
                    gameState.player.dy = gameState.player.jumpForce;
                    gameState.player.isJumping = true;
                    sounds.jump.play();
                    isOnPlatform = true;
                }
            }
            
            // Обновление ломающихся платформ
            if (platform.type === 'breaking' && platform.isBreaking) {
                platform.breakTimer--;
                if (platform.breakTimer <= 0) {
                    gameState.platforms.splice(i, 1);
                    i--;
                }
            }
        }
        
        // Проверка столкновений с пружинами
        for (let i = 0; i < gameState.springs.length; i++) {
            const spring = gameState.springs[i];
            
            if (
                gameState.player.y + gameState.player.height >= spring.y &&
                gameState.player.y < spring.y + spring.height &&
                gameState.player.x + gameState.player.width > spring.x &&
                gameState.player.x < spring.x + spring.width &&
                gameState.player.dy > 0
            ) {
                gameState.player.dy = gameState.player.jumpForce * 1.8;
                gameState.player.isJumping = true;
                sounds.spring.play();
            }
        }
        
        // Проверка столкновений с монстрами
        for (let i = 0; i < gameState.monsters.length; i++) {
            const monster = gameState.monsters[i];
            
            if (
                gameState.player.y + gameState.player.height > monster.y &&
                gameState.player.y < monster.y + monster.height &&
                gameState.player.x + gameState.player.width > monster.x &&
                gameState.player.x < monster.x + monster.width
            ) {
                // Если игрок падает на монстра сверху
                if (gameState.player.dy > 0 && gameState.player.y + gameState.player.height < monster.y + monster.height / 2) {
                    gameState.monsters.splice(i, 1);
                    gameState.player.dy = gameState.player.jumpForce * 1.2;
                    gameState.score += 50;
                    updateUI();
                    i--;
                } else {
                    // Игрок столкнулся с монстром - конец игры
                    endGame();
                    return;
                }
            }
            
            // Движение монстров
            monster.x += monster.direction * monster.speed;
            
            // Ограничение движения монстров
            if (monster.x < 0 || monster.x + monster.width > canvas.width) {
                monster.direction *= -1;
            }
        }
        
        // Камера следует за игроком, когда он поднимается
        if (gameState.player.y < canvas.height / 3 && gameState.player.dy < 0) {
            const deltaY = canvas.height / 3 - gameState.player.y;
            gameState.cameraOffset += deltaY;
            gameState.player.y += deltaY;
            
            // Перемещение всех объектов вниз
            for (let platform of gameState.platforms) {
                platform.y += deltaY;
            }
            
            for (let spring of gameState.springs) {
                spring.y += deltaY;
            }
            
            for (let monster of gameState.monsters) {
                monster.y += deltaY;
            }
            
            // Добавление очков за подъем
            gameState.score += deltaY * 0.2;
            updateUI();
        }
        
        // Генерация новых платформ, когда игрок поднимается
        if (gameState.platforms[gameState.platforms.length - 1].y > canvas.height / 2) {
            createPlatform();
        }
        
        // Удаление платформ, которые вышли за пределы экрана
        if (gameState.platforms[0].y > canvas.height) {
            gameState.platforms.shift();
        }
        
        // Удаление пружин и монстров за пределами экрана
        gameState.springs = gameState.springs.filter(spring => spring.y < canvas.height);
        gameState.monsters = gameState.monsters.filter(monster => monster.y < canvas.height);
        
        // Проверка на проигрыш (падение вниз)
        if (gameState.player.y > canvas.height) {
            endGame();
        }
    }

    // Отрисовка игры
    function draw() {
        // Очистка canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Фон
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Отрисовка платформ
        for (let platform of gameState.platforms) {
            if (platform.type === 'normal') {
                ctx.fillStyle = '#4CAF50';
                ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                ctx.strokeStyle = '#45a049';
                ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
            } else if (platform.type === 'spring') {
                ctx.fillStyle = '#FFC107';
                ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                ctx.strokeStyle = '#FFA000';
                ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
            } else if (platform.type === 'breaking') {
                if (platform.isBreaking) {
                    ctx.fillStyle = `rgba(244, 67, 54, ${platform.breakTimer / 30})`;
                } else {
                    ctx.fillStyle = '#F44336';
                }
                ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                ctx.strokeStyle = '#D32F2F';
                ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
            }
        }
        
        // Отрисовка пружин
        for (let spring of gameState.springs) {
            ctx.fillStyle = '#FF5722';
            ctx.beginPath();
            ctx.arc(spring.x + spring.width / 2, spring.y + spring.height / 2, spring.width / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#E64A19';
            ctx.stroke();
            
            // Спираль пружины
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let i = 0; i < 3; i++) {
                const angle = i * Math.PI / 3;
                const nextAngle = (i + 1) * Math.PI / 3;
                ctx.moveTo(
                    spring.x + spring.width / 2 + Math.cos(angle) * spring.width / 3,
                    spring.y + spring.height / 2 + Math.sin(angle) * spring.height / 3
                );
                ctx.lineTo(
                    spring.x + spring.width / 2 + Math.cos(nextAngle) * spring.width / 3,
                    spring.y + spring.height / 2 + Math.sin(nextAngle) * spring.height / 3
                );
            }
            ctx.stroke();
        }
        
        // Отрисовка монстров
        for (let monster of gameState.monsters) {
            // Тело
                ctx.fillStyle = '#9C27B0';
                ctx.beginPath();
                ctx.arc(
                    monster.x + monster.width / 2,
                    monster.y + monster.height / 2,
                    monster.width / 2,
                    0,
                    Math.PI * 2
                );
                ctx.fill();

        }
        
        // Отрисовка игрока
        ctx.fillStyle = '#FF5722';
        ctx.beginPath();
        ctx.ellipse(
            gameState.player.x + gameState.player.width / 2,
            gameState.player.y + gameState.player.height / 2,
            gameState.player.width / 2,
            gameState.player.height / 2,
            0,
            0,
            Math.PI * 2
        );
        ctx.fill();
        ctx.stroke();
    }

    // Игровой цикл
    function gameLoop() {
        update();
        draw();
        
        if (gameState.isGameRunning) {
            requestAnimationFrame(gameLoop);
        }
    }
    function startTimer() {
        gameState.timeLeft = 0;
        updateTimerDisplay();

        // Очищаем предыдущий интервал, если он был
        if (gameState.timerInterval) {
            clearInterval(gameState.timerInterval);
        }

        gameState.timerInterval = setInterval(() => {
            gameState.timeLeft++;
            updateTimerDisplay();

            if (gameState.timeLeft <= 0) {
                endGame();
            }
        }, 1000);
    }

    // Функция для обновления отображения таймера
    function updateTimerDisplay() {
        const timerElement = document.getElementById('timer');
        timerElement.textContent = `Время: ${gameState.timeLeft}`;
    }
    // Начало игры
    function startGame() {
        // Сброс состояния игры
        gameState.score = 0;
        gameState.isGameRunning = true;
        gameState.player.x = canvas.width / 2;
        gameState.player.y = canvas.height / 2;
        gameState.player.dx = 0;
        gameState.player.dy = 0;
        gameState.cameraOffset = 0;
        gameState.lastPlatformY = canvas.height;
        
        // Генерация платформ
        generatePlatforms();

        // Скрытие стартового экрана
        gameOverScreen.style.display = 'none';
        startScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
        
        // Обновление UI
        updateUI();     
        
        // Запуск игрового цикла
        gameLoop();
        startTimer();
    }

    // Конец игры
    function endGame() {
        if (!gameState.isGameRunning) return; // Убедимся, что игра запущена

        gameState.isGameRunning = false;
            if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
        // Обновление рекорда
        if (gameState.score > gameState.highScore) {
            gameState.highScore = gameState.score;
            localStorage.setItem('doodleHighScore', gameState.highScore);
        }

        // Показать экран завершения
        finalScoreElement.textContent = ` Ваш счет: ${Math.floor(gameState.score)}`;
        if (gameState.currentDifficulty) {
            finalDifficultyElement.textContent = `Сложность: ${difficultySettings[gameState.currentDifficulty].name}`;
        }

        // Важно: сначала обновляем текст, потом показываем экран
        gameOverScreen.style.display = 'block';
        gameOverScreen.classList.remove('hidden');

        // Звук завершения игры
        sounds.gameOver.currentTime = 0;
        sounds.gameOver.play();

        // Остановка игрового цикла
        cancelAnimationFrame(gameLoop);
    }
    function easyClick() {
        gameState.difficulty = 0;
    }
    function mediumClick() {
        gameState.difficulty = 1;
    }
    function hardClick() {
        gameState.difficulty = 2;
    }

    // Обработчики кнопок
    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', startGame);
    eBtn.addEventListener('click', easyClick);
    mBtn.addEventListener('click', mediumClick);
    hBtn.addEventListener('click', hardClick);

    // Настройка управления
    setupControls();

    // Пасхалка: секретная комбинация
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight'];
    let konamiIndex = 0;
    
    document.addEventListener('keydown', (e) => {
        if (e.key === konamiCode[konamiIndex]) {
            konamiIndex++;
            
            if (konamiIndex === konamiCode.length) {
                alert('Секрет открыт! Теперь вы летаете!');
                gameState.player.gravity = -0.1;
                konamiIndex = 0;
            }
        } else {
            konamiIndex = 0;
        }
    });

    // Инициализация UI
    updateUI();
});