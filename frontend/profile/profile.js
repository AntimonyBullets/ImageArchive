// Function to show/hide loading spinner
const toggleLoadingSpinner = (show) => {
    const loadingSpinner = document.getElementById('loading-spinner');
    if (loadingSpinner) {
        loadingSpinner.style.display = show ? 'flex' : 'none';
    }
};

// Function to fetch and display user profile data
const fetchUserProfile = async () => {
    try {
        toggleLoadingSpinner(true); // Show loading spinner

        // Retrieve user data from localStorage
        const userData = JSON.parse(localStorage.getItem('userData'));
        if (!userData) {
            console.error('User data not found in localStorage');
            return;
        }

        const username = userData.username;
        console.log('Fetching profile for username:', username); // Debugging line

        // Fetch the user's profile data
        const response = await fetch(`http://localhost:5000/api/v1/users/${username}`, {
            credentials: 'include'
        });
        console.log(response);

        if (response.ok) {
            const rawProfileData = await response.json();
            console.log(rawProfileData);
            const profileData = rawProfileData.data;
            console.log('User profile data:', profileData); // Debugging line

            // Update the profile section
            document.getElementById('profile-avatar').src = profileData.avatar;
            document.getElementById('profile-fullName').textContent = profileData.fullName;
            document.getElementById('profile-username').textContent = `@${profileData.username}`;

            // Display the user's images
            const imageGrid = document.getElementById('image-grid');
            const noImagesMessage = document.getElementById('no-images');
            imageGrid.innerHTML = ''; // Clear existing images

            if (profileData.images && profileData.images.length > 0) {
                profileData.images.forEach(image => {
                    // Create image container
                    const imageContainer = document.createElement('div');
                    imageContainer.className = 'image-container';

                    // Create image element
                    const imgElement = document.createElement('img');
                    imgElement.src = image.image;
                    imgElement.alt = image.description || 'User upload';

                    // Create delete icon
                    const deleteIcon = document.createElement('div');
                    deleteIcon.className = 'delete-icon';
                    deleteIcon.innerHTML = '🗑️'; // Delete icon
                    deleteIcon.addEventListener('click', () => {
                        console.log('Delete image:', image._id); // Debugging line
                        // Add delete functionality here
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
        }
    } catch (error) {
        console.error('Error:', error);
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
            const response = await fetch('http://localhost:5000/api/v1/users/logout', {
                method: 'POST',
                credentials: 'include'
            });
            if (response.ok) {
                // Clear user data from localStorage
                localStorage.removeItem('userData');

                // Redirect to homepage
                window.location.href = '../index.html';
            }
        } catch (error) {
            console.error('Error logging out:', error);
        }
    });
}

// Initialize
fetchUserProfile();