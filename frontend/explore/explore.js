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
    
    // Add placeholder while image loads
    img.style.backgroundColor = '#f0f0f0';
    
    // Set up intersection observer for each image
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Only set the src when the image is about to enter the viewport
                img.src = imageData.image;
                observer.disconnect();
            }
        });
    }, { rootMargin: '200px' }); // Load when within 200px of viewport
    
    observer.observe(img);

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

// Function to render images from cache to DOM
const renderImages = (startIdx, count) => {
    const imageGrid = document.getElementById('image-grid');
    const fragment = document.createDocumentFragment(); // Use document fragment for better performance
    
    const endIdx = Math.min(startIdx + count, imagesCache.length);
    
    for (let i = startIdx; i < endIdx; i++) {
        const imageElement = createImageElement(imagesCache[i]);
        fragment.appendChild(imageElement);
    }
    
    imageGrid.appendChild(fragment);
    return endIdx - startIdx; // Return number of images rendered
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

        // Add new images to cache
        imagesCache = imagesCache.concat(images);
        
        // If this is the first page, render immediately
        if (page === 1) {
            renderImages(0, images.length);
        }

        page++;

    } catch (error) {
        console.error('Error:', error);
    } finally {
        isLoading = false;
        document.getElementById('scroll-loader').style.display = 'none';
    }
};

// Optimized infinite scroll handler with debounce
let scrollTimeout;
const handleScroll = () => {
    if (scrollTimeout) clearTimeout(scrollTimeout);
    
    scrollTimeout = setTimeout(() => {
        const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
        const scrollPosition = scrollTop + clientHeight;
        const totalHeight = scrollHeight;
        
        // Calculate how far through the content we've scrolled (0 to 1)
        const scrollPercentage = scrollPosition / totalHeight;
        
        // If we're near the bottom, render more images from cache and possibly fetch more
        if (scrollPercentage > 0.7 && !isLoading) {
            const currentCount = document.querySelectorAll('.image-container').length;
            
            // If we have cached images that aren't rendered yet, render them
            if (currentCount < imagesCache.length) {
                renderImages(currentCount, IMAGES_PER_PAGE);
            }
            
            // If we're running low on cached images, fetch more
            if (currentCount >= imagesCache.length * PRELOAD_THRESHOLD && hasMore) {
                fetchRecentImages(true); // Silent fetch (don't show loader)
            }
        }
    }, 100); // 100ms debounce
};

// Search functionality with optimized auth data retrieval
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

// Initialize with optimized event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initial fetch
    fetchRecentImages();
    
    // Set up search
    handleSearch();
    
    // Use passive event listener for better scroll performance
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Prefetch next page when idle
    if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
            if (page === 2 && hasMore && !isLoading) {
                fetchRecentImages(true);
            }
        });
    }
});