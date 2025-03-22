/**
 * Управление аутентификацией
 */

// Функция для установки токена аутентификации в заголовки запросов
function setupAuthInterceptor() {
    // Перехватываем все fetch запросы
    const originalFetch = window.fetch;
    
    window.fetch = function(url, options = {}) {
        // Получаем токен из localStorage
        const token = localStorage.getItem('authToken');
        
        // Если токен существует, добавляем его в заголовки запроса
        if (token) {
            options.headers = options.headers || {};
            
            // Проверяем, установлены ли заголовки как объект или как Headers
            if (options.headers instanceof Headers) {
                if (!options.headers.has('Authorization')) {
                    options.headers.append('Authorization', `Bearer ${token}`);
                }
                if (!options.headers.has('X-Requested-With')) {
                    options.headers.append('X-Requested-With', 'XMLHttpRequest');
                }
            } else {
                if (!options.headers['Authorization']) {
                    options.headers['Authorization'] = `Bearer ${token}`;
                }
                if (!options.headers['X-Requested-With']) {
                    options.headers['X-Requested-With'] = 'XMLHttpRequest';
                }
            }
        }
        
        // Выполняем оригинальный fetch с модифицированными опциями
        return originalFetch(url, options)
            .then(response => {
                // Если ответ 401 или 403, перенаправляем на страницу логина
                if (response.status === 401 || response.status === 403) {
                    // Очищаем токен и перенаправляем на страницу логина
                    localStorage.removeItem('authToken');
                    deleteCookie('authToken');
                    window.location.href = '/auth/login';
                    return Promise.reject('Требуется авторизация');
                }
                return response;
            });
    };
}

// Функция для проверки существующего токена при загрузке страницы
function checkAuthToken() {
    // Получаем токен сначала из localStorage, затем пробуем из куки
    const token = getAuthToken();
    
    // Получаем текущий путь страницы
    const currentPath = window.location.pathname;
    
    // Список страниц, не требующих авторизации
    const publicPages = ['/', '/auth/login', '/auth/register', '/auth/verify', '/error', '/auth/token-debug'];
    const isPublicPage = publicPages.some(page => currentPath === page) || 
                         currentPath.startsWith('/css/') || 
                         currentPath.startsWith('/js/') || 
                         currentPath.startsWith('/images/');
    
    // Проверяем, является ли устройство мобильным
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
        console.log('Обнаружено мобильное устройство:', navigator.userAgent);
    }
    
    if (token) {
        // Сначала проверяем действительность токена
        validateToken(token)
            .then(isValid => {
                if (isValid) {
                    // Устанавливаем токен во все возможные хранилища
                    syncTokenStorage(token);
                    
                    console.log('Токен аутентификации действителен');
                    
                    // Добавляем класс authenticated к body, чтобы можно было стилизовать страницу
                    document.body.classList.add('authenticated');
                } else {
                    console.log('Токен аутентификации недействителен');
                    clearAuthToken();
                    
                    // Если страница требует аутентификации, перенаправляем
                    if (!isPublicPage) {
                        console.log('Перенаправление на страницу входа (недействительный токен)');
                        redirectToLogin();
                    }
                }
            })
            .catch(error => {
                console.error('Ошибка при проверке токена:', error);
                clearAuthToken();
                
                // Если страница требует аутентификации, перенаправляем
                if (!isPublicPage) {
                    console.log('Перенаправление на страницу входа (ошибка проверки)');
                    redirectToLogin();
                }
            });
    } else {
        console.log('Токен аутентификации не найден');
        
        // Если страница требует аутентификации и токен не найден, перенаправляем
        if (!isPublicPage) {
            console.log('Перенаправление на страницу входа (токен не найден)');
            redirectToLogin();
        }
    }
}

// Безопасное перенаправление на страницу логина
function redirectToLogin() {
    // Проверяем, находимся ли мы уже на странице логина
    if (window.location.pathname === '/auth/login') {
        console.log('Уже на странице логина, не перенаправляем');
        return;
    }
    
    // Для диагностики на мобильных устройствах
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
        // На мобильных устройствах выполняем особый редирект с задержкой и проверкой
        console.log('Выполняется безопасный редирект на мобильном устройстве');
        
        // Добавляем индикатор загрузки для пользователя
        const loadingDiv = document.createElement('div');
        loadingDiv.style.position = 'fixed';
        loadingDiv.style.top = '0';
        loadingDiv.style.left = '0';
        loadingDiv.style.width = '100%';
        loadingDiv.style.height = '100%';
        loadingDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
        loadingDiv.style.display = 'flex';
        loadingDiv.style.justifyContent = 'center';
        loadingDiv.style.alignItems = 'center';
        loadingDiv.style.zIndex = '9999';
        loadingDiv.innerHTML = '<div style="text-align: center;"><div style="border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 50px; height: 50px; margin: 0 auto; animation: spin 2s linear infinite;"></div><p style="margin-top: 20px;">Перенаправление...</p></div>';
        
        // Добавляем стили анимации
        const style = document.createElement('style');
        style.innerHTML = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
        document.head.appendChild(style);
        
        document.body.appendChild(loadingDiv);
        
        // Используем setTimeout для задержки редиректа
        setTimeout(() => {
            // Проверка состояния сети перед редиректом
            if (navigator.onLine) {
                window.location.href = '/auth/login';
            } else {
                alert('Нет подключения к интернету. Повторите попытку позже.');
                loadingDiv.remove();
            }
        }, 500);
    } else {
        // На десктопных устройствах обычный редирект
        window.location.href = '/auth/login';
    }
}

// Получение токена из всех возможных источников
function getAuthToken() {
    // Пробуем из localStorage
    try {
        const localToken = localStorage.getItem('authToken');
        if (localToken) {
            return localToken;
        }
    } catch (e) {
        console.warn('Ошибка при чтении из localStorage:', e);
    }
    
    // Пробуем из sessionStorage
    try {
        const sessionToken = sessionStorage.getItem('authToken');
        if (sessionToken) {
            return sessionToken;
        }
    } catch (e) {
        console.warn('Ошибка при чтении из sessionStorage:', e);
    }
    
    // Пробуем из cookie
    const cookieToken = getCookie('authToken');
    if (cookieToken) {
        // Если токен найден в куках, синхронизируем его с другими хранилищами
        try {
            localStorage.setItem('authToken', cookieToken);
        } catch (e) {
            console.warn('Ошибка при записи в localStorage:', e);
        }
        return cookieToken;
    }
    
    return null;
}

// Синхронизация токена между разными хранилищами
function syncTokenStorage(token) {
    // Сохраняем в localStorage и sessionStorage
    try {
        localStorage.setItem('authToken', token);
    } catch (e) {
        console.warn('Ошибка при записи в localStorage:', e);
    }
    
    try {
        sessionStorage.setItem('authToken', token);
    } catch (e) {
        console.warn('Ошибка при записи в sessionStorage:', e);
    }
    
    // Сохраняем в cookie
    setCookie('authToken', token, 1); // 1 день
}

// Функция для проверки действительности токена
function validateToken(token) {
    return fetch('/auth/validate-token', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => {
        return response.ok;
    })
    .catch(() => {
        return false;
    });
}

// Сохранение токена во всех хранилищах
function saveAuthToken(token) {
    syncTokenStorage(token);
}

// Удаление токена аутентификации из всех хранилищ
function clearAuthToken() {
    try {
        localStorage.removeItem('authToken');
    } catch (e) {
        console.warn('Ошибка при удалении из localStorage:', e);
    }
    
    try {
        sessionStorage.removeItem('authToken');
    } catch (e) {
        console.warn('Ошибка при удалении из sessionStorage:', e);
    }
    
    deleteCookie('authToken');
}

// Функция для установки cookie
function setCookie(name, value, days) {
    let expires = '';
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = '; expires=' + date.toUTCString();
    }
    document.cookie = name + '=' + value + expires + '; path=/';
}

// Функция для удаления cookie
function deleteCookie(name) {
    document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
}

// Получение значения cookie по имени
function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    setupAuthInterceptor();
    checkAuthToken();
}); 