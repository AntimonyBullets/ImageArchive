// Import the API base URL from config
import { API_BASE_URL } from '../config.js';

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
let imagesCache = []; // Cache for preloaded images
const IMAGES_PER_PAGE = 12; // Number of images to load per batch
const PRELOAD_THRESHOLD = 0.5; // Preload when 50% of the way through current images

// Image loading optimization
const imageLoadingQueue = [];
let isProcessingQueue = false;

const processImageQueue = async () => {
    if (isProcessingQueue || imageLoadingQueue.length === 0) return;
    
    isProcessingQueue = true;
    const BATCH_SIZE = 3; // Load 3 images at a time
    
    while (imageLoadingQueue.length > 0) {
        const batch = imageLoadingQueue.splice(0, BATCH_SIZE);
        await Promise.all(batch.map(async ({ img, src }) => {
            try {
                // Create a low-quality placeholder
                const canvas = document.createElement('canvas');
                canvas.width = 50;
                canvas.height = 50;
                img.style.filter = 'blur(10px)';
                img.src = canvas.toDataURL();

                // Load the actual image
                await new Promise((resolve, reject) => {
                    const tempImg = new Image();
                    tempImg.onload = () => {
                        img.src = src;
                        img.style.filter = 'none';
                        resolve();
                    };
                    tempImg.onerror = reject;
                    tempImg.src = src;
                });
            } catch (error) {
                console.error('Error loading image:', error);
                img.src = '../assets/image-error.png';
            }
        }));
        
        // Small delay between batches to prevent overwhelming the browser
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    isProcessingQueue = false;
};

// Get auth data with retry mechanism
const getAuthData = async () => {
    let authData = JSON.parse(localStorage.getItem('Data'));
    
    if (!authData) {
        // Retry up to 3 times with a short delay
        for (let i = 0; i < 3; i++) {
            await new Promise(resolve => setTimeout(resolve, 200));
            authData = JSON.parse(localStorage.getItem('Data'));
            if (authData) break;
        }
    }
    
    return authData;
};

// Function to create image element with optimized loading
const createImageElement = (imageData) => {
    const imageContainer = document.createElement('div');
    imageContainer.className = 'image-container';

    const img = document.createElement('img');
    img.loading = 'lazy'; // Use native lazy loading
    img.alt = imageData.description || 'User upload';
    img.className = 'image-transition'; // Add class for smooth transition
    
    // Add to loading queue instead of setting src directly
    imageLoadingQueue.push({ img, src: imageData.image });
    processImageQueue();

    const imageInfo = document.createElement('div');
    imageInfo.className = 'image-info';
    imageInfo.innerHTML = `
        <p class="username">@${imageData.owner.username}</p>
    `;

    // Make container clickable to view user's profile
    imageContainer.addEventListener('click', async () => {
        const authData = await getAuthData();
        if (!authData) return;
        
        if (imageData.owner.username === authData.username) {
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

// Intersection Observer for infinite scroll
const createIntersectionObserver = () => {
    return new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !isLoading) {
                fetchRecentImages();
            }
        });
    }, { rootMargin: '200px' });
};

// Function to fetch recent images
const fetchRecentImages = async (silent = false) => {
    if (isLoading || !hasMore) return;

    try {
        isLoading = true;
        const scrollLoader = document.getElementById('scroll-loader');
        if (!silent) {
            scrollLoader.style.display = 'flex';
        }

        const authData = await getAuthData();
        if (!authData) {
            throw new Error('User data not found');
        }

        const response = await fetch(`${API_BASE_URL}/images/recent?page=${page}&limit=${IMAGES_PER_PAGE}`, {
            headers: {
                'Authorization': `Bearer ${authData.accessToken}`
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
        const fragment = document.createDocumentFragment();

        images.forEach(imageData => {
            const imageElement = createImageElement(imageData);
            fragment.appendChild(imageElement);
        });

        imageGrid.appendChild(fragment);
        page++;

        // Set up intersection observer for the last image
        const observer = createIntersectionObserver();
        const lastImage = imageGrid.lastElementChild;
        if (lastImage) {
            observer.observe(lastImage);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        isLoading = false;
        document.getElementById('scroll-loader').style.display = 'none';
    }
};

// Handle search functionality
const handleSearch = () => {
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');

    const performSearch = async () => {
        const username = searchInput.value.trim();
        if (username) {
            const authData = await getAuthData();
            if (!authData) {
                alert('Please log in to search for users');
                return;
            }
            
            if (username === authData.username) {
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

// Logout functionality with optimized auth handling
const logoutLink = document.getElementById('logout-link');
if (logoutLink) {
    logoutLink.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            const authData = await getAuthData();
            if (!authData) {
                window.location.href = '../index.html';
                return;
            }
            
            const response = await fetch(`${API_BASE_URL}/users/logout`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${authData.accessToken}`
                }
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
    // Add CSS for image transitions
    const style = document.createElement('style');
    style.textContent = `
        .image-transition {
            opacity: 0;
            transition: opacity 0.3s ease-in-out, filter 0.3s ease-in-out;
        }
        .image-transition.loaded {
            opacity: 1;
        }
    `;
    document.head.appendChild(style);

    fetchRecentImages();
    handleSearch();
});