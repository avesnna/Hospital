

document.addEventListener('DOMContentLoaded', async () => {
    const fullName = sessionStorage.getItem('fullName');
    const userRole = sessionStorage.getItem('userRole');
    const patientId = sessionStorage.getItem('Id');
    const notification = sessionStorage.getItem('notification');


    if (notification) {

        showNotification(notification);
        sessionStorage.removeItem('notification');
    }
    if (fullName) {
        const sessionUserDiv = document.getElementById('sessionUser');
        sessionUserDiv.innerHTML = fullName.replace(' ', '<br>');
    }


    if (userRole === 'patient') {

    }

    loadAppointments();

    document.getElementById('logoutBtn').addEventListener('click', function (event) {
        event.preventDefault();


        fetch('/api/patient/logout', {
            method: 'POST',
            credentials: 'include'
        })
            .then(response => {
                if (response.ok) {
                    console.log('Пользователь вышел из записи');
                    sessionStorage.removeItem('fullName');
                    sessionStorage.removeItem('userRole');
                    sessionStorage.removeItem('Id');
                    sessionStorage.setItem('notification', 'Вы вышли из учётной записи');
                    window.location.href = '/api';
                } else {
                    console.error('Ошибка при выходе');
                }
            })
            .catch(error => {
                console.error('Ошибка сети:', error);
            });
    });

    document.querySelectorAll('.downloadtalon').forEach(button => {
        button.addEventListener('click', downloadAppointments);
    });


});


async function loadAppointments() {
    try {
        const response = await fetch('/api/appointment/all', {
            method: 'GET',
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error('Ошибка при получении талонов');
        }

        const appointments = await response.json();
        renderAppointments(appointments);

    } catch (error) {
        console.error('Ошибка при загрузке талонов:', error);
        const talonsList = document.getElementById('talonsList');
        talonsList.innerHTML = '<p>Ошибка при загрузке талонов</p>';
    }
}


function renderAppointments(appointments) {
    const talonsList = document.getElementById('talonsList');


    if (appointments.length === 0) {
        talonsList.innerHTML = '<p1>Похоже, что у вас нет активных талонов</p1>';
    } else {
        talonsList.innerHTML = '';

        appointments.forEach((appointment, index) => {
            const talonContainer = document.createElement('div');
            talonContainer.className = 'onetalon-container';
            talonContainer.id = `onetalon-container${index + 1}`;

            talonContainer.innerHTML = `
                <div class="talon-infoid">
                    Номер талона:
                    <p class="idtalona">${appointment.appointmentId}</p>
                </div>
                <div class="talon-when">
                    <p id="weekday">${getWeekday(appointment.date)}</p>
                    <p id="date">${formatDate(appointment.date)}</p>
                    <p id="time">${formatTime(appointment.time)}</p>
                </div>
                <div class="doctor">
                    <p class="speciality">${appointment.speciality}</p>
                    <p class="fio">${appointment.specialistFullName}</p>
                    <div class="cabinet-info">
                        <p class="cabinet">${appointment.cabinet}</p> кабинет
                    </div>
                </div>
                <button class="downloadtalon" id="downloadtalon${index + 1}">Скачать файлом</button>
                <button class="deletetalon" data-id="${appointment.appointmentId}">Удалить талон</button>
            `;


            talonContainer.querySelector(`.downloadtalon`).addEventListener('click', () => {

                console.log(`Скачивание талона ${appointment.appointmentId}`);
            });



            talonsList.appendChild(talonContainer);
            talonContainer.querySelector('.downloadtalon').addEventListener('click', () => {
                downloadAppointmentTXT(appointment);
            });

            talonContainer.querySelector(`.deletetalon`).addEventListener('click', async () => {
                const appointmentId = event.target.getAttribute('data-id');
                showConfirmationModal(appointmentId);
            });

        });
    }
}

function showConfirmationModal(appointmentId) {
    currentAppointmentId = appointmentId;
    const confirmationMessage = document.querySelector('#confirmation-modal .modal-content p');
    confirmationMessage.innerText = `Вы уверены, что хотите удалить талон № ${appointmentId}?`;
    document.getElementById('confirmation-modal').style.display = 'flex';
}


document.getElementById('confirmDelete').addEventListener('click', async () => {
    if (currentAppointmentId) {
        await deleteAppointment(currentAppointmentId);
    }
    closeConfirmationModal();
});


document.getElementById('cancelDelete').addEventListener('click', closeConfirmationModal);


function closeConfirmationModal() {
    document.getElementById('confirmation-modal').style.display = 'none';
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', options);
}

function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
}

function getWeekday(dateString) {
    const date = new Date(dateString);
    const weekdays = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
    return weekdays[date.getDay()];
}

function downloadAppointmentTXT(appointment) {
    const fullName = sessionStorage.getItem('fullName') || 'Неизвестный пациент';
    let txtContent = `ПАЦИЕНТ: ${fullName}\n\n`;

    txtContent += `Номер талона: ${appointment.appointmentId}\n`;
    txtContent += `Специальность врача: ${appointment.speciality}\n`;
    txtContent += `ФИО врача: ${appointment.specialistFullName}\n`;
    txtContent += `Дата приёма: ${formatDate(appointment.date)}\n`;
    txtContent += `Время приёма: ${formatTime(appointment.time)}\n`;
    txtContent += `Кабинет: ${appointment.cabinet}\n`;

    const blob = new Blob([txtContent], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ТАЛОН №_${appointment.appointmentId}.txt`;
    link.click();
}

async function deleteAppointment(appointmentId) {
    try {
        const response = await fetch(`/api/appointment/${appointmentId}`, {
            method: 'DELETE',
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error('Ошибка при удалении талона');
        }
        showNotification('Талон успешно удалён');
        loadAppointments();
    } catch (error) {
        console.error('Ошибка при удалении талона:', error);

    }
}

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
    }, 3000);
}