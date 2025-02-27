
const carousel = document.querySelector('.carousel');
const nextArrow = document.querySelector('.right-arrow-icon');
const prevArrow = document.querySelector('.left-arrow-icon');
let currentIndex = 0;
const totalContainers = 6;
const visibleContainers = 3;
const containerWidth = 350;
const containerMargin = 20;

nextArrow.addEventListener('click', () => {
    currentIndex++;
    if (currentIndex > totalContainers - visibleContainers) {
        currentIndex = 0;
    }
    updateCarousel();
});

prevArrow.addEventListener('click', () => {
    currentIndex--;
    if (currentIndex < 0) {
        currentIndex = totalContainers - visibleContainers;
    }
    updateCarousel();
});

function updateCarousel() {
    const offset = -(currentIndex * (containerWidth + containerMargin));
    carousel.style.transform = `translateX(${offset}px)`;
}