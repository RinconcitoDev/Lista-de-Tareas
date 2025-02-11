var tasks;
console.log("script.js: INICIO DE EJECUCION - VERSIÓN ACTUALIZADA VERIFICADA");


document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM completamente cargado y analizado");

    // **1. DECLARACIONES DE VARIABLES DEL DOM:**
    const taskInput = document.getElementById('taskInput');
    const addButton = document.getElementById('addButton');
    const taskList = document.getElementById('taskList');
    const dueDateInput = document.getElementById('dueDateInput');

    console.log("Tareas cargadas desde localStorage (ANTES de getTasksFromStorage):", tasks); // Log ANTES de cargar tareas

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

    function renderTasks() { // **DEFINICIÓN DE renderTasks - IMPORTANTE: DEFINIRLA AQUÍ**
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
            console.log('script.js: Tareas enviadas al Service Worker después de guardar (desde saveTasks).'); // MODIFICADO LOG
        } else {
            console.warn('script.js: Service Worker no activo o no disponible para enviar tareas (desde saveTasks).'); // MODIFICADO LOG
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
        tasks.forEach((task, index) => {
            if (task.dueDate && !task.completed) {
                const dueDate = new Date(task.dueDate);
                const now = new Date();
                if (dueDate <= now) {
                    alert(`¡Tarea "${task.text}" ha vencido!`);
                }
            }
        });
    }

    function getTasksFromStorage() {
      const storedTasks = localStorage.getItem('tasks');
      console.log("getTasksFromStorage: ANTES de asignar valor a 'tasks', tasks =", tasks);
      tasks = storedTasks ? JSON.parse(storedTasks) : [];
      renderTasks(); // Ahora OK porque renderTasks se define ANTES de llamar a getTasksFromStorage dentro de DOMContentLoaded
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
      return tasks;
  }

    console.log("Tareas cargadas desde localStorage (DESPUÉS de getTasksFromStorage):", tasks); // Log DESPUÉS de cargar tareas


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
                console.log('ServiceWorker registrado con éxito: ', registration);
                getTasksFromStorage(); 
            })
            .catch(registrationError => {
                console.log('Error al registrar el ServiceWorker: ', registrationError);
            });
    }

    // INICIAR TEMPORIZADOR PARA REVISAR FECHAS LÍMITE CADA MINUTO
    setInterval(checkDueDates, 60000);
    checkDueDates();
    updateBadge();


}); // FIN DE document.addEventListener('DOMContentLoaded'