
function showNotification(message) {
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

async function loadSchedule(specialistID) {
    try {
        const response = await fetch(`/api/specialist/${specialistID}`);

        if (!response.ok) {
            throw new Error('Ошибка при загрузке расписания');
        }

        const data = await response.json();


        if (data.schedule) {
            const weekdays = data.schedule.weekdays.split(',').map(day => day.trim()).join(', ');
            const starttime = formatTime(data.schedule.starttime);
            const endtime = formatTime(data.schedule.endtime);


            document.getElementById('weekdaysValue').innerText = weekdays;
            document.getElementById('startTimeValue').innerText = starttime;
            document.getElementById('endTimeValue').innerText = endtime;
        } else {
            document.getElementById('weekdaysValue').innerText = 'Расписание не найдено';
            document.getElementById('startTimeValue').innerText = '';
            document.getElementById('endTimeValue').innerText = '';
        }

    } catch (error) {
        console.error('Ошибка при загрузке расписания:', error);
        showNotification('Ошибка при загрузке расписания.');
    }
}




async function loadSchedule(specialistID) {
    try {
        const response = await fetch(`/api/specialist/${specialistID}`);

        if (!response.ok) {
            throw new Error('Ошибка при загрузке расписания');
        }

        const data = await response.json();


        if (data.schedule) {
            const weekdays = data.schedule.weekdays.split(',').map(day => day.trim()).join(', ');
            const starttime = formatTime(data.schedule.starttime);
            const endtime = formatTime(data.schedule.endtime);


            document.getElementById('weekdaysValue').innerText = weekdays;
            document.getElementById('startTimeValue').innerText = starttime;
            document.getElementById('endTimeValue').innerText = endtime;
        } else {
            document.getElementById('weekdaysValue').innerText = 'Расписание не найдено';
            document.getElementById('startTimeValue').innerText = '';
            document.getElementById('endTimeValue').innerText = '';
        }

    } catch (error) {
        console.error('Ошибка при загрузке расписания:', error);
        showNotification('Ошибка при загрузке расписания.');
    }
}
function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
}

async function loadSpecialistInfo(specialistID) {
    try {
        const response = await fetch(`/api/specialist/${specialistID}`, {
            method: 'GET',
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error('Ошибка при получении данных специалиста');
        }

        const data = await response.json();
        console.log('API Response:', data);


        if (data.specialist && data.specialist.departmentId) {
            sessionStorage.setItem('departmentId', data.specialist.departmentId);
            sessionStorage.setItem('Id', data.specialist.id);
            console.log('Saved Department ID:', data.specialist.departmentId);
        }

        updateSpecialistInfo(data);


        const departmentID = sessionStorage.getItem('departmentId');
        console.log('Department ID:', departmentID);
    } catch (error) {
        console.error('Ошибка при загрузке данных специалиста:', error);
        showNotification('Не удалось загрузить информацию. Попробуйте еще раз.');
    }
}


function updateSpecialistInfo(data) {
    document.getElementById('ppf').textContent = data.specialist.surname;
    document.getElementById('ppi').textContent = data.specialist.name;
    document.getElementById('ppo').textContent = data.specialist.secondname;

    document.getElementById('datebirth').textContent = formatDate(data.personalinfo.birthdate);
    document.getElementById('phonenumber').textContent = data.personalinfo.phonenumber;
    document.getElementById('homeadress').textContent = data.personalinfo.adress;
    document.getElementById('speciality').textContent = data.specialist.speciality;
    document.getElementById('age').textContent = `(${calculateAge(data.personalinfo.birthdate)})`;
}


function formatDate(dateString) {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', options);
}


function calculateAge(birthdate) {
    const birthDate = new Date(birthdate);
    const ageDiff = Date.now() - birthDate.getTime();
    const ageDate = new Date(ageDiff);
    const age = Math.abs(ageDate.getUTCFullYear() - 1970);


    let ageWord = 'лет';
    if (age % 10 === 1 && age % 100 !== 11) {
        ageWord = 'год';
    } else if ([2, 3, 4].includes(age % 10) && ![12, 13, 14].includes(age % 100)) {
        ageWord = 'года';
    }

    return `${age} ${ageWord}`;
}



document.addEventListener('DOMContentLoaded', () => {
    const fullName = sessionStorage.getItem('fullName');
    const specialistID = sessionStorage.getItem('Id');
    console.log('Специалист ID при загрузке страницы:', specialistID)
    const notification = sessionStorage.getItem('notification');

    if (notification) {
        showNotification(notification);
        sessionStorage.removeItem('notification');
    }

    if (fullName) {
        const sessionUserDiv = document.getElementById('sessionUser');
        sessionUserDiv.innerHTML = fullName.replace(' ', '<br>');
    }


    if (specialistID) {
        loadSpecialistInfo(specialistID);
        loadSchedule(specialistID);
    } else {
        showNotification('ID специалиста не найден.');
    }


    const departmentID = sessionStorage.getItem('departmentId');
    console.log('Department ID:', departmentID);

    document.getElementById('logoutBtn').addEventListener('click', function (event) {
        event.preventDefault();


        fetch('/api/specialist/logout', {
            method: 'POST',
            credentials: 'include'
        })
            .then(response => {
                if (response.ok) {
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



    if (specialistID) {
        loadSchedule(specialistID);
        loadSpecialistInfo(specialistID);
    } else {
        showNotification('ID специалиста не найден.');
    }
});
