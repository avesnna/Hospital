document.addEventListener('DOMContentLoaded', async () => {
    const fullName = sessionStorage.getItem('fullName');
    const userRole = sessionStorage.getItem('userRole');

    if (fullName) {
        const sessionUserDiv = document.getElementById('sessionUser');
        sessionUserDiv.innerHTML = fullName.replace(' ', '<br>');
    }


    if (userRole === 'patient') {


    }
    loadPatientInfo();
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

    document.getElementById('myAppointments').addEventListener('click', function (event) {
        event.preventDefault();
        console.log('in patientpage check');
        window.location.href = '/api/appointment';
    });

    document.getElementById('checktalons').addEventListener('click', function (event) {
        event.preventDefault();
        console.log('in patientpage check');
        window.location.href = '/api/appointment';
    });
});


async function loadPatientInfo() {
    try {
        const response = await fetch('/api/medicalrecord/my', {
            method: 'GET',
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error('Ошибка при получении данных пациента');
        }

        const data = await response.json();
        updatePatientInfo(data);
    } catch (error) {
        console.error('Ошибка при загрузке данных пациента:', error);
        alert('Не удалось загрузить информацию. Попробуйте еще раз.');
    }
}


function updatePatientInfo(data) {
    document.getElementById('ppf').textContent = data.patient.surname;
    document.getElementById('ppi').textContent = data.patient.name;
    document.getElementById('ppo').textContent = data.patient.secondname;
    document.getElementById('gender').textContent = data.patient.gender === 'M' ? '(М)' : '(Ж)';
    document.getElementById('datebirth').textContent = formatDate(data.patient.birthdate);
    document.getElementById('phonenumber').textContent = data.patient.phonenumber;
    document.getElementById('homeadress').textContent = data.patient.adress;
    document.getElementById('activetalons').textContent = data.appointmentIds.length;
    document.getElementById('age').textContent = `(${calculateAge(data.patient.birthdate)})`;
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