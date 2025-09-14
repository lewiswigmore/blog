// Enhanced Grid Trail Effect - Webflow Inspired
(function() {
    'use strict';
    
    let canvas, ctx;
    let mouseX = 0, mouseY = 0;
    let prevMouseX = 0, prevMouseY = 0;
    let gridSize = 40; // Increased from 25 to 40
    let maxInfluenceRadius = 150;
    let gridPoints = new Map();
    let animationId;
    let searchBarExpansion = false;
    let expansionCenter = { x: 0, y: 0 };
    let expansionRadius = 0;
    let lastMouseMoveTime = 0;
    let mouseInactivityThreshold = 1000; // 1 second of inactivity
    let inactivityFadeSpeed = 0.003; // Slow fade when mouse stops
    
    function createCanvas() {
        canvas = document.createElement('canvas');
        canvas.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            z-index: 0 !important;
            pointer-events: none !important;
            opacity: 0.8 !important;
        `;
        canvas.id = 'webflow-grid-trail';
        
        resizeCanvas();
        ctx = canvas.getContext('2d');
        document.body.appendChild(canvas);
    }
    
    function resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';
        
        if (ctx) {
            ctx.scale(dpr, dpr);
        }
    }
    
    function getGridKey(x, y) {
        return `${Math.floor(x / gridSize)}_${Math.floor(y / gridSize)}`;
    }
    
    function addGridPoint(x, y, intensity) {
        const gridX = Math.floor(x / gridSize) * gridSize;
        const gridY = Math.floor(y / gridSize) * gridSize;
        const key = getGridKey(x, y);
        
        const existingPoint = gridPoints.get(key);
        if (existingPoint) {
            existingPoint.intensity = Math.max(existingPoint.intensity, intensity);
            existingPoint.lastUpdate = Date.now();
        } else {
            gridPoints.set(key, {
                x: gridX,
                y: gridY,
                intensity: intensity,
                lastUpdate: Date.now(),
                fade: 0
            });
        }
    }
    
    function updateGridPoints() {
        const now = Date.now();
        const fadeSpeed = 0.012; // Increased from 0.008 to 0.012 for quicker fade
        const removeThreshold = 0.01;
        const timeSinceMouseMove = now - lastMouseMoveTime;
        const isMouseInactive = timeSinceMouseMove > mouseInactivityThreshold;
        
        gridPoints.forEach((point, key) => {
            const timeSinceUpdate = now - point.lastUpdate;
            
            if (timeSinceUpdate > 150) { // Reduced from 200ms to 150ms for quicker fade start
                // Use slower fade speed when mouse is inactive
                const currentFadeSpeed = isMouseInactive ? inactivityFadeSpeed : fadeSpeed;
                point.intensity -= currentFadeSpeed;
                
                if (point.intensity <= removeThreshold) {
                    gridPoints.delete(key);
                }
            }
        });
    }
    
    function drawEnhancedGrid() {
        if (!ctx) return;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Handle search bar expansion effect
        if (searchBarExpansion) {
            // Create a more focused expansion pattern around the search bar
            for (let angle = 0; angle < Math.PI * 2; angle += 0.2) { // More detailed angles
                for (let radius = 0; radius <= expansionRadius; radius += gridSize) {
                    const x = expansionCenter.x + Math.cos(angle) * radius;
                    const y = expansionCenter.y + Math.sin(angle) * radius;
                    
                    // Check bounds relative to viewport, not canvas
                    if (x >= 0 && x <= window.innerWidth && y >= 0 && y <= window.innerHeight) {
                        const distance = Math.sqrt(Math.pow(x - expansionCenter.x, 2) + Math.pow(y - expansionCenter.y, 2));
                        const intensity = Math.max(0, 1 - (distance / expansionRadius)) * 0.9; // Slightly higher intensity
                        
                        if (intensity > 0.05) { // Lower threshold for more coverage
                            addGridPoint(x, y, intensity);
                            
                            // Add some organic scatter for visual interest
                            if (Math.random() > 0.7 && intensity > 0.3) {
                                const scatterDistance = gridSize * (0.5 + Math.random() * 1.5);
                                const scatterAngle = Math.random() * Math.PI * 2;
                                const scatterX = x + Math.cos(scatterAngle) * scatterDistance;
                                const scatterY = y + Math.sin(scatterAngle) * scatterDistance;
                                
                                if (scatterX >= 0 && scatterX <= window.innerWidth && scatterY >= 0 && scatterY <= window.innerHeight) {
                                    addGridPoint(scatterX, scatterY, intensity * 0.6);
                                }
                            }
                        }
                    }
                }
            }
        }
        
        // Calculate mouse influence area (only if not expanding from search bar and mouse is moving)
        if (!searchBarExpansion && mouseX > 0 && mouseY > 0) {
            const timeSinceMouseMove = Date.now() - lastMouseMoveTime;
            const isMouseActive = timeSinceMouseMove < mouseInactivityThreshold;
            
            // Only generate new points if mouse is actively moving
            if (isMouseActive) {
                const influencePoints = [];
                
                // Add points in a radius around the mouse
                for (let angle = 0; angle < Math.PI * 2; angle += 1.0) { // Increased from 0.6 to 1.0
                    for (let radius = 0; radius <= maxInfluenceRadius; radius += gridSize * 3) { // Increased from gridSize * 2 to gridSize * 3
                        const x = mouseX + Math.cos(angle) * radius;
                        const y = mouseY + Math.sin(angle) * radius;
                        
                        if (x >= 0 && x <= window.innerWidth && y >= 0 && y <= window.innerHeight) {
                            const distance = Math.sqrt(Math.pow(x - mouseX, 2) + Math.pow(y - mouseY, 2));
                            const intensity = Math.max(0, 1 - (distance / maxInfluenceRadius));
                            
                            if (intensity > 0.5) { // Increased threshold from 0.3 to 0.5
                                addGridPoint(x, y, intensity);
                                
                                // Add some scattered adjacent squares for less linear appearance
                                if (Math.random() > 0.5) { // Increased chance from 60% to 50%
                                    const scatterOffsets = [
                                        { dx: gridSize, dy: 0 },
                                        { dx: -gridSize, dy: 0 },
                                        { dx: 0, dy: gridSize },
                                        { dx: 0, dy: -gridSize },
                                        { dx: gridSize, dy: gridSize },
                                        { dx: -gridSize, dy: -gridSize },
                                        { dx: gridSize, dy: -gridSize }, // Added more diagonal options
                                        { dx: -gridSize, dy: gridSize },
                                        { dx: gridSize * 2, dy: 0 }, // Added farther positions
                                        { dx: -gridSize * 2, dy: 0 },
                                        { dx: 0, dy: gridSize * 2 },
                                        { dx: 0, dy: -gridSize * 2 }
                                    ];
                                    
                                    // More random number of scattered squares (0-3)
                                    const numScatter = Math.floor(Math.random() * 4); // 0, 1, 2, or 3 squares
                                    const usedOffsets = new Set(); // Prevent duplicate positions
                                    
                                    for (let i = 0; i < numScatter; i++) {
                                        let attempts = 0;
                                        let randomOffset;
                                        
                                        // Try to find an unused offset position
                                        do {
                                            randomOffset = scatterOffsets[Math.floor(Math.random() * scatterOffsets.length)];
                                            attempts++;
                                        } while (usedOffsets.has(`${randomOffset.dx},${randomOffset.dy}`) && attempts < 10);
                                        
                                        if (attempts < 10) {
                                            usedOffsets.add(`${randomOffset.dx},${randomOffset.dy}`);
                                            const scatterX = x + randomOffset.dx;
                                            const scatterY = y + randomOffset.dy;
                                            
                                            if (scatterX >= 0 && scatterX <= window.innerWidth && scatterY >= 0 && scatterY <= window.innerHeight) {
                                                // Much more varied intensity (20-70% instead of 40-80%)
                                                const scatterIntensity = intensity * (0.2 + Math.random() * 0.5);
                                                addGridPoint(scatterX, scatterY, scatterIntensity);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        
        // Draw all active grid points
        gridPoints.forEach(point => {
            if (point.intensity > 0.01) {
                drawGridCell(point.x, point.y, point.intensity);
            }
        });
    }
    
    function drawGridCell(x, y, intensity) {
        ctx.save();
        
        // Create smooth gradient
        const gradient = ctx.createLinearGradient(x, y, x + gridSize, y + gridSize);
        gradient.addColorStop(0, `rgba(0, 212, 170, ${intensity * 0.8})`); // #00d4aa
        gradient.addColorStop(0.5, `rgba(0, 168, 255, ${intensity * 0.6})`); // #00a8ff
        gradient.addColorStop(1, `rgba(123, 104, 238, ${intensity * 0.4})`); // #7b68ee
        
        // Primary grid lines with gradient
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 0.5 + intensity;
        ctx.lineCap = 'round';
        
        // Draw the grid cell
        ctx.beginPath();
        ctx.rect(x, y, gridSize, gridSize);
        ctx.stroke();
        
        // Add glow effect for high intensity points
        if (intensity > 0.5) {
            ctx.shadowColor = `rgba(0, 212, 170, ${intensity * 0.3})`;
            ctx.shadowBlur = 8 * intensity;
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 0.8;
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
        
        // Draw connecting lines to adjacent cells
        if (intensity > 0.3) {
            // Use same gradient for connecting lines but with lower opacity
            const connectionGradient = ctx.createLinearGradient(x, y, x + gridSize * 2, y + gridSize * 2);
            connectionGradient.addColorStop(0, `rgba(0, 212, 170, ${intensity * 0.3})`);
            connectionGradient.addColorStop(0.5, `rgba(0, 168, 255, ${intensity * 0.2})`);
            connectionGradient.addColorStop(1, `rgba(123, 104, 238, ${intensity * 0.15})`);
            
            ctx.strokeStyle = connectionGradient;
            ctx.lineWidth = 0.3;
            
            // Horizontal line to next cell
            const rightKey = getGridKey(x + gridSize, y);
            if (gridPoints.has(rightKey)) {
                ctx.beginPath();
                ctx.moveTo(x + gridSize, y + gridSize/2);
                ctx.lineTo(x + gridSize + gridSize, y + gridSize/2);
                ctx.stroke();
            }
            
            // Vertical line to next cell
            const downKey = getGridKey(x, y + gridSize);
            if (gridPoints.has(downKey)) {
                ctx.beginPath();
                ctx.moveTo(x + gridSize/2, y + gridSize);
                ctx.lineTo(x + gridSize/2, y + gridSize + gridSize);
                ctx.stroke();
            }
        }
        
        ctx.restore();
    }
    
    function drawMouseHighlight() {
        if (mouseX <= 0 || mouseY <= 0) return;
        
        ctx.save();
        
        // Create radial gradient at mouse position
        const gradient = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 40);
        gradient.addColorStop(0, 'rgba(0, 212, 170, 0.8)');
        gradient.addColorStop(0.3, 'rgba(0, 168, 255, 0.6)');
        gradient.addColorStop(1, 'rgba(123, 104, 238, 0.1)');
        
        // Draw highlight circle
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, 30, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw crosshair
        ctx.strokeStyle = 'rgba(0, 212, 170, 0.8)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        
        ctx.beginPath();
        ctx.moveTo(mouseX - 20, mouseY);
        ctx.lineTo(mouseX + 20, mouseY);
        ctx.moveTo(mouseX, mouseY - 20);
        ctx.lineTo(mouseX, mouseY + 20);
        ctx.stroke();
        
        ctx.setLineDash([]);
        ctx.restore();
    }
    
    function animate() {
        updateGridPoints();
        drawEnhancedGrid();
        animationId = requestAnimationFrame(animate);
    }
    
    function handleMouseMove(e) {
        prevMouseX = mouseX;
        prevMouseY = mouseY;
        mouseX = e.clientX;
        mouseY = e.clientY;
        lastMouseMoveTime = Date.now(); // Track mouse activity
        
        // Add trail points based on mouse movement
        const distance = Math.sqrt(Math.pow(mouseX - prevMouseX, 2) + Math.pow(mouseY - prevMouseY, 2));
        const steps = Math.max(1, Math.floor(distance / 5));
        
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const x = prevMouseX + (mouseX - prevMouseX) * t;
            const y = prevMouseY + (mouseY - prevMouseY) * t;
            const intensity = 0.8 * (1 - t * 0.3); // Fade along the trail
            
            addGridPoint(x, y, intensity);
        }
    }
    
    function handleTouch(e) {
        e.preventDefault();
        const touch = e.touches[0];
        if (touch) {
            prevMouseX = mouseX || touch.clientX;
            prevMouseY = mouseY || touch.clientY;
            mouseX = touch.clientX;
            mouseY = touch.clientY;
            lastMouseMoveTime = Date.now(); // Track touch activity
            
            // Add trail points for touch movement
            const distance = Math.sqrt(Math.pow(mouseX - prevMouseX, 2) + Math.pow(mouseY - prevMouseY, 2));
            const steps = Math.max(1, Math.floor(distance / 5));
            
            for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                const x = prevMouseX + (mouseX - prevMouseX) * t;
                const y = prevMouseY + (mouseY - prevMouseY) * t;
                const intensity = 0.8 * (1 - t * 0.3);
                
                addGridPoint(x, y, intensity);
            }
        }
    }
    
    function triggerSearchBarExpansion() {
        const searchInput = document.querySelector('#searchbox input, .search-input, input[type="search"]');
        if (searchInput) {
            // Set expansion center to bottom center of screen
            expansionCenter.x = window.innerWidth / 2;
            expansionCenter.y = window.innerHeight;
            expansionRadius = 0;
            searchBarExpansion = true;
                        
            // Animate expansion
            const expandAnimation = () => {
                expansionRadius += 12; // Speed of expansion for bottom-up effect
                if (expansionRadius < 400) { // Radius to cover more screen from bottom
                    requestAnimationFrame(expandAnimation);
                } else {
                    searchBarExpansion = false;
                }
            };
            expandAnimation();
        }
    }
    
    function addSearchBarListener() {
        // Wait for the search page to load
        setTimeout(() => {
            // Try multiple selectors to find the search input
            const selectors = [
                '#searchbox input',
                '.search-input', 
                'input[type="search"]',
                '#search-input',
                '#fastSearch input',
                '.search-container input',
                'input[placeholder*="search" i]'
            ];
            
            let searchInput = null;
            for (const selector of selectors) {
                searchInput = document.querySelector(selector);
                if (searchInput) {
                    break;
                }
            }
            
            if (searchInput) {
                searchInput.addEventListener('focus', triggerSearchBarExpansion);
                searchInput.addEventListener('click', triggerSearchBarExpansion);
            }
        }, 500);
    }
    
    function addBackgroundGrid() {
        const style = document.createElement('style');
        style.id = 'webflow-background-grid';
        style.textContent = `
            body.search-enhanced::before {
                content: '';
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                z-index: -2;
                opacity: 0.02;
                pointer-events: none;
                background-image: 
                    linear-gradient(rgba(0, 212, 170, 0.1) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(0, 212, 170, 0.1) 1px, transparent 1px);
                background-size: ${gridSize}px ${gridSize}px;
                animation: backgroundShift 20s ease-in-out infinite;
            }
            
            /* Ensure search input is above the canvas */
            .search-input, #searchbox, #search-input, input[type="search"] {
                position: relative;
                z-index: 10 !important;
            }
            
            /* Make search input background transparent to show grid pattern */
            #searchbox input, 
            .search-input, 
            input[type="search"], 
            #search-input,
            #fastSearch input,
            .search-container input {
                background: transparent !important;
                background-color: transparent !important;
                backdrop-filter: blur(4px);
                border: none !important;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
            }
            
            /* Enhanced styling for transparent search input */
            #searchbox input:focus, 
            .search-input:focus, 
            input[type="search"]:focus, 
            #search-input:focus,
            #fastSearch input:focus {
                border-color: rgba(0, 212, 170, 0.5) !important;
                box-shadow: 0 0 0 2px rgba(0, 212, 170, 0.1), 0 4px 16px rgba(0, 0, 0, 0.15) !important;
                outline: none !important;
            }
            
            /* Placeholder text styling */
            #searchbox input::placeholder, 
            .search-input::placeholder, 
            input[type="search"]::placeholder, 
            #search-input::placeholder,
            #fastSearch input::placeholder {
                color: var(--primary) !important;
                opacity: 0.7 !important;
            }
            
            @keyframes backgroundShift {
                0%, 100% { transform: translate(0, 0); }
                25% { transform: translate(1px, -1px); }
                50% { transform: translate(-1px, 1px); }
                75% { transform: translate(1px, 1px); }
            }
        `;
        document.head.appendChild(style);
    }
    
    function handleResize() {
        resizeCanvas();
    }
    
    function cleanup() {
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
        document.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('resize', handleResize);
        if (canvas && canvas.parentNode) {
            canvas.parentNode.removeChild(canvas);
        }
        gridPoints.clear();
    }
    
    function initWebflowGridEffect() {
        const currentPath = window.location.pathname;
        
        if (currentPath.includes('/search')) {
            document.body.classList.add('search-enhanced');
            
            createCanvas();
            addBackgroundGrid();
            addSearchBarListener(); // Add search bar interaction
            
            document.addEventListener('mousemove', handleMouseMove);
            
            // Add touch event support for mobile
            document.addEventListener('touchstart', handleTouch, { passive: false });
            document.addEventListener('touchmove', handleTouch, { passive: false });
            document.addEventListener('touchend', () => {
                mouseX = null;
                mouseY = null;
            });
            
            window.addEventListener('resize', handleResize);
            window.addEventListener('beforeunload', cleanup);
            
            animate();
        }
    }
    
    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWebflowGridEffect);
    } else {
        initWebflowGridEffect();
    }
})();