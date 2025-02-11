// service-worker.js

const CACHE_NAME = 'pwa-task-manager-v1';
const urlsToCache = [
    './',
    'index.html',
    'styles.css',
    'script.js',
    'manifest.json',
    './icon-192x192.png',
    './icon-512x512.png'
];

self.addEventListener('install', event => {
    console.log('Service Worker instalado'); // CONSOLE LOG EN INSTALL
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache abierta'); // CONSOLE LOG AL ABRIR CACHÉ
                return cache.addAll(urlsToCache);
            })
            .catch(error => {
                console.error('Error al añadir URLs a la caché en install:', error); // CONSOLE LOG DE ERROR EN INSTALL
            })
    );
});

self.addEventListener('activate', event => {
    console.log('Service Worker activado'); // CONSOLE LOG EN ACTIVATE
    const cacheWhitelist = [CACHE_NAME];

    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('Service Worker: Borrando caché antigua:', cacheName); // CONSOLE LOG AL BORRAR CACHÉ ANTIGUA
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                return response || fetch(event.request);
            })
    );
});


self.addEventListener('message', event => {
    console.log('Service Worker Recibió mensaje:', event.data); // CONSOLE LOG AL RECIBIR MENSAJE

    if (event.data.type === 'check-due-dates') {
        console.log('Service Worker: Mensaje recibido para verificar fechas límite.'); // CONSOLE LOG ESPECÍFICO
        checkDueDatesAndNotify(event); // Llama a la función para verificar fechas y notificar
    } else if (event.data.type === 'tasks-updated') {
        console.log('Service Worker: Mensaje recibido de actualización de tareas.'); // CONSOLE LOG ESPECÍFICO
        // ... (puedes añadir lógica adicional si es necesario al actualizar tareas) ...
    } else if (event.data.type === 'update-badge') {
        console.log('Service Worker: Mensaje recibido para actualizar badge.'); // CONSOLE LOG ESPECÍFICO
        // ... (puedes añadir lógica adicional para badge si es necesario) ...
    }
});


function checkDueDatesAndNotify(event) {
    console.log('Service Worker: checkDueDatesAndNotify INICIO'); // CONSOLE LOG AL INICIO DE LA FUNCIÓN
    const tasks = event.data.tasks || []; // Obtén las tareas del mensaje o usa un array vacío por defecto
    console.log('Service Worker: Tareas recibidas en checkDueDatesAndNotify:', tasks); // CONSOLE LOG DE LAS TAREAS RECIBIDAS

    tasks.forEach(task => {
        if (task.dueDate && !task.completed) {
            const dueDate = new Date(task.dueDate);
            const now = new Date();
            if (dueDate <= now) {
                console.log('Service Worker: Tarea VENCIDA detectada:', task.text); // CONSOLE LOG DE TAREA VENCIDA DETECTADA
                showNotification(`¡Tarea vencida!`, `La tarea "${task.text}" ha vencido.`);
            }
        }
    });
    console.log('Service Worker: checkDueDatesAndNotify FIN'); // CONSOLE LOG AL FINAL DE LA FUNCIÓN
}


function showNotification(title, body) {
    console.log('Service Worker: showNotification INICIO', title, body); // CONSOLE LOG AL INICIO DE showNotification
    self.registration.showNotification(title, {
        body: body,
        icon: './icon-512x512.png',
        badge: './icon-192x192.png'
    }).then(() => {
        console.log('Service Worker: Notificación mostrada con éxito:', title); // CONSOLE LOG SI LA NOTIFICACIÓN SE MUESTRA BIEN
    }).catch(error => {
        console.error('Service Worker: Error al mostrar la notificación:', error); // CONSOLE LOG DE ERROR AL MOSTRAR NOTIFICACIÓN
    });
    console.log('Service Worker: showNotification FIN'); // CONSOLE LOG AL FINAL DE showNotification
}