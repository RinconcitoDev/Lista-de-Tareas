var tasks;
console.log("script.js: INICIO DE EJECUCION - VERSIÓN ACTUALIZADA VERIFICADA");

document.addEventListener('DOMContentLoaded', function() {
    console.log("script.js: DOM completamente cargado y analizado");

    // **1. DECLARACIONES DE VARIABLES DEL DOM:**
    const taskInput = document.getElementById('taskInput');
    const addButton = document.getElementById('addButton');
    const taskList = document.getElementById('taskList');
    const dueDateInput = document.getElementById('dueDateInput');

    console.log("script.js: Tareas cargadas desde localStorage (ANTES de getTasksFromStorage):", tasks); // Log ANTES de cargar tareas

    // **2. DEFINICIONES DE FUNCIONES (en este orden):**
    function formatDate(dateTimeString) {
        if (!dateTimeString) return "Sin fecha límite";
        const date = new Date(dateTimeString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    }

    function saveTask(event) {
        event.preventDefault();
        const taskText = taskInput.value.trim();
        if (taskText) {
            const dueDateValue = dueDateInput.value;
            const newTask = {
                id: Date.now(),
                text: taskText,
                completed: false,
                dueDate: dueDateValue || null
            };
            tasks.push(newTask);
            localStorage.setItem('tasks', JSON.stringify(tasks));
            taskInput.value = '';
            dueDateInput.value = '';
            renderTasks();
            updateBadge();

            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'tasks-updated',
                    tasks: tasks
                });
                console.log('script.js: Tareas enviadas al Service Worker después de guardar.');
            } else {
                console.warn('script.js: Service Worker no activo o no disponible para enviar tareas.');
            }
        }
    }

    function handleTaskActions(event) {
        if (event.target.tagName === 'BUTTON') {
            const button = event.target;
            const taskItem = button.parentElement;
            const taskIndex = Array.from(taskList.children).indexOf(taskItem);

            if (button.textContent === 'Borrar') {
                deleteTask(taskIndex);
            } else if (button.textContent === 'Completar' || button.textContent === 'Pendiente') {
                toggleComplete(taskIndex);
            }
        }
    }

    function deleteTask(index) {
        if (index !== -1 && index !== null && index !== undefined) {
            tasks.splice(index, 1);
            saveTasks();
            renderTasks();
        } else {
            console.warn("deleteTask: Índice inválido recibido:", index, ". No se borró ninguna tarea.");
        }
    }

    function toggleComplete(index) {
        tasks[index].completed = !tasks[index].completed;
        saveTasks();
        renderTasks();
    }

    function renderTasks() {
        taskList.innerHTML = "";
        tasks.forEach((task, index) => {
            const taskItem = document.createElement('li');
            if (task.completed) {
                taskItem.classList.add('completed');
            }

            const taskTextSpan = document.createElement('span');
            taskTextSpan.textContent = task.text;
            taskTextSpan.addEventListener('click', function(event){
                event.stopPropagation();
                console.log("Clic en el texto de la tarea:", task.text);
            });

            const dueDateSpan = document.createElement('span');
            dueDateSpan.classList.add('dueDate');
            if (task.dueDate) {
                dueDateSpan.textContent = formatDate(task.dueDate);
            } else {
                dueDateSpan.textContent = "Sin fecha límite";
            }

            const completeButton = document.createElement('button');
            completeButton.textContent = task.completed ? 'Pendiente' : 'Completar';
            completeButton.addEventListener('click', () => toggleComplete(index));

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Borrar';
            deleteButton.addEventListener('click', () => deleteTask(index));

            taskItem.appendChild(taskTextSpan);
            taskItem.appendChild(dueDateSpan);
            taskItem.appendChild(completeButton);
            taskItem.appendChild(deleteButton);
            taskList.appendChild(taskItem);
        });
    }

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'tasks-updated',
                tasks: tasks
            });
            console.log('script.js: Tareas enviadas al Service Worker después de guardar (desde saveTasks).');
        } else {
            console.warn('script.js: Service Worker no activo o no disponible para enviar tareas (desde saveTasks).');
        }
    }

    function updateBadge() {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            const pendingTasksCount = tasks.filter(task => !task.completed).length;
            navigator.serviceWorker.controller.postMessage({
                type: 'update-badge',
                badgeCount: pendingTasksCount
            });
        }
    }

    function checkDueDates() {
        console.log('script.js: checkDueDates: INICIO');

        if (!tasks) {
            console.error("checkDueDates: ERROR CRÍTICO: ¡tasks es UNDEFINED!  La carga de tareas desde localStorage falló o aún no se ha completado correctamente.  Las notificaciones NO funcionarán.  Revisa la función getTasksFromStorage() y la carga de datos.");
            return;
        }

        if (!Array.isArray(tasks)) {
            console.warn("checkDueDates: tasks NO es un array (pero NO es undefined, algo inesperado). Inicializando como array vacío por seguridad, pero puede haber un problema. Revisa la lógica de carga de tareas.");
            tasks = [];
            console.log('script.js: checkDueDates: tasks inicializado como array vacío (por seguridad, aunque algo inesperado)');
            return;
        }

        tasks.forEach((task, index) => {
            if (task.dueDate && !task.completed) {
                const dueDate = new Date(task.dueDate);
                const now = new Date();
                if (dueDate <= now) {
                    alert(`¡Tarea "${task.text}" ha vencido!`);
                }
            }
        });
        console.log('script.js: checkDueDates: FIN');
    }

    function getTasksFromStorage() {
        console.log('script.js: getTasksFromStorage: INICIO');
        const storedTasks = localStorage.getItem('tasks');
        console.log("script.js: getTasksFromStorage: ANTES de asignar valor a 'tasks', tasks =", tasks);
        tasks = storedTasks ? JSON.parse(storedTasks) : [];
        renderTasks();
        updateBadge();

        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'tasks-updated',
                tasks: tasks
            });
            console.log('script.js: Tareas enviadas al Service Worker después de cargar desde localStorage.');
        } else {
            console.warn('script.js: Service Worker no activo o no disponible para enviar tareas.');
        }
        console.log('script.js: getTasksFromStorage: FIN');
        return Promise.resolve(tasks);
    }


    console.log("script.js: Tareas cargadas desde localStorage (DESPUÉS de getTasksFromStorage):", tasks); // Log DESPUÉS de cargar tareas - ESTE LOG AHORA PROBABLEMENTE SEA ANTES DE CARGAR REALMENTE LAS TAREAS PORQUE getTasksFromStorage SE LLAMA ASINCRONAMENTE

    // **4. EVENT LISTENERS Y CÓDIGO ADICIONAL DE DOMContentLoaded:**
    addButton.addEventListener('click', saveTask);
    taskList.addEventListener('click', handleTaskActions);


    // **SOLICITAR PERMISO DE NOTIFICACIONES AL INICIO**
    if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                console.log('Permiso de notificaciones concedido.');
            } else if (permission === 'denied') {
                console.warn('Permiso de notificaciones denegado.');
            } else if (permission === 'default') {
                console.log('Permiso de notificaciones en estado "default" (el usuario puede ser preguntado de nuevo).');
            }
        });
    } else {
        console.error('Las notificaciones no están soportadas en este navegador.');
    }

    // Registrar Service Worker (para PWA)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./service-worker.js')
            .then(registration => {
                console.log('script.js: ServiceWorker registrado con éxito: ', registration);
                getTasksFromStorage()
                    .then(loadedTasks => {
                        console.log('script.js: getTasksFromStorage() promesa RESUELTA. Tareas cargadas:', loadedTasks);
                        checkDueDates();
                    })
                    .catch(error => {
                        console.error('script.js: Error en la promesa getTasksFromStorage():', error);
                    });
            })
            .catch(registrationError => {
                console.log('script.js: Error al registrar el ServiceWorker: ', registrationError);
            });
    }

    // INICIAR TEMPORIZADOR PARA REVISAR FECHAS LÍMITE CADA MINUTO
    setInterval(checkDueDates, 60000);
    // checkDueDates(); // <-- **NO LLAMAR a checkDueDates() DIRECTAMENTE AQUÍ - AHORA SE LLAMA DESDE EL .then() ANIDADO DESPUÉS DE CARGAR LAS TAREAS**
    updateBadge();


}); // FIN DE document.addEventListener('DOMContentLoaded'