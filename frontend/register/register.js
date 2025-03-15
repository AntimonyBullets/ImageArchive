// Function to show a popup message
const showPopup = (message, isError = false) => {
    console.log('Showing popup:', message); // Debugging line
    const popup = document.createElement('div');
    popup.className = `popup ${isError ? 'error' : 'success'}`;
    popup.textContent = message;
    document.body.appendChild(popup);

    // Remove the popup after 2 seconds
    setTimeout(() => {
        popup.remove();
    }, 2000);
};

// Register Button Click Event
const submitButton = document.getElementById('submit-button');
if (submitButton) {
    submitButton.addEventListener('click', async () => {
        console.log('Register button clicked'); // Debugging line

        // Create FormData object
        const formData = new FormData();
        formData.append('fullName', document.getElementById('fullName').value);
        formData.append('email', document.getElementById('email').value);
        formData.append('username', document.getElementById('username').value);
        formData.append('password', document.getElementById('password').value);
        formData.append('avatar', document.getElementById('avatar').files[0]);

        try {
            const response = await fetch('http://localhost:5000/api/v1/users/register', {
                method: 'POST',
                body: formData, // Send FormData directly
                credentials: 'include'
            });

            console.log('Response status:', response.status); // Debugging line
            console.log('Response headers:', response.headers); // Debugging line

            const data = await response.json();
            console.log('Response data:', data); // Debugging line

            if (response.ok) {
                // Show success popup
                showPopup('Registration successful! Redirecting...', false);

                // Redirect to homepage after 2 seconds
                setTimeout(() => {
                    window.location.href = '../index.html'; // Redirect to homepage
                }, 2000);
            } else {
                // Show error popup
                showPopup(data.message || 'Registration failed', true);
            }
        } catch (error) {
            console.error('Error registering:', error);
            showPopup('An error occurred. Please try again.', true);
        }
    });
} else {
    console.error('Submit button not found'); // Debugging line
}