    const passwordInput = document.getElementById('password');
    const requirements = document.querySelectorAll('.password-requirements li');
    if (passwordInput) {
        passwordInput.addEventListener('input', (e) => {
            const password = e.target.value;
            requirements[0].classList.toggle('valid', password.length >= 8);
            requirements[1].classList.toggle('valid', /\d/.test(password));
            requirements[2].classList.toggle('valid', /[A-Z]/.test(password));
            requirements[3].classList.toggle('valid', /[!@#$%^&*()_+\-=\[\]{};:,.<>?]/.test(password));
        });
    }
    const authForm = document.querySelector('.auth-form');
    if (authForm) {
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = authForm.querySelector('button[type="submit"]');
            const formData = new FormData(authForm);
            const endpoint = authForm.getAttribute('data-endpoint');
            try {
                authForm.classList.add('loading');
                submitBtn.disabled = true;
                const response = await fetch(endpoint, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.detail || 'An error occurred');
                }
                showMessage('success', 'Success! Redirecting...');
                if (data.access_token) {
                    localStorage.setItem('access_token', data.access_token);
                    localStorage.setItem('refresh_token', data.refresh_token);
                }
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 1500);
            }
            catch (error) {
                showMessage('error', error.message);
            }
            finally {
                authForm.classList.remove('loading');
                submitBtn.disabled = false;
            }
        });
    }
});
function showMessage(type, text): any {
    const existingMessages = document.querySelectorAll('.error-message, .success-message');
    existingMessages.forEach(msg => msg.remove());
    const message = document.createElement('div');
    message.className = type === 'error' ? 'error-message' : 'success-message';
    message.textContent = text;
    const form = document.querySelector('.auth-form');
    form.parentNode.insertBefore(message, form.nextSibling);
    if (type === 'success') {
        setTimeout(() => message.remove(), 3000);
    }
}
export {};
//# sourceMappingURL=auth.js.map