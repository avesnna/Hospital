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
document.addEventListener('DOMContentLoaded', () => {
    const fullName = sessionStorage.getItem('fullName');
    const specialistID1 = sessionStorage.getItem('Id');
    const specialistID = parseInt(specialistID1, 10);
    console.log('ID специалиста:', specialistID);
    const notification = sessionStorage.getItem('notification');

    const patientsContainer = document.getElementById('patientsContainer');

    const button1 = document.getElementById('button1');
    const button2 = document.getElementById('button2');
    const indicator = document.querySelector('.indicator');
    const sortl1 = document.querySelector('.sortl1');
    const sortn1 = document.querySelector('.sortn1');
    const sortl2 = document.querySelector('.sortl2');
    const sortn2 = document.querySelector('.sortn2');
    const modal = document.querySelector('.modal');
    const closeModal = modal.querySelector('.close');
    const modalTitle = modal.querySelector('h2');



    const button3 = document.querySelector('.button3');

    let specialistSchedule;

    function setupRecordButtons() {
        const buttons = document.querySelectorAll('.button3');
        buttons.forEach(button => {
            button.addEventListener('click', async () => {
                const patientRecord = button.closest('.record-container');
                const patientIdElement = patientRecord.querySelector('.activetalons');
                const patientId = patientIdElement ? patientIdElement.textContent.trim() : null;
                console.log('patientId:', patientId);



                const patientFullName = patientRecord.querySelector('.patient-fio').innerText;


                const cleanedFullName = patientFullName.replace(/\n/g, ' ').trim();

                document.getElementById('patientFullName').innerText = cleanedFullName;

                try {
                    const response = await fetch(`/api/specialist/${specialistID}`);
                    const data = await response.json();
                    const specialistFullName = `${data.specialist.surname} ${data.specialist.name} ${data.specialist.secondname}`;
                    const specialistSpeciality = data.specialist.speciality;


                    const formattedText = `${specialistFullName} (${specialistSpeciality})`;


                    document.getElementById('specialistSpecialty').innerText = formattedText;


                    specialistSchedule = data.schedule;
                    console.log(specialistSchedule);
                    populateDatePicker();

                } catch (error) {
                    console.error('Ошибка при получении информации о специалисте:', error);
                }


                document.querySelector('.modal').style.display = 'block';
                document.getElementById('appointmentForm').setAttribute('data-patient-id', patientId);
            });
        });
    }

    function populateDatePicker() {
        if (!specialistSchedule) return;

        const today = new Date();
        const availableDates = [];
        const weekdays = specialistSchedule.weekdays.split(' ');

        console.log('Рабочие дни специалиста:', weekdays);

        for (let i = 0; i <= 30; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            const dayOfWeek = date.toLocaleString('ru-RU', { weekday: 'short' });


            const weekDaysMap = {
                'пн': 'пн',
                'вт': 'вт',
                'ср': 'ср',
                'чт': 'чт',
                'пт': 'пт',
                'сб': 'сб',
                'вс': 'вс'
            };


            const formattedDay = weekDaysMap[dayOfWeek];

            if (weekdays.includes(formattedDay)) {
                availableDates.push(date);
            }
        }

        console.log('Доступные даты:', availableDates);

        flatpickr("#date", {
            enable: availableDates,
            minDate: today,
            dateFormat: "Y-m-d",
            locale: {
                firstDayOfWeek: 1,
                weekdays: {
                    shorthand: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
                    longhand: ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"]
                },
                months: {
                    shorthand: ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"],
                    longhand: ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"]
                }
            },
            onChange: function (selectedDates) {
                if (selectedDates.length) {
                    populateTimeOptions(selectedDates[0]);
                }
            }
        });
    }

    function populateTimeOptions() {
        if (!specialistSchedule) return;

        const startTime = specialistSchedule.starttime;
        const endTime = specialistSchedule.endtime;

        const startHour = startTime.split(':').map(Number);
        const endHour = endTime.split(':').map(Number);


        const timeOptions = [];

        for (let hour = startHour[0]; hour <= endHour[0]; hour++) {
            for (let minute = (hour === startHour[0] ? startHour[1] : 0); minute < 60; minute += 30) {

                if (hour === endHour[0] && minute > endHour[1]) break;
                timeOptions.push(`${hour}:${minute < 10 ? '0' : ''}${minute}`);
            }
        }


        $('#time').timepicker({
            timeFormat: 'H:i',
            interval: 30,
            minTime: `${startHour[0]}:${(startHour[1] < 10 ? '0' : '') + startHour[1]}`,
            maxTime: `${endHour[0]}:${(endHour[1] < 10 ? '0' : '') + endHour[1]}`,
            dynamic: false,
            dropdown: true,
            scrollbar: true,

            change: function (time) {

            }
        });


        timeOptions.forEach(time => {
            $('#time').timepicker('addTime', time);
        });
    }
    document.getElementById('appointmentForm').addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = new FormData(event.target);
        const specialistId = sessionStorage.getItem('Id');


        const patientId = event.target.getAttribute('data-patient-id');
        console.log('patientId:', patientId);
        const date = formData.get('date');
        const time = formData.get('time');

        const data = {
            patientId,
            date,
            time,
            specialistId
        };

        try {
            const response = await fetch('/api/appointment/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
                credentials: 'include'
            });

            if (response.ok) {
                const result = await response.json();


                sessionStorage.setItem('notification', 'Талон успешно оформлен!');

                window.location.href = '/api/patient/s';
            } else {
                const error = await response.json();
                document.getElementById('notification').textContent = error.message;
            }
        } catch (error) {
            console.error('Ошибка при создании талона:', error);
            document.getElementById('notification').textContent = 'Ошибка при создании талона';
        }
    });

    document.querySelector('.close').addEventListener('click', () => {
        document.querySelector('.modal').style.display = 'none';
    });


    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });


    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    let isMyPatientsView = true;
    let currentSortOrder = 'asc';


    function getUrlParameter(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }


    const activeButton = getUrlParameter('activeButton');


    if (activeButton === 'button1') {
        button1.classList.add('active');
        indicator.style.left = '0%';
        fetchMyPatients();
    } else if (activeButton === 'button2') {
        button2.classList.add('active');
        indicator.style.left = '50%';
        fetchAllPatients();
        isMyPatientsView = false;
    } else {
        button1.classList.add('active');
        indicator.style.left = '0%';
        fetchMyPatients();
    }


    updateSortButtonsVisibility();


    button1.addEventListener('click', () => {
        indicator.style.left = '0%';
        button1.classList.add('active');
        button2.classList.remove('active');
        isMyPatientsView = true;
        updateSortButtonsVisibility();
        fetchMyPatients();
    });

    button2.addEventListener('click', () => {
        indicator.style.left = '50%';
        button2.classList.add('active');
        button1.classList.remove('active');
        isMyPatientsView = false;
        updateSortButtonsVisibility();
        fetchAllPatients();
    });


    function updateSortButtonsVisibility() {
        if (isMyPatientsView) {
            sortn1.style.display = 'block';
            sortl1.style.display = 'none';
            sortn2.style.display = 'none';
            sortl2.style.display = 'none';
        } else {
            sortn2.style.display = 'none';
            sortl2.style.display = 'block';
            sortn1.style.display = 'none';
            sortl1.style.display = 'none';
        }
    }


    sortn1.addEventListener('click', () => {
        currentSortOrder = 'desc';
        sortn1.style.display = 'none';
        sortl1.style.display = 'block';
        fetchMyPatients();
    });

    sortl1.addEventListener('click', () => {
        currentSortOrder = 'asc';
        sortl1.style.display = 'none';
        sortn1.style.display = 'block';
        fetchMyPatients();
    });

    sortn2.addEventListener('click', () => {
        currentSortOrder = 'desc';
        sortn2.style.display = 'none';
        sortl2.style.display = 'block';
        fetchAllPatients();
    });

    sortl2.addEventListener('click', () => {
        currentSortOrder = 'asc';
        sortl2.style.display = 'none';
        sortn2.style.display = 'block';
        fetchAllPatients();
    });

    async function fetchAllPatients() {
        const patientsContainer = document.getElementById('patientsContainer');
        patientsContainer.innerHTML = '';

        try {
            const response = await fetch('/api/patient/all');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const patients = await response.json();


            if (currentSortOrder === 'asc') {
                patients.sort((a, b) => a.id - b.id);
            } else {
                patients.sort((a, b) => b.id - a.id);
            }

            console.log('Полученные пациенты:', patients);


            displayAllPatients(patients);
        } catch (error) {
            console.error('Ошибка при получении пациентов:', error);
        }
    }

    function displayAllPatients(patients) {
        const patientsContainer = document.getElementById('patientsContainer');
        patientsContainer.innerHTML = '';


        if (patients.length === 0) {
            const noPatientsMessage = document.createElement('p');
            noPatientsMessage.innerText = 'Нет пациентов для отображения.';
            patientsContainer.appendChild(noPatientsMessage);
            return;
        }

        patients.forEach(patient => {

            const patientRecord = document.createElement('div');
            patientRecord.className = 'record-container';


            patientRecord.innerHTML = `
                <div class="row4">
                    <div class="activetalons-t">Номер пациента:</div>
                    <div class="activetalons">${patient.id}</div>
                </div>
                <div class="patient-fio">
                    <p>${patient.surname}</p>
                    <p>${patient.name}</p>
                    <p>${patient.secondname}</p>
                </div>
                <div class="gender">(${patient.gender === 'F' ? 'Ж' : 'М'})</div>
                <div class="row1">
                    <i class="fa-solid fa-cake-candles dr-icon"></i>
                    <div class="datebirth">${formatDate(patient.birthdate)}</div>
                    <div class="age">(${calculateAge(patient.birthdate)})</div>
                </div>
                <div class="row2">
                    <i class="fa-solid fa-phone p-phone-icon"></i>
                    <div class="phonenumber">${patient.phonenumber}</div>
                </div>
                <div class="row3">
                    <i class="fa-solid fa-house home-icon"></i>
                    <div class="homeadress">${patient.adress}</div>
                </div>
                <button class="button3" id ="button3">Оформить запись</button>
                
            `;


            patientsContainer.appendChild(patientRecord);

            setupRecordButtons();

        });
        function formatDate(dateString) {
            const date = new Date(dateString);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}.${month}.${year}`;
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
    }
    async function fetchMyPatients() {
        const patientsContainer = document.getElementById('patientsContainer');
        patientsContainer.innerHTML = '';

        try {
            const response = await fetch('/api/patient/all');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const patients = await response.json();


            const filteredPatients = patients.filter(patient =>
                patient.appointments &&
                patient.appointments.some(appointment => appointment.specialistId === specialistID)
            );


            if (currentSortOrder === 'asc') {
                filteredPatients.sort((a, b) => a.id - b.id);
            } else {
                filteredPatients.sort((a, b) => b.id - a.id);
            }

            console.log('Отфильтрованные пациенты:', filteredPatients);


            displayMyPatients(filteredPatients, specialistID);
        } catch (error) {
            console.error('Ошибка при получении пациентов:', error);
        }
    }

    function displayMyPatients(patients, specialistId) {
        const patientsContainer = document.getElementById('patientsContainer');
        patientsContainer.innerHTML = '';

        if (patients.length === 0) {
            const noPatientsMessage = document.createElement('p');
            noPatientsMessage.innerText = 'Нет пациентов для отображения.';
            patientsContainer.appendChild(noPatientsMessage);
            return;
        }

        patients.forEach(patient => {

            const filteredAppointments = patient.appointments.filter(appointment => appointment.specialistId === specialistId);


            if (filteredAppointments.length === 0) {
                return;
            }


            const patientRecord = document.createElement('div');
            patientRecord.className = 'record-container';


            patientRecord.innerHTML = `
                <div class="row4">
                    <div class="activetalons-t">Номер пациента:</div>
                    <div class="activetalons">${patient.id}</div>
                </div>
                <div class="patient-fio">
                    <p>${patient.surname}</p>
                    <p>${patient.name}</p>
                    <p>${patient.secondname}</p>
                </div>
                <div class="gender">(${patient.gender === 'F' ? 'Ж' : 'М'})</div>
                <div class="row1">
                <i class="fa-solid fa-cake-candles dr-icon"></i>
                    <div class="datebirth">${patient.birthdate}</div>
                    <div class="age">(${calculateAge(patient.birthdate)})</div>
                </div>
                <div class="row2">
                <i class="fa-solid fa-phone p-phone-icon"></i>
                    <div class="phonenumber">${patient.phonenumber}</div>
                </div>
                <div class="row3">
                <i class="fa-solid fa-house home-icon"></i>
                    <div class="homeadress">${patient.adress}</div>
                </div>
                <button class="button3" id ="button3">Оформить запись</button>
                
                <a href="#" class="checka" data-target="hiddenContainer-${patient.id}">-></a>
                
            `;


            const hiddenContainer = document.createElement('div');
            hiddenContainer.className = 'hidden-container';
            hiddenContainer.id = `hiddenContainer-${patient.id}`;
            hiddenContainer.style.transform = 'translateX(-440px)';
            hiddenContainer.style.position = 'absolute';
            hiddenContainer.style.zIndex = '0';

            hiddenContainer.innerHTML = `
                <div class="talonim">Активные записи:</div>
                ${filteredAppointments.length > 0 ?
                    filteredAppointments.map(appointment => `
                        <div class="talonimi">
                            <div class="talon-infoid">Номер талона: <p class="idtalona">${appointment.id}</p></div>
                            <div class="talon-when">
                            <p>${getWeekday(appointment.appointmentDate)}</p>
                            <p>${formatDate(appointment.appointmentDate)}</p>
                            <p>${formatTime(appointment.appointmentTime)}</p>
                            </div>
                        </div>
                        <hr class="divider">
                    `).join('') :
                    '<p>Нет активных записей для этого специалиста.</p>'
                }
            `;


            patientsContainer.appendChild(patientRecord);
            patientsContainer.appendChild(hiddenContainer);
            setupRecordButtons();

            hiddenContainer.style.top = patientRecord.offsetTop + patientRecord.offsetHeight + 'px';
            hiddenContainer.style.left = patientRecord.offsetLeft + 'px';

            function formatDate(dateString) {
                const date = new Date(dateString);
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                return `${day}.${month}.${year}`;
            }

            function formatTime(timeString) {
                const [hour, minute] = timeString.split(':');
                return `${hour}.${minute}`;
            }

            function getWeekday(dateString) {
                const date = new Date(dateString);
                const weekdays = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
                return weekdays[date.getDay()];
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


        });



        document.querySelectorAll('.checka').forEach(button => {
            button.addEventListener('click', (event) => {
                event.preventDefault();

                const hiddenContainer = document.getElementById(button.dataset.target);
                let isHidden = hiddenContainer.style.transform === 'translateX(-440px)';


                if (isHidden) {
                    hiddenContainer.style.transform = 'translateX(-80px)';
                    button.textContent = '<-';
                } else {
                    hiddenContainer.style.transform = 'translateX(-440px)';
                    button.textContent = '->';
                }
            });
        });


        document.addEventListener('click', (event) => {
            const checkaButtons = document.querySelectorAll('.checka');
            const hiddenContainers = document.querySelectorAll('.hidden-container');

            checkaButtons.forEach((button, index) => {
                const hiddenContainer = hiddenContainers[index];

                if (!button.contains(event.target) && !hiddenContainer.contains(event.target) && hiddenContainer.style.transform !== 'translateX(-440px)') {
                    hiddenContainer.style.transform = 'translateX(-440px)';
                    button.textContent = '->';
                }
            });
        });
    }


    function calculateAge(dateOfBirth) {
        const birthDate = new Date(dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDifference = today.getMonth() - birthDate.getMonth();
        if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }
    if (notification) {
        showNotification(notification);
        sessionStorage.removeItem('notification');
    }

    if (fullName) {
        const sessionUserDiv = document.getElementById('sessionUser');
        sessionUserDiv.innerHTML = fullName.replace(' ', '<br>');
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

});