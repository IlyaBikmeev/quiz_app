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
    const token = localStorage.getItem('authToken');
    
    // Получаем текущий путь страницы
    const currentPath = window.location.pathname;
    
    // Список страниц, не требующих авторизации
    const publicPages = ['/', '/auth/login', '/auth/register', '/auth/verify', '/error'];
    const isPublicPage = publicPages.some(page => currentPath === page) || 
                         currentPath.startsWith('/css/') || 
                         currentPath.startsWith('/js/') || 
                         currentPath.startsWith('/images/');
    
    if (token) {
        // Сначала проверяем действительность токена
        validateToken(token)
            .then(isValid => {
                if (isValid) {
                    // Устанавливаем токен в cookie для поддержки non-JS запросов
                    setCookie('authToken', token, 1); // 1 день
                    
                    console.log('Токен аутентификации действителен');
                    
                    // Добавляем класс authenticated к body, чтобы можно было стилизовать страницу
                    document.body.classList.add('authenticated');
                } else {
                    console.log('Токен аутентификации недействителен');
                    clearAuthToken();
                    
                    // Если страница требует аутентификации, перенаправляем
                    if (!isPublicPage) {
                        console.log('Перенаправление на страницу входа');
                        window.location.href = '/auth/login';
                    }
                }
            })
            .catch(error => {
                console.error('Ошибка при проверке токена:', error);
                clearAuthToken();
                
                // Если страница требует аутентификации, перенаправляем
                if (!isPublicPage) {
                    console.log('Перенаправление на страницу входа');
                    window.location.href = '/auth/login';
                }
            });
    } else {
        console.log('Токен аутентификации не найден');
        
        // Если страница требует аутентификации и токен не найден, перенаправляем
        if (!isPublicPage) {
            console.log('Перенаправление на страницу входа');
            window.location.href = '/auth/login';
        }
    }
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

// Сохранение токена в localStorage и cookie
function saveAuthToken(token) {
    localStorage.setItem('authToken', token);
    setCookie('authToken', token, 1); // 1 день
}

// Удаление токена аутентификации
function clearAuthToken() {
    localStorage.removeItem('authToken');
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

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    setupAuthInterceptor();
    checkAuthToken();
}); 