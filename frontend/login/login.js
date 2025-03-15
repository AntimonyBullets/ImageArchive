// Function to show a popup message
const showPopup = (message, isError = false) => {
    const popup = document.createElement('div');
    popup.className = `popup ${isError ? 'error' : 'success'}`;
    popup.textContent = message;
    document.body.appendChild(popup);

    // Remove the popup after 2 seconds
    setTimeout(() => {
        popup.remove();
    }, 2000);
};

// Login Form Submission
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('http://localhost:5000/api/v1/users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password }),
                credentials: 'include'
            });

            const data = await response.json();

            if (response.ok) {
                // Store user data in localStorage
                localStorage.setItem('userData', JSON.stringify(data.data.user));

                // Show success popup
                showPopup('Login successful! Redirecting...', false);

                // Redirect to profile page
                setTimeout(() => {
                    window.location.href = '../profile/profile.html';
                }, 1000);
            } else {
                // Show error popup
                showPopup(data.message || 'Login failed', true);
            }
        } catch (error) {
            console.error('Error logging in:', error);
            showPopup('An error occurred. Please try again.', true);
        }
    });
}