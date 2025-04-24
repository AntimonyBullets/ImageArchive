// Import the API base URL from config
import { API_BASE_URL } from '../config.js';

// Function to show/hide loading spinner
const toggleLoadingSpinner = (show) => {
    const loadingSpinner = document.getElementById('loading-spinner');
    if (loadingSpinner) {
        loadingSpinner.style.display = show ? 'flex' : 'none';
    }
};

// Function to get username from URL parameters
const getUsernameFromURL = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('username');
};

// Function to fetch and display user profile
const fetchUserProfile = async (username) => {
    try {
        toggleLoadingSpinner(true);

        const Data = JSON.parse(localStorage.getItem('Data'));
        if (!Data) {
            console.error('User data not found in localStorage');
            return;
        }

        const response = await fetch(`${API_BASE_URL}/users/${username}`, {
            headers: {
                "Authorization": `Bearer ${Data.accessToken}`
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                alert('User does not exist');
                window.location.href = '../profile/profile.html';
                return;
            }
            throw new Error('Failed to fetch profile');
        }

        const rawProfileData = await response.json();
        const profileData = rawProfileData.data;

        // Update profile information
        const avatarElement = document.getElementById('profile-avatar');
        avatarElement.src = profileData.avatar || '../assets/default-avatar.png';
        avatarElement.alt = `${profileData.fullName}'s avatar`;
        
        document.getElementById('profile-fullName').textContent = profileData.fullName;
        document.getElementById('profile-username').textContent = `@${profileData.username}`;
        document.title = `${profileData.fullName} | ImageShare`;

        // Display user's images
        const imageGrid = document.getElementById('image-grid');
        const noImagesMessage = document.getElementById('no-images');
        imageGrid.innerHTML = '';

        if (profileData.images && profileData.images.length > 0) {
            profileData.images.forEach(image => {
                const imageContainer = document.createElement('div');
                imageContainer.className = 'image-container';

                const imgElement = document.createElement('img');
                imgElement.src = image.image;
                imgElement.alt = image.description || 'User upload';
                imgElement.loading = 'lazy';

                // Make image clickable to view full size
                imageContainer.addEventListener('click', () => {
                    window.open(image.image, '_blank');
                });

                imageContainer.appendChild(imgElement);
                imageGrid.appendChild(imageContainer);
            });
            
            noImagesMessage.style.display = 'none';
        } else {
            noImagesMessage.style.display = 'block';
        }

    } catch (error) {
        console.error('Error:', error);
        alert('Failed to load profile. Please try again later.');
    } finally {
        toggleLoadingSpinner(false);
    }
};

// Handle search functionality
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
                // Store the new searched username and refresh the page
                localStorage.setItem('searchedUsername', username);
                window.location.reload();
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

// Update logout function
const logout = async () => {
    try {
        const Data = JSON.parse(localStorage.getItem('Data'));
        const response = await fetch(`${API_BASE_URL}/users/logout`, {
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${Data.accessToken}`
            }
        });
        if (response.ok) {
            localStorage.removeItem('Data');
            window.location.href = '../index.html';
        }
    } catch (error) {
        console.error('Error logging out:', error);
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const searchedUsername = localStorage.getItem('searchedUsername');
    if (searchedUsername) {
        fetchUserProfile(searchedUsername);
        // Clear the searched username from localStorage after using it
        localStorage.removeItem('searchedUsername');
    } else {
        window.location.href = '../profile/profile.html';
    }
    handleSearch();
});
