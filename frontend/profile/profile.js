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
const fetchUserProfile = async () => {
    try {
        toggleLoadingSpinner(true); // Show loading spinner

        // Retry logic for retrieving user data
        let userData = null;
        let retryCount = 0;
        const maxRetries = 3;
        
        while (!userData && retryCount < maxRetries) {
            userData = JSON.parse(localStorage.getItem('userData'));
            if (!userData) {
                console.log(`Attempt ${retryCount + 1}: User data not found in localStorage, retrying...`);
                retryCount++;
                // Wait 200ms before retrying
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }
        
        // Get auth data
        const authData = await getAuthData();
        console.log("Auth Data:", authData);
        
        if (!userData) {
            console.error('User data not found in localStorage after multiple attempts');
            alert('Unable to load profile. Please try logging in again.');
            window.location.href = '../login/login.html';
            return;
        }

        const username = userData.username;
        console.log('Fetching profile for username:', username); // Debugging line

        // Fetch the user's profile data
        const response = await fetch(`${API_BASE_URL}/users/${username}`, {
            credentials: 'include',
            headers: {
                "Authorization": `Bearer ${authData.accessToken}`
            }
        });
        console.log(response);

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
                    // Create image container
                    const imageContainer = document.createElement('div');
                    imageContainer.className = 'image-container';
                    imageContainer.style.display = 'none'; // Hide initially
                    
                    // Create image element
                    const imgElement = document.createElement('img');
                    imgElement.src = image.image;
                    imgElement.alt = image.description || 'User upload';
                    imgElement.loading = 'lazy'; // Add lazy loading for better performance
                    
                    // Add load event listener to track when image is loaded
                    imgElement.addEventListener('load', () => {
                        imagesLoaded++;
                        
                        // Update loading message
                        const loadingMessageElement = document.querySelector('.loading-images-message p');
                        if (loadingMessageElement) {
                            loadingMessageElement.textContent = `Loading ${totalImages - imagesLoaded} of ${totalImages} images...`;
                        }
                        
                        // Show this image container
                        imageContainer.style.display = 'block';
                        
                        // If all images are loaded, remove the loading message
                        if (imagesLoaded === totalImages) {
                            const loadingMessage = document.querySelector('.loading-images-message');
                            if (loadingMessage) {
                                loadingMessage.remove();
                            }
                        }
                    });
                    
                    // Add error event listener
                    imgElement.addEventListener('error', () => {
                        imagesLoaded++;
                        imageContainer.style.display = 'block';
                        imgElement.src = '../assets/image-error.png'; // Replace with your error image
                        imgElement.alt = 'Image failed to load';
                        
                        // If all images are loaded (or failed), remove the loading message
                        if (imagesLoaded === totalImages) {
                            const loadingMessage = document.querySelector('.loading-images-message');
                            if (loadingMessage) {
                                loadingMessage.remove();
                            }
                        }
                    });

                    // Create delete icon
                    const deleteIcon = document.createElement('div');
                    deleteIcon.className = 'delete-icon';
                    deleteIcon.innerHTML = '<i class="fas fa-trash"></i>'; // Font Awesome trash icon
                    
                    // Add click event listener to delete icon
                    deleteIcon.addEventListener('click', async (e) => {
                        e.stopPropagation(); // Prevent image click event
                        
                        // Confirm before deleting
                        if (confirm('Are you sure you want to delete this image?')) {
                            try {
                                toggleLoadingSpinner(true); // Show loading spinner
                                
                                const authData = await getAuthData();
                                
                                if (!authData) {
                                    alert('Unable to delete image. Please try logging in again.');
                                    return;
                                }
                                
                                // Send delete request to the API
                                const deleteResponse = await fetch(`${API_BASE_URL}/images/${image._id}`, {
                                    method: 'DELETE',
                                    credentials: 'include',
                                    headers: {
                                        "Authorization": `Bearer ${authData.accessToken}`,
                                    }
                                });
                                console.log(deleteResponse);
                                if (deleteResponse.ok) {
                                    // If successful, remove the image from the UI
                                    imageContainer.remove();
                                    
                                    // Check if there are no more images
                                    if (imageGrid.children.length === 0 || 
                                        (imageGrid.children.length === 1 && imageGrid.children[0].className === 'loading-images-message')) {
                                        noImagesMessage.style.display = 'block'; // Show the "No images" message
                                    }
                                    
                                    // Show success message
                                    alert('Image deleted successfully!');
                                } else {
                                    // Handle error response
                                    const errorData = await deleteResponse.json();
                                    console.error('Error deleting image:', errorData);
                                    alert(`Failed to delete image: ${errorData.message || 'Unknown error'}`);
                                }
                            } catch (error) {
                                console.error('Error deleting image:', error);
                                alert('An error occurred while deleting the image. Please try again.');
                            } finally {
                                toggleLoadingSpinner(false); // Hide loading spinner
                            }
                        }
                    });

                    // Make the image clickable to view full size
                    imageContainer.addEventListener('click', () => {
                        window.open(image.image, '_blank');
                    });

                    // Append elements to container
                    imageContainer.appendChild(imgElement);
                    imageContainer.appendChild(deleteIcon);
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
                credentials: 'include',
                headers: {
                    "Authorization" : `Bearer ${authData.accessToken}`
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

    handleSearch();
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    // Add click handler to upload button
    const uploadBtn = document.querySelector('.upload-btn');
    if (uploadBtn) {
        uploadBtn.addEventListener('click', () => {
            fileInput.click();
        });
    }

    // Handle file selection
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            handleFileUpload(file);
        }
    });
    fetchUserProfile();
});