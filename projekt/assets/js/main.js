document.addEventListener('DOMContentLoaded', function() {
    let data = null;
    let mainSwiper, sideSwiper;

   
    function fetchData() {
        return fetch('data.json')
            .then(response => response.json())
            .then(json => {
                data = json;
                return data;
            });
    }

    
    function renderCharacters() {
        const mainWrapper = document.querySelector('.mainSwiper .swiper-wrapper');
        const sideWrapper = document.querySelector('.sideSwiper .swiper-wrapper');

        mainWrapper.innerHTML = '';
        sideWrapper.innerHTML = '';

        data.characters.forEach(character => {
            const slide = document.createElement('div');
            slide.className = 'swiper-slide flex justify-center';
            slide.innerHTML = `
                <div class="character-card bg-white p-8 rounded-lg shadow-lg flex flex-row items-start card-hover mx-4 max-w-4xl" style="max-width: 1000px;">
                    <img src="${character.image}" alt="${character.name}" class="w-2/5 h-auto rounded-lg border-4 border-gray-200 object-contain mr-8 flex-shrink-0">
                    <div class="flex-1">
                        <h3 class="text-3xl font-bold mb-4 text-gray-800">${character.name}</h3>
                        <p class="text-gray-600 text-lg mb-6 leading-relaxed">${character.description}</p>
                        <p class="text-lg text-gray-500 mb-6">Votes: <span class="vote-count font-semibold">${character.votes}</span></p>
                        <button class="vote-btn bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 btn-hover text-xl font-semibold" data-id="${character.id}">Vote</button>
                    </div>
                </div>
            `;

            if (character.category === 'main') {
                mainWrapper.appendChild(slide);
            } else {
                sideWrapper.appendChild(slide);
            }
        });
    }

    
    function updateStatistics() {
        const mainChars = data.characters.filter(c => c.category === 'main');
        const sideChars = data.characters.filter(c => c.category === 'side');

        let maxMainVotes = -1;
        let mostPopularMain = null;
        for (let char of mainChars) {
            if (char.votes > maxMainVotes) {
                maxMainVotes = char.votes;
                mostPopularMain = char;
            }
        }

        let maxSideVotes = -1;
        let mostPopularSide = null;
        for (let char of sideChars) {
            if (char.votes > maxSideVotes) {
                maxSideVotes = char.votes;
                mostPopularSide = char;
            }
        }

        document.getElementById('most-popular-main').textContent = mostPopularMain ? `${mostPopularMain.name} (${mostPopularMain.votes} votes)` : 'No data';
        document.getElementById('most-popular-side').textContent = mostPopularSide ? `${mostPopularSide.name} (${mostPopularSide.votes} votes)` : 'No data';
    }

    
    function renderAuthor() {
        document.getElementById('author-name').textContent = data.author.name;
        document.getElementById('author-email').textContent = data.author.email;
        document.getElementById('author-bio').textContent = data.author.bio;
    }

    
    function initSwipers() {
        mainSwiper = new Swiper('.mainSwiper', {
            slidesPerView: 1,
            centeredSlides: true,
            spaceBetween: 50,
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
            on: {
                slideChange: function() {
                    updateIndicator(this, 'main');
                }
            }
        });

        sideSwiper = new Swiper('.sideSwiper', {
            slidesPerView: 1,
            centeredSlides: true,
            spaceBetween: 50,
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
            on: {
                slideChange: function() {
                    updateIndicator(this, 'side');
                }
            }
        });

        
        updateIndicator(mainSwiper, 'main');
        updateIndicator(sideSwiper, 'side');
    }

   
    function updateIndicator(swiper, type) {
        const indicator = document.querySelector(`.${type}-indicator`);
        const total = swiper.slides.length;
        const current = swiper.activeIndex + 1;
        indicator.textContent = `Character ${current} of ${total}`;
    }

    
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('vote-btn')) {
            const id = e.target.getAttribute('data-id');
            fetch('api.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id: parseInt(id) }),
            })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    
                    if (mainSwiper) mainSwiper.destroy();
                    if (sideSwiper) sideSwiper.destroy();
                    
                    fetchData().then(() => {
                        renderCharacters();
                        updateStatistics();
                        initSwipers();
                    });
                } else {
                    alert('Error: ' + result.error);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred while voting.');
            });
        }
    });

    
    document.getElementById('contact-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            message: formData.get('message'),
        };
        alert('sended');

        fetch('contact.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })
        .then(response => response.json())
        .then(result => {
            const messageDiv = document.getElementById('form-message');
            if (result.success) {
                messageDiv.innerHTML = '<p class="text-green-600">sended</p>';
                this.reset();
            } else {
                messageDiv.innerHTML = '<p class="text-red-600">Error: ' + result.error + '</p>';
            }
        })
    });

    
    fetchData().then(() => {
        renderCharacters();
        updateStatistics();
        initSwipers();
        initSmoothScroll();
    });

    
    function initSmoothScroll() {
        const navLinks = document.querySelectorAll('nav a');
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href').substring(1);
                const targetSection = document.getElementById(targetId);
                if (targetSection) {
                    targetSection.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    }
});