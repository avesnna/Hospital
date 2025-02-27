let isRegisterMode = false;


setActiveButton('patientBtn');


document.getElementById('loginBtn').onclick = function (e) {
    e.preventDefault();
    const overlay = document.getElementById('overlay');
    const modal = document.querySelector('.modal');
    overlay.style.display = 'flex';
    setTimeout(() => {
        modal.classList.add('show');
        resetModal();
    }, 10);
};

document.getElementById('closeBtn').onclick = function () {
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
};

document.getElementById('adminBtn').onclick = function () {
    setActiveButton('adminBtn');
    showEmailField(false);
};

function setActiveButton(activeId) {
    const buttons = document.querySelectorAll('.role-btn');
    buttons.forEach(button => {
        if (button.id === activeId) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
}

function showEmailField(show) {
    const emailGroup = document.getElementById('emailGroup');
    const registerLink = document.getElementById('registerLink');

    if (show) {
        emailGroup.style.display = 'block';
        registerLink.style.display = 'block';
    } else {
        emailGroup.style.display = 'none';
        registerLink.style.display = 'none';
    }
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

