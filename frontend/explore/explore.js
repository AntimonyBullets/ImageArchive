// Function to show/hide loading spinner
const toggleLoadingSpinner = (show) => {
    const loadingSpinner = document.getElementById('loading-spinner');
    if (loadingSpinner) {
        loadingSpinner.style.display = show ? 'flex' : 'none';
    }
};

// Variables for infinite scroll
let page = 1;
let isLoading = false;
let hasMore = true;

// Function to create image element
const createImageElement = (imageData) => {
    const imageContainer = document.createElement('div');
    imageContainer.className = 'image-container';

    const img = document.createElement('img');
    img.src = imageData.image;
    img.alt = imageData.description || 'User upload';
    img.loading = 'lazy';

    const imageInfo = document.createElement('div');
    imageInfo.className = 'image-info';
    imageInfo.innerHTML = `
        <p class="username">@${imageData.owner.username}</p>
    `;

    // Make container clickable to view user's profile
    imageContainer.addEventListener('click', () => {
        const Data = JSON.parse(localStorage.getItem('Data'));
        if (imageData.owner.username === Data.username) {
            window.location.href = '../profile/profile.html';
        } else {
            localStorage.setItem('searchedUsername', imageData.owner.username);
            window.location.href = '../otherProfile/otherProfile.html';
        }
    });

    imageContainer.appendChild(img);
    imageContainer.appendChild(imageInfo);
    return imageContainer;
};

// Function to fetch recent images
const fetchRecentImages = async () => {
    if (isLoading || !hasMore) return;

    try {
        isLoading = true;
        const scrollLoader = document.getElementById('scroll-loader');
        scrollLoader.style.display = 'flex';

        const Data = JSON.parse(localStorage.getItem('Data'));
        if (!Data) {
            throw new Error('User data not found');
        }

        const response = await fetch(`http://localhost:5000/api/v1/images/recent?page=${page}`, {
            headers: {
                'Authorization': `Bearer ${Data.accessToken}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch images');
        }

        const data = await response.json();
        const images = data.data.images;

        if (images.length === 0) {
            hasMore = false;
            document.getElementById('no-more-images').style.display = 'block';
            scrollLoader.style.display = 'none';
            return;
        }

        const imageGrid = document.getElementById('image-grid');
        images.forEach(image => {
            const imageElement = createImageElement(image);
            imageGrid.appendChild(imageElement);
        });

        page++;

    } catch (error) {
        console.error('Error:', error);
    } finally {
        isLoading = false;
        document.getElementById('scroll-loader').style.display = 'none';
    }
};

// Infinite scroll handler
const handleScroll = () => {
    const scrollLoader = document.getElementById('scroll-loader');
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;

    if (scrollTop + clientHeight >= scrollHeight - 100 && !isLoading && hasMore) {
        fetchRecentImages();
    }
};

// Search functionality
const handleSearch = () => {
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');

    const performSearch = () => {
        const username = searchInput.value.trim();
        if (username) {
            const Data = JSON.parse(localStorage.getItem('Data'));
            
            if (username === Data.username) {
                window.location.href = '../profile/profile.html';
            } else {
                localStorage.setItem('searchedUsername', username);
                window.location.href = '../otherProfile/otherProfile.html';
            }
        }
    };

    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
};

// Logout functionality
const logoutLink = document.getElementById('logout-link');
if (logoutLink) {
    logoutLink.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:5000/api/v1/users/logout', {
                method: 'POST',
                credentials: 'include'
            });
            if (response.ok) {
                localStorage.removeItem('Data');
                window.location.href = '../index.html';
            }
        } catch (error) {
            console.error('Error logging out:', error);
        }
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchRecentImages();
    handleSearch();
    window.addEventListener('scroll', handleScroll);
});