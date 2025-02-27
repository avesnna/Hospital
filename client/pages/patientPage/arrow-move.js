document.addEventListener('DOMContentLoaded', () => {
    const leftArrow = document.querySelector('.left-arrow-icon');
    const rightArrow = document.querySelector('.right-arrow-icon');


    const handleScroll = () => {
        const arrowContainer = document.querySelector('.arrow-container');
        const rect = arrowContainer.getBoundingClientRect();


        if (rect.top >= 0 && rect.bottom <= window.innerHeight) {
            leftArrow.classList.add('animate-left');
            rightArrow.classList.add('animate-right');


            setTimeout(() => {
                leftArrow.classList.remove('animate-left');
                rightArrow.classList.remove('animate-right');
            }, 500);
        }
    };


    window.addEventListener('scroll', handleScroll);
});