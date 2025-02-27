let isRegisterMode = false;


setActiveButton('patientBtn');



document.getElementById('loginBtn').onclick = function (e) {
    e.preventDefault();
    const overlay = document.getElementById('overlay');
    const modal = document.querySelector('.modal');
    document.querySelector('.role-buttons').style.display = 'block';

    overlay.style.display = 'flex';
    setTimeout(() => {
        modal.classList.add('show');
        resetModal();
    }, 10);
};


document.getElementById('closeBtn').onclick = function () {
    isRegister = false;
    toggleForms(isRegister);
    closeModal();
};


document.getElementById('overlay').onclick = function (e) {
    if (e.target === this) {
        closeModal();
    }
};


function closeModal() {
    const modal = document.querySelector('.modal');
    modal.classList.remove('show');
    document.getElementById('overlay').style.display = 'none';
}


function resetModal() {
    isRegisterMode = false;
    document.getElementById('authForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('registerLink').style.display = 'block';
    document.getElementById('backBtn').style.display = 'none';
    document.getElementById('emailGroup').style.display = 'block';
    document.getElementById('authForm').reset();
    document.getElementById('registerForm').reset();
    setActiveButton('patientBtn');
}


document.getElementById('registerToggle').onclick = function (e) {
    e.preventDefault();
    toggleForms(true);
};

document.getElementById('backBtn').onclick = function () {
    toggleForms(false);
};

function toggleForms(isRegister) {
    isRegisterMode = isRegister;
    document.getElementById('authForm').style.display = isRegister ? 'none' : 'block';
    document.getElementById('registerForm').style.display = isRegister ? 'block' : 'none';
    document.getElementById('registerLink').style.display = isRegister ? 'none' : 'block';
    document.getElementById('backBtn').style.display = isRegister ? 'block' : 'none';
    const whovhod = document.getElementById('whovhodid');
    whovhod.style.display = isRegister ? 'none' : 'block';

    const modal = document.querySelector('.modal');
    if (isRegister) {
        modal.style.width = '500px';
        modal.style.height = '610px';
        modal.style.paddingTop = '60px';
        modal.style.paddingBottom = '30px';
    } else {
        modal.style.width = '';
        modal.style.height = '';
        modal.style.paddingTop = '';
        modal.style.paddingBottom = '';
    }

    const roleButtons = document.querySelectorAll('#patientBtn, #specialistBtn, #adminBtn');
    roleButtons.forEach(btn => {
        btn.style.display = isRegister ? 'none' : 'inline-block';
    });
}


document.getElementById('patientBtn').onclick = function () {
    setActiveButton('patientBtn');
    showEmailField(true);

};

document.getElementById('specialistBtn').onclick = function () {
    setActiveButton('specialistBtn');
    showEmailField(false);
    const fogpass = document.getElementById('fogpass');
    fogpass.style.display = 'none';
};

document.getElementById('adminBtn').onclick = function () {
    setActiveButton('adminBtn');
    showEmailField(false);
    const fogpass = document.getElementById('fogpass');
    fogpass.style.display = 'none';
};

function setActiveButton(activeId) {
    const buttons = document.querySelectorAll('.role-btn');
    buttons.forEach(button => {
        button.classList.toggle('active', button.id === activeId);
    });
    const fogpass = document.getElementById('fogpass');
    fogpass.style.display = 'inline';
}

function showEmailField(show) {
    const emailGroup = document.getElementById('emailGroup');
    const registerLink = document.getElementById('registerLink');
    emailGroup.style.display = show ? 'block' : 'none';
    registerLink.style.display = show ? 'block' : 'none';
}


function togglePasswordVisibility(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    input.type = input.type === 'password' ? 'text' : 'password';
    icon.classList.toggle('fa-eye');
    icon.classList.toggle('fa-eye-slash');
}


document.getElementById('togglePassword').onclick = function () {
    togglePasswordVisibility('password', 'togglePassword');
};

document.getElementById('toggleRegPassword').onclick = function () {
    togglePasswordVisibility('regPassword', 'toggleRegPassword');
};



document.getElementById('authForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const isSpecialist = document.getElementById('specialistBtn').classList.contains('active');
    const isAdmin = document.getElementById('adminBtn').classList.contains('active');
    const password = document.getElementById('password').value;
    let email;


    if (!isSpecialist && !isAdmin) {
        email = document.getElementById('email').value;
    }

    try {
        const response = await fetch(isAdmin ? '/api/admin/login' : isSpecialist ? '/api/specialist/login' : '/api/patient/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(isAdmin ? { password } : isSpecialist ? { password } : { gmail: email, password }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Ошибка: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('Server response:', data);


        if (data.success) {
            sessionStorage.setItem('notification', `Здравствуйте, ${data.fullName}!`);
            sessionStorage.setItem('fullName', data.fullName);
            sessionStorage.setItem('userRole', data.role);
            sessionStorage.setItem('Id', data.id);
            sessionStorage.setItem('departmentId', data.departmentId);
            console.log('Department ID saved in main:', data.departmentId);

            const authCheckResponse = await fetch(isAdmin ? '/api/admin/auth' : isSpecialist ? '/api/specialist/auth' : '/api/patient/auth', {
                method: 'GET',
                credentials: 'include',
            });

            if (authCheckResponse.ok) {
                const authData = await authCheckResponse.json();
                if (authData.success) {
                    sessionStorage.setItem('fullName', data.fullName);
                    sessionStorage.setItem('userRole', data.role);
                    sessionStorage.setItem('Id', data.id);
                    console.log('ID пользователя сохранен:', data.id);
                    sessionStorage.setItem('departmentId', data.departmentId);
                    console.log('Department ID saved in main2:', data.departmentId);
                } else {
                    alert(authData.message || 'Ошибка проверки авторизации');
                }
            } else {
                throw new Error('Ошибка проверки авторизации');
            }


            window.location.href = isAdmin ? '/api/admin' : isSpecialist ? '/api/specialist' : '/api/patient';
        } else {
            alert(data.message || 'Пользователь не найден');
        }
    } catch (error) {
        console.error('Ошибка при авторизации');
        alert('Произошла ошибка при авторизации');
    }
});


document.getElementById('registerForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const surname = document.getElementById('surname').value;
    const firstname = document.getElementById('firstname').value;
    const lastname = document.getElementById('lastname').value;
    const gender = document.getElementById('gender').value;
    const dob = document.getElementById('dob').value;
    const phone = document.getElementById('phone').value;
    const address = document.getElementById('address').value;
    const regEmail = document.getElementById('regEmail').value;
    const regPassword = document.getElementById('regPassword').value;

    try {
        const response = await fetch('/api/patient/registration', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                surname,
                name: firstname,
                secondname: lastname,
                gender,
                birthdate: dob,
                phonenumber: phone,
                adress: address,
                enter: {
                    gmail: regEmail,
                    password: regPassword
                }
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Ошибка: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        sessionStorage.setItem('notification', 'Регистрация прошла успешно');
        document.getElementById('email').value = regEmail;
        document.getElementById('password').value = regPassword;


        document.getElementById('registerForm').reset();
        document.getElementById('registerForm').style.display = 'none';
        const modal = document.querySelector('.modal');
        modal.style.width = '';
        modal.style.height = '';
        modal.style.paddingTop = '';
        modal.style.paddingBottom = '';
        document.getElementById('backBtn').style.display = 'none';
        document.getElementById('whovhodid').style.display = 'block';
        document.getElementById('authForm').style.display = 'block';
        document.getElementById('registerLink').style.display = 'block';
        const roleButtons = document.querySelectorAll('#patientBtn, #specialistBtn, #adminBtn');
        roleButtons.forEach(btn => {
            btn.style.display = 'inline-block';
        });
    } catch (error) {
        console.error('Ошибка при регистрации:', error);
        sessionStorage.setItem('notification', 'Ошибка при регистрации: ' + error.message);
    }
});


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

document.getElementById('confirmAuth').addEventListener('click', async () => {



    const overlay = document.getElementById('overlay');
    const modal = document.getElementById('modal');


    overlay.style.display = 'flex';
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
    closeConfirmationModal();
});


document.getElementById('cancelAuth').addEventListener('click', closeConfirmationModal);

function showConfirmationModal() {
    document.getElementById('overlay1').style.display = 'flex';
    const confirmationMessage = document.querySelector('#confirmation-modal1 .modal-content1 p');
    confirmationMessage.innerText = `Оформление талона доступно только авторизованным пользователям :(`;
    document.getElementById('confirmation-modal1').style.display = 'flex';
}


function closeConfirmationModal() {
    const modal1 = document.querySelector('.modal1');
    modal1.classList.remove('show');
    document.getElementById('overlay1').style.display = 'none';
}


document.getElementById('overlay1').onclick = function (e) {
    console.log('Клик на оверлей зарегистрирован');

    if (e.target === this) {
        console.log('Клик был по самому оверлею, закрываем модальное окно');
        document.getElementById('confirmation-modal1').style.display = 'none';
        closeConfirmationModal();
    } else {
        console.log('Клик был по элементу внутри оверлея: ', e.target);
        console.log('Тип элемента:', e.target.tagName);
        console.log('ID элемента:', e.target.id);
        console.log('Класс элемента:', e.target.className);
    }
};



document.addEventListener('DOMContentLoaded', () => {
    const notification = sessionStorage.getItem('notification');
    const talonContainer = document.querySelector('.image-container');
    if (notification) {
        showNotification(notification);
        sessionStorage.removeItem('notification');
    }
    const talonArrow = talonContainer.querySelector(`#talonarrow`);
    if (talonArrow) {
        talonArrow.addEventListener('click', (event) => {
            event.preventDefault();
            showConfirmationModal();
        });
    } else {
        console.error('Стрелка не найдена!');
    }
    document.getElementById('password').addEventListener('input', function () {
        if (this.value.length > 10) {
            this.value = this.value.slice(0, 10);
            this.classList.add('error');
        } else {
            this.classList.remove('error');
        }
    });


    document.getElementById('email').addEventListener('input', function () {
        if (this.value.length > 40) {
            this.value = this.value.slice(0, 40);
            this.classList.add('error');
        } else {
            this.classList.remove('error');
        }
    });


    function preventSpecialCharsForPassword(event) {

        const regex = /^[a-zA-Z0-9]*$/;
        if (!regex.test(event.target.value)) {
            event.target.value = event.target.value.replace(/[^a-zA-Z0-9]/g, '');
        }
    }

    function preventSpecialCharsForEmail(event) {
        const regex = /^[a-zA-Z0-9@.]*$/;
        if (!regex.test(event.target.value)) {

            event.target.value = event.target.value.replace(/[^a-zA-Z0-9@.]/g, '');
        }
    }
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
    document.getElementById('phone').addEventListener('input', preventSpecialCharsForPhone);

    document.getElementById('surname').addEventListener('input', preventSpecialCharsForFIO);
    document.getElementById('firstname').addEventListener('input', preventSpecialCharsForFIO);
    document.getElementById('lastname').addEventListener('input', preventSpecialCharsForFIO);

    document.getElementById('resetEmail').addEventListener('input', preventSpecialCharsForEmail);
    document.getElementById('email').addEventListener('input', preventSpecialCharsForEmail);
    document.getElementById('regEmail').addEventListener('input', preventSpecialCharsForEmail);
    document.getElementById('address').addEventListener('input', preventSpecialCharsForAddress);
    document.getElementById('password').addEventListener('input', preventSpecialCharsForPassword);
    document.getElementById('regPassword').addEventListener('input', preventSpecialCharsForPassword);
    const today = new Date().toISOString().split('T')[0];
    const dobInput = document.getElementById('dob');
    dobInput.setAttribute('max', today);


    dobInput.addEventListener('input', function () {
        const selectedDate = new Date(dobInput.value);
        const currentDate = new Date(today);

        if (selectedDate > currentDate) {

            this.classList.add('error');
            dobInput.value = '';
        } else {

            this.classList.remove('error');
        }
    });



    document.getElementById('fogpass').addEventListener('click', function (event) {
        event.preventDefault();
        document.getElementById('authForm').style.display = 'none';
        document.getElementById('resetPassword').style.display = 'block';
        document.getElementById('backButton').style.display = 'block';
        document.getElementById('whovhodid').style.display = 'none';
        document.querySelector('.role-buttons').style.display = 'none';
    });


    document.getElementById('backButton').addEventListener('click', function () {
        document.getElementById('resetPassword').style.display = 'none';
        document.getElementById('authForm').style.display = 'block';
        document.getElementById('whovhodid').style.display = 'block';
        document.querySelector('.role-buttons').style.display = 'block';
    });


    document.getElementById('closeButton').addEventListener('click', function () {
        document.getElementById('resetPassword').style.display = 'none';
        document.querySelector('.role-buttons').style.display = 'block';
        document.querySelector('.mess').style.display = 'none';
        isRegister = false;
        toggleForms(isRegister);


        document.getElementById('resetPassword').innerHTML = '';
        closeModal();
    });


    document.querySelector('.pochtb').addEventListener('click', async function (event) {
        event.preventDefault();

        const gmail = document.getElementById('resetEmail').value;
        const messageSpan = document.querySelector('.mess');

        try {
            const response = await fetch('/api/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ gmail })
            });

            const result = await response.text();


            messageSpan.textContent = result;
            messageSpan.style.display = 'block';
        } catch (error) {
            console.error('Ошибка:', error);
            const messageSpan = document.querySelector('.mess');
            messageSpan.textContent = 'Произошла ошибка, попробуйте позже.';
            messageSpan.style.display = 'block';
        }
    });

});