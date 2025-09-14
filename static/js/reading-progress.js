// Enhanced Reading Progress Bar

(function() {
    'use strict';
    
    // Check if we're on a blog post page
    function isPostPage() {
        // First, exclude non-post pages explicitly
        const currentPath = window.location.pathname;
        
        // Exclude root, archives, search, contact, and other non-post pages
        if (currentPath === '/' || 
            currentPath === '/archives/' || 
            currentPath === '/search/' || 
            currentPath === '/contact/' || 
            currentPath === '/404/' ||
            currentPath.endsWith('/archives/') ||
            currentPath.endsWith('/search/') ||
            currentPath.endsWith('/contact/')) {
            return false;
        }
        
        // Check for specific post page indicators (more restrictive)
        const isPostUrl = currentPath.includes('/posts/') && currentPath !== '/posts/';
        const hasPostSingle = document.querySelector('article.post-single');
        const hasPostContent = document.querySelector('.post-content');
        const isSinglePage = document.body.classList.contains('single');
        
        // Must have URL pattern AND specific post elements
        const isPost = isPostUrl && (hasPostSingle || hasPostContent || isSinglePage);
        
        return isPost;
    }
    
    // Create progress bar element
    function createProgressBar() {
        const progressBar = document.createElement('div');
        progressBar.className = 'reading-progress enhanced';
        progressBar.setAttribute('aria-label', 'Reading progress');
        progressBar.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 0%;
            height: 4px;
            background: linear-gradient(90deg, #00d4aa, #00a8ff, #7b68ee);
            z-index: 9999;
            transition: width 0.25s ease;
            box-shadow: 0 0 10px rgba(0, 212, 170, 0.5);
        `;
        document.body.appendChild(progressBar);
        return progressBar;
    }
    
    // Calculate reading progress
    function updateProgress() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        
        const progressBar = document.querySelector('.reading-progress');
        if (progressBar) {
            const width = Math.min(100, Math.max(0, scrollPercent));
            progressBar.style.width = width + '%';
        }
    }
    
    // Initialize progress bar
    function init() {
        // Only show on blog post pages
        if (!isPostPage()) {
            return;
        }
        
        const progressBar = createProgressBar();
        
        // Update progress on scroll
        window.addEventListener('scroll', updateProgress);
        
        // Initial update
        updateProgress();
        
        // Update on window resize
        window.addEventListener('resize', updateProgress);
    }
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();