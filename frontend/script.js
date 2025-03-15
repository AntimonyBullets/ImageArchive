// Check if user is logged in
// Check if user is logged in
const checkAuth = async () => {
    try {
        const response = await fetch('/api/v1/users/profile', {
            credentials: 'include'
        });
        if (response.ok) {
            const data = await response.json();
            document.getElementById('login-link').style.display = 'none';
            document.getElementById('logout-link').style.display = 'block';
            document.getElementById('profile-link').style.display = 'block';
            document.getElementById('cta-button').textContent = 'Upload a Photo';
            document.getElementById('cta-button').onclick = () => window.location.href = '/upload.html';
        } else {
            document.getElementById('login-link').style.display = 'block';
            document.getElementById('logout-link').style.display = 'none';
            document.getElementById('profile-link').style.display = 'none';
            document.getElementById('cta-button').textContent = 'Get Started';
            document.getElementById('cta-button').onclick = () => window.location.href = './register/register.html'; // Updated path
        }
    } catch (error) {
        console.error('Error checking auth:', error);
    }
};

// Logout functionality
const logoutLink = document.getElementById('logout-link');
if (logoutLink) {
    logoutLink.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/v1/users/logout', {
                method: 'POST',
                credentials: 'include'
            });
            if (response.ok) {
                window.location.href = '/';
            }
        } catch (error) {
            console.error('Error logging out:', error);
        }
    });
}

// Initialize
checkAuth();

// Explore Button
const exploreButton = document.getElementById('explore-button');
if (exploreButton) {
    exploreButton.addEventListener('click', () => {
        window.location.href = '/explore.html';
    });
}