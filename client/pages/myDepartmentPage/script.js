document.addEventListener('DOMContentLoaded', async () => {
    const fullName = sessionStorage.getItem('fullName');
    const userRole = sessionStorage.getItem('userRole');
    const specialistID = sessionStorage.getItem('Id');

    const notification = sessionStorage.getItem('notification');
    if (notification) {
        showNotification(notification);
        sessionStorage.removeItem('notification');
    }

    if (fullName) {
        const sessionUserDiv = document.getElementById('sessionUser');
        sessionUserDiv.innerHTML = fullName.replace(' ', '<br>');
    }

    const departmentID = sessionStorage.getItem('departmentId');
    if (departmentID) {
        console.log('Fetching specialists for department ID:', departmentID);

        const department = await fetchDepartment(departmentID);
        const specialists = await fetchSpecialists(departmentID);
        displaySpecialists(specialists, department);
    }

    const allDepartments = await fetchAllDepartments();
    const excludedDepartmentID = parseInt(departmentID, 10);
    displayAllDepartments(allDepartments, excludedDepartmentID);


    function displaySpecialists(specialists, department) {
        const scheduleContainer = document.getElementById('scheduleContainer');
        const departmentNameElement = document.getElementById('departmentName');


        departmentNameElement.innerText = department.name.toUpperCase();

        if (specialists.length === 0) {
            scheduleContainer.innerHTML = '<p>Нет специалистов в этом отделении.</p>';
            return;
        }

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
        ${specialists.map(worker => {
            const fullName = `${worker.surname} ${worker.name} ${worker.secondname}`;


            const sessionSpecialistName = sessionStorage.getItem('fullName');


            const rowClass = fullName === sessionSpecialistName ? 'highlight' : '';

            return `
                <tr class="${rowClass}">
                    <td>${fullName}</td>
                    <td>${worker.schedule ? worker.schedule.weekdays : 'Нет графика'}</td>
                    <td>${worker.schedule ? formatTimeRange(worker.schedule.startTime, worker.schedule.endTime) : 'Нет графика'}</td>
                </tr>
            `;
        }).join('')}
    </tbody>
`;



        scheduleContainer.appendChild(table);


        function formatTimeRange(startTime, endTime) {
            return `${formatTime(startTime)} - ${formatTime(endTime)}`;
        }


        function formatTime(timeString) {
            const [hours, minutes] = timeString.split(':');
            return `${hours}.${minutes.padStart(2, '0')}`;
        }
    }


    function displayAllDepartments(departments, excludedDepartmentID) {


        departments.forEach((department, index) => {

            if (department.id === excludedDepartmentID) {
                return;
            }

            const departmentContainer = document.createElement('div');
            departmentContainer.className = 'graf-container';
            departmentContainer.id = `graf${index + 2}`;

            const departmentName = document.createElement('h1');
            departmentName.innerText = department.name.toUpperCase();
            departmentContainer.appendChild(departmentName);

            const scheduleContainer = document.createElement('div');
            scheduleContainer.id = 'scheduleContainer';
            departmentContainer.appendChild(scheduleContainer);


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
            scheduleContainer.appendChild(table);



            document.body.appendChild(departmentContainer);
        });
        function formatTimeRange(startTime, endTime) {
            return `${formatTime(startTime)} - ${formatTime(endTime)}`;
        }


        function formatTime(timeString) {
            const [hours, minutes] = timeString.split(':');
            return `${hours}.${minutes.padStart(2, '0')}`;
        }
    }

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


async function fetchDepartment(departmentID) {
    try {
        const response = await fetch(`/api/department/${departmentID}`);
        if (!response.ok) {
            throw new Error('Ошибка при получении данных о департаменте');
        }
        return await response.json();
    } catch (error) {
        console.error(error);
        return {};
    }
}


async function fetchSpecialists(departmentID) {
    try {
        const response = await fetch(`/api/department/${departmentID}`);
        if (!response.ok) {
            throw new Error('Ошибка при получении специалистов');
        }
        const data = await response.json();
        return data.workers;
    } catch (error) {
        console.error(error);
        return [];
    }
}


async function fetchAllDepartments(departmentID) {
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