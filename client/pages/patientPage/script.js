
function showNotification(message) {
    console.log('showNotification called with message:', message);
    const notificationContainer = document.getElementById('notification-container');
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerText = message;


    notificationContainer.appendChild(notification);


    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            notificationContainer.removeChild(notification);
        }, 500);
    }, 2000);
}


document.addEventListener('DOMContentLoaded', () => {
    const notification = sessionStorage.getItem('notification');

    if (notification) {
        showNotification(notification);
        sessionStorage.removeItem('notification');
    }


    fetch('/api/patient')
        .then(response => {
            if (!response.ok) {
                throw new Error('Сеть не ответила');
            }
            return response.json();
        })
        .then(data => {
            document.getElementById('content').innerText = data.message;
            sessionStorage.setItem('fullName', data.fullName);
            sessionStorage.setItem('userRole', data.role);
            sessionStorage.setItem('Id', data.Id);
            console.log('id usera0', sessionStorage.getItem('Id'));
        })
        .catch(error => {
            document.getElementById('content').innerText = 'Ошибка: ' + error.message;
        });


    document.getElementById('myAppointments').addEventListener('click', function (event) {
        event.preventDefault();
        sessionStorage.getItem('userRole');
        console.log('in patientpage check');
        window.location.href = '/api/appointment';
    });
    document.getElementById('talonarrow').addEventListener('click', function (event) {
        event.preventDefault();
        sessionStorage.getItem('userRole');
        sessionStorage.getItem('fullName');
        sessionStorage.getItem('Id');
        console.log('in patientpage check');
        window.location.href = '/api/appointment/create';
    });



    document.getElementById('logoutBtn').addEventListener('click', function (event) {
        event.preventDefault();


        fetch('/api/patient/logout', {
            method: 'POST',
            credentials: 'include'
        })
            .then(response => {
                if (response.ok) {
                    console.log('Пользователь вышел из записи');
                    sessionStorage.setItem('notification', 'Вы вышли из учётной записи');
                    window.location.href = '/api';
                }
                else {
                    console.error('Ошибка при выходе');
                }
            })
            .catch(error => {
                console.error('Ошибка сети:', error);
            });
    });


});
