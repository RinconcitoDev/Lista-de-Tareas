const CACHE_NAME = 'todo-list-pwa-cache-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/styles.css',
    '/script.js',
    '/manifest.json',
    './icon-192x192.png', // MODIFICADO: Rutas relativas './'
    './icon-512x512.png'  // MODIFICADO: Rutas relativas './'
];

// **VARIABLE GLOBAL PARA CACHE DE TAREAS EN EL SERVICE WORKER**
let tareasCache = []; // Inicializada vacía, se actualizará con mensajes del cliente

self.addEventListener('install', event => {
    console.log('Service Worker instalado');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache abierta');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('activate', event => {
    console.log('Service Worker activado');
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});

// **FUNCION PARA MOSTRAR NOTIFICACIONES**
function mostrarNotificacion(titulo, cuerpo) {
    console.log('Service Worker: Función mostrarNotificacion() llamada:', titulo, cuerpo); // Mensaje de depuración
    self.registration.showNotification(titulo, {
        body: cuerpo,
        icon: './icon-512x512.png', // MODIFICADO: Ruta relativa './'
        vibrate: [200, 100, 200],
        badge: './icon-192x192.png' // MODIFICADO: Ruta relativa './'
        // Puedes configurar más opciones aquí: https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/showNotification
    });
}

// **FUNCION PARA OBTENER TAREAS DEL CACHE DEL SERVICE WORKER** - **MODIFICADO: AHORA USA LA VARIABLE GLOBAL 'tareasCache'**
function getTasksFromCache() {
    console.log('Service Worker: getTasksFromCache() - Devolviendo tareas desde cache interna del SW.'); // Mensaje de depuración
    return Promise.resolve(tareasCache); // Devolver la variable global 'tareasCache' como promesa
}


// **FUNCION PARA VERIFICAR TAREAS VENCIDAS Y MOSTRAR NOTIFICACIONES** - **MODIFICADO: AHORA USA 'getTasksFromCache()'**
function verificarTareasVencidas() {
    console.log('Service Worker: Verificando tareas vencidas...'); // Mensaje de depuración
    // **¡IMPORTANTE!** Ahora usamos 'getTasksFromCache()' para obtener las tareas desde la cache del SW
    getTasksFromCache().then(tareas => {
        if (tareas && tareas.length > 0) {
            tareas.forEach(tarea => {
                console.log(`Service Worker: Verificando tarea "${tarea.text}", vencimiento: ${tarea.dueDate}, ahora: ${new Date()}`); // Log por cada tarea verificada
                if (tarea.dueDate) {
                    const fechaVencimiento = new Date(tarea.dueDate);
                    const ahora = new Date();

                    if (fechaVencimiento <= ahora && !tarea.completed) {
                        // **TAREA VENCIDA Y NO COMPLETADA - MOSTRAR NOTIFICACION**
                        console.log(`Service Worker: ¡Tarea "${tarea.text}" VENCIDA! - Mostrando notificación`); // Log ANTES de mostrar notificación
                        mostrarNotificacion('¡Tarea Vencida!', `La tarea "${tarea.text}" ha vencido.`);
                        // **OPCIONAL:** Aquí podrías añadir lógica para marcar la tarea como "notificación enviada"
                        // para no repetir la notificación cada minuto si la tarea sigue vencida
                    }
                }
            });
        } else {
            console.log('Service Worker: No hay tareas en cache del SW para verificar.'); // Log si no hay tareas en cache
        }
    });
}

// **EJEMPLO: VERIFICAR TAREAS VENCIDAS CADA MINUTO (AJUSTAR INTERVALO SEGÚN NECESIDADES - BATERIA)**
setInterval(verificarTareasVencidas, 60 * 1000); // Cada 60 segundos (1 minuto)

// **EVENT LISTENER PARA MENSAJES DESDE EL CLIENTE (PWA)** - **MODIFICADO: AHORA GUARDA LAS TAREAS EN 'tareasCache'**
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'tasks-updated') { // **NUEVO TIPO DE MENSAJE: 'tasks-updated'**
        console.log('Service Worker: Recibido mensaje "tasks-updated" del cliente.'); // Mensaje de depuración
        tareasCache = event.data.tasks; // **GUARDAR LAS TAREAS RECIBIDAS EN LA VARIABLE GLOBAL 'tareasCache'**
        console.log('Service Worker: Tareas actualizadas desde el cliente y guardadas en cache interna del SW: ', tareasCache); // Mensaje de depuración (mostrar tareas en cache)
    } else if (event.data && event.data.type === 'getTasks') {
        // **EL CLIENTE (PWA) SOLICITA LAS TAREAS - RESPONDER ENVIANDO LOS DATOS (YA NO ES TAN NECESARIO)**
        // **EN ESTE EJEMPLO, YA NO NECESITAMOS OBTENER LAS TAREAS DESDE localStorage DIRECTAMENTE EN EL SW**
        // **AHORA EL SW USA LA VARIABLE GLOBAL 'tareasCache' QUE SE ACTUALIZA CON MENSAJES DEL CLIENTE**
        // **PERO DEJAMOS ESTE BLOQUE 'getTasks' POR SI EN EL FUTURO QUIERES USARLO PARA ALGO**
        console.warn('Service Worker: Mensaje "getTasks" RECIBIDO del cliente, pero YA NO ES NECESARIO en este ejemplo.'); // Warning - ya no es necesario
        const tareasJSON = localStorage.getItem('tasks'); // **INTENTO DE ACCEDER A localStorage DIRECTAMENTE (PUEDE NO FUNCIONAR EN SW)**
        const tareas = tareasJSON ? JSON.parse(tareasJSON) : [];
        event.ports[0].postMessage({ type: 'tasks', tasks: tareas }); // **ENVIAR TAREAS AL CLIENTE (RESPUESTA)**
    }  else if (event.data && event.data.type === 'update-badge') {
        // **RECIBE MENSAJE PARA ACTUALIZAR EL BADGE (CONTADOR)**
        const badgeCount = event.data.badgeCount;
        if ('setAppBadge' in navigator) {
            if (badgeCount > 0) {
                navigator.setAppBadge(badgeCount).then(() => {
                    console.log('Service Worker: Badge de la app actualizado a:', badgeCount);
                }).catch(error => {
                    console.error('Service Worker: Error al actualizar el badge de la app:', error);
                });
            } else {
                navigator.clearAppBadge().then(() => {
                    console.log('Service Worker: Badge de la app limpiado.');
                }).catch(error => {
                    console.error('Service Worker: Error al limpiar el badge de la app:', error);
                });
            }
        } else {
            console.warn('Service Worker: API de badges de app no soportada en este navegador.');
        }
    }
});