document.getElementById('myProfile').addEventListener('click', function (event) {
    event.preventDefault();
    const dropdownMenu = document.getElementById('dropdownMenu');
    dropdownMenu.classList.toggle('show');

    this.classList.toggle('active', dropdownMenu.classList.contains('show'));

});


window.addEventListener('click', function (event) {
    const dropdownMenu = document.getElementById('dropdownMenu');
    if (!event.target.matches('#myProfile') && !event.target.closest('.dropdown-content') && dropdownMenu.classList.contains('show')) {
        dropdownMenu.classList.remove('show');
        document.getElementById('myProfile').classList.remove('active');
    }
});