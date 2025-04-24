// Import the API base URL from config
import { API_BASE_URL } from '../config.js';

// Function to show/hide loading spinner
const toggleLoadingSpinner = (show) => {
    const loadingSpinner = document.getElementById('loading-spinner');
    if (loadingSpinner) {
        loadingSpinner.style.display = show ? 'flex' : 'none';
    }
};

// Replace direct Data assignment with a function that will be called when needed
let Data = null;
const getAuthData = async () => {
    if (Data) return Data;
    
    let retryCount = 0;
    const maxRetries = 3;
    
    while (!Data && retryCount < maxRetries) {
        Data = JSON.parse(localStorage.getItem('Data'));
        if (!Data) {
            console.log(`Attempt ${retryCount + 1}: Auth data not found in localStorage, retrying...`);
            retryCount++;
            // Wait 200ms before retrying
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }
    
    return Data;
};

// Function to fetch and display user profile data

// Add this function to handle search
const handleSearch = () => {
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');

    const performSearch = async () => {
        const username = searchInput.value.trim();
        if (username) {
            // Get the current user's username from localStorage using our retry function
            const authData = await getAuthData();
            
            if (!authData) {
                alert('Unable to perform search. Please try logging in again.');
                return;
            }
            
            // If searching for current user, stay on profile page
            if (username === authData.username) {
                window.location.href = 'profile.html';
            } else {
                // Redirect to otherProfile page
                window.location.href = '../otherProfile/otherProfile.html';
                // Store searched username in localStorage for otherProfile to use
                localStorage.setItem('searchedUsername', username);
            }
        }
    };

    // Add click event listener to search button
    searchBtn.addEventListener('click', performSearch);

    // Add enter key event listener to search input
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
};

const handleFileUpload = async (file) => {
    try {
        const formData = new FormData();
        formData.append('image', file);

        const authData = await getAuthData();
        
        if (!authData) {
            alert('Unable to upload image. Please try logging in again.');
            return;
        }
        
        const response = await fetch(`${API_BASE_URL}/images/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authData.accessToken}`
            },
            body: formData
        });

        if (response.ok) {
            alert('Image uploaded successfully! Reload the page to see the changes.');
        }
    } catch (error) {
        console.error('Error uploading image:', error);
    }
};

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
                        img.classList.add('loaded');
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

// Function to create image element with optimized loading
const createImageElement = (image) => {
    const imageContainer = document.createElement('div');
    imageContainer.className = 'image-container';
    imageContainer.style.display = 'none'; // Hide initially
    
    const imgElement = document.createElement('img');
    imgElement.className = 'image-transition';
    imgElement.alt = image.description || 'User upload';
    imgElement.loading = 'lazy'; // Use native lazy loading

    // Add to loading queue instead of setting src directly
    imageLoadingQueue.push({ img: imgElement, src: image.image });
    
    // Create delete icon
    const deleteIcon = document.createElement('div');
    deleteIcon.className = 'delete-icon';
    deleteIcon.innerHTML = '<i class="fas fa-trash"></i>';
    
    // Add click event listener to delete icon
    deleteIcon.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this image?')) {
            try {
                toggleLoadingSpinner(true);
                const authData = await getAuthData();
                if (!authData) {
                    alert('Unable to delete image. Please try logging in again.');
                    return;
                }
                
                const deleteResponse = await fetch(`${API_BASE_URL}/images/${image._id}`, {
                    method: 'DELETE',
                    headers: {
                        "Authorization": `Bearer ${authData.accessToken}`
                    }
                });

                if (deleteResponse.ok) {
                    imageContainer.remove();
                    if (document.querySelectorAll('.image-container').length === 0) {
                        document.getElementById('no-images').style.display = 'block';
                    }
                    alert('Image deleted successfully!');
                } else {
                    const errorData = await deleteResponse.json();
                    alert(`Failed to delete image: ${errorData.message || 'Unknown error'}`);
                }
            } catch (error) {
                console.error('Error deleting image:', error);
                alert('An error occurred while deleting the image.');
            } finally {
                toggleLoadingSpinner(false);
            }
        }
    });

    // Make the image clickable to view full size
    imageContainer.addEventListener('click', () => {
        window.open(image.image, '_blank');
    });

    // Show container when image is loaded
    imgElement.addEventListener('load', () => {
        imageContainer.style.display = 'block';
    });

    imageContainer.appendChild(imgElement);
    imageContainer.appendChild(deleteIcon);
    return imageContainer;
};

const fetchUserProfile = async () => {
    try {
        toggleLoadingSpinner(true);
        
        const authData = await getAuthData();
        if (!authData) {
            console.error('User data not found in localStorage');
            window.location.href = '../login/login.html';
            return;
        }

        const response = await fetch(`${API_BASE_URL}/users/${authData.user.username}`, {
            headers: {
                "Authorization": `Bearer ${authData.accessToken}`
            }
        });

        if (response.ok) {
            const rawProfileData = await response.json();
            console.log(rawProfileData);
            const profileData = rawProfileData.data;
            console.log('User profile data:', profileData); // Debugging line

            // Update the profile section
            const avatarElement = document.getElementById('profile-avatar');
            avatarElement.src = profileData.avatar || '../assets/default-avatar.png';
            avatarElement.alt = `${profileData.fullName}'s avatar`;
            
            document.getElementById('profile-fullName').textContent = profileData.fullName;
            document.getElementById('profile-username').textContent = `@${profileData.username}`;
            document.title = `${profileData.fullName} | ImageShare`;

            // Display the user's images
            const imageGrid = document.getElementById('image-grid');
            const noImagesMessage = document.getElementById('no-images');
            imageGrid.innerHTML = ''; // Clear existing images

            if (profileData.images && profileData.images.length > 0) {
                // Show loading message in the grid while images load
                const loadingMessage = document.createElement('div');
                loadingMessage.className = 'loading-images-message';
                loadingMessage.innerHTML = `
                    <div class="image-loading-spinner"></div>
                    <p>Loading ${profileData.images.length} images...</p>
                `;
                imageGrid.appendChild(loadingMessage);
                
                // Track how many images have loaded
                let imagesLoaded = 0;
                const totalImages = profileData.images.length;
                
                profileData.images.forEach(image => {
                    const imageContainer = createImageElement(image);
                    imageGrid.appendChild(imageContainer);
                });
                
                noImagesMessage.style.display = 'none'; // Hide the "No images" message
            } else {
                noImagesMessage.style.display = 'block'; // Show the "No images" message
            }
        } else {
            console.error('Error fetching user profile:', response.statusText);
            alert('Failed to load profile data. Please try again later.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while loading your profile.');
    } finally {
        toggleLoadingSpinner(false); // Hide loading spinner
    }
};

// Logout functionality
const logoutLink = document.getElementById('logout-link');
if (logoutLink) {
    logoutLink.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            const authData = await getAuthData();
            
            if (!authData) {
                alert('Unable to logout properly. Redirecting to home page.');
                window.location.href = '../index.html';
                return;
            }
            
            const response = await fetch(`${API_BASE_URL}/users/logout`, {
                method: 'POST',
                headers: {
                    "Authorization": `Bearer ${authData.accessToken}`
                }
            });
            if (response.ok) {
                // Clear user data from localStorage
                localStorage.removeItem('userData');
                localStorage.removeItem('Data');
                Data = null; // Reset our cached Data

                // Redirect to homepage
                window.location.href = '../index.html';
            }
        } catch (error) {
            console.error('Error logging out:', error);
        }
    });
}

// Edit profile button functionality
const editProfileBtn = document.querySelector('.edit-profile-btn');
if (editProfileBtn) {
    editProfileBtn.addEventListener('click', () => {
        // Redirect to edit profile page or show modal
        alert('Edit profile functionality will be implemented soon!');
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

    handleSearch();
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    const uploadBtn = document.querySelector('.upload-btn');
    if (uploadBtn) {
        uploadBtn.addEventListener('click', () => {
            fileInput.click();
        });
    }

    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            handleFileUpload(file);
        }
    });

    // Start processing the image queue
    setInterval(() => {
        if (!isProcessingQueue) {
            processImageQueue();
        }
    }, 200);

    fetchUserProfile();
});