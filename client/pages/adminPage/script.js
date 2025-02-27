document.body.addEventListener('dblclick', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

function showNotification(message) {
    console.log('showNotification called with message:', message);
    const notificationContainer = document.getElementById('notification-container');
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerText = message;
    let patients = [];
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
    const AdminName = sessionStorage.getItem('fullName');
    const role = sessionStorage.getItem('userRole');
    console.log('role ', role)
    document.getElementById('admin-name').textContent = AdminName;

    document.getElementById('logoutBtn').addEventListener('click', function (event) {
        event.preventDefault();

        fetch('/api/admin/logout', {
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

    const containers = document.querySelectorAll('.grid-container > div');
    const vivodContainer = document.getElementById('vivod-container');
    const backIcon = document.getElementById('bb');
    const backIcon1 = document.getElementById('bb1');
    const addSpec = document.getElementById('addspec');
    const whatText = vivodContainer.querySelector('.what');
    const patientsContainer = document.getElementById('patientsContainer');
    const modal = document.getElementById('createspecmodal');
    const overlay = document.getElementById('modalOverlay');
    const closeModal = modal.querySelector('.close');
    backIcon1.style.display = 'none';
    let previousWhatText = 'lol';
    let isSortedAlphabetically = false;

    hideSortIcons();

    document.getElementById('sortAlphabet').addEventListener('click', () => {
        if (!isSortedAlphabetically) {
            patients.sort((a, b) => a.surname.localeCompare(b.surname));
            displayAllPatients(patients);
            toggleSortIcons(true);
            isSortedAlphabetically = true;
        }
    });

    document.getElementById('sortByName').addEventListener('click', () => {
        if (isSortedAlphabetically) {
            fetchAllPatients();
            toggleSortIcons(false);
            isSortedAlphabetically = false;
        }
    });

    function toggleSortIcons(isAlphabetical) {
        const sortByNameIcon = document.getElementById('sortByName');
        const sortAlphabetIcon = document.getElementById('sortAlphabet');

        if (isAlphabetical) {
            sortByNameIcon.style.display = 'inline';
            sortAlphabetIcon.style.display = 'none';
        } else {
            sortByNameIcon.style.display = 'none';
            sortAlphabetIcon.style.display = 'inline';
        }
    }
    addSpec.addEventListener('click', () => {
        modal.style.display = 'block';
        overlay.style.display = 'block';

        populateWeekdayCheckboxes();
        applyRestrictionsAdd()
        initializeTimepickers();
    });
    fetchDepartments();

    closeModal.addEventListener('click', () => {
        closeModalWindow1();
    });

    overlay.addEventListener('click', () => {
        closeModalWindow1();
    });

    function closeModalWindow1() {
        modal.style.display = 'none';
        overlay.style.display = 'none';
    }

    async function fetchDepartments() {
        const departmentSelect = document.getElementById('departmentSelect');

        try {
            const response = await fetch('/api/department/all');
            if (!response.ok) throw new Error('Ошибка при загрузке отделений');

            const departments = await response.json();
            departments.forEach(department => {
                const option = document.createElement('option');
                option.value = department.id;
                option.textContent = department.name;
                departmentSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Ошибка при загрузке отделений:', error);
            alert(error.message);
        }
    }

    function populateWeekdayCheckboxes() {
        const weekdays = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];

        const weekdayCheckboxes = weekdays.map(day => {
            return `
                <label>
                    <input type="checkbox" value="${day}" /> ${day}
                </label>
            `;
        }).join('');

        document.querySelector('.weekdays-checkboxes').innerHTML = weekdayCheckboxes;
    }

    document.getElementById('saveSpec').addEventListener('click', async () => {

        const specialistData = {
            surname: document.getElementById('surname').value,
            name: document.getElementById('name').value,
            secondname: document.getElementById('secondname').value,
            password: document.getElementById('password').value,
            birthdate: document.getElementById('birthdate').value,
            phonenumber: document.getElementById('phonenumber').value,
            adress: document.getElementById('adress').value,
            speciality: document.getElementById('speciality').value,
            cabinet: document.getElementById('cabinet').value,
            starttime: document.getElementById('starttime').value,
            endtime: document.getElementById('endtime').value,
            weekdays: Array.from(document.querySelectorAll('.weekdays-checkboxes input:checked')).map(input => input.value),
            departmentID: document.getElementById('departmentSelect').value
        };

        const allFieldsFilled = Object.values(specialistData).every(value => value);

        if (!allFieldsFilled) {
            alert('Пожалуйста, заполните все поля.');
            return;
        }

        const daysMapping = {
            'пн': 'пн',
            'вт': 'вт',
            'ср': 'ср',
            'чт': 'чт',
            'пт': 'пт',
            'сб': 'сб',
            'вс': 'вс'
        };

        const formattedWeekdays = specialistData.weekdays
            .map(day => daysMapping[day])
            .join(' ');

        try {
            const response = await fetch('/api/admin/s/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    surname: specialistData.surname,
                    name: specialistData.name,
                    secondname: specialistData.secondname,
                    speciality: specialistData.speciality,
                    cabinet: specialistData.cabinet,
                    personalinfo: {
                        phonenumber: specialistData.phonenumber,
                        adress: specialistData.adress,
                        birthdate: specialistData.birthdate
                    },
                    schedule: {
                        weekdays: formattedWeekdays,
                        starttime: specialistData.starttime,
                        endtime: specialistData.endtime
                    },
                    enter: {
                        password: specialistData.password
                    },
                    departmentID: specialistData.departmentID
                })
            });

            const result = await response.json();

            if (response.ok) {
                console.log('Специалист успешно создан:', result);
                fetchAllSpecialists();
                closeModalWindow1();
                displayAllSpecialists();
                showNotification('Специалист успешно добавлен');
            } else {
                console.error('Ошибка при создании специалиста:', result.error);
                alert(result.error || 'Ошибка при создании специалиста.');
            }
        } catch (error) {
            console.error('Ошибка соединения:', error);
            alert('Ошибка соединения с сервером. Пожалуйста, попробуйте позже.');
        }
    });

    document.getElementById('cancelSpec').addEventListener('click', closeModalWindow1);

    fetchAllPatients();
    fetchAllSpecialists();
    fetchAllDepartments();
    loadAllAppointments();

    containers.forEach(container => {
        container.addEventListener('click', async () => {
            const name = container.querySelector('.name-name').textContent;

            containers.forEach(c => {
                c.style.display = 'none';
            });

            whatText.textContent = name;
            previousWhatText = whatText.textContent;

            vivodContainer.style.display = 'block';

            patientsContainer.innerHTML = '';
            specialistsContainer.innerHTML = '';
            hideSortIcons();

            if (name === 'ПАЦИЕНТЫ') {
                await fetchAllPatients();
                const scheduleContainer1 = document.getElementById('talonsList1');
                scheduleContainer1.style.display = 'none';
                resetSpecialistSortIcons()
                hideSpecialistSortIcons();
                toggleSortIcons(false);

            } else if (name === 'СПЕЦИАЛИСТЫ') {
                hideSortIcons();
                const scheduleContainer1 = document.getElementById('talonsList1');
                scheduleContainer1.style.display = 'none';
                await fetchAllSpecialists();
                toggleSpecialistSortIcons(false);
            } else if (name === 'ОТДЕЛЕНИЯ') {
                hideSortIcons();
                hideSpecialistSortIcons();
                const scheduleContainer = document.getElementById('scheduleContainer');
                scheduleContainer.style.display = 'block';
                const scheduleContainer1 = document.getElementById('talonsList1');
                scheduleContainer1.style.display = 'none';
                backIcon.style.display = 'block';
                backIcon1.style.display = 'none';
                const allDepartments = await fetchAllDepartments();
                displayAllDepartments(allDepartments);
            } else if (name === 'ТАЛОНЫ') {
                hideSortIcons();
                hideSpecialistSortIcons();
                const scheduleContainer1 = document.getElementById('talonsList1');
                scheduleContainer1.style.display = 'block';
                loadAllAppointments();

                backIcon.style.display = 'block';
                backIcon1.style.display = 'none';

            }
            else {
                hideSortIcons();
                hideSpecialistSortIcons();
            }
        });
    });

    let appointments11 = [];
    async function loadAllAppointments() {
        try {
            const response = await fetch('/api/appointment/all', {
                method: 'GET',
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Ошибка при получении талонов');
            }

            appointments11 = await response.json();
            console.log('Полученные талоны:', appointments11);
            renderAppointmentsAll(appointments11);

        } catch (error) {
            console.error('Ошибка при загрузке талонов:', error);
            const talonsList = document.getElementById('talonsList1');
            talonsList.innerHTML = '<p>Ошибка при загрузке талонов</p>';
        }
    }

    function renderAppointmentsAll(appointments) {
        const talonsList = document.getElementById('talonsList1');

        if (!appointments || appointments.length === 0) {
            talonsList.innerHTML = '<p>Похоже, что нет талонов</p>';
        } else {
            talonsList.innerHTML = '';

            appointments.forEach((appointment, index) => {
                const talonContainer = document.createElement('div');
                talonContainer.className = 'onetalon-container';
                talonContainer.innerHTML = `
                    <div class="talon-infoid">
                        Номер талона:
                        <p class="idtalona">${appointment.appointmentId}</p>
                    </div>
                    <div class="doctor" style="color: #4FDFDF;">
                    Пациент: 
                        <p class="fio-p">${appointment.patientFullName}</p>
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
                   
                    <button class="deletetalon" data-id="${appointment.appointmentId}">Удалить талон</button>
                `;
                talonContainer.querySelector(`.deletetalon`).addEventListener('click', async (event) => {
                    const appointmentId = event.target.getAttribute('data-id');
                    showConfirmationModal11(appointmentId);
                });

                talonsList.appendChild(talonContainer);
            });
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
    }

    async function fetchAllDepartments() {
        try {
            const response = await fetch('/api/department/all');
            if (!response.ok) {
                throw new Error('Ошибка при получении всех департаментов');
            }

            return await response.json();
        } catch (error) {
            console.error(error);
            return [];
        }
    }
    function displayAllDepartments(departments) {
        const scheduleContainer = document.getElementById('scheduleContainer');
        scheduleContainer.innerHTML = '';

        departments.forEach(department => {
            const departmentContainer = document.createElement('div');
            departmentContainer.className = 'department-container';

            const departmentName = document.createElement('h2');
            departmentName.innerText = department.name.toUpperCase();
            departmentContainer.appendChild(departmentName);

            const specialists = department.workers || [];
            const table = document.createElement('table');
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>Специалист</th>
                        <th>Рабочие дни</th>
                        <th>Рабочее время</th>
                    </tr>
                </thead>
                <tbody>
                    ${specialists.length > 0 ? specialists.map(worker => `
                        <tr>
                            <td>${worker.surname} ${worker.name} ${worker.secondname}</td>
                            <td>${worker.schedule ? worker.schedule.weekdays : 'Нет графика'}</td>
                            <td>${worker.schedule ? formatTimeRange(worker.schedule.startTime, worker.schedule.endTime) : 'Нет графика'}</td>
                        </tr>
                    `).join('') : '<tr><td colspan="3">Нет специалистов в этом отделении.</td></tr>'}
                </tbody>
            `;

            departmentContainer.appendChild(table);

            scheduleContainer.appendChild(departmentContainer);
        });

        function formatTimeRange(startTime, endTime) {
            return `${formatTime(startTime)} - ${formatTime(endTime)}`;
        }

        function formatTime(timeString) {
            const [hours, minutes] = timeString.split(':');
            return `${hours}.${minutes.padStart(2, '0')}`;
        }
    }
    let specialists = [];
    async function fetchAllSpecialists() {

        try {
            const response = await fetch('/api/specialist/all');
            if (!response.ok) {
                throw new Error(`Ошибка HTTP! Статус: ${response.status}`);
            }
            specialists = await response.json();
            specialists.sort((a, b) => a.id - b.id);
            displayAllSpecialists(specialists);
        } catch (error) {
            specialistsContainer.innerHTML = '<p>Ошибка при загрузке специалистов. Попробуйте позже.</p>';
            console.error('Ошибка при получении специалистов:', error);
        }
    }

    async function displayAllSpecialists(specialists) {
        const specialistsContainer = document.getElementById('specialistsContainer');
        specialistsContainer.innerHTML = '';

        if (specialists.length === 0) {
            const noSpecialistsMessage = document.createElement('p');
            noSpecialistsMessage.innerText = 'Нет специалистов для отображения.';
            specialistsContainer.appendChild(noSpecialistsMessage);
            return;
        }

        for (const specialist of specialists) {
            const specialistRecord = document.createElement('div');
            specialistRecord.className = 'record-container';
            specialistRecord.style.width = '600px';
            const formattedStartTime = formatTime(specialist.schedule.starttime);
            const formattedEndTime = formatTime(specialist.schedule.endtime);
            specialistRecord.innerHTML = `
            <div class="row4">
            <div class="activetalons-t">Номер специалиста:</div>
            <div class="activetalons">${specialist.id}</div>
        </div>
                <div class="patient-fio" id="patientInfo">
                    <p id="ppf">${specialist.surname}</p>
                    <p id="ppi">${specialist.name}</p>
                    <p id="ppo">${specialist.secondname}</p>
                </div>
                <div class="row0">
                    <div class="speciality1" id="speciality">${specialist.speciality}</div>
                    
                    <div class="password" id="password">${specialist.enter.password}</div>
                </div>
                <div class="row1">
                    <i class="fa-solid fa-cake-candles dr-icon"></i>
                    <div class="datebirth" id="datebirth">${formatDate(specialist.personalinfo.birthdate)}</div>
                    <div class="age" id="age">(${calculateAge(specialist.personalinfo.birthdate)} )</div>
                </div>
                <div class="row2">
                    <i class="fa-solid fa-phone p-phone-icon"></i>
                    <div class="phonenumber" id="phonenumber">${specialist.personalinfo.phonenumber}</div>
                </div>
                <div class="row3">
                    <i class="fa-solid fa-house home-icon"></i>
                    <div class="homeadress" id="homeadress">${specialist.personalinfo.adress}</div>
                </div>
                <a  class="edit" data-specialist-id="${specialist.id}">Редактировать</a>
                <button class="save" data-specialist-id="${specialist.id}" style="display:none;">Подтвердить</button>
                <button class="cancel" data-specialist-id="${specialist.id}" style="display:none;">Отмена</button>
                <div class="row5">
                <div class="dni">Рабочие дни:</div>
                    <div class="weekdays" id="weekdays">${specialist.schedule.weekdays}</div>
                </div>
                <div class="row6">
                <div class="timerab">Время:</div>
                    <div class="timi" id="timi">${formattedStartTime} - ${formattedEndTime}</div>
                </div>
                <button class="delete" data-specialist-id="${specialist.id}">Удалить специалиста</button>
            `;

            specialistRecord.querySelector('.edit').addEventListener('click', () => {
                specialistRecord.innerHTML = createSpecialistEditForm(specialist);

                applyInputRestrictions();
                attachEditHandlersSpec(specialistRecord, specialist);
                initializeTimepickers();

            });
            specialistRecord.querySelector(`.delete`).addEventListener('click', async (event) => {
                const specialistId = event.target.getAttribute('data-specialist-id');
                showConfirmationModalSpec(specialistId, specialist);
            });
            specialistsContainer.appendChild(specialistRecord);
        }

    }
    function formatTime(timeString) {
        const [hours, minutes] = timeString.split(':');
        return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
    }
    function createSpecialistEditForm(specialist) {
        const weekdays = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];
        const selectedWeekdays = specialist.schedule.weekdays || [];

        const weekdayCheckboxes = weekdays.map(day => {
            const isChecked = selectedWeekdays.includes(day) ? 'checked' : '';
            return `
                <label>
                    <input type="checkbox" value="${day}" ${isChecked} /> ${day}
                </label>
            `;
        }).join('');

        return `
            <div class="row4">
                <div class="activetalons-t">Номер специалиста:</div>
                <div class="activetalons">${specialist.id}</div>
            </div>
            <div class="patient-fio">
                <input type="text" value="${specialist.surname}" data-field="surname" placeholder="Фамилия" />
                <input type="text" value="${specialist.name}" data-field="name" placeholder="Имя" />
                <input type="text" value="${specialist.secondname}" data-field="secondname" placeholder="Отчество" />
                <input type="text" value="${specialist.enter.password}" data-field="password" placeholder="Пароль"</div>
            </div>
            <div class="row1">
                <input type="date" value="${formatDateToInput(specialist.personalinfo.birthdate)}" data-field="birthdate" style="width: 90px;"/>
                <input type="text" value="${specialist.personalinfo.phonenumber}" data-field="phonenumber" placeholder="Телефон" style="width: 110px;"/>
                <input type="text" value="${specialist.personalinfo.adress}" data-field="adress" placeholder="Адрес"style="width: 150px;" />
            </div>
            <div class="row5" style="margin-top: -180px;">
                <div class="dni">Рабочие дни:</div>
                <div class="weekdays-checkboxes">${weekdayCheckboxes}</div>
            </div>
            <div class="row6" style="margin-top: -80px;">
            <div class="timerab">Время работы:</div>
            <div>
                <label>Начало: <input type="text" class="starttime" value="${specialist.schedule.starttime}" data-field="starttime" style="width: 70px;" /></label>
                <label>Конец: <input type="text" class="endtime" value="${specialist.schedule.endtime}" data-field="endtime" style="width: 70px;"/></label>
            </div>
        </div>
            <button class="save" data-specialist-id="${specialist.id}">Подтвердить</button>
            <button class="cancel" data-specialist-id="${specialist.id}">Отмена</button>
        `;
    }
    function initializeTimepickers() {
        const startHour = [7, 0];
        const endHour = [22, 0];

        $('.starttime').timepicker({
            timeFormat: 'H:i',
            interval: 30,
            minTime: `${startHour[0]}:${(startHour[1] < 10 ? '0' : '') + startHour[1]}`,
            maxTime: `${endHour[0]}:${(endHour[1] < 10 ? '0' : '') + endHour[1]}`,
            dynamic: false,
            dropdown: true,
            scrollbar: true
        });

        $('.endtime').timepicker({
            timeFormat: 'H:i',
            interval: 30,
            minTime: `${startHour[0]}:${(startHour[1] < 10 ? '0' : '') + startHour[1]}`,
            maxTime: `${endHour[0]}:${(endHour[1] < 10 ? '0' : '') + endHour[1]}`,
            dynamic: false,
            dropdown: true,
            scrollbar: true
        });
    }

    function attachEditHandlersSpec(specialistRecord, specialist) {

        specialistRecord.querySelector('.save').addEventListener('click', async () => {
            const updatedData = gatherUpdatedDataSpec(specialistRecord);
            await updateSpecialist(specialist.id, updatedData);

            const updatedSpecialistData = await fetchAllSpecialists(specialist.id);

            specialistRecord.innerHTML = createSpecialistView(updatedSpecialistData);
            attachViewHandlersSpec(specialistRecord, updatedSpecialistData);
        });

        specialistRecord.querySelector('.cancel').addEventListener('click', () => {
            specialistRecord.innerHTML = createSpecialistView(specialist);

            attachViewHandlersSpec(specialistRecord, specialist);
        });
    }


    function attachViewHandlersSpec(specialistRecord, specialist) {

        specialistRecord.querySelector('.edit').addEventListener('click', () => {
            specialistRecord.innerHTML = createSpecialistEditForm(specialist);

            initializeTimepickers();
            applyInputRestrictions();
            attachEditHandlersSpec(specialistRecord, specialist);
        });
        specialistRecord.querySelector(`.delete`).addEventListener('click', async (event) => {
            const specialistId = event.target.getAttribute('data-specialist-id');
            showConfirmationModalSpec(specialistId, specialist);
        });
    }

    function createSpecialistView(specialist) {
        const formattedStartTime = formatTime(specialist.schedule.starttime);
        const formattedEndTime = formatTime(specialist.schedule.endtime);
        return `
            <div class="row4">
                <div class="activetalons-t">Номер специалиста:</div>
                <div class="activetalons">${specialist.id}</div>
            </div>
            <div class="patient-fio">
            <p id="ppf">${specialist.surname}</p>
            <p id="ppi">${specialist.name}</p>
            <p id="ppo">${specialist.secondname}</p>
            </div>
            <div class="row0">
            <div class="speciality1" id="speciality">${specialist.speciality}</div>
            
            <div class="password" id="password">${specialist.enter.password}</div>
        </div>
            <div class="row1">
                <i class="fa-solid fa-cake-candles dr-icon"></i>
                <div class="datebirth">${formatDate(specialist.personalinfo.birthdate)}</div>
                <div class="age">(${calculateAge(specialist.personalinfo.birthdate)})</div>
            </div>
            <div class="row2">
                <i class="fa-solid fa-phone p-phone-icon"></i>
                <div class="phonenumber">${specialist.personalinfo.phonenumber}</div>
            </div>
            <div class="row3">
                <i class="fa-solid fa-house home-icon"></i>
                <div class="homeadress">${specialist.personalinfo.adress}</div>
            </div>
            <div class="row5">
            <div class="dni">Рабочие дни:</div>
                <div class="weekdays" id="weekdays">${specialist.schedule.weekdays}</div>
            </div>
            <div class="row6">
            <div class="timerab">Время:</div>
                <div class="timi" id="timi">${formattedStartTime} - ${formattedEndTime}</div>
            </div>
            
            <a  class="edit" data-specialist-id="${specialist.id}">Редактировать</a>
            <button class="save" data-specialist-id="${specialist.id}" style="display:none;">Подтвердить</button>
            <button class="cancel" data-specialist-id="${specialist.id}" style="display:none;">Отмена</button>
            <button class="delete" data-specialist-id="${specialist.id}">Удалить специалиста</button>
        `;

    }


    function gatherUpdatedDataSpec(specialistRecord) {
        const updatedData = {};

        specialistRecord.querySelectorAll('input[data-field],select[data-field]').forEach(input => {
            updatedData[input.dataset.field] = input.value;
        });

        const selectedWeekdays = [];
        specialistRecord.querySelectorAll('.weekdays-checkboxes input[type="checkbox"]:checked').forEach(checkbox => {
            selectedWeekdays.push(checkbox.value);
        });

        updatedData['weekdays'] = selectedWeekdays.join(' ');
        console.log('Собранные данные для обновления:', updatedData);

        return updatedData;
    }

    function formatDateToInput(dateString) {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }


    async function updateSpecialist(specialistId, updatedData) {
        console.log('Обновляем данные speca с ID:', specialistId);
        console.log('Отправляемые данные:', updatedData);

        try {
            const response = await fetch(`/api/admin/s/${specialistId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedData),
                credentials: 'include'
            });

            console.log('Статус ответа:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Ошибка ответа:', errorText);
                throw new Error('Ошибка при обновлении данных пациента');
            }

            const result = await response.json();
            console.log('Данные спеца обновлены:', result);
            showNotification('Данные успешно обновлены');
            return result;
        } catch (error) {
            console.error('Ошибка при обновлении данных:', error);
        }
    }

    let isSortedSpecialistsAlphabetically = false;

    function resetSpecialistSortIcons() {
        const sortByNameIcon = document.getElementById('sortByName1');
        const sortAlphabetIcon = document.getElementById('sortAlphabet1');

        sortByNameIcon.style.display = 'none';
        sortAlphabetIcon.style.display = 'inline';
        isSortedSpecialistsAlphabetically = false;
    }

    function hideSpecialistSortIcons() {
        const sortByNameIcon = document.getElementById('sortByName1');
        const sortAlphabetIcon = document.getElementById('sortAlphabet1');
        const addSpec = document.getElementById('addspec');
        addSpec.style.display = 'none';
        sortByNameIcon.style.display = 'none';
        sortAlphabetIcon.style.display = 'none';
    }

    document.getElementById('sortAlphabet1').addEventListener('click', () => {
        if (!isSortedSpecialistsAlphabetically) {

            specialists.sort((a, b) => a.surname.localeCompare(b.surname));
            displayAllSpecialists(specialists);
            toggleSpecialistSortIcons(true);
            isSortedSpecialistsAlphabetically = true;
        }
    });

    document.getElementById('sortByName1').addEventListener('click', () => {
        if (isSortedSpecialistsAlphabetically) {

            fetchAllSpecialists();
            toggleSpecialistSortIcons(false);
            isSortedSpecialistsAlphabetically = false;

        }
    });

    function toggleSpecialistSortIcons(isAlphabetical) {
        const sortByNameIcon = document.getElementById('sortByName1');
        const sortAlphabetIcon = document.getElementById('sortAlphabet1');
        const addSpec = document.getElementById('addspec');
        addSpec.style.display = 'inline';
        sortByNameIcon.style.marginLeft = '360px';
        sortAlphabetIcon.style.marginLeft = '360px';
        if (isAlphabetical) {
            sortByNameIcon.style.display = 'inline';
            sortAlphabetIcon.style.display = 'none';
        } else {
            sortByNameIcon.style.display = 'none';
            sortAlphabetIcon.style.display = 'inline';
        }
    }

    function resetSortIcons() {
        const sortByNameIcon = document.getElementById('sortByName');
        const sortAlphabetIcon = document.getElementById('sortAlphabet');

        sortByNameIcon.style.display = 'none';
        sortAlphabetIcon.style.display = 'inline';
        isSortedAlphabetically = false;
    }

    function hideSortIcons() {
        const sortByNameIcon = document.getElementById('sortByName');
        const sortAlphabetIcon = document.getElementById('sortAlphabet');

        sortByNameIcon.style.display = 'none';
        sortAlphabetIcon.style.display = 'none';
    }

    backIcon.addEventListener('click', () => {

        vivodContainer.style.display = 'none';
        const scheduleContainer = document.getElementById('scheduleContainer');
        scheduleContainer.style.display = 'none';
        const talonsList1 = document.getElementById('talonsList1');
        talonsList1.style.display = "none";

        containers.forEach(c => {
            c.style.display = 'block';
        });
        resetSortIcons();
    });

    backIcon1.addEventListener('click', () => {

        const talonsList = document.getElementById('talonsList');
        talonsList.innerHTML = '';
        talonsList.style.display = 'block';
        whatText.textContent = previousWhatText;

        patientsContainer.style.display = 'block';
        fetchAllPatients();

        backIcon.style.display = 'block';
        backIcon1.style.display = 'none';
        resetSortIcons();
    });

    async function fetchAllPatients() {
        try {
            const response = await fetch('/api/patient/all');
            if (!response.ok) {
                throw new Error(`Ошибка HTTP! Статус: ${response.status}`);
            }
            patients = await response.json();
            patients.sort((a, b) => a.id - b.id);
            displayAllPatients(patients);
        } catch (error) {
            patientsContainer.innerHTML = '<p>Ошибка при загрузке пациентов. Попробуйте позже.</p>';
            console.error('Ошибка при получении пациентов:', error);
        }
    }
    async function getActiveAppointmentsCount(patientId) {
        try {
            const response = await fetch(`/api/medicalrecord/${patientId}`, {
                method: 'GET',
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Ошибка при получении количества активных талонов');
            }

            const data = await response.json();
            return data.appointmentIds.length;
        } catch (error) {
            console.error('Ошибка при загрузке активных талонов:', error);
            return 0;
        }
    }

    let currentPatient;
    let currentAppointmentId;
    let currentPatientId;
    let currentSpecialist;
    let currentSpecialistId;

    function renderAppointments(appointments, patient) {
        console.log('Талоны для отображения:', appointments);
        hideSortIcons();
        const talonsList = document.getElementById('talonsList');
        talonsList.innerHTML = '';

        if (appointments.length === 0) {
            talonsList.innerHTML = '<p>Похоже, что у вас нет активных талонов</p>';
        } else {
            appointments.forEach(appointment => {
                const talonContainer = document.createElement('div');
                talonContainer.className = 'onetalon-container';
                talonContainer.innerHTML = `
                    <div class="talon-infoid">Номер талона: <p class="idtalona">${appointment.id}</p></div>
                    <div class="talon-when">
                    <p id="weekday">${getWeekday(appointment.appointmentDate)}</p>
                    <p id="date">${formatDate(appointment.appointmentDate)}</p>
                    <p id="time">${formatTime(appointment.appointmentTime)}</p>
                    </div>
                    <div class="doctor">
                    <p class="speciality">${appointment.speciality}</p>
                    <p class="fio">${appointment.specialistFullName}</p>
                    <div class="cabinet-info">
                        <p class="cabinet">${appointment.cabinet}</p> кабинет
                    </div>
                </div>
                    
                    <button class="deletetalon" data-id="${appointment.id}">Удалить талон</button>
                `;

                talonContainer.querySelector(`.deletetalon`).addEventListener('click', async (event) => {
                    const appointmentId = event.target.getAttribute('data-id');
                    showConfirmationModal(appointmentId, patient);
                });

                talonsList.appendChild(talonContainer);
            });

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
    }

    async function displayAllPatients(patients) {
        const patientsContainer = document.getElementById('patientsContainer');
        patientsContainer.innerHTML = '';

        if (patients.length === 0) {
            const noPatientsMessage = document.createElement('p');
            noPatientsMessage.innerText = 'Нет пациентов для отображения.';
            patientsContainer.appendChild(noPatientsMessage);
            return;
        }

        for (const patient of patients) {

            const patientRecord = document.createElement('div');
            patientRecord.className = 'record-container';

            const activeAppointmentsCount = await getActiveAppointmentsCount(patient.id);

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
                <div class="row44">
                    <div class="activetalons-t4">Активных талонов:</div>
                    <div class="activetalons4">${activeAppointmentsCount}</div>
                </div>
                <a  class="checktalons4"  data-patient-id="${patient.id}">Просмотреть -></a>
                <a  class="edit" data-patient-id="${patient.id}" style="margin-left:300px;">Редактировать</a>
                <button class="save" data-patient-id="${patient.id}" style="display:none;">Подтвердить</button>
                <button class="cancel" data-patient-id="${patient.id}" style="display:none;">Отмена</button>
                <button class="delete1" data-patient-id="${patient.id}">Удалить пациента</button>
            `;

            patientRecord.querySelector('.checktalons4').addEventListener('click', (event) => {
                event.preventDefault();
                const patientId = event.target.getAttribute('data-patient-id');
                console.log(`Просмотр талонов для пациента с ID: ${patientId}`);
                const whatElement = document.querySelector('.what');
                whatElement.textContent = `Талоны для: ${patient.surname} ${patient.name} ${patient.secondname}`;
                backIcon.style.display = 'none';
                backIcon1.style.display = 'block';
                patientsContainer.style.display = 'none';
                renderAppointments(patient.appointments, patient);
            });

            patientRecord.querySelector('.edit').addEventListener('click', () => {
                patientRecord.innerHTML = createPatientEditForm(patient, activeAppointmentsCount);

                applyInputRestrictions();
                attachEditHandlers(patientRecord, patient);

            });

            patientRecord.querySelector(`.delete1`).addEventListener('click', async (event) => {
                const patientId = event.target.getAttribute('data-patient-id');
                showConfirmationModalPac(patientId, patient);
            });

            patientsContainer.appendChild(patientRecord);
        }
    }

    function createPatientEditForm(patient) {
        return `
            <div class="row4">
                <div class="activetalons-t">Номер пациента:</div>
                <div class="activetalons">${patient.id}</div>
            </div>
            <div class="patient-fio">
                <input type="text" value="${patient.surname}" data-field="surname" placeholder="Фамилия" />
                <input type="text" value="${patient.name}" data-field="name" placeholder="Имя" />
                <input type="text" value="${patient.secondname}" data-field="secondname" placeholder="Отчество" />
            </div>
            <div class="gender">
                <select data-field="gender">
                    <option value="M" ${patient.gender === 'M' ? 'selected' : ''}>М</option>
                    <option value="F" ${patient.gender === 'F' ? 'selected' : ''}>Ж</option>
                </select>
            </div>
            <div class="row1">
                <input type="date" value="${formatDateToInput(patient.birthdate)}" data-field="birthdate" />
                <input type="text" value="${patient.phonenumber}" data-field="phonenumber" placeholder="Телефон" />
                <input type="text" value="${patient.adress}" data-field="adress" placeholder="Адрес" />
            </div>
            <button class="save" data-patient-id="${patient.id}">Подтвердить</button>
            <button class="cancel" data-patient-id="${patient.id}">Отмена</button>
        `;
    }

    function applyRestrictionsAdd() {

        function preventSpecialCharsForFIO(event) {
            const regex = /^[а-яА-ЯёЁ]*$/;
            if (!regex.test(event.target.value)) {
                event.target.value = event.target.value.replace(/[^а-яА-ЯёЁ]/g, '');
            }
        }
        function preventSpecialCharsForCabinet(event) {
            const regex = /^[0-9]*$/;
            const input = event.target;

            if (!regex.test(input.value)) {
                input.value = input.value.replace(/[^0-9]/g, '');
            }
        }

        function preventSpecialCharsForSpeciality(event) {
            const regex = /^[а-яё\s]*$/;
            const input = event.target;

            if (!regex.test(input.value)) {
                input.value = input.value.replace(/[^а-яё\s]/g, '');
            }
        }
        function preventSpecialCharsForPhone(event) {
            const regex = /^[+0-9]*$/;
            const input = event.target;

            if (!regex.test(input.value)) {
                input.value = input.value.replace(/[^+0-9]/g, '');
            }

            if (input.value.length > 13) {
                input.value = input.value.slice(0, 13);
            }
        }

        function preventSpecialCharsForAddress(event) {
            const regex = /^[а-яА-ЯёЁ0-9, ]*$/;
            if (!regex.test(event.target.value)) {
                event.target.value = event.target.value.replace(/[^а-яА-ЯёЁ0-9, ]/g, '');
            }
        }

        function dataspets(inputElement) {
            const today = new Date().toISOString().split('T')[0];
            inputElement.setAttribute('max', today);

            inputElement.addEventListener('input', function () {
                const selectedDate = new Date(inputElement.value);
                if (selectedDate > new Date(today)) {
                    inputElement.classList.add('error');
                    inputElement.value = '';
                } else {
                    inputElement.classList.remove('error');
                }
            });
        }
        function validatePassword(event) {
            const regex = /^[a-zA-Z0-9]*$/;

            if (event.target.value.length > 10) {
                event.target.classList.add('error');
                event.target.value = event.target.value.slice(0, 10);
            } else {
                event.target.classList.remove('error');
            }

            if (!regex.test(event.target.value)) {
                event.target.value = event.target.value.replace(/[^a-zA-Z0-9]/g, '');
            }
        }

        document.getElementById('surname').addEventListener('input', preventSpecialCharsForFIO);
        document.getElementById('name').addEventListener('input', preventSpecialCharsForFIO);
        document.getElementById('secondname').addEventListener('input', preventSpecialCharsForFIO);
        document.getElementById('phonenumber').addEventListener('input', preventSpecialCharsForPhone);
        document.getElementById('adress').addEventListener('input', preventSpecialCharsForAddress);
        document.getElementById('password').addEventListener('input', validatePassword);
        const dobInput = document.getElementById('birthdate');
        dataspets(dobInput);
        document.getElementById('cabinet').addEventListener('input', preventSpecialCharsForCabinet);
        document.getElementById('speciality').addEventListener('input', preventSpecialCharsForSpeciality);

        const weekdaysCheckboxes = document.querySelectorAll('.weekdays-checkboxes input[type="checkbox"]');

        weekdaysCheckboxes.forEach((checkbox) => {
            checkbox.addEventListener('change', () => {

                const checkedCount = Array.from(weekdaysCheckboxes).filter(cb => cb.checked).length;

                if (checkedCount === 0 && !checkbox.checked) {
                    checkbox.checked = true;
                    alert('Вы должны выбрать хотя бы один рабочий день.');
                }
            });
        });
    }

    function applyInputRestrictions() {

        function preventSpecialCharsForFIO(event) {
            const regex = /^[а-яА-ЯёЁ]*$/;
            if (!regex.test(event.target.value)) {
                event.target.value = event.target.value.replace(/[^а-яА-ЯёЁ]/g, '');
            }
        }

        function preventSpecialCharsForPhone(event) {
            const regex = /^[+0-9]*$/;
            const input = event.target;

            if (!regex.test(input.value)) {
                input.value = input.value.replace(/[^+0-9]/g, '');
            }

            if (input.value.length > 13) {
                input.value = input.value.slice(0, 13);
            }
        }

        function preventSpecialCharsForAddress(event) {
            const regex = /^[а-яА-ЯёЁ0-9, ]*$/;
            if (!regex.test(event.target.value)) {
                event.target.value = event.target.value.replace(/[^а-яА-ЯёЁ0-9, ]/g, '');
            }
        }

        function dataspets(inputElement) {
            const today = new Date().toISOString().split('T')[0];
            inputElement.setAttribute('max', today);

            inputElement.addEventListener('input', function () {
                const selectedDate = new Date(inputElement.value);
                if (selectedDate > new Date(today)) {
                    inputElement.classList.add('error');
                    inputElement.value = '';
                } else {
                    inputElement.classList.remove('error');
                }
            });
        }

        const passwordInput = document.querySelector('[data-field="password"]');

        if (passwordInput) {
            passwordInput.addEventListener('input', function (event) {
                const regex = /^[a-zA-Z0-9]*$/;

                if (event.target.value.length > 10) {
                    event.target.classList.add('error');
                    event.target.value = event.target.value.slice(0, 10);
                } else {
                    event.target.classList.remove('error');
                }

                if (!regex.test(event.target.value)) {
                    event.target.value = event.target.value.replace(/[^a-zA-Z0-9]/g, '');
                }
            });
        }

        document.querySelector('[data-field="surname"]').addEventListener('input', preventSpecialCharsForFIO);
        document.querySelector('[data-field="name"]').addEventListener('input', preventSpecialCharsForFIO);
        document.querySelector('[data-field="secondname"]').addEventListener('input', preventSpecialCharsForFIO);
        document.querySelector('[data-field="phonenumber"]').addEventListener('input', preventSpecialCharsForPhone);
        document.querySelector('[data-field="adress"]').addEventListener('input', preventSpecialCharsForAddress);
        const dobInput = document.querySelector('[data-field="birthdate"]');
        dataspets(dobInput);

        const weekdaysCheckboxes = document.querySelectorAll('.weekdays-checkboxes input[type="checkbox"]');

        weekdaysCheckboxes.forEach((checkbox) => {
            checkbox.addEventListener('change', () => {

                const checkedCount = Array.from(weekdaysCheckboxes).filter(cb => cb.checked).length;

                if (checkedCount === 0 && !checkbox.checked) {
                    checkbox.checked = true;
                    alert('Вы должны выбрать хотя бы один рабочий день.');
                }
            });
        });
    }

    function attachEditHandlers(patientRecord, patient) {

        patientRecord.querySelector('.save').addEventListener('click', async () => {
            const updatedData = gatherUpdatedData(patientRecord);
            await updatePatient(patient.id, updatedData);
            const activeAppointmentsCount = await getActiveAppointmentsCount(patient.id);
            patientRecord.innerHTML = createPatientView({ ...patient, ...updatedData }, activeAppointmentsCount);
            attachViewHandlers(patientRecord, { ...patient, ...updatedData });
        });

        patientRecord.querySelector('.cancel').addEventListener('click', async () => {
            const activeAppointmentsCount = await getActiveAppointmentsCount(patient.id);
            patientRecord.innerHTML = createPatientView(patient, activeAppointmentsCount);
            attachViewHandlers(patientRecord, patient);
        });
    }


    function attachViewHandlers(patientRecord, patient) {

        patientRecord.querySelector('.checktalons4').addEventListener('click', (event) => {
            event.preventDefault();
            const patientId = event.target.getAttribute('data-patient-id');
            console.log(`Просмотр талонов для пациента с ID: ${patientId}`);
            const whatElement = document.querySelector('.what');
            whatElement.textContent = `Талоны для: ${patient.surname} ${patient.name} ${patient.secondname}`;
            backIcon.style.display = 'none';
            backIcon1.style.display = 'block';
            patientsContainer.style.display = 'none';
            renderAppointments(patient.appointments, patient);
        });

        patientRecord.querySelector('.edit').addEventListener('click', () => {
            patientRecord.innerHTML = createPatientEditForm(patient);
            applyInputRestrictions();
            attachEditHandlers(patientRecord, patient);
        });

        patientRecord.querySelector(`.delete1`).addEventListener('click', async (event) => {
            const patientId = event.target.getAttribute('data-patient-id');
            showConfirmationModalPac(patientId, patient);
        });
    }

    function createPatientView(patient, activeAppointmentsCount) {
        return `
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
            <div class="row44">
                <div class="activetalons-t4">Активных талонов:</div>
                <div class="activetalons4">${activeAppointmentsCount}</div>
            </div>
            <a  class="checktalons4" data-patient-id="${patient.id}">Просмотреть -></a>
            <a  class="edit" style="margin-left:300px;" data-patient-id="${patient.id}">Редактировать</a>
            <button class="save" data-patient-id="${patient.id}" style="display:none;">Подтвердить</button>
            <button class="cancel" data-patient-id="${patient.id}" style="display:none;">Отмена</button>
            <button class="delete1" data-patient-id="${patient.id}">Удалить пациента</button>
        `;
    }

    function gatherUpdatedData(patientRecord) {
        const updatedData = {};
        patientRecord.querySelectorAll('input[data-field], select[data-field]').forEach(input => {
            updatedData[input.dataset.field] = input.value;
        });
        return updatedData;
    }

    function formatDateToInput(dateString) {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    async function updatePatient(patientId, updatedData) {
        console.log('Обновляем данные пациента с ID:', patientId);
        console.log('Отправляемые данные:', updatedData);

        try {
            const response = await fetch(`/api/admin/${patientId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedData),
                credentials: 'include'
            });

            console.log('Статус ответа:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Ошибка ответа:', errorText);
                throw new Error('Ошибка при обновлении данных пациента');
            }

            const result = await response.json();
            console.log('Данные пациента обновлены:', result);
            showNotification('Данные успешно обновлены');
        } catch (error) {
            console.error('Ошибка при обновлении данных:', error);
        }
    }

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
    function showConfirmationModal(appointmentId, patient) {
        currentAppointmentId = appointmentId;
        currentPatientId = null;
        currentSpecialistId = null;
        currentSpecialist = null;
        currentPatient = patient;
        const confirmationMessage = document.querySelector('#confirmation-modal .modal-content p');
        confirmationMessage.innerText = `Вы уверены, что хотите удалить талон № ${appointmentId}?`;
        document.getElementById('confirmation-modal').style.display = 'flex';
    }
    let currentAppointmentId11;
    function showConfirmationModal11(appointmentId) {
        currentAppointmentId = null;
        currentAppointmentId11 = appointmentId;
        currentPatientId = null;
        currentSpecialistId = null;
        currentSpecialist = null;
        currentPatient = null;
        const confirmationMessage = document.querySelector('#confirmation-modal .modal-content p');
        confirmationMessage.innerText = `Вы уверены, что хотите удалить талон № ${appointmentId}?`;
        document.getElementById('confirmation-modal').style.display = 'flex';
    }

    function showConfirmationModalPac(patientId, patient) {
        currentAppointmentId = null;
        currentSpecialistId = null;
        currentSpecialist = null;
        currentPatientId = patientId;
        currentPatient = patient;
        const confirmationMessage = document.querySelector('#confirmation-modal .modal-content p');
        confirmationMessage.innerText = `Вы уверены, что хотите удалить пациента ${patient.surname} ${patient.name} ${patient.secondname}?`;
        document.getElementById('confirmation-modal').style.display = 'flex';
    }
    function showConfirmationModalSpec(specialistId, specialist) {
        currentPatient = null;
        currentAppointmentId = null;
        currentPatientId = null;
        currentSpecialistId = specialistId;
        currentSpecialist = specialist;
        const confirmationMessage = document.querySelector('#confirmation-modal .modal-content p');
        confirmationMessage.innerText = `Вы уверены, что хотите удалить специалиста ${specialist.surname} ${specialist.name} ${specialist.secondname}?`;
        document.getElementById('confirmation-modal').style.display = 'flex';
    }

    document.getElementById('confirmDelete').addEventListener('click', async () => {
        console.log('Кнопка "Да" нажата');

        if (currentAppointmentId) {
            console.log('Удаляем талон с ID:', currentAppointmentId);
            await deleteAppointment(currentAppointmentId, currentPatient);
        } else if (currentPatientId) {
            console.log('Удаляем пациента с ID:', currentPatientId);
            await deletePatient(currentPatientId);
        } else if (currentSpecialistId) {
            console.log('Удаляем speca с ID:', currentSpecialistId);
            await deleteSpecialist(currentSpecialistId);
        } else if (currentAppointmentId11) {
            console.log('Удаляем talon с ID:', currentAppointmentId11);
            await deleteAppointment11(currentAppointmentId11);
        }
        else {
            console.error('Нет ID для удаления');
        }

        closeConfirmationModal();
    });

    document.getElementById('cancelDelete').addEventListener('click', closeConfirmationModal);

    function closeConfirmationModal() {
        document.getElementById('confirmation-modal').style.display = 'none';
    }

    async function deleteAppointment(appointmentId, patient) {
        try {
            console.log('Удаляем талон с ID:', appointmentId);
            console.log('Список талонов до удаления:', patient.appointments);

            const response = await fetch(`/api/appointment/${appointmentId}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (!response.ok) {
                const errorMessage = await response.text();
                throw new Error(`Ошибка при удалении талона: ${errorMessage}`);
            }

            patient.appointments = patient.appointments.filter(appointment => appointment.id.toString() !== appointmentId.toString());

            console.log('Обновленный список талонов:', patient.appointments);

            renderAppointments(patient.appointments, patient);

            showNotification('Талон успешно удалён');
        } catch (error) {
            console.error('Ошибка при удалении талона:', error);
        }
    }
    async function deleteAppointment11(appointmentId) {
        try {
            console.log('Удаляем талон с ID:', appointmentId);

            const response = await fetch(`/api/appointment/${appointmentId}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (!response.ok) {
                const errorMessage = await response.text();
                throw new Error(`Ошибка при удалении талона: ${errorMessage}`);
            }

            appointments11 = appointments11.filter(appointment => appointment.appointmentId.toString() !== appointmentId.toString());

            renderAppointmentsAll(appointments11);

            showNotification('Талон успешно удалён');
        } catch (error) {
            console.error('Ошибка при удалении талона:', error);
        }
    }
    async function deletePatient(patientId) {
        try {
            console.log('Удаляем пациента с ID:', patientId);

            const response = await fetch(`/api/admin/p/${patientId}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (!response.ok) {
                const errorMessage = await response.text();
                throw new Error(`Ошибка при удалении пациента: ${errorMessage}`);
            }
            fetchAllPatients();
            displayAllPatients();
            showNotification('Пациент успешно удалён');
        } catch (error) {
            console.error('Ошибка при удалении пациента:', error);
        }
    }
    async function deleteSpecialist(specialistId) {
        try {
            console.log('Удаляем пациента с ID:', specialistId);

            const response = await fetch(`/api/admin/s/${specialistId}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (!response.ok) {
                const errorMessage = await response.text();
                throw new Error(`Ошибка при удалении speca: ${errorMessage}`);
            }
            fetchAllSpecialists();
            displayAllSpecialists();
            showNotification('Специалист успешно удалён');
        } catch (error) {
            console.error('Ошибка при удалении пациента:', error);
        }
    }
});    