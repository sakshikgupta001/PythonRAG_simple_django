// Theme Management
document.addEventListener('DOMContentLoaded', () => {
    // Set current year in footer
    document.getElementById('current-year').textContent = new Date().getFullYear();
    
    // Theme toggle
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Initialize theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && prefersDarkScheme.matches)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    
    // Theme toggle event
    themeToggleBtn.addEventListener('click', () => {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
    
    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    
    mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('open');
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (mobileMenu.classList.contains('open') && 
            !mobileMenuBtn.contains(e.target) && 
            !mobileMenu.contains(e.target)) {
            mobileMenu.classList.remove('open');
        }
    });
    
    // Initialize animated gradients
    initAnimatedGradients();
});

// Animated Gradient
function initAnimatedGradients() {
    const gradients = document.querySelectorAll('.animated-gradient');
    
    gradients.forEach(gradient => {
        const canvas = document.createElement('canvas');
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        gradient.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        const isSmall = gradient.classList.contains('small');
        
        // Set canvas dimensions
        function setCanvasDimensions() {
            canvas.width = canvas.offsetWidth * window.devicePixelRatio;
            canvas.height = canvas.offsetHeight * window.devicePixelRatio;
        }
        
        setCanvasDimensions();
        window.addEventListener('resize', setCanvasDimensions);
        
        // Animation variables
        const particles = [];
        const particleCount = isSmall ? 15 : 30;
        const maxSize = isSmall ? 80 : 150;
        const minSize = isSmall ? 40 : 80;
        
        // Create particles
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: minSize + Math.random() * (maxSize - minSize),
                speedX: (Math.random() - 0.5) * 0.3,
                speedY: (Math.random() - 0.5) * 0.3,
                opacity: 0.1 + Math.random() * 0.2,
            });
        }
        
        // Animation function
        function animate() {
            if (!canvas || !ctx) return;
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Get primary color from computed styles
            const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
            const rgb = hslToRgb(primaryColor);
            
            // Update and draw particles
            particles.forEach(particle => {
                // Update position
                particle.x += particle.speedX;
                particle.y += particle.speedY;
                
                // Bounce off edges
                if (particle.x < 0 || particle.x > canvas.width) {
                    particle.speedX *= -1;
                }
                
                if (particle.y < 0 || particle.y > canvas.height) {
                    particle.speedY *= -1;
                }
                
                // Draw gradient circle
                const gradient = ctx.createRadialGradient(
                    particle.x, 
                    particle.y, 
                    0, 
                    particle.x, 
                    particle.y, 
                    particle.size
                );
                
                gradient.addColorStop(0, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${particle.opacity})`);
                gradient.addColorStop(1, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0)`);
                
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fillStyle = gradient;
                ctx.fill();
            });
            
            requestAnimationFrame(animate);
        }
        
        animate();
    });
}

// HSL to RGB conversion
function hslToRgb(hslString) {
    // Parse HSL string (format: "262.1 83.3% 57.8%")
    const parts = hslString.split(' ');
    const h = parseFloat(parts[0]) / 360;
    const s = parseFloat(parts[1]) / 100;
    const l = parseFloat(parts[2]) / 100;
    
    let r, g, b;
    
    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

// Toast Notification System
function showToast(title, message, type = 'default', duration = 3000) {
    const toastContainer = document.getElementById('toast-container');
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let iconSvg;
    if (type === 'success') {
        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="toast-icon"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
    } else if (type === 'error') {
        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="toast-icon"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    } else {
        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="toast-icon"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    }
    
    toast.innerHTML = `
        ${iconSvg}
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-description">${message}</div>
        </div>
        <button class="toast-close">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
    `;
    
    toastContainer.appendChild(toast);
    
    // Close button event
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
        toast.classList.add('closing');
        setTimeout(() => {
            toast.remove();
        }, 300);
    });
    
    // Auto close
    setTimeout(() => {
        if (toast.parentNode) {
            toast.classList.add('closing');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }
    }, duration);
    
    return toast;
}

// Format date
function formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    }).format(date);
}

// Format time
function formatTime(date) {
    return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: 'numeric'
    }).format(date);
}
