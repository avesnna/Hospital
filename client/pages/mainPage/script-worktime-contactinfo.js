
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}


const handleVisibility = (entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {

            entry.target.classList.add('enlarged');


            setTimeout(() => {
                entry.target.classList.remove('enlarged');
            }, 500);
        }
    });
};


const observer = new IntersectionObserver(handleVisibility, {
    threshold: 0.1
});


const leftContainer = document.querySelector('.left-part-container');
const rightContainer = document.querySelector('.right-part-container');

observer.observe(leftContainer);
observer.observe(rightContainer);