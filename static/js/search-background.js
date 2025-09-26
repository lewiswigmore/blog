// Grid Trail Effect
(function() {
    'use strict';
    
    let canvas, ctx;
    let mouseX = 0, mouseY = 0;
    let prevMouseX = 0, prevMouseY = 0;
    let gridSize = getResponsiveGridSize(); // Make grid size responsive
    let maxInfluenceRadius = Math.min(150, window.innerWidth * 0.2); // Responsive influence radius
    let gridPoints = new Map();
    let animationId;
    let searchBarExpansion = false;
    let expansionCenter = { x: 0, y: 0 };
    let expansionRadius = 0;
    let lastMouseMoveTime = 0;
    let mouseInactivityThreshold = 1000; // 1 second of inactivity
    let inactivityFadeSpeed = 0.003; // Slow fade when mouse stops
    
    // Calculate responsive grid size based on screen width
    function getResponsiveGridSize() {
        const screenWidth = window.innerWidth;
        if (screenWidth < 480) return 25;        // Small mobile
        if (screenWidth < 768) return 30;        // Large mobile/small tablet
        if (screenWidth < 1024) return 35;       // Tablet
        return 40;                               // Desktop
    }
    
    // Calculate responsive influence radius based on screen size
    function getResponsiveInfluenceRadius() {
        const screenWidth = window.innerWidth;
        if (screenWidth < 480) return 80;         // Smaller radius on mobile
        if (screenWidth < 768) return 100;        // Medium radius on tablets
        return 150;                               // Full radius on desktop
    }
    
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
        
        // Mobile optimization - use different effect entirely
        const isMobile = window.innerWidth < 768;
        
        // Mobile: Draw slow pulsing ambient effect instead of interactive trail
        if (isMobile) {
            drawMobileAmbientPulse();
            return;
        }
        
        // Desktop: Continue with original interactive effects
        const angleStep = 0.2;
        const radiusStep = gridSize;
        
        // Handle search bar expansion effect (desktop only - mobile uses ambient pulse)
        if (searchBarExpansion && !isMobile) {
            // Create a more focused expansion pattern around the search bar
            for (let angle = 0; angle < Math.PI * 2; angle += angleStep) {
                for (let radius = 0; radius <= expansionRadius; radius += radiusStep) {
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
                
                // Add points in a radius around the mouse (optimized for mobile)
                const mouseAngleStep = isMobile ? 1.5 : 1.0; // Fewer angles on mobile
                const mouseRadiusStep = isMobile ? gridSize * 4 : gridSize * 3; // Larger steps on mobile
                
                for (let angle = 0; angle < Math.PI * 2; angle += mouseAngleStep) {
                    for (let radius = 0; radius <= maxInfluenceRadius; radius += mouseRadiusStep) {
                        const x = mouseX + Math.cos(angle) * radius;
                        const y = mouseY + Math.sin(angle) * radius;
                        
                        if (x >= 0 && x <= window.innerWidth && y >= 0 && y <= window.innerHeight) {
                            const distance = Math.sqrt(Math.pow(x - mouseX, 2) + Math.pow(y - mouseY, 2));
                            const intensity = Math.max(0, 1 - (distance / maxInfluenceRadius));
                            
                            if (intensity > 0.5) {
                                addGridPoint(x, y, intensity);
                                
                                // Reduce scatter on mobile for performance
                                if (!isMobile && Math.random() > 0.5) {
                                    const scatterOffsets = [
                                        { dx: gridSize, dy: 0 },
                                        { dx: -gridSize, dy: 0 },
                                        { dx: 0, dy: gridSize },
                                        { dx: 0, dy: -gridSize },
                                        { dx: gridSize, dy: gridSize },
                                        { dx: -gridSize, dy: -gridSize },
                                        { dx: gridSize, dy: -gridSize }, 
                                        { dx: -gridSize, dy: gridSize },
                                        { dx: gridSize * 2, dy: 0 }, 
                                        { dx: -gridSize * 2, dy: 0 },
                                        { dx: 0, dy: gridSize * 2 },
                                        { dx: 0, dy: -gridSize * 2 }
                                    ];
                                    
                                    // Fewer scattered squares on mobile (0-2 instead of 0-3)
                                    const maxScatter = isMobile ? 2 : 4;
                                    const numScatter = Math.floor(Math.random() * maxScatter);
                                    const usedOffsets = new Set();
                                    
                                    for (let i = 0; i < numScatter; i++) {
                                        let attempts = 0;
                                        let randomOffset;
                                        
                                        do {
                                            randomOffset = scatterOffsets[Math.floor(Math.random() * scatterOffsets.length)];
                                            attempts++;
                                        } while (usedOffsets.has(`${randomOffset.dx},${randomOffset.dy}`) && attempts < 10);
                                        
                                        if (attempts < 10) {
                                            usedOffsets.add(`${randomOffset.dx},${randomOffset.dy}`);
                                            const scatterX = x + randomOffset.dx;
                                            const scatterY = y + randomOffset.dy;
                                            
                                            if (scatterX >= 0 && scatterX <= window.innerWidth && scatterY >= 0 && scatterY <= window.innerHeight) {
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
    
    function drawMobileAmbientPulse() {
        const time = Date.now() * 0.001; // Convert to seconds
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        
        ctx.save();
        
        // Create slow pulsing effect around screen edges
        const pulseIntensity = (Math.sin(time * 0.5) + 1) * 0.5; // Slow pulse (0.5 Hz)
        const secondaryPulse = (Math.sin(time * 0.3 + Math.PI) + 1) * 0.5; // Offset pulse
        
        // Corner pulses
        const corners = [
            { x: 0, y: 0 }, // Top-left
            { x: screenWidth, y: 0 }, // Top-right
            { x: 0, y: screenHeight }, // Bottom-left
            { x: screenWidth, y: screenHeight } // Bottom-right
        ];
        
        corners.forEach((corner, index) => {
            const intensity = (index % 2 === 0) ? pulseIntensity : secondaryPulse;
            const maxRadius = Math.min(screenWidth, screenHeight) * 0.3;
            const currentRadius = maxRadius * intensity * 0.3;
            
            if (currentRadius > 0) {
                const gradient = ctx.createRadialGradient(
                    corner.x, corner.y, 0,
                    corner.x, corner.y, currentRadius
                );
                
                gradient.addColorStop(0, `rgba(0, 212, 170, ${intensity * 0.05})`);
                gradient.addColorStop(0.5, `rgba(0, 168, 255, ${intensity * 0.03})`);
                gradient.addColorStop(1, `rgba(123, 104, 238, 0)`);
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(corner.x, corner.y, currentRadius, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        
        // Edge pulses - subtle lines along screen edges
        const edgeIntensity = pulseIntensity * 0.02;
        ctx.strokeStyle = `rgba(0, 212, 170, ${edgeIntensity})`;
        ctx.lineWidth = 1;
        
        // Top edge
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(screenWidth, 0);
        ctx.stroke();
        
        // Bottom edge  
        ctx.beginPath();
        ctx.moveTo(0, screenHeight);
        ctx.lineTo(screenWidth, screenHeight);
        ctx.stroke();
        
        // Left edge
        ctx.strokeStyle = `rgba(0, 168, 255, ${secondaryPulse * 0.02})`;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, screenHeight);
        ctx.stroke();
        
        // Right edge
        ctx.beginPath();
        ctx.moveTo(screenWidth, 0);
        ctx.lineTo(screenWidth, screenHeight);
        ctx.stroke();
        
        ctx.restore();
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
        // Don't preventDefault if the touch is on a search input
        const target = e.target;
        const isSearchInput = target && (
            target.matches('input[type="search"]') ||
            target.matches('#searchbox input') ||
            target.matches('.search-input') ||
            target.matches('#search-input') ||
            target.matches('#fastSearch input') ||
            target.matches('.search-container input')
        );
        
        // Only preventDefault for touches outside of search inputs
        if (!isSearchInput && (e.type === 'touchstart' || e.type === 'touchmove')) {
            e.preventDefault();
        }
        
        const touch = e.touches[0] || e.changedTouches[0];
        if (touch && !isSearchInput) { // Only create trail if not touching search input
            prevMouseX = mouseX || touch.clientX;
            prevMouseY = mouseY || touch.clientY;
            mouseX = touch.clientX;
            mouseY = touch.clientY;
            lastMouseMoveTime = Date.now(); // Track touch activity
            
            // Add trail points for touch movement with mobile optimization
            const distance = Math.sqrt(Math.pow(mouseX - prevMouseX, 2) + Math.pow(mouseY - prevMouseY, 2));
            
            // Reduce steps on mobile for better performance
            const isMobile = window.innerWidth < 768;
            const stepDivisor = isMobile ? 8 : 5; // Fewer steps on mobile
            const steps = Math.max(1, Math.floor(distance / stepDivisor));
            
            for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                const x = prevMouseX + (mouseX - prevMouseX) * t;
                const y = prevMouseY + (mouseY - prevMouseY) * t;
                const intensity = 0.8 * (1 - t * 0.3);
                
                addGridPoint(x, y, intensity);
            }
        }
    }
    
    function handleTouchEnd(e) {
        mouseX = null;
        mouseY = null;
        // Clean up any remaining touch references
        prevMouseX = 0;
        prevMouseY = 0;
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
                pointer-events: auto !important; /* Explicitly enable touch/click events */
                touch-action: manipulation !important; /* Enable touch interactions */
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
            
            /* Mobile-specific optimizations */
            @media screen and (max-width: 768px) {
                /* Ensure search input is fully interactive on mobile */
                #searchbox input, 
                .search-input, 
                input[type="search"], 
                #search-input,
                #fastSearch input,
                .search-container input {
                    backdrop-filter: blur(2px) !important;
                    font-size: 16px !important; /* Prevent zoom on iOS */
                    padding: 12px 16px !important; /* Better touch targets */
                    border-radius: 8px !important;
                    min-height: 44px !important; /* iOS accessibility guidelines */
                    -webkit-appearance: none !important; /* Remove iOS styling */
                    appearance: none !important;
                    pointer-events: auto !important; /* Ensure touch works */
                    touch-action: manipulation !important; /* Enable touch */
                    -webkit-user-select: text !important; /* Enable text selection */
                    user-select: text !important;
                }
                
                /* Ensure parent containers don't block touch */
                #searchbox,
                .search-container {
                    pointer-events: auto !important;
                    touch-action: manipulation !important;
                }
                
                /* Adjust search input for mobile */
                #searchbox input:focus, 
                .search-input:focus, 
                input[type="search"]:focus, 
                #search-input:focus,
                #fastSearch input:focus {
                    box-shadow: 0 0 0 1px rgba(0, 212, 170, 0.2), 0 2px 8px rgba(0, 0, 0, 0.1) !important;
                    transform: none !important; /* Prevent unwanted transforms on focus */
                }
                
                /* Reduce background opacity on mobile */
                body.search-enhanced::before {
                    opacity: 0.01 !important;
                }
                
                /* Search container mobile adjustments */
                #searchbox,
                .search-container {
                    margin: 16px 0 !important;
                    width: 100% !important;
                }
            }
            
            @media screen and (max-width: 480px) {
                /* Further reduce effects on small screens */
                #searchbox input, 
                .search-input, 
                input[type="search"], 
                #search-input,
                #fastSearch input,
                .search-container input {
                    backdrop-filter: blur(1px) !important;
                    padding: 14px 18px !important; /* Larger padding for small screens */
                    font-size: 16px !important; /* Consistent sizing */
                }
                
                body.search-enhanced::before {
                    opacity: 0.005 !important;
                    background-size: 25px 25px !important;
                }
                
                /* Ensure search results are properly spaced on mobile */
                #searchResults {
                    margin-top: 20px !important;
                }
                
                #searchResults li {
                    padding: 16px !important;
                    margin: 12px 0 !important;
                    border-radius: 12px !important;
                }
            }
            
            /* Landscape mobile adjustments */
            @media screen and (max-width: 900px) and (max-height: 500px) {
                #searchbox input, 
                .search-input, 
                input[type="search"], 
                #search-input,
                #fastSearch input,
                .search-container input {
                    min-height: 40px !important; /* Slightly smaller in landscape */
                    padding: 10px 14px !important;
                }
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
        // Update responsive values on resize
        gridSize = getResponsiveGridSize();
        maxInfluenceRadius = getResponsiveInfluenceRadius();
        resizeCanvas();
        
        // Update background grid size in CSS
        const style = document.getElementById('webflow-background-grid');
        if (style) {
            style.textContent = style.textContent.replace(
                /background-size: \d+px \d+px;/,
                `background-size: ${gridSize}px ${gridSize}px;`
            );
        }
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
            
            // Only add touch events on desktop - mobile uses ambient pulse instead
            if (window.innerWidth >= 768) {
                document.addEventListener('touchstart', handleTouch, { passive: false });
                document.addEventListener('touchmove', handleTouch, { passive: false });
                document.addEventListener('touchend', handleTouchEnd, { passive: true });
                document.addEventListener('touchcancel', handleTouchEnd, { passive: true });
            }
            
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