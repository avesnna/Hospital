document.addEventListener('DOMContentLoaded', async () => {
    const fullName = sessionStorage.getItem('fullName');
    const userRole = sessionStorage.getItem('userRole');
    const patientId = sessionStorage.getItem('Id');
    const departmentSelect = document.getElementById('department');
    const specialistSelect = document.getElementById('specialist');
    const dateInput = document.getElementById('date');
    const timeInput = document.getElementById('time');
    let specialistSchedule = null;

    if (fullName) {
        const sessionUserDiv = document.getElementById('sessionUser');
        sessionUserDiv.innerHTML = fullName.replace(' ', '<br>');
    }

    async function fetchDepartments() {
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

    async function fetchSpecialists(departmentId) {
        try {
            const response = await fetch(`/api/department/${departmentId}`);
            if (!response.ok) throw new Error('Ошибка при загрузке специалистов');

            const { workers } = await response.json();
            specialistSelect.innerHTML = '<option value="">Выберите специалиста</option>';
            workers.forEach(worker => {
                const option = document.createElement('option');
                option.value = worker.id;
                option.textContent = `${worker.surname} ${worker.name} ${worker.secondname} (${worker.speciality})`;
                specialistSelect.appendChild(option);
            });
            specialistSelect.disabled = false;
        } catch (error) {
            console.error('Ошибка при загрузке специалистов:', error);
            alert(error.message);
        }
    }

    async function fetchSpecialistSchedule(specialistId) {
        try {
            const response = await fetch(`/api/specialist/${specialistId}`);
            if (!response.ok) throw new Error('Ошибка при загрузке графика специалиста');

            const { schedule } = await response.json();
            specialistSchedule = schedule;
            console.log('График специалиста:', specialistSchedule);
        } catch (error) {
            console.error('Ошибка при загрузке графика специалиста:', error);
            alert(error.message);
        }
    }

    await fetchDepartments();

    departmentSelect.addEventListener('change', (event) => {
        const departmentId = event.target.value;
        if (departmentId) {
            fetchSpecialists(departmentId);

        } else {
            specialistSelect.innerHTML = '<option value="">Сначала выберите отделение</option>';
            specialistSelect.disabled = true;
        }
    });

    specialistSelect.addEventListener('change', async (event) => {
        const specialistId = event.target.value;
        if (specialistId) {
            await fetchSpecialistSchedule(specialistId);
            dateInput.disabled = false;
            timeInput.disabled = true;
            populateDatePicker();
        } else {
            dateInput.disabled = true;
            timeInput.disabled = true;
        }
    });

    function populateDatePicker() {
        if (!specialistSchedule) return;

        const today = new Date();
        const availableDates = [];

        for (let i = 0; i <= 30; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            const dayOfWeek = date.toLocaleString('ru-RU', { weekday: 'long' });
            const weekdays = specialistSchedule.weekdays.split(' ');
            const weekDays = {
                'понедельник': 'пн',
                'вторник': 'вт',
                'среда': 'ср',
                'четверг': 'чт',
                'пятница': 'пт',
                'суббота': 'сб',
                'воскресенье': 'вс'
            };
            const appointmentWeekDay = weekDays[dayOfWeek];

            if (weekdays.includes(appointmentWeekDay)) {
                availableDates.push(date);
            }
        }

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
                    populateTimeOptions();
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

        $(timeInput).timepicker({
            timeFormat: 'H:i',
            interval: 30,
            minTime: `${startHour[0]}:${(startHour[1] < 10 ? '0' : '') + startHour[1]}`,
            maxTime: `${endHour[0]}:${(endHour[1] < 10 ? '0' : '') + endHour[1]}`,
            dynamic: false,
            dropdown: true,
            scrollbar: true
        });

        timeInput.disabled = false;
    }

    document.getElementById('appointmentForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const patientId = sessionStorage.getItem('Id');
        console.log('id usera', patientId);
        const date = formData.get('date');
        const time = formData.get('time');
        const specialistId = specialistSelect.value;

        const data = {
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

                window.location.href = '/api/appointment';
            } else {
                const error = await response.json();
                document.getElementById('notification').textContent = error.message;
            }
        } catch (error) {
            console.error('Ошибка при создании талона:', error);
            document.getElementById('notification').textContent = 'Ошибка при создании талона';
        }
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