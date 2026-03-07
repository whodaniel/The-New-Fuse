export const getPasswordStrength = (password: string): any => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const strengthMap = {
        0: { label: 'Very Weak', color: 'bg-red-500' },
        1: { label: 'Weak', color: 'bg-orange-500' },
        2: { label: 'Fair', color: 'bg-yellow-500' },
        3: { label: 'Good', color: 'bg-blue-500' },
        4: { label: 'Strong', color: 'bg-green-500' },
        5: { label: 'Very Strong', color: 'bg-green-700' },
    };

    return { score, ...strengthMap[score as keyof typeof strengthMap] };
};
