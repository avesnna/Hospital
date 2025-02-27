function toggleInfo(selectedElement) {
    const departments = document.querySelectorAll('.department, .department-cons');

    departments.forEach(department => {
        if (department !== selectedElement) {

            department.classList.remove('open');

            if (department.classList.contains('department')) {
                department.style.height = '70px';
            } else {
                department.style.height = '120px';
            }
        }
    });


    if (selectedElement.classList.contains('open')) {
        selectedElement.classList.remove('open');

        if (selectedElement.classList.contains('department')) {
            selectedElement.style.height = '70px';
        } else {
            selectedElement.style.height = '120px';
        }
    } else {
        selectedElement.classList.add('open');

        if (selectedElement.classList.contains('department')) {
            selectedElement.style.height = '310px';
        } else {
            selectedElement.style.height = '350px';
        }
    }
}


document.addEventListener('click', function (event) {
    const departments = document.querySelectorAll('.department, .department-cons');
    const isClickInside = Array.from(departments).some(department => department.contains(event.target));

    if (!isClickInside) {
        departments.forEach(department => {
            department.classList.remove('open');
            if (department.classList.contains('department')) {
                department.style.height = '70px';
            } else {
                department.style.height = '120px';
            }
        });
    }
});
